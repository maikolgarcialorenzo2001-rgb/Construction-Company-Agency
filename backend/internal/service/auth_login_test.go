package service_test

import (
	"context"
	"errors"
	"testing"

	"cca/backend/internal/domain"
	"cca/backend/internal/service"
)

func TestAuth_Login(t *testing.T) {
	worker := domain.User{
		ID:           "u-worker",
		Email:        "ana@demo.test",
		PasswordHash: hashOf("correct-password"),
		Role:         domain.RoleWorker,
	}
	company := domain.User{
		ID:           "u-company",
		Email:        "obra@demo.test",
		PasswordHash: hashOf("correct-password"),
		Role:         domain.RoleCompany,
	}

	tests := []struct {
		name     string
		email    string
		password string
		seed     []domain.User
		wantErr  error
		wantRole domain.Role
	}{
		{
			name:     "valid credentials",
			email:    "ana@demo.test",
			password: "correct-password",
			seed:     []domain.User{worker},
			wantRole: domain.RoleWorker,
		},
		{
			name:     "role matches stored",
			email:    "obra@demo.test",
			password: "correct-password",
			seed:     []domain.User{company},
			wantRole: domain.RoleCompany,
		},
		{
			name:     "wrong password",
			email:    "ana@demo.test",
			password: "wrong-password",
			seed:     []domain.User{worker},
			wantErr:  service.ErrInvalidCredentials,
		},
		{
			name:     "unknown email",
			email:    "nadie@demo.test",
			password: "correct-password",
			wantErr:  service.ErrInvalidCredentials,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			users := newFakeStore()
			users.seed(tt.seed...)
			issuer := &fakeIssuer{}
			svc := service.NewAuth(users, issuer, &fakeHasher{})

			result, err := svc.Login(context.Background(), tt.email, tt.password)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("Login() error = %v, want %v", err, tt.wantErr)
				}
				if len(issuer.issued) != 0 {
					t.Errorf("Login() minted a token for invalid credentials: %+v", issuer.issued)
				}
				return
			}

			if err != nil {
				t.Fatalf("Login() error = %v, want nil", err)
			}
			if result.Token == "" {
				t.Error("Login() returned an empty Token")
			}
			if result.Role != tt.wantRole {
				t.Errorf("Login() Role = %q, want %q", result.Role, tt.wantRole)
			}
		})
	}
}
