# Tasks: p4-postgres-persistence

> Change: `p4-postgres-persistence` · Repo: `construction-company-agency` · Phase: tasks · Date: 2026-10-11
> Inputs: `proposal.md` (881), `design.md` (885 / decisions 886), `specs/backend-runtime/spec.md` (883 / 884). Go 1.27, `CGO_ENABLED=0`, pure Go, no Docker. Runner: `go test ./...` from `backend/`. `contracts/openapi.yaml` READ-ONLY.
> **Strict TDD** per task: **R** (RED — exact first failing test) → **G** (GREEN — minimal impl) → **T** (TRIANGULATE) → **Ref** (REFACTOR); **Verify** = command. Integration gate (verbatim): run only when `CCA_TEST_DATABASE_URL` set **AND** `!testing.Short()`; else `t.Skip`; DSN never hardcoded.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~740 total (prod + test + go.sum): C1 ~170 · C2 ~160 · C3 ~300 · C4 ~110 |
| 400-line budget risk | Low (largest unit C3 ≈300; each commit ≤400) |
| Chained PRs recommended | Yes (realized as sequential local commits on `main`) |
| Suggested split | C1 → C2 → C3 → C4 (sequential local work-unit commits on `main`) |
| Delivery strategy | sequential local work-unit commits on `main` (no branches/PRs/pushes) |
| Chain strategy | stacked-to-main (local commits on `main`) |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low
```

> Delivery is locked to four sequential local work-unit commits on `main`, each ≤400 changed lines; no `size:exception` needed. Every commit subject ends with `(p4-postgres-persistence)`; `go test ./...` is green after **every** commit.

### Suggested Work Units

| Unit | Goal | Commit | Base/Notes |
|------|------|--------|-----------|
| C1 | `DATABASE_URL` config + goose embed infra + `users` table + `migrations.Up` | C1 | `main`; tests ship with code |
| C2 | Shared `storetest` conformance suite + memory refactor | C2 | depends C1 |
| C3 | pgx `UserStore` adapter + gated conformance + HTTP-contract over pgx | C3 | depends C2 |
| C4 | Composition-root `buildStore` wiring + Makefile/README/.env + smoke | C4 | depends C3 |

## Phase 1: Foundation — config + goose infra (C1)

- [x] **1.1** Add optional `DatabaseURL string` to `Config` (`backend/internal/config/config.go`); read `os.Getenv("DATABASE_URL")` only — **no pgx import** (shape only: unset/empty/set).
  - Files: `internal/config/config.go`, `internal/config/config_test.go`.
  - R: `TestLoad_DatabaseURLDefaultsEmpty` + `TestLoad_DatabaseURLReadsOverride` fail to compile (`DatabaseURL` missing). G: field + env read. T: table-driven cases (unset / empty / set). Ref: fold into table-driven `Load` cases.
  - Verify: `go test ./internal/config/...`.
- [x] **1.2** Add embedded goose migrations: `backend/migrations/00001_create_users.sql` (`id uuid PK`, `email text NOT NULL UNIQUE`, `password_hash`, `role CHECK`; goose Up/Down) + `backend/migrations/embed.go` (`//go:embed *.sql`→`FS`; `Up(ctx,pool)`= `stdlib.OpenDBFromPool`→`goose.NewProvider(DialectPostgres,db,FS)`→`p.Up`; `Down` for the test). Add `jackc/pgx/v5` + `pressly/goose/v3` to `go.mod`/`go.sum`.
  - Files: `migrations/embed.go`, `migrations/00001_create_users.sql`, `migrations/migrate_integration_test.go`, `go.mod`, `go.sum`.
  - R: gated `TestMigrations_UpDown` fails to compile (no `Up`/SQL). G: `embed.go` + SQL + `Up`. T: `Up` twice idempotent (down→up). Ref: extract migration-runner helper.
  - Verify: `go build ./...`; `make test-integration` (gated).
  - **Commit C1**: `feat(backend): add optional DATABASE_URL config and embedded goose migrations (p4-postgres-persistence)`.

## Phase 2: Shared conformance suite + memory refactor (C2)

- [x] **2.1** Create `backend/internal/store/storetest/storetest.go` — `RunUserStore(t, newStore func(*testing.T) store.UserStore)`; subtests: create→by-email round trip · duplicate email ⇒ `ErrEmailExists` + no second id · unknown email ⇒ `ErrUserNotFound` · by-id among several · unknown id ⇒ `ErrUserNotFound`. Mint `domain.NewID()` UUIDs; **no `t.Parallel()`**.
  - Files: `internal/store/storetest/storetest.go`.
  - R: `memory_test` calls `storetest.RunUserStore` before the package exists (compile fail). G: write suite + UUID fixtures; memory passes. T: "right user among several" + "duplicate persisted no second id". Ref: extract `sampleUser` helper.
  - Verify: `go test ./internal/store/...`.
- [x] **2.2** Rewrite `backend/internal/store/memory/memory_test.go` to `storetest.RunUserStore(t, func(*testing.T) store.UserStore { return memory.NewUserStore() })` (replaces bespoke tests).
  - Files: `internal/store/memory/memory_test.go`.
  - **Commit C2**: `test(backend): extract shared UserStore conformance suite over memory (p4-postgres-persistence)`.

