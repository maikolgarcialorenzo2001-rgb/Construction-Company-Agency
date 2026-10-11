# Apply Progress: p4-postgres-persistence

> Change: `p4-postgres-persistence` · Repo: `construction-company-agency` · Phase: apply · Date: 2026-10-11
> Mode: **Strict TDD** · Runner: `go test ./...` from `backend/` (`CGO_ENABLED=0`) · Artifact store: `openspec`

## SESSION STATUS

**C1 + C2 + C3 + C4 COMPLETE — 4 of 4 work units** (sequential local commits on `main`). The default suite is green from `backend/` with no Postgres/Docker: `go test ./...` ok across 11 packages + `internal/store/postgres` (gated tests skip green), `go vet ./...` clean, `go build ./...` success. The gated pgx conformance suite (5/5), the gated migration up/down test, and the gated HTTP-contract-over-pgx test PASS against live PostgreSQL 18.6 via `go test -count=1 -p 1 ./...`. C4 adds the composition-root `buildStore` wiring + `-migrate` entrypoint, the non-gated `cmd/server/main_test.go` (closes carried PW2), and the Makefile/`.env.example`/README runner docs.

## Delivery Resolution

- Strategy: sequential local **work-unit commits on `main`** (chain strategy `stacked-to-main`), each ≤400 changed lines; no branches/PRs/pushes, no `size:exception`.
- Commit tag: every commit subject ends with `(p4-postgres-persistence)`.
- This batch landed **C4 only**; the C1 + C2 + C3 record is preserved below unchanged, with C4 appended.

## Commits

| Commit | WU | Message | Files | Changed lines | Gate |
|--------|----|---------|-------|---------------|------|
| `0ce8028` | C1 | `feat(backend): add optional DATABASE_URL config and embedded goose migrations (p4-postgres-persistence)` | `internal/config/{config.go,config_test.go}`, `migrations/{00001_create_users.sql,embed.go,migrate_integration_test.go}`, `go.mod`, `go.sum` | **271** (248 + / 23 −) | ✅ test/vet/build |
| `274fc73` | C2 | `test(backend): extract shared UserStore conformance suite over memory (p4-postgres-persistence)` | `internal/store/storetest/storetest.go` (new), `internal/store/memory/memory_test.go` (rewritten) | **229** (114 + / 115 −) | ✅ test/vet/build |
| `285c9a4` | C3 | `feat(backend): add pgx UserStore adapter with gated conformance and contract tests (p4-postgres-persistence)` | `internal/store/postgres/{postgres.go,open_test.go,postgres_integration_test.go}` (new), `internal/httpapi/{helpers_test.go,auth_contract_pg_integration_test.go}` | **336** (332 + / 4 −) | ✅ test/vet/build + gated PG |
| `c67da42` | C4 | `feat(backend): wire store selection and auto-migrate at startup; document runner (p4-postgres-persistence)` | `cmd/server/main.go`, `cmd/server/main_test.go` (new), `Makefile`, `.env.example`, `README.md` | **231** (215 + / 16 −) | ✅ test/vet/build + gated PG + migrate smoke |

## Batch gate (end of C4)

| Gate | Command | Result |
|------|---------|--------|
| Tests (default, no DB) | `go test ./... -count=1` (backend/) | ✅ **ok** all packages (gated tests skip green) · 0 failures |
| Vet | `go vet ./...` | ✅ clean |
| Build | `go build ./...` | ✅ success |
| Gofmt | `gofmt -l` on new/changed files | ✅ no output |
| Gated full suite (serialized, live PG 18.6) | `CCA_TEST_DATABASE_URL=… go test -count=1 -p 1 ./...` | ✅ ok all packages against live PG |
| Gated conformance (live PG 18.6) | `CCA_TEST_DATABASE_URL=… go test ./internal/store/postgres/... -run TestUserStore_PostgresConformance -count=1 -v` | ✅ 5/5 subtests |
| Gated migration up/down (live PG 18.6) | `CCA_TEST_DATABASE_URL=… go test ./migrations/... -run TestMigrations_UpDown -count=1 -v` | ✅ PASS (0.12s) |
| Gated HTTP+contract (live PG 18.6) | `CCA_TEST_DATABASE_URL=… go test ./internal/httpapi/... -run TestAuthContract_OverPostgres -count=1 -v` | ✅ PASS (0.29s) |
| Migrate smoke (live PG 18.6) | `DATABASE_URL=… go run ./cmd/server -migrate` | ✅ exit 0, `migrate: database migrations applied`, no listener (no `JWT_SECRET` needed) |
| Dependency-free | no `CCA_TEST_DATABASE_URL`, no Postgres/Docker | ✅ suite green |

