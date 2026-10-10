# Apply Progress: p3-backend-foundation

> Change: `p3-backend-foundation` · Repo: `construction-company-agency` · Phase: apply · Date: 2026-10-10
> Mode: **Strict TDD** · Runner: `go test ./...` from `backend/` (`CGO_ENABLED=0`)

## SESSION STATUS

**BATCH 2/2 COMPLETE — ALL WU1–WU5** (7 of 7 planned commits: C1–C7). Batch 1 = WU1a/1b/1c (C1–C3), batch 2 = WU2–WU5 (C4–C7). Final suite: `go test ./...` green, `go vet ./...` clean, `go build ./...` success — from `backend/`, no Postgres/Docker.

## Delivery Resolution

- Strategy: `ask-on-risk` → orchestrator resolved **7 sequential local work-unit commits on `main`**, stacked-to-main, each commit ≤400 changed lines target; no `size:exception`, no branches/PRs/pushes.
- Commit tag: every commit ends with `(p3-backend-foundation)`.

## Commits (batch 1 + batch 2)

| Commit | WU | Message | Files | Changed lines | Gate |
|--------|----|---------|-------|---------------|------|
| `6c1ebff` | 1a | `feat(backend): scaffold cca/backend module, config, health (p3-backend-foundation)` | go.mod, go.sum, cmd/server/main.go, internal/config/{config.go,config_test.go}, internal/httpapi/{errors.go,router.go,router_test.go}, README.md, .env.example, Makefile, .gitignore | 464 (incl. 89 generated `go.sum` + ~33 generated `go.mod` indirect) | ✅ test/vet/build |
| `6fd92d3` | 1b | `feat(backend): add domain, UserStore port and in-memory adapter (p3-backend-foundation)` | internal/domain/{domain.go,domain_test.go}, internal/store/store.go, internal/store/memory/{memory.go,memory_test.go}, internal/httpapi/errors.go (refactor), go.mod, go.sum | 381 (371+10) | ✅ test/vet |
| `a464933` | 1c | `feat(backend): add JWT issuer and bcrypt hasher (p3-backend-foundation)` | internal/auth/{token.go,token_test.go,hash.go,hash_test.go}, go.mod, go.sum | 293 (292+1) | ✅ test/vet/build |
| `5e2ea0a` | 2 | `feat(backend): implement POST /auth/register (p3-backend-foundation)` | internal/service/{service.go,auth_register.go,auth_register_test.go,fakes_test.go}, internal/httpapi/{auth_register.go,auth_register_test.go,helpers_test.go}, internal/httpapi/{errors.go,router.go}, cmd/server/main.go | **595** (over budget — see deviation 1) | ✅ test/vet/build |
| `b51acd2` | 3 | `feat(backend): implement POST /auth/login (p3-backend-foundation)` | internal/service/{auth_login.go,auth_login_test.go}, internal/httpapi/{auth_login.go,auth_login_test.go,router.go} | 244 | ✅ test/vet/build |
| `fca42df` | 4 | `feat(backend): implement GET /auth/me with bearer middleware (p3-backend-foundation)` | internal/httpapi/{middleware.go,middleware_test.go,auth_me.go,auth_me_test.go,router.go}, internal/service/{auth_me.go,auth_me_test.go} | 315 | ✅ test/vet/build |
| `f781dd7` | 5 | `test(backend): add kin-openapi contract guard and auth conformance tests (p3-backend-foundation)` | internal/contract/{guard.go,guard_test.go}, internal/httpapi/auth_contract_test.go, go.mod, go.sum | 413 gross (380 authored + 26 `go.sum` + 7 `go.mod` generated) | ✅ test/vet/build |

> **Line-budget note (deviation 1):** C4 is **595** changed lines (all authored). C1 remains 464 gross / ~342 authored. The orchestrator locked the commit boundaries (one commit per WU2–WU5) and forbade `size:exception`, so C4 could not be split without violating the fixed C4–C7 mapping. The overflow is entirely required test coverage (service table + handler cases + shared fakes/helpers). C5/C6 are under budget; C7 is 380 authored lines once generated lockfile lines are excluded.

## Batch gate (end of BATCH 2 — final)

| Gate | Command | Result |
|------|---------|--------|
| Tests | `go test ./... -count=1` (backend/) | ✅ **ok** all 7 packages (5 with tests) · **48 top-level tests pass · 26 subtests pass · 0 failures** |
| Vet | `go vet ./...` | ✅ clean |
| Build | `go build ./...` | ✅ success |

