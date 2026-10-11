# Archive Report: p4-postgres-persistence

Change `p4-postgres-persistence` is complete and archived. Verify passed with **PASS (0 CRITICAL, 0 WARNING)**: the in-memory-only user store is now a **swappable** store — the `store.UserStore` port is unchanged and the composition root selects the in-memory adapter (default) or a pure-Go pgx v5 (`pgxpool`) PostgreSQL adapter via `DATABASE_URL`, with goose v3 embedded migrations auto-run at startup. `backend-auth`, `api-conformance`, and `contracts/openapi.yaml` are untouched. The single modified capability `backend-runtime` was merged into its baseline.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p4-postgres-persistence` (swap the in-memory user store for a pgx/Postgres adapter behind the unchanged port; optional `DATABASE_URL`; embedded goose migrations) |
| Verify verdict | **PASS** (0 CRITICAL, 0 WARNING) — `verify-report.md` recorded as Engram #891 (summary observation only; see Risks) |
| Work units | 4/4 complete — `0ce8028` (C1), `274fc73` (C2), `285c9a4` (C3), `c67da42` (C4), each ≤400 changed lines, all tagged `(p4-postgres-persistence)` on `main` |
| Tasks | 5/5 phases — 1.1–1.2, 2.1–2.2, 3.1–3.4, 4.1–4.2 done; Phase 5 final verification done at verify |
| Deltas | 1 capability · `backend-runtime` MODIFIED (ADDED 4 · MODIFIED 3 · REMOVED 1) |
| Final gate (verified by sdd-verify) | default `go test ./...` green from `backend/` with no Postgres/Docker (gated tests skip green) · gated suite green against live PostgreSQL 18.6 via `go test -count=1 -p 1 ./...` · `go vet ./...` clean · `go build ./...` success |
| Contract | `contracts/openapi.yaml` untouched |
| Port/domain | `backend/internal/store/store.go` and `backend/internal/domain/domain.go` untouched (port is unchanged) |
| Archive location | `openspec/changes/archive/2026-10-11-p4-postgres-persistence/` |
| Artifact store | openspec (Engram observations referenced for traceability) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | #880 |
| Proposal | `proposal.md` | #881 `sdd/p4-postgres-persistence/proposal` |
| Resolved decisions | — | #882 |
| Spec (delta) | `specs/backend-runtime/spec.md` | #883 `sdd/p4-postgres-persistence/spec` · #884 (capability mapping) |
| Design | `design.md` | #885 `sdd/p4-postgres-persistence/design` · #886 (design decisions) |
| Tasks | `tasks.md` | #887 |
| Apply progress | `apply-progress.md` | #888 |
| Verify report | *(no file — see Risks)* | #891 |
| Archive report | `archive-report.md` | `sdd/p4-postgres-persistence/archive-report` (this save) |

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| `backend-runtime` | **Updated** | Merged the single delta into `openspec/specs/backend-runtime/spec.md` by heading name. **ADDED (4):** "Swappable user store behind a port" (`storetest.RunUserStore` drives both adapters), "Postgres adapter semantics and lifecycle" (`pgx.ErrNoRows`→`ErrUserNotFound`, SQLSTATE `23505`→`ErrEmailExists`; duplicate email stays HTTP 400 `email_already_exists`; `users.id uuid`; pool closes on shutdown; only this package imports pgx), "Embedded database migrations" (`//go:embed` goose v3, idempotent startup `Up`), "Database-gated integration tests" (`CCA_TEST_DATABASE_URL` set AND `!testing.Short()`, else `t.Skip`; no hardcoded DSN; no `t.Parallel()`). **MODIFIED (3):** "Self-contained backend module" (default suite must gate DB-backed tests — no service-dependent skips), "Server composition root" (store selection by `DATABASE_URL` + idempotent embedded migrations at startup; +2 scenarios), "Environment configuration" (adds `TOKEN_TTL` and optional `DATABASE_URL`; +1 scenario). **REMOVED (1):** "In-memory user store behind a port" — deleted as the superseded pair of the ADDED swappable-store requirement (matched **by heading name**, not appended). |

Merge result: `openspec/specs/backend-runtime/spec.md` now has **10 requirements / 18 scenarios**, **0 duplicate headings**, all 4 ADDED requirements present exactly once, and the REMOVED heading absent. Unrelated baseline requirements preserved unchanged: "Contract path resolution", "Operational health endpoint", "Uniform JSON error envelope". The Purpose line was updated to describe the swappable store (in-memory default + pgx adapter).

## Capability change: `backend-runtime` (MODIFIED)

