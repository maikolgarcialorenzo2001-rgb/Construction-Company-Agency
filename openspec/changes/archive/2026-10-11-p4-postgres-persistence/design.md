# Design: p4-postgres-persistence

> Change: `p4-postgres-persistence` · Repo: `construction-company-agency` · Phase: design · Date: 2026-10-11
> Inputs: `proposal.md` (Engram 881), `explore.md` (Engram 880), decisions (Engram 882), delta `backend-runtime` spec, live code under `backend/`. Go 1.27, `CGO_ENABLED=0`, pure Go. `contracts/openapi.yaml` READ-ONLY.

## Architecture Overview

A **composition-root swap behind the unchanged `store.UserStore` port**. The pgx adapter is a new sibling of the in-memory adapter; services/handlers/router/guard are untouched. `DATABASE_URL` selects the adapter and triggers embedded goose migrations. Sequences/handlers depend on the port only, so the swap is invisible above the store layer.

    cmd/server ──> config.Load() ──> buildStore(cfg)
       │                                   │ DATABASE_URL=""      │ set
       │                                   ▼                      ▼
       │                            memory.NewUserStore()   postgres.Open → migrations.Up → postgres.NewUserStore(pool)
       │                                   └──────────┬───────────┘
       ▼                                              ▼
    httpapi.NewRouter ──> handlers ──> service.Auth ──> store.UserStore (port, UNCHANGED)

    gated integration only:  httptest ─> router(over pgx) ─> contract.Guard.ValidateHTTP (real openapi.yaml)

Migration flow (startup, DSN set):

    config.DatabaseURL ─> postgres.Open (ParseConfig+New+Ping) ─> migrations.Up(ctx,pool)
         │ stdlib.OpenDBFromPool(pool) ─> goose.NewProvider(DialectPostgres, db, FS).Up(ctx)  [idempotent]
         └─ one pgxpool serves migrations AND queries; pool.Close() is deferred in main

## Architecture Decisions

| # | Decision | Choice | Alternatives / trade-off |
|---|----------|--------|--------------------------|
| A1 | Adapter | `jackc/pgx/v5` `pgxpool` behind fixed port; `postgres` is the only package importing pgx | `database/sql`+stdlib everywhere (loses native pool). Port change (rejected: zero benefit). |
| A2 | Store selection | `DATABASE_URL` optional, empty ⇒ memory + `log.Printf` warning; set ⇒ pgx | Required DSN (breaks zero-config `go run` + `backend-runtime` scenario). |
| A3 | Migrations | goose v3, `//go:embed *.sql`, provider over `stdlib.OpenDBFromPool(pool)`; auto-`Up` at startup | `os.DirFS` (CWD-fragile in deployed binary); `cmd/migrate` (deferred follow-on). |
| A4 | Config validation | config stores the raw DSN (shape only: unset/empty/set), mirrors `JWT_SECRET` precedent; **DSN validity + connectivity proven by `postgres.Open`+`Ping` at startup (fail-fast)** | Parse in config (would import pgx into config — couples layers). |
| A5 | id column | `uuid` PK; adapter passes/reads Go `string` | `text` PK (fallback ladder in §8). |
| A6 | Selection helper | extract `buildStore(ctx,cfg) (store.UserStore, func(), error)` in `cmd/server` so the empty-DSN branch is unit-testable (closes carried PW2/R7) | Inline branch (untested). |

## File-by-File Plan

**NEW**

- `backend/migrations/00001_create_users.sql` — goose migration:
  ```sql
  -- +goose Up
  CREATE TABLE users (
      id            uuid PRIMARY KEY,
      email         text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role          text NOT NULL CHECK (role IN ('worker','company','admin'))
  );
  -- +goose Down
  DROP TABLE users;
  ```
