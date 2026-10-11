# Proposal: p4-postgres-persistence

> Change: `p4-postgres-persistence` · Repo: `construction-company-agency` · Phase: propose · Date: 2026-10-11
> Grounded in `openspec/changes/p4-postgres-persistence/explore.md` and `contracts/openapi.yaml` (read-only).

## Intent (WHAT/WHY)

- **WHAT**: Swap the in-memory `UserStore` for a **PostgreSQL** adapter (`jackc/pgx/v5` `pgxpool`) behind the **unchanged** `store.UserStore` port, with **goose v3** embedded migrations. Add optional `DATABASE_URL` config; keep the memory adapter as the default test/dev store so the default `go test ./...` stays dependency-free.
- **WHY**: `p3-backend-foundation` (archived `29d92d1`) shipped auth against an in-memory store. Persistence is the next foundation concern (HANDOFF §3 "Option A"); the port already exists at `backend/internal/store/store.go:22-29` and is injected only at `cmd/server/main.go:25`, so this is a **composition-root swap** — no handler/service/guard changes. Explore proves domain↔row maps 1:1 (no timestamps, app-minted UUIDs).

## Resolved Decisions (open questions closed)

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| **D1** | DSN optional vs required | **Optional**: `DATABASE_URL` set → pgx pool + provider `Up`; empty → memory adapter (warn). | Preserves zero-config `go run` dev and the `backend-runtime` "server starts and serves" scenario; required DSN is a deploy-time concern (revisit later). |
| **D3/D5** | goose + when migrations run | **Embedded** (`//go:embed *.sql` → `goose.NewProvider(goose.DialectPostgres, db, FS)`), same pool via `stdlib.OpenDBFromPool`. **Auto-run idempotent `Up` at server startup** when DB configured; integration tests reuse it. No `cmd/migrate` now (documented follow-on). | Embed survives deployed binaries (unlike `os.DirFS` CWD); one pool serves migrations + queries; startup `Up` keeps ops simple. |
| **D6** | `id` column type | **`uuid` PK**, pgx encodes `string`↔`uuid`. | Typed PK; fallback to `TEXT` only if C3 RED exposes an encoding error. |
| **D7** | Error mapping | `pgx.ErrNoRows → ErrUserNotFound`; `errors.As(&pgconn.PgError){Code=="23505"} → ErrEmailExists`. | Only real adapter logic; maps dup email to the contract's existing **400 `email_already_exists`** (no 409). |
| **D8** | Integration gate | **`testing.Short() || CCA_TEST_DATABASE_URL unset → t.Skip`**; DSN never hardcoded, supplied by `make test-integration`. | CRITICAL: default `go test ./...` never passes `-short`, so `testing.Short()` alone would run DB tests. |
| **D9** | Test isolation | `TestMain` migrates once; per-adapter `TRUNCATE users`; no `t.Parallel()` in shared suite. | Deterministic against shared local `cca` DB. |
| **D10** | Conformance | Shared `storetest.RunUserStore(t, newStore)` for both adapters. | Proves port interchangeability; memory path runs in default suite. |

## Scope

**In scope**
- `internal/config`: add `DatabaseURL` (optional, `DATABASE_URL`) + validation; `config_test` cases.
- `internal/store/postgres`: **new** pgx adapter (`Open`, `NewUserStore`, `Create`/`ByEmail`/`ByID`) + error mapping.
- `internal/store/storetest`: **new** shared `UserStore` conformance suite; refactor `memory_test` to call it.
- `migrations/`: **new** `00001_create_users.sql` + `embed.go` (`//go:embed`, `Up(ctx, pool)`).
- `cmd/server/main.go`: store-selection branch (Postgres when configured, else memory); auto-migrate.
- Gated integration: `storetest` over pgx + HTTP register→login→me validated by the contract guard over real PG.
- `Makefile` (`test-integration`, `migrate`), `.env.example`, `README.md`; `go.mod`/`go.sum` (+pgx, +goose).

**Out of scope**
- jobs/profiles/feed/applications stores; deployment/TLS; refresh tokens; `cmd/migrate` binary.
- Any edit to `contracts/openapi.yaml`; any change to the port, service, handlers, or router.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `backend-runtime`: generalize "In-memory user store behind a port" → a **swappable store with a Postgres adapter** selected by `DATABASE_URL`; add `DATABASE_URL` to environment configuration; composition root wires the configured store and auto-migrates. `backend-auth` and `api-conformance` requirements are unchanged (must stay conformant/green).

## Approach

Composition-root swap behind the fixed port. Default suite uses memory (dependency-free); `storetest` proves memory and pgx are interchangeable. The pgx adapter is the only package importing `pgx`. Contract guard stays on memory → unchanged. Duplicate-email `23505` is proven end-to-end by a **gated** HTTP+contract test over real PG (the guard is otherwise never driven by Postgres).

