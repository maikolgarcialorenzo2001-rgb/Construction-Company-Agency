// Package storetest provides a shared behavioral conformance suite for
// store.UserStore adapters. Every adapter (in-memory, pgx) is expected to
// satisfy the same contract by running RunUserStore.
package storetest

import (
	"context"
	"errors"
	"testing"

	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// sampleUser builds a user fixture with a fresh v4 UUID id. Adapters backed by
// a PostgreSQL uuid column require UUID-shaped ids, so callers must never pass
// ad-hoc strings like "u1".
func sampleUser(email string, role domain.Role) domain.User {
	return domain.User{
		ID:           domain.NewID(),
		Email:        email,
		PasswordHash: "bcrypt-hash",
		Role:         role,
	}
}

// RunUserStore exercises the store.UserStore contract against an adapter built
// by newStore. It deliberately omits t.Parallel() so adapters sharing a
// database can reset their own state safely.
func RunUserStore(t *testing.T, newStore func(t *testing.T) store.UserStore) {
	t.Helper()
	ctx := context.Background()

	t.Run("create then ByEmail round trips", func(t *testing.T) {
		s := newStore(t)
		want := sampleUser("ana@demo.test", domain.RoleWorker)

		if err := s.Create(ctx, want); err != nil {
			t.Fatalf("Create() error = %v, want nil", err)
		}

		got, err := s.ByEmail(ctx, want.Email)
		if err != nil {
			t.Fatalf("ByEmail(%q) error = %v, want nil", want.Email, err)
		}
		if got != want {
			t.Errorf("ByEmail(%q) = %+v, want %+v", want.Email, got, want)
		}
	})

	t.Run("duplicate email is rejected and stores no second id", func(t *testing.T) {
		s := newStore(t)
		first := sampleUser("ana@demo.test", domain.RoleWorker)
		if err := s.Create(ctx, first); err != nil {
			t.Fatalf("first Create() error = %v, want nil", err)
		}

		dup := sampleUser(first.Email, domain.RoleCompany)
		if err := s.Create(ctx, dup); !errors.Is(err, store.ErrEmailExists) {
			t.Fatalf("second Create() error = %v, want store.ErrEmailExists", err)
		}

		// The rejected duplicate must not be persisted under its own id.
		if _, err := s.ByID(ctx, dup.ID); !errors.Is(err, store.ErrUserNotFound) {
			t.Errorf("ByID(dup) error = %v, want store.ErrUserNotFound", err)
		}
		// The original row must survive the rejected duplicate untouched.
		got, err := s.ByEmail(ctx, first.Email)
		if err != nil {
			t.Fatalf("ByEmail(first) error = %v, want nil", err)
		}
		if got != first {
			t.Errorf("ByEmail(first) = %+v, want %+v", got, first)
		}
	})

	t.Run("unknown email is not found", func(t *testing.T) {
		s := newStore(t)
		if _, err := s.ByEmail(ctx, "nadie@demo.test"); !errors.Is(err, store.ErrUserNotFound) {
			t.Fatalf("ByEmail(unknown) error = %v, want store.ErrUserNotFound", err)
		}
	})

	t.Run("ByID returns the right user among several", func(t *testing.T) {
		s := newStore(t)
		worker := sampleUser("ana@demo.test", domain.RoleWorker)
		company := sampleUser("obra@demo.test", domain.RoleCompany)
		for _, u := range []domain.User{worker, company} {
			if err := s.Create(ctx, u); err != nil {
				t.Fatalf("Create(%q) error = %v", u.Email, err)
			}
		}

		got, err := s.ByID(ctx, company.ID)
		if err != nil {
			t.Fatalf("ByID(%q) error = %v, want nil", company.ID, err)
		}
		if got != company {
			t.Errorf("ByID(%q) = %+v, want %+v", company.ID, got, company)
		}
	})

	t.Run("unknown id is not found", func(t *testing.T) {
		s := newStore(t)
		if _, err := s.ByID(ctx, domain.NewID()); !errors.Is(err, store.ErrUserNotFound) {
			t.Fatalf("ByID(unknown) error = %v, want store.ErrUserNotFound", err)
		}
	})
}