- `backend/migrations/embed.go` — `package migrations`; `//go:embed *.sql` → `var FS embed.FS`; `func Up(ctx, pool *pgxpool.Pool) error` = `stdlib.OpenDBFromPool(pool)` → `goose.NewProvider(goose.DialectPostgres, db, FS)` → `p.Up(ctx)`; `func Down(ctx,pool) error` for the gated test. Closing the wrapped `*sql.DB` does NOT close the pool.
- `backend/migrations/migrate_integration_test.go` — gated (`-short`/DSN); `Up` ⇒ `users` exists (query `information_schema.tables`), `Down` ⇒ gone.
- `backend/internal/store/postgres/postgres.go` — adapter:
  ```go
  package postgres
  type UserStore struct{ pool *pgxpool.Pool }
  var _ store.UserStore = (*UserStore)(nil)
  func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) // ParseConfig → New → Ping
  func NewUserStore(pool *pgxpool.Pool) *UserStore
  func (s *UserStore) Create(ctx, u domain.User) error            // INSERT; 23505 → store.ErrEmailExists
  func (s *UserStore) ByEmail(ctx, email string) (domain.User, error) // SELECT; ErrNoRows → store.ErrUserNotFound
  func (s *UserStore) ByID(ctx, id string) (domain.User, error)       // SELECT; ErrNoRows → store.ErrUserNotFound
  ```
  SQL: `INSERT INTO users (id,email,password_hash,role) VALUES ($1,$2,$3,$4)`;
  `SELECT id,email,password_hash,role FROM users WHERE email=$1` / `WHERE id=$1`.
- `backend/internal/store/postgres/open_test.go` — **non-gated**: `TestOpen_RejectsMalformedDSN` (`Open(ctx,"://nope")` errors without a DB) and `TestNewUserStore_SatisfiesPort`.
- `backend/internal/store/postgres/postgres_integration_test.go` — gated conformance + `TestMain` (migrate once).
- `backend/internal/store/storetest/storetest.go` — shared behavioral contract:
  ```go
  func RunUserStore(t *testing.T, newStore func(t *testing.T) store.UserStore)
  ```
  Subtests: create→by-email round trip; duplicate email ⇒ `ErrEmailExists` and no second id persisted; unknown email ⇒ `ErrUserNotFound`; by-id round trip (right user among several); unknown id ⇒ `ErrUserNotFound`. **Mints UUID-shaped ids** (pgx `uuid` column rejects `"u1"`). No `t.Parallel()` (A-D9).
- `backend/internal/httpapi/auth_contract_pg_integration_test.go` — gated HTTP+contract over pgx: register→login→me validated by `contract.Guard`; duplicate register ⇒ 400 `email_already_exists`.
- `backend/cmd/server/main_test.go` — `TestBuildStore_EmptyDSNReturnsMemoryStore` (non-gated).
- `backend/internal/store/memory/…` — unchanged source; only its test is rewritten to call `storetest`.

**MODIFIED**

| File | Change |
|------|--------|
| `backend/internal/config/config.go` | add `DatabaseURL string` field; `cfg.DatabaseURL = os.Getenv("DATABASE_URL")` |
| `backend/internal/config/config_test.go` | add `TestLoad_DatabaseURLDefaultsEmpty`, `TestLoad_DatabaseURLReadsOverride` |
| `backend/internal/store/memory/memory_test.go` | replace bespoke tests with `storetest.RunUserStore(t, func(*testing.T) store.UserStore { return memory.NewUserStore() })` |
| `backend/internal/httpapi/helpers_test.go` | extract `newAuthRouterWithStore(s store.UserStore) *gin.Engine`; `newAuthRouter` delegates with memory |
| `backend/cmd/server/main.go` | add `buildStore`; replace `users := memory.NewUserStore()` with `users, cleanup, err := buildStore(ctx, cfg)`; `defer cleanup()` |
| `backend/Makefile` | add `test-integration` + `migrate` targets |
| `backend/.env.example`, `backend/README.md` | document `DATABASE_URL` + integration runner |
| `backend/go.mod`/`go.sum` | + `jackc/pgx/v5`, `pressly/goose/v3` (+transitive, all pure Go) |

## Interfaces / Contracts — port is UNCHANGED

