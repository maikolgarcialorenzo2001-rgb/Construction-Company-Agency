package migrations

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestMigrations_UpDown exercises the migration lifecycle over a real
// Postgres. It is gated: it runs only when CCA_TEST_DATABASE_URL is set and
// -short is absent, and it never hardcodes a DSN.
func TestMigrations_UpDown(t *testing.T) {
	dsn := os.Getenv("CCA_TEST_DATABASE_URL")
	if testing.Short() || dsn == "" {
		t.Skip("integration: set CCA_TEST_DATABASE_URL and run without -short")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pgxpool.New: %v", err)
	}
	defer pool.Close()

	// Up creates the users table and records the applied version.
	if err := Up(ctx, pool); err != nil {
		t.Fatalf("Up: %v", err)
	}
	if !tableExists(t, ctx, pool, "users") {
		t.Fatal("users table missing after Up")
	}

	// Up again is idempotent: already-applied migrations are a no-op.
	if err := Up(ctx, pool); err != nil {
		t.Fatalf("Up (second time): %v", err)
	}

	// Down removes the users table.
	if err := Down(ctx, pool); err != nil {
		t.Fatalf("Down: %v", err)
	}
	if tableExists(t, ctx, pool, "users") {
		t.Fatal("users table still exists after Down")
	}

	// Down then Up again re-creates the table (fresh migration cycle).
	if err := Up(ctx, pool); err != nil {
		t.Fatalf("Up after Down: %v", err)
	}
	if !tableExists(t, ctx, pool, "users") {
		t.Fatal("users table missing after re-Up")
	}
}

// tableExists reports whether name exists in the public schema.
func tableExists(t *testing.T, ctx context.Context, pool *pgxpool.Pool, name string) bool {
	t.Helper()
	var exists bool
	err := pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = $1
		)`, name,
	).Scan(&exists)
	if err != nil {
		t.Fatalf("checking table %q: %v", name, err)
	}
	return exists
}