## Work-Unit / Commit Plan (sequential local commits on `main`, each ≤400 lines)

**Decision needed before apply**: No (locked strategy). **Chained PRs recommended**: Yes (realized as local commits). **400-line budget risk**: Low per unit.

| WU | Deliverable | Files | ~LOC | TDD RED→GREEN |
|----|-------------|-------|------|----------------|
| **C1** | `DATABASE_URL` config + goose embed infra + `users` table + `migrations.Up` | `config.go`(+test), `migrations/00001_create_users.sql`, `migrations/embed.go`, gated `migrations` integration test | ~180 | RED: config cases + gated up/down test. GREEN: field + SQL + `Up`. |
| **C2** | Shared `storetest` conformance suite + memory refactor | `store/storetest/storetest.go`, `store/memory/memory_test.go` | ~170 | RED: memory test calls `RunUserStore`, fails on mismatch. GREEN: satisfy over memory. |
| **C3** | pgx `UserStore` + error mapping + gated integration & HTTP-contract tests | `store/postgres/postgres.go`(+test), `httpapi/*_integration_test.go` | ~230 | RED: gated `RunUserStore` over pgx + 23505→400. GREEN: implement adapter. |
| **C4** | Composition-root wiring + runner/docs | `cmd/server/main.go`, `Makefile`, `.env.example`, `README.md` | ~120 | RED: none (wiring); verified by `go build ./...` + `go run` memory smoke (+ optional store-selection unit test). |

Ordering C1→C2→C3→C4: C2 before C3 so the adapter's RED is a shared contract. Tests ship with their code; every commit ends with `(p4-postgres-persistence)`.

## Test Strategy

| Suite | Gate | Default `go test ./...` |
|---|---|---|
| Existing unit + guard | none | runs |
| `config` `DatabaseURL` cases | none | runs |
| Conformance over memory | none | runs |
| Conformance over pgx | `-short` OR DSN unset → skip | **skips (green)** |
| HTTP+contract over pgx | same gate | **skips (green)** |

Runners: default `go test ./...` (green anywhere) · `go test -short ./...` · full local `make test-integration` (`CCA_TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/cca go test -short=false ./...`).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `testing.Short()` alone leaks DB tests into default suite | High | Env-gate + `-short`; DSN only via `make test-integration` (D8). |
| Shared `cca` DB pollution/races | Med | `TestMain` migrate once; `TRUNCATE` per adapter; no `t.Parallel()` (D9). |
| Duplicate email returns 500 instead of 400 | Med | Explicit `23505` mapping (D7); gated HTTP+contract test over PG. |
| `uuid` string↔column encoding in pgx | Low-Med | `uuid` default; `TEXT` fallback if C3 RED errors (D6). |
| `go.sum` growth needs module network | Low | Verified reachable; pin versions; pure Go, no cgo. |
| Contract drift | Low | `contracts/openapi.yaml` untouched; `git diff contracts/` empty at verify. |

## Rollback Plan

Additive: new `store/postgres`, `store/storetest`, `migrations`; small edits to `config.go`, `main.go`, `memory_test.go`, docs, `go.mod`. `DATABASE_URL` unset ⇒ memory path (unchanged behavior). Revert = `git revert` the C1–C4 commits; no contract or frontend impact.

## Dependencies

- Go 1.27.2, `CGO_ENABLED=0`; live local Postgres 18.6 (`cca`) for integration only.
- `github.com/jackc/pgx/v5` (+`pgconn`), `github.com/pressly/goose/v3` (+transitive, all pure Go).
- `contracts/openapi.yaml` present (read-only).

## Success Criteria

- [ ] `go build ./...` and `go test ./...` pass from `backend/` with **no Postgres/Docker**; integration tests skip green.
- [ ] `make test-integration` runs the pgx conformance suite + HTTP+contract `register→login→me` green against live PG.
- [ ] `DATABASE_URL` set selects pgx (auto-migrated `users` table); unset selects memory and boots with no config.
- [ ] Duplicate email over PG yields HTTP 400 `email_already_exists`; unknown lookups yield `ErrUserNotFound`.
- [ ] `contracts/openapi.yaml` unchanged (`git diff contracts/` empty); guard + `backend-auth` still green.
- [ ] Memory and pgx adapters pass the **same** `storetest` suite.
- [ ] Four commits, each ≤400 changed lines, tagged `(p4-postgres-persistence)` on `main`.

## Next Recommended

`sdd-spec` (delta `backend-runtime`) → `sdd-design` → `sdd-tasks` → `sdd-apply`.
