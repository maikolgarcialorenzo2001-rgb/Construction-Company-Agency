# Exploration: p4-postgres-persistence (swap the in-memory `UserStore` for a pgx/Postgres adapter)

> Change: `p4-postgres-persistence` · Repo: `construction-company-agency` · Date: 2026-10-11
> Artifact store: openspec · Phase: explore (read-only investigation, no implementation)
> Predecessor: `p3-backend-foundation` (archived `29d92d1`). This is HANDOFF.md §3 "Option A".

## TL;DR (the answer first)

1. **The port already exists and does not change.** `store.UserStore` has exactly three methods (`Create`, `ByEmail`, `ByID`) at `backend/internal/store/store.go:22-29`. A pgx adapter is a pure **composition-root swap** (`cmd/server/main.go:25`); services and handlers are untouched. Domain `User` maps **1:1** — no new fields, no timestamps in the contract.
2. **Integration tests must be gated by an ENV VAR, not only `testing.Short()`.** This is the single biggest correctness trap: the default runner is `go test ./...`, which does **not** pass `-short`, so `testing.Short()` is `false` by default and a naive `if testing.Short() { t.Skip() }` guard would run DB tests in the default suite. The gate must be `testing.Short() || DSN-unset → skip`, with the local DSN supplied by a Makefile target — never hardcoded in the test (a hardcoded localhost default would make the default suite DB-dependent and fail on CI/other machines, violating `backend-runtime` "Default suite is dependency-free").
3. **The contract guard is untouched and stays green for free.** It drives in-memory adapters via `httpapi/helpers_test.go:24-29` (`newAuthRouter` → `memory.NewUserStore()`). Keeping the memory adapter as the test/dev store means **zero** guard changes; the contract file is never edited.
4. **Error mapping is the real adapter logic:** `pgx.ErrNoRows → ErrUserNotFound`, SQLSTATE `23505` (`pgconn.PgError`) → `ErrEmailExists`. These are the only behaviors the port requires beyond plain SQL.
5. **Migration tooling: `pressly/goose` v3 via `//go:embed` + `goose.NewProvider`**, reusing the **same pgxpool** for both migrations and the store through `stdlib.OpenDBFromPool(pool)`. Pure Go, CGO-free. Network for `go mod tidy` is reachable (verified: `proxy.golang.org` + `sum.golang.org` → HTTP 200).
6. **Recommended first slice:** C1 config `DATABASE_URL` + goose migrations infra + `users` table (text/uuid PK, unique email, role CHECK) + `migrations.Up`. Then C2 shared store conformance suite, C3 pgx adapter + gated integration, C4 composition-root wiring + runner/docs. **~700 lines → chained local commits (each ≤400), as already locked.**

---

## 1. What exists today (grounded, with file refs)

### 1.1 The port (UNCHANGED)

`backend/internal/store/store.go`:

```go
var (
    ErrEmailExists  = errors.New("store: email already exists")
    ErrUserNotFound = errors.New("store: user not found")
)

type UserStore interface {                                             // store.go:22-29
    Create(ctx context.Context, u domain.User) error                    // ErrEmailExists on dup
    ByEmail(ctx context.Context, email string) (domain.User, error)     // ErrUserNotFound
    ByID(ctx context.Context, id string) (domain.User, error)           // ErrUserNotFound
}
```

`backend/internal/domain/domain.go:28-33`:

```go
type User struct {
    ID           string   // uuid v4 string, minted by the service
    Email        string
    PasswordHash string  // bcrypt hash, never plaintext
    Role         Role
}
```

**Conclusion:** the domain maps 1:1 to a `users` row. There are no timestamps in the contract auth responses (`register → {userId,token}`, `login → {token,role}`, `me → {userId,email,role}`), so **no `created_at`/`updated_at` columns are needed**. IDs are app-generated (`domain.NewID()` → `uuid.NewString()`), so the DB has no `DEFAULT gen_random_uuid()`.

### 1.2 The in-memory adapter

`backend/internal/store/memory/memory.go` — mutex + two maps, `var _ store.UserStore = (*UserStore)(nil)` (line 20). It stays as the **test/dev** adapter.

### 1.3 The composition root (the ONE prod call site)

`backend/cmd/server/main.go:24-28`:

```go
issuer := auth.NewJWT(cfg.JWTSecret, cfg.TokenTTL)
users := memory.NewUserStore()                       // ← line 25: the swap point
authService := service.NewAuth(users, issuer, auth.Bcrypt{})
router := httpapi.NewRouter(httpapi.Deps{Auth: authService, Tokens: issuer})
```