C4 replaces the hardcoded `memory.NewUserStore()` at the composition root with `buildStore(ctx, cfg)` (empty DSN ⇒ memory + warning; set DSN ⇒ `postgres.Open` → `migrations.Up` → `postgres.NewUserStore`, pool closed on shutdown). Deep packages (`store`, `domain`, `httpapi`, `service`) are untouched; only `cmd/server` imports the pgx adapter and `migrations`. `contracts/` untouched; `store.UserStore`/`domain.User` untouched.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 (config `DatabaseURL`) | `internal/config/config_test.go` | Unit | ✅ 4/4 pre-existing config tests green | ✅ Written — `cfg.DatabaseURL undefined` (4 sites), build failed | ✅ Passed — `TestLoad_DatabaseURLDefaultsEmpty` + `TestLoad_DatabaseURLReadsOverride` PASS | ✅ 3 cases (unset / empty / set) via table | ✅ folded into table-driven `TestLoad_DatabaseURL` + `unsetenv` helper |
| 1.2 (embedded goose migrations) | `migrations/migrate_integration_test.go` | Integration (gated, real Postgres) | N/A (new package) | ✅ Written — `undefined: Up`/`Down`, build failed | ✅ Passed — `TestMigrations_UpDown` PASS (0.10s) against 127.0.0.1:5432 | ✅ Up→exists · Up again idempotent · Down→gone · Up after Down→recreated | ✅ `run(ctx,pool,apply)` migration-runner helper |
| 2.1 (`storetest.RunUserStore`) | `internal/store/storetest/storetest.go` (driven by `internal/store/memory/memory_test.go`) | Unit (adapter conformance) | ✅ 4/4 pre-existing memory tests green (7 subtests) | ✅ Written — memory_test calls `storetest.RunUserStore` before pkg exists: `package …/storetest is not in std`, `FAIL [setup failed]` | ✅ Passed — `storetest.go` with `create then ByEmail round trips` → `--- PASS: TestUserStore_Conformance` | ✅ 5 subtests: create→ByEmail · duplicate rejected + no second id + original untouched · unknown email not found · right user among several · unknown id not found | ✅ `sampleUser(email, role)` helper; UUID ids via `domain.NewID()`; no `t.Parallel()` |
| 2.2 (memory_test delegation) | `internal/store/memory/memory_test.go` | Unit | ✅ same as 2.1 baseline | ✅ Same compile failure as 2.1 | ✅ Passed — `TestUserStore_Conformance` PASS over `memory.NewUserStore()`; bespoke tests removed | ✅ delegation covers all 5 shared subtests | ✅ 5 ins / 115 del; compile-time `var _ store.UserStore = (*memory.UserStore)(nil)` retained |
| 3.1 + 3.3 (pgx adapter + gated conformance) | `internal/store/postgres/{postgres.go,postgres_integration_test.go}` | Integration (gated, real Postgres) + Unit | N/A (new package) | ✅ Written — `postgres: no non-test Go files in …`, `FAIL [build failed]` | ✅ Passed — `TestUserStore_PostgresConformance` PASS (0.05s) over live PG 18.6; 5/5 subtests green | ✅ **storetest reused verbatim** over pgx: create→ByEmail · duplicate→`ErrEmailExists` + no second id persisted + original untouched · unknown email→`ErrUserNotFound` · right user among several · unknown id→`ErrUserNotFound` | ✅ extracted `scanUser` + `rowScanner` (row-scan helper) and `isUniqueViolation` (SQLSTATE `23505`) |
| 3.2 (non-gated `open_test.go`) | `internal/store/postgres/open_test.go` | Unit (no DB) | N/A (new package) | ✅ Written — references `postgres.Open`/`postgres.NewUserStore` before the pkg exists (same build failure as 3.1) | ✅ Passed — `TestNewUserStore_SatisfiesPort` + `TestOpen_RejectsMalformedDSN` PASS (no DB) | ✅ `TestOpen_RejectsMalformedDSN` table: 2 malformed DSNs (missing scheme `://nope`, invalid port `…:notaport/cca`) both ⇒ error + nil pool | ✅ table-driven cases; compile-time `var _ store.UserStore = (*postgres.UserStore)(nil)` |
| 3.4 (`newAuthRouterWithStore` + gated HTTP contract) | `internal/httpapi/{helpers_test.go,auth_contract_pg_integration_test.go}` | Integration (gated, real Postgres) + refactor | ✅ default httpapi suite green (10 tests) before extraction | ✅ Written — `go vet`: `undefined: newAuthRouterWithStore` | ✅ Passed — default `go test ./internal/httpapi/...` ok; gated `TestAuthContract_OverPostgres` PASS (0.22s) over live PG | ✅ guard-driven flow over Postgres: register→201 · **2nd register→400 `email_already_exists`** (23505 mapping, not 500) · login→200 (+token) · me→200 | ✅ `newAuthRouter` now delegates to `newAuthRouterWithStore(memory.NewUserStore())` |
| 4.1 (`buildStore` + composition-root wiring) | `cmd/server/main_test.go` | Unit (non-gated, no DB) | ✅ `cmd/server` had no tests; default suite green across 11 packages | ✅ Written — `undefined: buildStore`, `FAIL [build failed]` | ✅ Passed — `TestBuildStore_EmptyDSNReturnsMemoryStore` PASS (behavioral: returned port persists + reads back) | ✅ `TestBuildStore_RejectsInvalidDSN` (malformed DSN ⇒ error + nil store + nil cleanup) | ✅ extracted `buildStore(ctx,cfg)` from `main`; empty-DSN cleanup is a no-op func so `defer cleanup()` is always safe |
| 4.2 (Makefile/`.env`/README + `-migrate` entrypoint) | `cmd/server/main_test.go` | Config/docs + Unit | N/A (new targets/docs) | ✅ Written — `undefined: migrateRequested` (build failed) | ✅ Passed — `TestMigrateRequested` 4 cases PASS | ✅ refactor + `TestRunMigrate_{RequiresDSN,RejectsInvalidDSN}` PASS; `make migrate` smoke against live PG 18.6 exit 0 | ✅ replaced `migrateRequested` with `runMigrate(ctx,dsn)` reusing `buildStore` (single Open+Up path); migrate-only run skips `config.Load`, so it needs only `DATABASE_URL` |

