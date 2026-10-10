package service_test

import (
	"context"
	"errors"
	"testing"

	"cca/backend/internal/domain"
	"cca/backend/internal/service"
)

func TestAuth_Register(t *testing.T) {
	existing := domain.User{
		ID:           "u-existing",
		Email:        "ana@demo.test",
		PasswordHash: "hashed:old-password",
		Role:         domain.RoleWorker,
	}

	tests := []struct {
		name     string
		email    string
		password string
		role     domain.Role
		seed     []domain.User
		wantErr  error
	}{
		{
			name:     "worker registers",
			email:    "ana@demo.test",
			password: "s3cret-password",
			role:     domain.RoleWorker,
		},
		{
			name:     "company registers",
			email:    "obra@demo.test",
			password: "s3cret-password",
			role:     domain.RoleCompany,
		},
		{
			name:     "admin rejected",
			email:    "root@demo.test",
			password: "s3cret-password",
			role:     domain.RoleAdmin,
			wantErr:  service.ErrRoleNotAllowed,
		},
		{
			name:     "duplicate email",
			email:    "ana@demo.test",
			password: "s3cret-password",
			role:     domain.RoleCompany,
			seed:     []domain.User{existing},
			wantErr:  service.ErrEmailAlreadyExists,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			users := newFakeStore()
			users.seed(tt.seed...)
			hasher := &fakeHasher{}
			issuer := &fakeIssuer{}
			svc := service.NewAuth(users, issuer, hasher)

			result, err := svc.Register(context.Background(), tt.email, tt.password, tt.role)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("Register() error = %v, want %v", err, tt.wantErr)
				}
				if got := users.len(); got != len(tt.seed) {
					t.Errorf("store has %d users, want %d (rejected register must not persist)", got, len(tt.seed))
				}
				return
			}

			if err != nil {
				t.Fatalf("Register() error = %v, want nil", err)
			}
			if result.UserID == "" {
				t.Error("Register() returned an empty UserID")
			}
			if result.Token == "" {
				t.Error("Register() returned an empty Token")
			}

			stored, ok := users.stored(tt.email)
			if !ok {
				t.Fatalf("Register() did not store a user for %q", tt.email)
			}
			if stored.PasswordHash == tt.password {
				t.Error("stored PasswordHash equals the plaintext password")
			}
			if stored.PasswordHash != hashOf(tt.password) {
				t.Errorf("stored PasswordHash = %q, want a hash of the password", stored.PasswordHash)
			}
			if stored.Role != tt.role {
				t.Errorf("stored Role = %q, want %q", stored.Role, tt.role)
			}
			if stored.ID != result.UserID {
				t.Errorf("stored ID = %q, want %q", stored.ID, result.UserID)
			}
			if len(issuer.issued) != 1 || issuer.issued[0].userID != result.UserID {
				t.Errorf("issuer calls = %+v, want exactly one token for %q", issuer.issued, result.UserID)
			}
		})
	}
}
