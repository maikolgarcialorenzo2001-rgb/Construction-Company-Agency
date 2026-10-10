package memory_test

import (
	"context"
	"errors"
	"testing"

	"cca/backend/internal/domain"
	"cca/backend/internal/store"
	"cca/backend/internal/store/memory"
)

func sampleUser(id, email string, role domain.Role) domain.User {
	return domain.User{ID: id, Email: email, PasswordHash: "bcrypt-hash", Role: role}
}

func TestUserStore_CreateThenFindByEmail(t *testing.T) {
	t.Parallel()

	s := memory.NewUserStore()
	u := sampleUser("u1", "ana@demo.test", domain.RoleWorker)

	if err := s.Create(context.Background(), u); err != nil {
		t.Fatalf("Create() error = %v, want nil", err)
	}

	got, err := s.ByEmail(context.Background(), "ana@demo.test")
	if err != nil {
		t.Fatalf("ByEmail() error = %v, want nil", err)
	}
	if got != u {
		t.Errorf("ByEmail() = %+v, want %+v", got, u)
	}
}

func TestUserStore_DuplicateEmailReturnsErrEmailExists(t *testing.T) {
	t.Parallel()

	s := memory.NewUserStore()
	if err := s.Create(context.Background(), sampleUser("u1", "ana@demo.test", domain.RoleWorker)); err != nil {
		t.Fatalf("first Create() error = %v, want nil", err)
	}

	err := s.Create(context.Background(), sampleUser("u2", "ana@demo.test", domain.RoleCompany))
	if !errors.Is(err, store.ErrEmailExists) {
		t.Fatalf("second Create() error = %v, want store.ErrEmailExists", err)
	}

	// The duplicate must not have been persisted under a second id.
	if _, err := s.ByID(context.Background(), "u2"); !errors.Is(err, store.ErrUserNotFound) {
		t.Errorf("ByID(u2) error = %v, want store.ErrUserNotFound", err)
	}
}

func TestUserStore_FindByEmailNotFound(t *testing.T) {
	t.Parallel()

	s := memory.NewUserStore()

	_, err := s.ByEmail(context.Background(), "nadie@demo.test")
	if !errors.Is(err, store.ErrUserNotFound) {
		t.Fatalf("ByEmail() error = %v, want store.ErrUserNotFound", err)
	}
}

func TestUserStore_FindByID(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		seed      []domain.User
		lookupID  string
		want      domain.User
		wantError error
	}{
		{
			name:     "finds a stored worker",
			seed:     []domain.User{sampleUser("u1", "ana@demo.test", domain.RoleWorker)},
			lookupID: "u1",
			want:     sampleUser("u1", "ana@demo.test", domain.RoleWorker),
		},
		{
			name: "finds the right user among several",
			seed: []domain.User{
				sampleUser("u1", "ana@demo.test", domain.RoleWorker),
				sampleUser("u2", "obra@demo.test", domain.RoleCompany),
			},
			lookupID: "u2",
			want:     sampleUser("u2", "obra@demo.test", domain.RoleCompany),
		},
		{
			name:      "unknown id is not found",
			seed:      []domain.User{sampleUser("u1", "ana@demo.test", domain.RoleWorker)},
			lookupID:  "missing",
			wantError: store.ErrUserNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			s := memory.NewUserStore()
			for _, u := range tt.seed {
				if err := s.Create(context.Background(), u); err != nil {
					t.Fatalf("seed Create(%q) error = %v", u.ID, err)
				}
			}

			got, err := s.ByID(context.Background(), tt.lookupID)
			if tt.wantError != nil {
				if !errors.Is(err, tt.wantError) {
					t.Fatalf("ByID(%q) error = %v, want %v", tt.lookupID, err, tt.wantError)
				}
				return
			}
			if err != nil {
				t.Fatalf("ByID(%q) error = %v, want nil", tt.lookupID, err)
			}
			if got != tt.want {
				t.Errorf("ByID(%q) = %+v, want %+v", tt.lookupID, got, tt.want)
			}
		})
	}
}

// Compile-time proof that the in-memory adapter satisfies the port.
var _ store.UserStore = (*memory.UserStore)(nil)