## Phase 3: pgx adapter + gated integration (C3)

- [x] **3.1** Create `backend/internal/store/postgres/postgres.go`: `Open(ctx,dsn)` (ParseConfig→New→Ping — **validates the DSN**), `NewUserStore(pool)`, `Create`/`ByEmail`/`ByID`; map `pgconn.PgError` `23505`→`store.ErrEmailExists`, `pgx.ErrNoRows`→`store.ErrUserNotFound`; `var _ store.UserStore`.
  - Files: `internal/store/postgres/postgres.go`.
  - R: gated `TestUserStore_PostgresConformance` (via `storetest`) fails to compile (no `postgres` pkg); once compiling, duplicate email must surface `ErrEmailExists`. G: adapter + error mapping. T: unknown-email hunt ⇒ `ErrUserNotFound` over real PG; both adapters green on the identical suite. Ref: extract row-scan helper.
  - Verify: `go build ./...`; `make test-integration`.
- [x] **3.2** Add **non-gated** `backend/internal/store/postgres/open_test.go`: `TestOpen_RejectsMalformedDSN` (`Open(ctx,"://nope")` errors, no DB) + `TestNewUserStore_SatisfiesPort`.
  - Files: `internal/store/postgres/open_test.go`. Verify: `go test ./internal/store/postgres/...`.
- [x] **3.3** Add **gated** `backend/internal/store/postgres/postgres_integration_test.go`: `TestMain` applies `migrations.Up` once (idempotent) when DSN set; `storetest` over pgx with a `NewUserStore(pool)` closure that `TRUNCATE users` per use.
  - Files: `internal/store/postgres/postgres_integration_test.go`.
  - R: gated conformance RED (see 3.1). Verify: `make test-integration`.
- [x] **3.4** Extract `newAuthRouterWithStore(s store.UserStore)` in `backend/internal/httpapi/helpers_test.go` (`newAuthRouter` delegates with memory); add **gated** `backend/internal/httpapi/auth_contract_pg_integration_test.go` (register→login→me validated by `contract.Guard`; 2nd register ⇒ 400 `email_already_exists`).
  - Files: `internal/httpapi/helpers_test.go`, `internal/httpapi/auth_contract_pg_integration_test.go`.
  - R: gated `TestAuthContract_OverPostgres` expects 400 `email_already_exists` on 2nd register. G: `newAuthRouterWithStore` + pgx wiring. T: guard-driven run over Postgres. Verify: `make test-integration`.
  - **Commit C3**: `feat(backend): add pgx UserStore adapter with gated conformance and contract tests (p4-postgres-persistence)`.

## Phase 4: Composition root + runner/docs (C4)

- [x] **4.1** Add `buildStore(ctx, cfg) (store.UserStore, func(), error)` in `backend/cmd/server/main.go` (empty `DATABASE_URL`⇒memory + `log.Printf` warning; set⇒`postgres.Open`→`migrations.Up`→`postgres.NewUserStore`); replace line 25 with `users, cleanup, err := buildStore(ctx, cfg)`; `defer cleanup()`. Add **non-gated** `backend/cmd/server/main_test.go` `TestBuildStore_EmptyDSNReturnsMemoryStore` (closes carried PW2).
  - Files: `cmd/server/main.go`, `cmd/server/main_test.go`.
  - R: `TestBuildStore_EmptyDSNReturnsMemoryStore` fails (no `buildStore`). G: add helper + swap line. T: `go build ./...`; memory smoke `go run ./cmd/server` boots with no `DATABASE_URL`. Ref: extract log messages.
  - Verify: `go test ./cmd/...`; `go build ./...`.
- [x] **4.2** Add `test-integration` (+`migrate`) targets to `backend/Makefile`; document `DATABASE_URL` + integration runner in `backend/.env.example` and `backend/README.md`.
  - Files: `backend/Makefile`, `backend/.env.example`, `backend/README.md`.
  - **Commit C4**: `feat(backend): wire store selection and auto-migrate at startup; document runner (p4-postgres-persistence)`.

## Phase 5: Final verification (no new commit)

- [ ] **5.1** From `backend/`: `go build ./...` + `go test ./...` pass with no Postgres/Docker; DB-backed tests skip green (`t.Skip`). Verify each commit ≤400 changed lines (`git diff --stat`).
- [ ] **5.2** Prove zero drift: `git diff backend/internal/store/store.go backend/internal/domain/domain.go` empty (port unchanged); `git diff contracts/` empty (`openapi.yaml` untouched); guard + `backend-auth` still green.
- [ ] **5.3** Map every `backend-runtime` scenario to a named test: both adapters satisfy the port · duplicate email 400 · unknown lookup not found · `Up` idempotent · default run skips green · gate opens on DSN · build standalone · server serves · memory-when-unset · pgx+auto-migrate-when-set · missing secret fails · PORT honored · optional `DATABASE_URL`.
- [ ] **5.4** Confirm four commits on `main`, each ending `(p4-postgres-persistence)`.

**Work-unit rule**: tests ship with code; one deliverable per commit; integration gate verbatim (`CCA_TEST_DATABASE_URL` set AND `!testing.Short()`, else `t.Skip`); DSN never hardcoded.