`service.NewAuth(users store.UserStore, ...)` (`service/service.go:44`) depends on the **interface**, so the only wiring change is line 25. No handler, service, router, or middleware change.

### 1.4 Config today

`backend/internal/config/config.go` — `Load()` reads `PORT` (def 8080), `JWT_SECRET` (required, fail-fast), `CONTRACT_PATH` (optional), `TOKEN_TTL` (def 24h). A `DatabaseURL` field slots in as another optional parse with the same fail-fast-on-invalid style (`config_test.go` already table-tests this pattern).

### 1.5 How tests construct the store

| Test surface | Store | File |
|---|---|---|
| Service unit | `fakeStore` (test-local) | `service/fakes_test.go:16-62` |
| Memory store unit | `memory.NewUserStore()` | `store/memory/memory_test.go` |
| HTTP handler tests | `memory.NewUserStore()` via `newAuthRouter` | `httpapi/helpers_test.go:24-29` |
| **Contract guard** | `memory.NewUserStore()` via `newAuthRouter` | `httpapi/auth_contract_test.go` |

**Key consequence:** every existing test injects a store directly or via `memory`. Swapping the prod root leaves **all of them unchanged and green**. The guard is not coupled to Postgres and must stay that way.

### 1.6 The contract guard

`internal/contract/guard.go` — path resolution (`ResolvePath`, env override + walk-up), `Load` (load + `doc.Validate`), `Validate`/`ValidateHTTP` (kin-openapi request+response). **Read-only consumer of `contracts/openapi.yaml`; not touched by this change.**

---

## 2. Affected areas

- `backend/internal/config/config.go` (+`config_test.go`) — add optional `DatabaseURL` parsing/validation.
- `backend/internal/store/postgres/postgres.go` — **NEW** pgx adapter (the only package importing `pgx`).
- `backend/internal/store/storetest/storetest.go` — **NEW** shared `UserStore` conformance suite (proves memory and pgx are interchangeable).
- `backend/internal/store/memory/memory_test.go` — refactor to call the shared suite (net small change).
- `backend/migrations/00001_create_users.sql` — **NEW** goose migration.
- `backend/migrations/embed.go` — **NEW** `//go:embed *.sql` + `Up(ctx, pool)` helper (package `migrations`).
- `backend/cmd/server/main.go` — composition-root branch (Postgres when configured, memory otherwise).
- `backend/Makefile` — add `test-integration` + `migrate` targets.
- `backend/.env.example`, `backend/README.md` — document `DATABASE_URL` + how to run integration tests.
- `backend/go.mod` / `go.sum` — add `jackc/pgx/v5` and `pressly/goose/v3` (+transitive).
- `openspec/specs/backend-runtime/spec.md` — **delta in the spec phase**: "In-memory user store behind a port" → generalize to a swappable store with a Postgres adapter; "Server composition root" wires the configured store.
- **NOT** `contracts/openapi.yaml` — read-only, never edited.

---

## 3. Key design decisions