Exact port (`backend/internal/store/store.go:22-29`) quoted verbatim:

```go
type UserStore interface {
    Create(ctx context.Context, u domain.User) error
    ByEmail(ctx context.Context, email string) (domain.User, error)
    ByID(ctx context.Context, id string) (domain.User, error)
}
```

**Proof no port change is needed**: `domain.User` (`ID/Email/PasswordHash/Role string|Role`) maps 1:1 to the four `users` columns; the adapter satisfies the identical method set via compile-time `var _ store.UserStore = (*UserStore)(nil)`. Verify at verify-phase: `git diff backend/internal/store/store.go backend/internal/domain/domain.go` is empty. `service.NewAuth(users store.UserStore, …)` already depends on the interface only.

## Migration Strategy

Embed (survives deployed binaries; `.sql` only, `embed.go` excluded by `//go:embed *.sql`) → provider over the **same pool** → **up-only, auto-run at startup**. goose records applied versions in `goose_db_version`; re-running `Up` is a no-op (idempotent). `Down` exists for the gated up/down test only and is never invoked at runtime. DSN never hardcoded. No `cmd/migrate` in this change.

## Test Strategy

| Suite | Gate | Default `go test ./...` |
|-------|------|--------------------------|
| Existing unit + contract guard | none | runs |
| `config` DatabaseURL cases | none | runs |
| `postgres.Open` malformed-DSN parse | none (no DB) | runs |
| Conformance over **memory** (`storetest`) | none | runs |
| Conformance over **pgx** (`storetest`) | `testing.Short() \|\| CCA_TEST_DATABASE_URL=="" → t.Skip` | **skips (green)** |
| Migration up/down over real PG | same gate | **skips (green)** |
| HTTP+contract register→login→me over **pgx** | same gate | **skips (green)** |

`storetest` is shared: `memory_test` calls `RunUserStore` with a fresh memory store; the gated pgx test calls the **same** function with a `NewUserStore(pool)` closure that first `TRUNCATE users`. Both are separate `TestMain`s in `postgres_test`/`httpapi_test` that apply `migrations.Up` once (idempotent) when the DSN is set. The guard stays on memory by default → dependency-free; the gated HTTP+contract-over-pgx run is the only place the guard is driven by Postgres.

## Work Units — Strict TDD (RED → GREEN → TRIANGULATE → REFACTOR)

**C1 — config + goose infra + users table (~170).** RED: `TestLoad_DatabaseURLDefaultsEmpty` / `_ReadsOverride` fail to compile (`DatabaseURL` missing); gated `TestMigrations_UpDown` fails (no `Up`/SQL). GREEN: field + `embed.go` + SQL. TRIANGULATE: down-then-up again (idempotency). REFACTOR: table-driven config. Commit: `feat(backend): add optional DATABASE_URL config and embedded goose migrations (p4-postgres-persistence)`.

**C2 — shared conformance suite + memory refactor (~160).** RED: `memory_test` calls `storetest.RunUserStore` before the package exists (compile fail). GREEN: write `storetest` + UUID-shaped fixtures; memory passes. TRIANGULATE: add the "right user among several" and "duplicate persisted no second id" subtests. REFACTOR: extract `sampleUser` helper. Commit: `test(backend): extract shared UserStore conformance suite over memory (p4-postgres-persistence)`.

**C3 — pgx adapter + gated integration + HTTP-contract over pgx (~300).** RED: gated `TestUserStore_PostgresConformance` (via `storetest`) fails to compile (no `postgres` pkg) and, once it compiles, duplicate email must surface `ErrEmailExists`; gated `TestAuthContract_OverPostgres` expects 400 `email_already_exists` on the 2nd register. GREEN: implement `Open`/`NewUserStore`/`Create`/`ByEmail`/`ByID` + `23505`/`ErrNoRows` mapping; add `newAuthRouterWithStore`. TRIANGULATE: unknown-email hunt returns `ErrUserNotFound` over real PG; both adapters green on the identical suite. REFACTOR: extract row-scan helper. Commit: `feat(backend): add pgx UserStore adapter with gated conformance and contract tests (p4-postgres-persistence)`.

