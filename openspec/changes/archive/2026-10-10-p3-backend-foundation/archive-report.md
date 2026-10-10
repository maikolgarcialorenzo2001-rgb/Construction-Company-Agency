# Archive Report: p3-backend-foundation

Change `p3-backend-foundation` is complete and archived. Verify passed with **PASS WITH WARNINGS** (0 CRITICAL): the Go backend foundation now lives under `backend/` (module `cca/backend`), implements the contract's three auth operations with JWT/bcrypt, and closes the `api-conformance` R3 contract-guard gap — all gated by `go test ./...` with **no external service**. The two new capabilities (`backend-runtime`, `backend-auth`) became baselines and the modified `api-conformance` capability was merged with the inherited R3 requirement annotated **CLOSED by this change**.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p3-backend-foundation` (Go + Gin backend foundation: module scaffold, env config, error envelope, `/health`, `UserStore` port + in-memory adapter, JWT issuer, bcrypt hasher, `register`/`login`/`me`, kin-openapi contract guard) |
| Verify verdict | PASS WITH WARNINGS (0 CRITICAL) — `verify-report.md` + Engram #875; 24/26 COMPLIANT, 2/26 PARTIAL (W2 listener bind, S1 `exp` claim assert); no FAILING/UNTESTED |
| Work units | 7/7 complete — batch 1: `6c1ebff`, `6fd92d3`, `a464933`; batch 2: `5e2ea0a`, `b51acd2`, `fca42df`, `f781dd7` (all tagged `(p3-backend-foundation)`) |
| Tasks | 7/7 WUs + Phase 4 (6.1, 6.2 done; 6.3 carries the documented C4 overrun) |
| Deltas | 3 capabilities · 2 new (backend-runtime, backend-auth) + 1 modified (api-conformance — R3 realized + guard integrity self-test added) |
| Final gate (verified by sdd-verify) | `CGO_ENABLED=0 go build ./...` exit 0 · `go test ./... -count=1` **48 top-level + 26 subtests passed / 0 failed / 0 skipped** · `go vet ./...` clean · coverage 69.4–100% per package (cmd/server 0.0% — no test, see W2) · go1.27.2 windows/amd64 |
| Contract | `contracts/openapi.yaml` untouched (`git diff HEAD -- contracts/` empty) |
| Archive location | `openspec/changes/archive/2026-10-10-p3-backend-foundation/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | #868 `p3-backend-foundation exploration decisions` |
| Proposal | `proposal.md` | #870 `sdd/p3-backend-foundation/proposal` |
| Specs (3 deltas) | `specs/*/spec.md` | #871 `sdd/p3-backend-foundation/spec` |
| Design | `design.md` | #872 `sdd/p3-backend-foundation/design` |
| Tasks | `tasks.md` | #873 `sdd/p3-backend-foundation/tasks` |
| Apply progress | `apply-progress.md` | #874 `sdd/p3-backend-foundation/apply-progress` |
| Verify report | `verify-report.md` | #875 `sdd/p3-backend-foundation/verify-report` |
| Archive report | `openspec/changes/archive/2026-10-10-p3-backend-foundation/archive-report.md` | `sdd/p3-backend-foundation/archive-report` (this save) |

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| `backend-runtime` | **Created** | New baseline `openspec/specs/backend-runtime/spec.md` (7 requirements / 11 scenarios): self-contained module, server composition root, environment configuration, contract path resolution, operational health endpoint, in-memory user store behind a port, uniform JSON error envelope. |
| `backend-auth` | **Created** | New baseline `openspec/specs/backend-auth/spec.md` (4 requirements / 9 scenarios): register (201 `{userId,token}`, rejects `admin` + duplicate email), login (200 `{token,role}`, 401 `invalid_credentials`), current user (200 `{userId,email,role}`, 401 `not_authenticated`), JWT issuance/verification (HS256, `sub`/`role`/`exp`). |
| `api-conformance` | **Updated** | "Backend contract tests" requirement replaced: now mandates in-process kin-openapi `openapi3filter.ValidateResponse` against the live contract under the default `go test ./...` — not skippable, no external service; inherited R3 annotation replaced with **CLOSED by this change** (mirroring the W1 precedent). "Contract guard integrity self-test" ADDED (2 scenarios: guard rejects a mutated response; neutered guard fails the suite). |

Modified capability preserved all unrelated baseline requirements (validation gate, frontend compile-time conformance, platform domain type bindings, drift response procedure); no destructive deletions. The R3 ("deferred by design" → CLOSED) and self-test annotations carry the verify evidence, including the independently reproduced guard-neuter experiment.

## Follow-ups closed

| Inherited item | Closed by | Evidence |
|---|---|---|
| `api-conformance` R3 — backend contract tests (recorded at `p2-api-contract`, "no Go code in this change") | WU5 `f781dd7` (+ auth ops C4–C6) | `backend/internal/contract/guard.go` load+validate+`ValidateRequest`/`ValidateResponse` via gorillamux; `httpapi/auth_contract_test.go` drives `register`/`login`/`getMe` with `httptest` + in-memory store; runs in default `go test ./...`, no build tags / `testing.Short()` / `-run` gates |

## Carried forward (not silently dropped)

1. **(W1 from this verify)** C4 (`5e2ea0a`) exceeds the 400-line review budget: **600 changed (595 ins + 5 del)**. Documented process deviation, not a spec violation: the overflow is 100% required test surface (production ~214 lines). Commit boundaries were locked to one commit per WU2–WU5 and `size:exception` was forbidden. For future changes, keep the WU↔commit mapping 1:1 but split test-heavy work units or pre-authorize an exception before apply.
2. **(W2 from this verify)** "Server starts and serves" has no listener-binding test — `cmd/server/main.go` compiles and wires config→store→service→router, route serving is covered by handler tests, but no test starts the server or asserts `PORT` binding. Scenario marked ⚠️ PARTIAL. Suggested: an integration test that boots `main`'s wiring (or a `run()` helper) and asserts the listener on a free port.
3. **(S1 from this verify)** JWT `exp` claim presence is asserted only behaviorally (`TestJWT_IssueVerifyRoundTrip` asserts `sub`+`role`; `exp` proven via `TestJWT_RejectsExpired`). Consider asserting `exp` directly for a literal match to the "token carries the expected claims" scenario.
4. **(S2 from this verify)** `config.ContractPath` is read but not consumed by `main` — the guard is test-only (design D3), so the production composition root never passes `CONTRACT_PATH` to `contract.Load`. Harmless today; wire it when the guard becomes runtime-used.
5. **(S3 from this verify)** `internal/service` (75.7%) and `internal/contract` (69.4%) coverage — uncovered lines are error/edge branches; optional: add cases for the `fmt.Errorf` wrap paths.
6. **(C4 budget deviation, process)** Recorded in `verify-report.md` §7 and `apply-progress.md` deviation 1; kept out of the spec compliance matrix — it is a review-budget note, not a defect.
7. **(Deferred by design, L3)** **Postgres + migrations are deferred to a follow-on change** — pgx adapter (drop-in behind `store.UserStore`), goose migrations, SQL and `testing.Short()`-skippable integration tests were explicitly scoped out; the in-memory adapter keeps the port stable so the pgx adapter lands without touching auth/service code.
8. **(Next changes in the backend track)** The four resource domains are independent follow-on changes, per locked decision L1: **jobs**, **profiles**, **feed**, and **applications** (contract operations beyond the auth trio), each landing on the foundation's ports and guard harness. `backend/README.md`, `.env.example` and the `Makefile` document build/test/run.

## Final gate result

`CGO_ENABLED=0` from `backend/` — **exit 0 on all**:

| Stage | Result |
|---|---|
| `go build ./...` | ✅ exit 0 |
| `go test ./... -count=1` | ✅ 7 packages ok — **48 top-level + 26 subtests passed / 0 failed / 0 skipped** |
| `go vet ./...` | ✅ clean |
| Coverage (informational) | `auth 82.1%` · `config 89.5%` · `contract 69.4%` · `domain 100%` · `httpapi 85.3%` · `service 75.7%` · `store/memory 100%` |
| Contract diff | ✅ `git diff HEAD -- contracts/` empty |
| Guard integrity (destructive probe, reverted) | ✅ neutering `openapi3filter.ValidateResponse` → `TestGuard_RejectsMutatedResponse` FAILS; reverted clean, suite green |

Independent re-proof (sdd-verify, fresh context): all build/test/vet commands re-executed; guard-neuter experiment reproduced; contract diff verified. Tree left clean except intentional untracked `HANDOFF.md`.

## Commits

| Commit | Work unit |
|---|---|
| `6c1ebff` | C1 `feat(backend): scaffold cca/backend module, config, health (p3-backend-foundation)` |
| `6fd92d3` | C2 `feat(backend): add domain, UserStore port and in-memory adapter (p3-backend-foundation)` |
| `a464933` | C3 `feat(backend): add JWT issuer and bcrypt hasher (p3-backend-foundation)` |
| `5e2ea0a` | C4 `feat(backend): implement POST /auth/register (p3-backend-foundation)` |
| `b51acd2` | C5 `feat(backend): implement POST /auth/login (p3-backend-foundation)` |
| `fca42df` | C6 `feat(backend): implement GET /auth/me with bearer middleware (p3-backend-foundation)` |
| `f781dd7` | C7 `test(backend): add kin-openapi contract guard and auth conformance tests (p3-backend-foundation)` |
| this commit | `docs(openspec): archive p3-backend-foundation with verify annotations (p3-backend-foundation)` — spec sync (2 new + 1 updated capabilities), report, full change record incl. verify-report; folder moved to `archive/2026-10-10-p3-backend-foundation/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Disposition of HANDOFF.md

`HANDOFF.md` remains **untracked** — it is a session handoff note, not a change artifact, and is not part of the openspec tree. This archive does not commit or modify it. Recommended: rewrite it for the next session (the backend handoff §5 is now executed for the foundation; update it to point at the four resource-domain follow-ons).

## Checklist

- [x] 2 new baselines created in `openspec/specs/` (backend-runtime, backend-auth)
- [x] `api-conformance` delta merged into baseline (R3 requirement replaced + annotated **CLOSED by this change**, guard-integrity self-test ADDED), unrelated requirements preserved
- [x] Change folder moved to `openspec/changes/archive/2026-10-10-p3-backend-foundation/` with all artifacts (explore, proposal, specs, design, tasks, apply-progress, verify-report)
- [x] Engram archive report saved as `sdd/p3-backend-foundation/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `backend/`, no `contracts/`, no `HANDOFF.md`, no push, no PR
- [x] Working tree after commit: only intentional untracked file (`HANDOFF.md`) remains

SDD cycle complete: explore → proposal → spec → design → tasks → apply → verify → archive. The `api-conformance` R3 contract-guard gap is closed; the next SDD changes start from a green baseline with a self-contained Go backend, a dependency-free contract gate, and a stable `UserStore` port ready for the pgx adapter and the four resource-domain follow-ons (jobs, profiles, feed, applications).