| # | Decision | Recommendation | Alternatives / trade-off |
|---|----------|----------------|--------------------------|
| **D1** | Store selection in the root | `DATABASE_URL` **optional**: set → pgxpool adapter; empty → memory adapter (log a warning). Preserves the existing zero-config `go run` dev loop and the `backend-runtime` "server starts and serves" scenario. | **Required** `DATABASE_URL` (fail-fast when absent): more production-real but breaks zero-config dev and forces a bigger spec delta. Chosen-against for this project stage; revisit at deploy. |
| **D2** | Driver | `github.com/jackc/pgx/v5` + `pgxpool` (native pool). Pure Go, CGO-free. | `database/sql` + `pgx/v5/stdlib` everywhere (simpler mental model, slower). lib/pq (cgo-adjacent, stale). |
| **D3** | Migration tool | `pressly/goose/v3` via **`//go:embed`** + `goose.NewProvider(goose.DialectPostgres, db, fs)`. | `os.DirFS("migrations")` (fragile CWD in a deployed binary). golang-migrate (extra CLI). |
| **D4** | Migration connection | Reuse the **same pool**: `db := stdlib.OpenDBFromPool(pool)` → one pool serves migrations and queries. | A second dedicated `sql.DB` (extra connection path). |
| **D5** | When migrations run | **At server startup** (idempotent goose `Up`) + reused verbatim by integration tests. | Separate `cmd/migrate` step (cleaner ops, more surface; can be added later). |
| **D6** | `id` column type | **`uuid`** PK; adapter passes `u.ID` string (pgx v5 encodes string↔uuid). | `TEXT` PK — zero encoding risk, but less typed. **Fallback `TEXT` if the RED integration test shows an encoding error.** |
| **D7** | Error mapping | `pgx.ErrNoRows → store.ErrUserNotFound`; `errors.As(err, &pgErr) && pgErr.Code=="23505" → store.ErrEmailExists` (`github.com/jackc/pgx/v5/pgconn`). | Broad string matching (fragile). |
| **D8** | Integration gate | `if testing.Short() { skip }` **AND** `DSN env unset → skip`; DSN via `CCA_TEST_DATABASE_URL`, default supplied by `make test-integration`, never hardcoded in the test. | `-short` only (WRONG — default `go test ./...` never sets `-short`). Build tag `//go:build integration` (task mandates `testing.Short()`). |
| **D9** | Test isolation on the shared `cca` DB | `TestMain` applies migrations once; per-adapter `newStore` does `TRUNCATE users` so each conformance subtest is deterministic. No `t.Parallel()` in the shared suite. | Unique emails per test (fewer guarantees about duplicates). Fresh schema/db per run (hermetic, more work) — follow-on. |
| **D10** | Conformance suite | `internal/store/storetest` `RunUserStore(t, newStore)` shared by **both** adapters → proves interchangeability in the default suite (memory) and via integration (pgx). | Duplicate assertions in each adapter's package. |

---

## 4. Interfaces / concrete shapes (target)

```go
// internal/config — added field
type Config struct {
    // ... existing ...
    DatabaseURL string // DATABASE_URL, optional; empty ⇒ in-memory store
}

// internal/store/postgres (NEW)
func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) // pgxpool.New + Ping
type UserStore struct { pool *pgxpool.Pool }
var _ store.UserStore = (*UserStore)(nil)
func NewUserStore(pool *pgxpool.Pool) *UserStore
func (s *UserStore) Create(ctx context.Context, u domain.User) error          // INSERT; 23505 → ErrEmailExists
func (s *UserStore) ByEmail(ctx context.Context, email string) (domain.User, error) // ErrNoRows → ErrUserNotFound
func (s *UserStore) ByID(ctx context.Context, id string) (domain.User, error)       // ErrNoRows → ErrUserNotFound

// migrations (NEW; package migrations, dir backend/migrations)
//go:embed *.sql
var FS embed.FS
func Up(ctx context.Context, pool *pgxpool.Pool) error // stdlib.OpenDBFromPool → goose provider.Up

// internal/store/storetest (NEW)
func RunUserStore(t *testing.T, newStore func(t *testing.T) store.UserStore) // shared behavioral contract
```

`backend/migrations/00001_create_users.sql`:

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

---

## 5. Migration approach — grounded in goose's pure-Go API

Verified against pressly/goose v3 docs:

- **Embed + provider (recommended):**
  ```go
  //go:embed *.sql
  var FS embed.FS
  p, _ := goose.NewProvider(goose.DialectPostgres, db, FS)
  _, err := p.Up(ctx) // idempotent; records applied versions in goose_db_version
  ```
  `//go:embed` must live **inside** `backend/migrations/` (embed cannot reference parent dirs), hence a tiny `embed.go` in that dir. Provider works with any `io/fs.FS` — including an embedded FS — and exposes `HasPending`/`GetVersions`.
- **Same pool for both concerns:** `db := stdlib.OpenDBFromPool(pool)` wraps the live `*pgxpool.Pool` as a `*sql.DB` (closing the DB does not close the pool), so goose and the store share one pool.
- **No Docker:** migrations and integration tests run against the **live local Postgres 18.6** at `127.0.0.1:5432` (db `cca`), verified reachable (`select version()` round-trips; `\dt` → no tables yet).
- **Dependency note:** goose drags a handful of transitive deps (`sethvargo/go-retry`, `mfridman/interpolate`, `shopspring/decimal`, `go.uber.org/multierr`, …). `go mod tidy` will scope them; `go.sum` will grow. All pure Go.

---

## 6. Test split (default vs integration) — the critical section

**The default `go test ./...` must pass with no database.** Because `-short` is not passed by default, `testing.Short()` alone is insufficient. The gate is:

