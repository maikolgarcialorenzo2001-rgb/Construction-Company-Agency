package postgres_test

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"cca/backend/internal/store"
	"cca/backend/internal/store/postgres"
	"cca/backend/internal/store/storetest"
	"cca/backend/migrations"
)

// pgTestPool is the shared pool used by the gated conformance test. It is nil
// when CCA_TEST_DATABASE_URL is unset, so the default suite stays
// dependency-free.
var pgTestPool *pgxpool.Pool

// TestMain applies the embedded migrations once (idempotent) when a DSN is
// configured. Without a DSN it just runs the default suite, where every gated
// test skips green.
func TestMain(m *testing.M) {
	if dsn := os.Getenv("CCA_TEST_DATABASE_URL"); dsn != "" {
		ctx := context.Background()
		pool, err := postgres.Open(ctx, dsn)
		if err != nil {
			log.Fatalf("postgres: open test pool: %v", err)
		}
		if err := migrations.Up(ctx, pool); err != nil {
			log.Fatalf("postgres: migrate test db: %v", err)
		}
		pgTestPool = pool
	}

	code := m.Run()

	if pgTestPool != nil {
		pgTestPool.Close()
	}
	os.Exit(code)
}

// newPgUserStore resets the shared users table and returns a pgx-backed store.
// It is the adapter factory handed to the shared conformance suite; the
// TRUNCATE makes each subtest start from a clean table without t.Parallel().
func newPgUserStore(t *testing.T) store.UserStore {
	t.Helper()
	if pgTestPool == nil {
		t.Fatal("test pool is nil; set CCA_TEST_DATABASE_URL to run the gated conformance suite")
	}
	if _, err := pgTestPool.Exec(context.Background(), `TRUNCATE users`); err != nil {
		t.Fatalf("TRUNCATE users: %v", err)
	}
	return postgres.NewUserStore(pgTestPool)
}

// TestUserStore_PostgresConformance runs the SAME shared suite used by the
// in-memory adapter against a live PostgreSQL, proving the two adapters are
// interchangeable behind the unchanged store.UserStore port.
func TestUserStore_PostgresConformance(t *testing.T) {
	if testing.Short() || os.Getenv("CCA_TEST_DATABASE_URL") == "" {
		t.Skip("integration: set CCA_TEST_DATABASE_URL and run without -short")
	}

	storetest.RunUserStore(t, newPgUserStore)
}
