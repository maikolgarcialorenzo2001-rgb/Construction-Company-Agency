package postgres_test

import (
	"context"
	"testing"

	"cca/backend/internal/store"
	"cca/backend/internal/store/postgres"
)

// TestNewUserStore_SatisfiesPort is the structural proof that the pgx adapter
// implements the store.UserStore port. It needs no database.
func TestNewUserStore_SatisfiesPort(t *testing.T) {
	s := postgres.NewUserStore(nil)
	if s == nil {
		t.Fatal("NewUserStore(nil) = nil, want a *postgres.UserStore")
	}
	var port store.UserStore = s
	if port == nil {
		t.Fatal("NewUserStore(nil) does not satisfy store.UserStore")
	}
}

// TestOpen_RejectsMalformedDSN proves Open validates the DSN before touching a
// database: a malformed DSN returns an error and a nil pool.
func TestOpen_RejectsMalformedDSN(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name string
		dsn  string
	}{
		{"missing scheme", "://nope"},
		{"invalid port", "postgres://postgres@127.0.0.1:notaport/cca"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			pool, err := postgres.Open(ctx, tc.dsn)
			if err == nil {
				pool.Close()
				t.Fatalf("Open(%q) error = nil, want a parse error", tc.dsn)
			}
			if pool != nil {
				t.Errorf("Open(%q) pool = %v, want nil on error", tc.dsn, pool)
			}
		})
	}
}