```go
// store/postgres/integration_test.go
func testPool(t *testing.T) *pgxpool.Pool {
    t.Helper()
    if testing.Short() {
        t.Skip("integration: skipped in -short mode")
    }
    dsn := os.Getenv("CCA_TEST_DATABASE_URL")
    if dsn == "" {
        t.Skip("integration: set CCA_TEST_DATABASE_URL (see make test-integration)")
    }
    pool, err := postgres.Open(context.Background(), dsn)
    if err != nil { t.Fatalf("open: %v", err) }
    t.Cleanup(pool.Close)
    return pool
}
```

| Suite | Contents | Gate | Default `go test ./...` |
|---|---|---|---|
| Unit (existing) | config, domain, memory, auth, service, httpapi, contract guard | none | **runs** |
| Unit (new) | `config` `DatabaseURL` parse (default empty / reads override / rejects malformed) | none | **runs** |
| Conformance (memory) | `storetest.RunUserStore` over `memory.NewUserStore()` | none | **runs** |
| Conformance (pgx) | `storetest.RunUserStore` over `postgres.NewUserStore` + `TRUNCATE users` | `-short` OR DSN unset → skip | **skips (green)** |
| HTTP+contract over pgx | register→login→me through the real router, validated by the guard | same gate | **skips (green)** |

Runners:
- Default: `go test ./...` (no env) → integration skips → green anywhere.
- Fast: `go test -short ./...` → integration skips explicitly.
- Full local: `make test-integration` → `CCA_TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/cca go test -short=false ./...`.

**Why the HTTP+contract-over-pgx test matters:** the contract guard is only ever driven by the **memory** adapter today. Without a gated contract run over Postgres, the adapter's duplicate-email→400 mapping (SQLSTATE 23505) is never proven end-to-end against the real DB. Adding it closes that gap.

---

## 7. Recommended work-unit slice plan (chained local commits on `main`)

`go test ./...` must be green after **every** commit. Forecast ≈ **700 changed lines** across `backend/` (+`go.sum` churn) → **exceeds the 400-line budget as one commit**; use chained slices (the locked strategy; no branches/PRs/pushes).

| WU | Deliverable | Files | ~Lines | Verify |
|---|---|---|---|---|
| **C1** | `DATABASE_URL` config + goose migrations infra + `users` table + `migrations.Up` | `config.go`(+test), `migrations/00001_create_users.sql`, `migrations/embed.go`, `migrations/migrate_integration_test.go` (gated) | ~180 | config unit tests; gated migration up/down against live PG |
| **C2** | Shared `storetest` conformance suite + memory refactor | `store/storetest/storetest.go`, `store/memory/memory_test.go` | ~170 | `storetest` green over memory in the default suite |
| **C3** | pgx `UserStore` adapter + error mapping + gated integration & HTTP-contract tests | `store/postgres/postgres.go`(+test), `httpapi/*_integration_test.go` | ~230 | `go test ./...` skips; `make test-integration` runs green |
| **C4** | Composition-root wiring + runner/docs | `cmd/server/main.go`, `Makefile`, `.env.example`, `README.md` | ~120 | `go build ./...`; `go run` boots on memory with no config |

Ordering: C1 → C2 → C3 → C4. C2 before C3 so the adapter's RED is a concrete, shared contract. Tests ship with their code; every commit ends with `(p4-postgres-persistence)`.

---

## 8. Strict-TDD red/green path (per slice)

- **C1 RED:** `config_test` cases for `DatabaseURL`; `migrations` integration test asserts `users` exists after `Up` and is gone after `Down`. GREEN: implement config field + SQL + `Up`.
- **C2 RED:** `storetest` compiles, memory test calls `RunUserStore` and fails until the assertions match adapter behavior. GREEN: satisfy over `memory`.
- **C3 RED:** `storetest.RunUserStore` over `postgres.NewUserStore` (gated) fails until the adapter exists; duplicate email must yield `ErrEmailExists`, unknown lookups `ErrUserNotFound`. GREEN: implement `Create`/`ByEmail`/`ByID` + mapping. The gated HTTP+contract test then proves 201/200/401/400 shapes over real PG.
- **C4 RED:** none (wiring/docs) — verified by `go build ./...` and a `go run` smoke on the memory path; optionally a tiny store-selection unit test.

---

## 9. Risks / unknowns