Pinned deps (go.mod): `gin v1.12.0`, `golang-jwt/jwt/v5 v5.3.1`, `google/uuid v1.6.0`, `golang.org/x/crypto v0.48.0` (bcrypt), **`getkin/kin-openapi v0.149.0`** (+ `routers/gorillamux`, `gorilla/mux v1.8.0`). Contract untouched.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 (config) | `internal/config/config_test.go` | Unit | N/A (new) | ✅ Written — `undefined: Load` | ✅ Passed (4 tests) | ✅ 4 cases incl. invalid-port table (abc/0/-1/70000) + overrides | ✅ none needed |
| 1.1 (health/router) | `internal/httpapi/router_test.go` | Integration (httptest) | N/A (new) | ✅ Written — `undefined: NewRouter/Deps` | ✅ Passed (`GET /health` 200) | ➖ Single scenario | ➖ errors.go unified onto `domain.Error` at 1b |
| 1.2 (domain) | `internal/domain/domain_test.go` | Unit | N/A (new) | ✅ Written — `undefined: Role/Error/NewID` | ✅ Passed (3 tests) | ✅ role table (5 cases) + envelope details case + ID uniqueness/v4 | ✅ errors.go switched to `domain.Error` |
| 1.2 (memory store) | `internal/store/memory/memory_test.go` | Unit | N/A (new) | ✅ Written — `package ... is not in std` | ✅ Passed (4 tests) | ✅ `ByID` table (3 cases) + duplicate + not-found | ➖ none needed |
| 1.3 (JWT) | `internal/auth/token_test.go` | Unit | N/A (new) | ✅ Written — `undefined: NewJWT` | ✅ Passed (4 tests) | ✅ 4 cases: round-trip, expired (negative TTL), wrong secret, tampered | ➖ none needed |
| 1.3 (bcrypt) | `internal/auth/hash_test.go` | Unit | N/A (new) | ✅ Written — `undefined: Bcrypt/DefaultBcryptCost` | ✅ Passed (2 tests) | ✅ `Compare` table (4 cases) + cost==10 assertion | ➖ none needed |
| 2.1 (register service) | `internal/service/auth_register_test.go` | Unit | N/A (new) | ✅ Written — `no non-test Go files` / `NewAuth` absent | ✅ Passed (table, 4 cases) | ✅ worker / company / admin-rejected / duplicate + hash-never-plaintext + no-write-on-reject | ➖ none needed |
| 2.1 (register handler) | `internal/httpapi/auth_register_test.go` | Integration (httptest) | N/A (new) | ✅ Written — 404 (route/service absent) | ✅ Passed (4 tests) | ✅ 201 / admin-400 / duplicate-400 / malformed-400 | ➖ none needed |
| 3.1 (login service) | `internal/service/auth_login_test.go` | Unit | N/A (new) | ✅ Written — `svc.Login undefined` | ✅ Passed (table, 4 cases) | ✅ valid / role-matches-stored / wrong-pw / unknown-email (all 401 invalid_credentials, no enumeration) | ➖ none needed |
| 3.1 (login handler) | `internal/httpapi/auth_login_test.go` | Integration (httptest) | N/A (new) | ✅ Written — 404 | ✅ Passed (4 tests) | ✅ 200 / wrong-pw-401 / unknown-email-401 / extra-fields-400 (strict JSON) | ➖ none needed |
| 4.1 (me service) | `internal/service/auth_me_test.go` | Unit | N/A (new) | ✅ Written — `svc.Me undefined` | ✅ Passed (2 tests) | ✅ profile-from-store (D5) + unknown-user → not_authenticated | ➖ none needed |
| 4.1 (middleware) | `internal/httpapi/middleware_test.go` | Unit (gin) | N/A (new) | ✅ Written — `RequireAuth/CtxUserID/CtxRole undefined` | ✅ Passed (4 tests) | ✅ missing-header-401 / malformed-401 / expired-401 / valid-sets-context | ✅ exported ctx keys for testability |
| 4.1 (me handler) | `internal/httpapi/auth_me_test.go` | Integration (httptest) | N/A (new) | ✅ Written — compile/404 | ✅ Passed (3 tests) | ✅ 200 (userId/email/role) / no-token-401 / bad-token-401 | ➖ none needed |
| 5.1 (contract guard) | `internal/contract/guard_test.go` | Contract | N/A (new) | ✅ Written — `package contract` absent | ✅ Passed (4 tests) | ✅ **spike** load+validate 3.1 contract; mutated-response rejected AND conforming accepted; env override; default walk-up | ✅ in-memory `doc.Servers` cleared for host-agnostic routing |
| 5.1 (conformance) | `internal/httpapi/auth_contract_test.go` | Contract (in-process) | N/A (new) | ✅ Written — compile/404 | ✅ Passed (7 tests) | ✅ 3 ops × success+error, request AND response validated vs live contract | ✅ guard-neuter experiment proven |

### Test Summary (cumulative)

- **Total top-level tests written/passing**: 48 / 48 (batch 2 added 30)
- **Subtests passing**: 26 (batch 2 added 8)
- **Layers used (batch 2)**: Unit 7 · Integration (in-process httptest/gin) 11 · Contract (kin-openapi) 11
- **Approval tests (refactoring)**: none — batch 2 is new code; the only refactor was the exported context keys (4.1).
- **Guard integrity experiment**: disabling `openapi3filter.ValidateResponse` made `TestGuard_RejectsMutatedResponse` fail (`guard_test.go:48`) — proof the guard cannot be silently neutered.

## Spec Traceability (full change)

