package main

import (
	"context"
	"testing"

	"cca/backend/internal/config"
	"cca/backend/internal/domain"
	"cca/backend/internal/store/memory"
)

// TestBuildStore_EmptyDSNReturnsMemoryStore proves the zero-config path: with no
// DATABASE_URL the composition root selects the in-memory store (non-gated, no
// database needed). This closes the carried PW2 gap for cmd/server.
func TestBuildStore_EmptyDSNReturnsMemoryStore(t *testing.T) {
	ctx := context.Background()

	s, cleanup, err := buildStore(ctx, config.Config{})
	if err != nil {
		t.Fatalf("buildStore(empty DSN) error = %v, want nil", err)
	}
	if s == nil {
		t.Fatal("buildStore(empty DSN) store = nil, want a store.UserStore")
	}
	if cleanup == nil {
		t.Fatal("buildStore(empty DSN) cleanup = nil, want a no-op cleanup")
	}
	cleanup() // the empty-DSN cleanup must be safe to call unconditionally.

	if _, ok := s.(*memory.UserStore); !ok {
		t.Fatalf("buildStore(empty DSN) store = %T, want *memory.UserStore", s)
	}

	// The returned port must actually persist and read back a user.
	u := domain.User{
		ID:           domain.NewID(),
		Email:        "dev@demo.test",
		PasswordHash: "hash",
		Role:         domain.RoleWorker,
	}
	if err := s.Create(ctx, u); err != nil {
		t.Fatalf("Create() error = %v, want nil", err)
	}
	got, err := s.ByEmail(ctx, u.Email)
	if err != nil {
		t.Fatalf("ByEmail(%q) error = %v, want nil", u.Email, err)
	}
	if got != u {
		t.Errorf("ByEmail(%q) = %+v, want %+v", u.Email, got, u)
	}
}

// TestBuildStore_RejectsInvalidDSN triangulates the configured branch: a
// malformed DSN must fail before any connection is attempted, returning no
// store and no cleanup (so the caller never defers a nil function).
func TestBuildStore_RejectsInvalidDSN(t *testing.T) {
	s, cleanup, err := buildStore(context.Background(), config.Config{DatabaseURL: "://nope"})
	if err == nil {
		t.Fatal("buildStore(invalid DSN) error = nil, want a parse error")
	}
	if s != nil {
		t.Errorf("buildStore(invalid DSN) store = %v, want nil on error", s)
	}
	if cleanup != nil {
		t.Errorf("buildStore(invalid DSN) cleanup = non-nil, want nil on error")
	}
}

// TestRunMigrate_RequiresDSN proves the migrate path rejects a missing DSN
// instead of quietly doing nothing.
func TestRunMigrate_RequiresDSN(t *testing.T) {
	if err := runMigrate(context.Background(), ""); err == nil {
		t.Fatal(`runMigrate("") error = nil, want a DATABASE_URL error`)
	}
}

// TestRunMigrate_RejectsInvalidDSN proves the migrate path surfaces a bad DSN
// (no partial migration, no listener) without a live database.
func TestRunMigrate_RejectsInvalidDSN(t *testing.T) {
	if err := runMigrate(context.Background(), "://nope"); err == nil {
		t.Fatal("runMigrate(invalid DSN) error = nil, want a parse error")
	}
}