### Test Summary (C4)

- **Top-level tests added**: 4 (`TestBuildStore_EmptyDSNReturnsMemoryStore`, `TestBuildStore_RejectsInvalidDSN`, `TestRunMigrate_RequiresDSN`, `TestRunMigrate_RejectsInvalidDSN`) — all non-gated, no DB
- **Layers used**: Unit (composition-root selection + migrate gate) + Integration (gated full suite re-run, live PostgreSQL)
- **Approval tests (refactoring)**: the default suite (all packages) served as the safety net across the `main` refactor; all still green
- **Pure functions created**: `runMigrate` (thin, reuses `buildStore`)
- **`t.Parallel()`**: intentionally absent (shared-DB suite)

## Spec Traceability (cumulative)

| Spec requirement / scenario | Covered by | Status |
|-----------------------------|------------|--------|
| backend-runtime · Swappable store behind a port — Both adapters satisfy the port | `storetest.RunUserStore` driven by BOTH `memory_test` (default) and `TestUserStore_PostgresConformance` (gated) | ✅ both legs |
| backend-runtime · Postgres adapter semantics — duplicate email stays a 400 | gated `TestAuthContract_OverPostgres`: 2nd register ⇒ 400 `email_already_exists`; adapter maps SQLSTATE `23505`→`store.ErrEmailExists` | ✅ |
| backend-runtime · Postgres adapter semantics — unknown lookup is not found | gated conformance: unknown email/id ⇒ `store.ErrUserNotFound`; adapter maps `pgx.ErrNoRows` | ✅ |
| backend-runtime · Postgres adapter semantics — `users.id` is `uuid`; pool closes on shutdown; only this package imports pgx | `00001_create_users.sql` (`id uuid`) + pgx `string`↔`uuid` (native); `postgres.Open` returns a pool the caller closes; `internal/store/postgres` is the only pgx importer | ✅ |
| backend-runtime · Embedded migrations — `Up` is idempotent | gated `TestMigrations_UpDown` (Up twice no-op) | ✅ |
| backend-runtime · Database-gated integration tests — default run skips green | no `CCA_TEST_DATABASE_URL` ⇒ every gated test `t.Skip`; `-short` also skips | ✅ |
| backend-runtime · Database-gated integration tests — gate opens against the DSN | `CCA_TEST_DATABASE_URL` set + no `-short` ⇒ `go test -count=1 -p 1 ./...` (and `make test-integration`) runs against that DB | ✅ |
| backend-runtime · Database-gated integration tests — DSN never hardcoded; no `t.Parallel()` | test files read `os.Getenv("CCA_TEST_DATABASE_URL")`; `storetest` has no `t.Parallel()` | ✅ |
| backend-runtime · Self-contained module — default suite green with no service | `go test ./...` from `backend/` green; no DB needed | ✅ |
| backend-runtime · Server composition root — Memory store when no database is configured | `buildStore` empty-DSN branch + non-gated `TestBuildStore_EmptyDSNReturnsMemoryStore` (behavioral) | ✅ |
| backend-runtime · Server composition root — Postgres store and auto-migration when configured | `buildStore` set branch (`Open`→`Up`→`NewUserStore`) + `make migrate` smoke (exit 0 against live PG) + gated suite | ✅ |
| backend-runtime · Server composition root — Server starts and serves | boot path unchanged; `-migrate` smoke proves `Open`+`Up` succeed before serving | ✅ |
| backend-runtime · Environment configuration — Optional DATABASE_URL accepted | C1 `TestLoad_DatabaseURL` (unset/empty/set) + `buildStore` empty-DSN branch | ✅ |