| Spec requirement / scenario | Covered by | Status |
|-----------------------------|------------|--------|
| backend-runtime · Self-contained module (+ builds / dependency-free suite) | `go build ./...`, `go test ./...` from `backend/`, no Postgres/Docker | ✅ |
| backend-runtime · Server composition root | `cmd/server/main.go` (config → store → service → router); builds standalone | ✅ |
| backend-runtime · Environment configuration | `TestLoad_DefaultsPortAndTTL/MissingJWTSecretFails/RejectsInvalidPort/ReadsOverrides` | ✅ |
| backend-runtime · Contract path resolution (default + override) | `TestResolvePath_DefaultsToRepoContract`, `TestResolvePath_EnvOverrideWins` | ✅ |
| backend-runtime · Operational health endpoint | `TestHealth_Returns200` | ✅ |
| backend-runtime · In-memory store behind a port | `TestUserStore_*`, `var _ store.UserStore` | ✅ |
| backend-runtime · Uniform JSON error envelope | `TestError_JSONEnvelopeShape` + all handler error tests assert `{code,message}` | ✅ |
| backend-auth · Register 201 `{userId,token}` (worker/company) | `TestAuth_Register/worker registers`, `/company registers`, `TestRegister_201`, `TestAuthContract_Register` | ✅ |
| backend-auth · Admin rejected (no user created) | `TestAuth_Register/admin rejected`, `TestRegister_AdminRejected400`, `TestAuthContract_RegisterRoleNotAllowed` | ✅ |
| backend-auth · Duplicate email rejected (no second user) | `TestAuth_Register/duplicate email`, `TestRegister_DuplicateEmail400`, `TestAuthContract_RegisterDuplicateEmail` | ✅ |
| backend-auth · Login 200 `{token,role}` | `TestAuth_Login/valid credentials`, `/role matches stored`, `TestLogin_200`, `TestAuthContract_Login` | ✅ |
| backend-auth · Wrong password / unknown email → 401 invalid_credentials | `TestAuth_Login/wrong password`, `/unknown email`, `TestLogin_WrongPassword401`, `TestLogin_UnknownEmail401`, `TestAuthContract_LoginInvalidCredentials` | ✅ |
| backend-auth · Current user 200 `{userId,email,role}` | `TestMe_ReturnsProfile`, `TestMe_200`, `TestAuthContract_Me` | ✅ |
| backend-auth · Missing/malformed/expired token → 401 not_authenticated | `TestRequireAuth_*` (4), `TestMe_NoToken401`, `TestMe_BadToken401`, `TestMe_UnknownUserIsNotAuthenticated`, `TestAuthContract_MeNotAuthenticated` | ✅ |
| backend-auth · JWT issuance/verification (sub/role/exp, expiry) | `TestJWT_*` (batch 1), `TestRequireAuth_ValidTokenSetsContext`, `TestRequireAuth_ExpiredToken401` | ✅ |
| api-conformance · Backend contract tests (load + validate; not skippable) | `TestGuard_LoadsAndValidatesContract`, `TestAuthContract_*` (7) | ✅ |
| api-conformance · Guard integrity self-test (reject mutated; neutered → suite fails) | `TestGuard_RejectsMutatedResponse` + neuter experiment | ✅ |

## Deviations / Reconciliation

1. **C4 line budget (595 > 400)** — commit boundaries were locked to one commit per WU2–WU5 and `size:exception` was forbidden, so C4 could not be split. Overflow is required test surface. Recommend the reviewer exclude test files from the mechanical count (authored production code in C4 is ~230 lines) or accept the documented overrun.
2. **Guard host-agnostic routing (WU5)** — the contract declares a production `servers` URL, so `gorillamux` required matching host+scheme and rejected in-process path-only requests. `contract.Load` clears the **in-memory** `doc.Servers` before building the router; schema/status validation is unaffected and `contracts/openapi.yaml` is never modified.
3. **Exported context keys (WU4)** — design said `RequireAuth` "sets ctxUserID, ctxRole"; they are exported as `httpapi.CtxUserID` / `httpapi.CtxRole` so the middleware test can assert the context without a same-package (white-box) test.
4. **500 fallback (WU2)** — `writeServiceError` maps unrecognized errors to 500 `internal_error`/`"Error interno del servidor"`; the design error map does not name it, but the contract declares `500` for all three auth operations.
5. **Batch-1 carryovers (unchanged)** — `CONTRACT_PATH` walk-up default deferred to WU5 (now done); `domain.NewID` (uuid v4) default injected into the service.

## Remaining Tasks

- [x] WU2 — `service.Auth.Register` + `POST /auth/register` (C4)
- [x] WU3 — `service.Auth.Login` + `POST /auth/login` (C5)
- [x] WU4 — `RequireAuth` middleware + `service.Auth.Me` + `GET /auth/me` (C6)
- [x] WU5 — `internal/contract` kin-openapi guard + auth conformance tests (C7) + `ResolvePath` walk-up default
- [x] Phase 4 — final verification (no commit): `go build ./...`, `go test ./...`, `go vet ./...` all green; per-commit line counts recorded; `.gitignore` covers `/backend/bin`, `backend/.env`.

**Status:** 7/7 planned commits complete. **Ready for verify.**