The capability generalizes "In-memory user store behind a port" into a **swappable store with a Postgres adapter** selected by `DATABASE_URL`; adds `DATABASE_URL` (and `TOKEN_TTL`) to environment configuration; and has the composition root wire the configured store and auto-migrate embedded goose migrations. `backend-auth` and `api-conformance` baselines are unchanged and stay conformant/green.

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `0ce8028` | C1 `feat(backend): add optional DATABASE_URL config and embedded goose migrations (p4-postgres-persistence)` |
| `274fc73` | C2 `test(backend): extract shared UserStore conformance suite over memory (p4-postgres-persistence)` |
| `285c9a4` | C3 `feat(backend): add pgx UserStore adapter with gated conformance and contract tests (p4-postgres-persistence)` |
| `c67da42` | C4 `feat(backend): wire store selection and auto-migrate at startup; document runner (p4-postgres-persistence)` |
| this commit | `docs(openspec): archive p4-postgres-persistence with spec sync (p4-postgres-persistence)` — delta merged into `backend-runtime` baseline, report written, folder moved to `archive/2026-10-11-p4-postgres-persistence/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Follow-ups closed

| Inherited item | Closed by | Evidence |
|---|---|---|
| **PW2** (carried from `p3-backend-foundation`) — `cmd/server` had no test; the composition root's store wiring was unverified | C4 `c67da42` | `cmd/server/main.go` extracts `buildStore(ctx, cfg)` (empty DSN ⇒ memory + warning; set ⇒ `postgres.Open` → `migrations.Up` → `postgres.NewUserStore`); non-gated `cmd/server/main_test.go` adds `TestBuildStore_EmptyDSNReturnsMemoryStore` (behavioral) and `TestBuildStore_RejectsInvalidDSN`. |
| **L3** (deferred by design from `p3-backend-foundation`) — Postgres + migrations deferred to a follow-on | this change | pgx v5 `pgxpool` adapter behind unchanged `store.UserStore`; goose v3 embedded migrations auto-run at startup; gated integration tests (conformance + HTTP + contract over real PG). |

## Carried forward (not silently dropped)

1. **`cmd/migrate` binary not built** (documented follow-on) — `make migrate` instead runs `go run ./cmd/server -migrate`; `runMigrate` reuses `buildStore` so startup and migrate share one `Open`+`Up` path, and the migrate-only run needs only `DATABASE_URL` (not `JWT_SECRET`).
2. **`make` unavailable in the win32 dev environment** — `make test-integration` / `make migrate` could not be invoked literally; the exact wrapped commands were run directly (`CCA_TEST_DATABASE_URL=… go test -count=1 -p 1 ./...` and `DATABASE_URL=… go run ./cmd/server -migrate`) with no behavioral difference.
3. **Gated packages serialize (`-p 1`)** — three gated package binaries (`migrations`, `internal/store/postgres`, `internal/httpapi`) share one `cca` DB and the migrations test drops/recreates `users`; `-p 1` removes the race.
4. **`go mod tidy` cannot fully complete** — goose's test-only dependency `modernc.org/sqlite@v1.57.0` returns HTTP 403; no runtime impact (pure-Go runtime deps pin cleanly).
5. **Next changes in the backend track** — the four resource domains are independent follow-on changes on the foundation's ports/guard: **jobs**, **profiles**, **feed**, and **applications**.

## Risks / housekeeping

1. **No `verify-report.md` file was archived.** The verify phase recorded only an Engram summary observation (#891) and did not persist `openspec/changes/p4-postgres-persistence/verify-report.md` to disk; the change folder therefore contains no verify-report file (unlike `p3-backend-foundation`). The verdict itself is authoritative (**PASS, 0 CRITICAL, 0 WARNING**, per orchestrator + Engram #891). Full verify evidence lives in the Engram observation and in `apply-progress.md` (batch gate + spec traceability). Recommended: have `sdd-verify` persist `verify-report.md` to the change folder so archives carry the full report.
2. **One unrelated tracked modification left uncommitted.** `backend/migrations/migrate_integration_test.go` has a trailing-newline-only edit (verify's gofmt cleanup) in the working tree. It is outside the archive scope (spec sync + move + report) and was intentionally **not** staged. Recommended: commit it with the C1/C3 work or as a tiny `style(backend)` commit.
3. **Untracked non-artifact files remain**: `HANDOFF.md` (session handoff note) and `fg.json` (a stray GitHub API 404 dump). Neither is part of the openspec tree and neither was committed or modified.

## Final gate result

From `backend/` (`CGO_ENABLED=0`):

| Stage | Result |
|---|---|
| `go build ./...` | ✅ success |
| `go test ./... -count=1` (default, no DB) | ✅ ok all packages — gated tests skip green |
| `go vet ./...` | ✅ clean |
| Gated full suite (live PG 18.6, `-count=1 -p 1`) | ✅ ok all packages |
| Gated conformance (pgx) | ✅ 5/5 subtests |
| Gated migration up/down | ✅ PASS |
| Gated HTTP+contract register→login→me over pgx | ✅ PASS (2nd register ⇒ 400 `email_already_exists`) |
| Migrate smoke (`go run ./cmd/server -migrate`, live PG) | ✅ exit 0 |
| Dependency-free (no DSN, no Postgres/Docker) | ✅ suite green |
| Contract diff | ✅ `git diff contracts/` empty; port/domain diff empty |

## Checklist

- [x] `backend-runtime` delta merged by heading name — 4 ADDED, 3 MODIFIED replaced, 1 REMOVED deleted; unrelated requirements preserved
- [x] No duplicate requirement headings; every ADDED present exactly once; 10 requirements / 18 scenarios
- [x] Change folder moved to `openspec/changes/archive/2026-10-11-p4-postgres-persistence/` with all present artifacts (explore, proposal, specs, design, tasks, apply-progress)
- [x] Engram archive report saved as `sdd/p4-postgres-persistence/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `backend/`, no `contracts/`, no `HANDOFF.md`, no `fg.json`, no push, no PR
- [ ] **Gap:** `verify-report.md` missing from the archived folder (see Risks #1)

SDD cycle complete: explore → proposal → spec → design → tasks → apply → verify → archive. The in-memory-only store is now a swappable store with a Postgres adapter behind the unchanged `store.UserStore` port, closing the deferred Postgres follow-on (L3) and the carried `cmd/server` test warning (PW2). Next SDD changes start from this green baseline: the four backend resource domains (jobs, profiles, feed, applications) land on the foundation's ports and contract guard.