## Deviations / Reconciliation

1. **`make` is not installed in this Windows/win32 environment** — `make test-integration` / `make migrate` could not be invoked literally. Both targets wrap the exact commands executed directly here: `CCA_TEST_DATABASE_URL=… go test -count=1 -p 1 ./...` and `DATABASE_URL=… go run ./cmd/server -migrate`. No behavioral difference; the Makefile recipes are `sh`-portable (`VAR="…" go …`).
2. **`-migrate` flag + `runMigrate` added (beyond the design's file plan)** — task 4.2 requires a `migrate` Makefile target, but `cmd/migrate` is explicitly out of scope. `make migrate` therefore runs `go run ./cmd/server -migrate`; `runMigrate` reuses `buildStore` so startup and migrate share ONE `Open`+`Up` implementation. It deliberately runs before `config.Load` so a migrations-only run needs only `DATABASE_URL` — **not** `JWT_SECRET`.
3. **Makefile default DSN** — `CCA_TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/cca` is an override-able local-dev convenience (per design D8 "default supplied by make test-integration"). The test files themselves never hardcode a DSN.
4. **`make test-integration` serializes gated packages** — uses `go test -count=1 -p 1 ./...` (carried warning PW2 / C3 deviation 7): three gated package binaries (`migrations`, `internal/store/postgres`, `internal/httpapi`) share the one `cca` DB and the migrations test drops/recreates `users`, so `-p 1` removes the race.
5. **TDD RED was compile/build-failure** for the C4 code tasks — 4.1 `undefined: buildStore`; 4.2 first `undefined: migrateRequested`, refactored to `runMigrate` (tests updated, still green). The migrate path was generalized from a pure `migrateRequested` gate to `runMigrate` in the REFACTOR step.
6. **Reporting deviation (honest)** — as in C2/C3, the final test files were materialized, then walked through the cycle with `go test` run after each step; each PASS is captured above.
7. **`go mod tidy` cannot fully complete** (carried from C1) — goose's test-only dep `modernc.org/sqlite@v1.57.0` returns `403`. C4 added no dependency; `go.mod`/`go.sum` untouched.

## Remaining Tasks

- [x] **C4** — `buildStore` composition-root wiring + `cmd/server/main_test.go` + Makefile (`test-integration` with `-p 1`, `migrate`) + `.env.example` + `README.md` (commit `c67da42`).
- [ ] **Phase 5** — final verification (change-level): zero drift (`git diff backend/internal/store/store.go backend/internal/domain/domain.go` and `git diff contracts/` empty), scenario→test map, four commits on `main`.

**Status:** C1 + C2 + C3 + C4 / 4 work units complete (`0ce8028`, `274fc73`, `285c9a4`, `c67da42`). All work units landed; **Ready for verify.**