**C4 — composition-root wiring + runner/docs (~110).** RED: `TestBuildStore_EmptyDSNReturnsMemoryStore` fails (no `buildStore`). GREEN: add `buildStore` + swap line 25 + `defer cleanup()`. TRIANGULATE: `go build ./...`; `go run` smoke boots on memory with no config. REFACTOR: extract log messages. Commit: `feat(backend): wire store selection and auto-migrate at startup; document runner (p4-postgres-persistence)`.

## Error Mapping

| Store error (adapter) | Service error (`service/*.go`) | HTTP | `code` | Trigger | SQLSTATE / pgx |
|---|---|---|---|---|---|
| `store.ErrEmailExists` | `ErrEmailAlreadyExists` | 400 | `email_already_exists` | register duplicate email | `pgconn.PgError.Code == "23505"` |
| `store.ErrUserNotFound` | `ErrInvalidCredentials` | 401 | `invalid_credentials` | login unknown email | `pgx.ErrNoRows` |
| `store.ErrUserNotFound` | `ErrNotAuthenticated` | 401 | `not_authenticated` | `/me` token `sub` not in `users` | `pgx.ErrNoRows` |

The adapter maps only these two SQL outcomes; service/handler translation is existing code (proof: `auth_register.go:36`, `auth_login.go:19`, `auth_me.go:18`, `errors.go`).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **`testing.Short()` alone leaks DB tests into the default suite** (the default `go test ./...` never passes `-short`) | Gate is `testing.Short() \|\| CCA_TEST_DATABASE_URL=="" → t.Skip`; DSN only via `make test-integration`; never hardcoded. |
| Shared `cca` DB pollution / races | `TestMain` applies `migrations.Up` once; pgx `newStore` closure `TRUNCATE users` per use; **no `t.Parallel()`** in `storetest`. |
| `uuid` string↔column encoding (pgx) | Ladder: (1) `uuid` column + Go `string`; (2) if encode errors, cast params `$1::text::uuid`/`id=$1::text::uuid` (no schema change); (3) scan via `pgtype.UUID`→`uuid.UUID.String()`; (4) migrate `00001` `id` → `text` (last resort, D6 fallback). |
| Duplicate email returns 500 instead of 400 | Explicit `23505` mapping + gated HTTP+contract-over-pgx test asserts 400 `email_already_exists`. |
| `storetest` uses non-UUID ids → pgx rejects them | Suite mints `domain.NewID()` (v4 UUID) fixtures, not `"u1"`. |
| Contract drift | `contracts/openapi.yaml` untouched; `git diff contracts/` empty at verify; guard + `backend-auth` stay green. |
| `cmd/server` untested (carried PW2) | `buildStore` helper + non-gated `TestBuildStore_EmptyDSNReturnsMemoryStore`. |
| go.sum growth needs module network | `proxy.golang.org`/`sum.golang.org` verified reachable; pin versions; pure Go. |

## Work-Unit → Commit Mapping

| WU | Commit subject (`(p4-postgres-persistence)`) | ~LOC | Verify |
|----|-----------------------------------------------|------|--------|
| C1 | `feat(backend): add optional DATABASE_URL config and embedded goose migrations` | ~170 | config unit; gated up/down |
| C2 | `test(backend): extract shared UserStore conformance suite over memory` | ~160 | `storetest` green over memory (default) |
| C3 | `feat(backend): add pgx UserStore adapter with gated conformance and contract tests` | ~300 | default skips; `make test-integration` green |
| C4 | `feat(backend): wire store selection and auto-migrate at startup; document runner` | ~110 | `go build ./...`; memory smoke |

Four sequential local commits on `main`, each ≤400 changed lines. `go test ./...` green after **every** commit.

## Open Questions

- None blocking. (Recorded follow-ons, out of scope: `cmd/migrate` binary; per-run schema isolation; non-user stores.)
