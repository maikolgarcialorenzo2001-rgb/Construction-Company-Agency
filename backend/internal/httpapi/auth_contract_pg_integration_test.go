package httpapi_test

import (
	"context"
	"log"
	"net/http"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"cca/backend/internal/store/postgres"
	"cca/backend/migrations"
)

// pgTestPool is the shared pool used by the gated HTTP+contract test. It is nil
// when CCA_TEST_DATABASE_URL is unset, so the default suite stays
// dependency-free.
var pgTestPool *pgxpool.Pool

// TestMain applies the embedded migrations once (idempotent) when a DSN is
// configured. Without a DSN it just runs the default suite, where the gated
// test skips green.
func TestMain(m *testing.M) {
	if dsn := os.Getenv("CCA_TEST_DATABASE_URL"); dsn != "" {
		ctx := context.Background()
		pool, err := postgres.Open(ctx, dsn)
		if err != nil {
			log.Fatalf("httpapi: open test pool: %v", err)
		}
		if err := migrations.Up(ctx, pool); err != nil {
			log.Fatalf("httpapi: migrate test db: %v", err)
		}
		pgTestPool = pool
	}

	code := m.Run()

	if pgTestPool != nil {
		pgTestPool.Close()
	}
	os.Exit(code)
}

// TestAuthContract_OverPostgres drives register -> login -> me through the real
// router over a live PostgreSQL and validates every request/response against
// contracts/openapi.yaml. It proves the pgx adapter keeps a duplicate email at
// HTTP 400 email_already_exists (SQLSTATE 23505 mapping), not a 500.
func TestAuthContract_OverPostgres(t *testing.T) {
	if testing.Short() || os.Getenv("CCA_TEST_DATABASE_URL") == "" {
		t.Skip("integration: set CCA_TEST_DATABASE_URL and run without -short")
	}

	if _, err := pgTestPool.Exec(context.Background(), `TRUNCATE users`); err != nil {
		t.Fatalf("TRUNCATE users: %v", err)
	}

	r := newAuthRouterWithStore(postgres.NewUserStore(pgTestPool))
	g := loadGuard(t)

	payload := `{"email":"ana@demo.test","password":"s3cret","role":"worker"}`
	res := serveValidate(t, g, r, http.MethodPost, "/auth/register", payload, "")
	if res.Code != http.StatusCreated {
		t.Fatalf("first register status = %d, want 201 (body=%s)", res.Code, res.Body.String())
	}

	// The duplicate email over Postgres must stay a 400 email_already_exists.
	dup := serveValidate(t, g, r, http.MethodPost, "/auth/register", payload, "")
	if dup.Code != http.StatusBadRequest {
		t.Fatalf("duplicate register status = %d, want 400 (body=%s)", dup.Code, dup.Body.String())
	}
	if code, _ := decode(t, dup)["code"].(string); code != "email_already_exists" {
		t.Fatalf("duplicate register code = %q, want %q (body=%s)", code, "email_already_exists", dup.Body.String())
	}

	login := serveValidate(t, g, r, http.MethodPost, "/auth/login",
		`{"email":"ana@demo.test","password":"s3cret"}`, "")
	if login.Code != http.StatusOK {
		t.Fatalf("login status = %d, want 200 (body=%s)", login.Code, login.Body.String())
	}
	token, _ := decode(t, login)["token"].(string)
	if token == "" {
		t.Fatal("login returned an empty token")
	}

	me := serveValidate(t, g, r, http.MethodGet, "/auth/me", "", token)
	if me.Code != http.StatusOK {
		t.Fatalf("me status = %d, want 200 (body=%s)", me.Code, me.Body.String())
	}
}