| # | Risk | Severity | Mitigation |
|---|---|----------|------------|
| R1 | **`testing.Short()` alone does not keep the default green** — `go test ./...` doesn't pass `-short`, so DB tests would run and fail without a DB/CI | **HIGH** | Env-gate (`CCA_TEST_DATABASE_URL` unset → skip) **plus** `-short`; local DSN supplied by `make test-integration`, never hardcoded (D8) |
| R2 | Shared `cca` DB pollution / parallel races | Med | `TestMain` migrates once; per-subtest `TRUNCATE users`; no `t.Parallel()` in the shared suite (D9) |
| R3 | go.sum/transitive growth from goose+pgx; needs network for `go mod tidy` | Low | Verified `proxy.golang.org`+`sum.golang.org` → 200; pin exact versions; all pure Go |
| R4 | Duplicate-email must map to 400, not 500 — the contract declares no 409 | Med | Map SQLSTATE `23505` explicitly (D7); gated HTTP+contract test over PG (R4/§6) |
| R5 | `uuid` string↔column encoding in pgx | Low-Med | Recommend `uuid`; `TEXT` fallback if the RED test errors (D6) |
| R6 | Auto-migrate at startup (concurrency, prod debate) | Low | Idempotent goose lock table; document; separate `cmd/migrate` is a later option (D5) |
| R7 | `cmd/server` still untested (carried `PW2`) — the store branch is unverified by unit tests | Low-Med | Optional: extract store selection into a small testable helper so the "empty DSN → memory" branch is unit-covered |
| R8 | Contract guard regresses if a DB dependency leaks into default tests | Med | Guard stays on `memory`; guard self-test (`TestGuard_RejectsMutatedResponse`) still detects neutering; no build tags |
| R9 | Contract must stay untouched | — | No planned edit to `contracts/openapi.yaml`; `git diff contracts/` must stay empty at verify |
| R10 | Windows/disk (D: ~26 GB free), CRLF | Low | `filepath.Join`; module cache on D: is small for these deps |

**No hard blockers.** Environment preconditions are already satisfied (§10).

---

## 10. Preconditions / blockers (verified 2026-10-11)

| Precondition | Status | Evidence |
|---|---|---|
| Go toolchain present, CGO-free | ✅ | `go version go1.27.2 windows/amd64`; `CGO_ENABLED=0` |
| Postgres live, DB `cca` exists | ✅ | `select version()` → PostgreSQL 18.6; `\dt` → no tables |
| Network for new modules | ✅ | `proxy.golang.org` / `sum.golang.org` → HTTP 200 |
| Contract read-only, unchanged | ✅ | `git diff contracts/` empty at start |
| Disk space | ✅ | D: ~26 GB free |

**Open questions for proposal/design:**
1. Confirm D1 (optional `DATABASE_URL`, memory fallback) vs required DSN.
2. Confirm D3/D5 (goose + auto-migrate at startup) and whether a `cmd/migrate` is wanted.
3. Confirm D6 (`uuid` vs `TEXT` id column).
4. Confirm the integration gate variable name (`CCA_TEST_DATABASE_URL`).

---

## 11. Approaches considered

1. **Composition-root swap behind the existing port (RECOMMENDED)** — pgxpool adapter + goose embed, memory retained for tests/dev. Pros: zero service/handler/guard changes, contract untouched, default suite dependency-free, true port interchangeability proven by a shared conformance suite. Cons: two adapters to keep in sync (covered by `storetest`). Effort: Medium.
2. **`database/sql` + `pgx/stdlib` everywhere** — one driver path. Pros: simpler mental model, goose-native. Cons: loses pgxpool's native API/perf; still needs a pool wrapper. Effort: Low-Med.
3. **Repository swap + hardcode `DATABASE_URL` required** — Pros: unambiguous prod behavior. Cons: breaks zero-config dev, larger spec delta, no benefit at this stage. Effort: Low.

---

## Recommendation

**Proceed to `sdd-propose`** for `p4-postgres-persistence`, scoped to: `config.DatabaseURL`, a goose embed-migration infra with a `users` table, a `pgxpool`-backed `UserStore` adapter behind the **unchanged** port, a shared `UserStore` conformance suite, a composition-root store branch, and **env-gated + `testing.Short()`-gated integration tests**. Keep the contract read-only and the memory adapter as the default test/dev store so the kin-openapi guard stays dependency-free and green. Deliver as **four chained local work-unit commits** (each ≤400 lines).

## Ready for Proposal

**Yes.** All preconditions are met (Go + live Postgres + module network verified), the port is fixed and requires no change, and the only non-obvious trap (D8: `testing.Short()` is false under the default `go test ./...`) has a concrete mitigation. Suggested triggers: `sdd-propose` → `sdd-spec` (delta `backend-runtime`) → `sdd-design` → `sdd-tasks` → `sdd-apply`.
