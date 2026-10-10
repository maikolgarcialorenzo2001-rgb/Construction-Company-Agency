# Tasks: p3-backend-foundation

> Change: `p3-backend-foundation` · Repo: `construction-company-agency` · Phase: tasks · Date: 2026-10-10
> Inputs: `proposal.md`, `explore.md`, `design.md`, specs (`backend-runtime`, `backend-auth`, `api-conformance`). Go 1.27.2, `CGO_ENABLED=0`. Runner: `go test ./...` from `backend/`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,400–1,900 total (7 slices, each target ≤400) |
| 400-line budget risk | Medium (WU1a and WU5 run near the cap) |
| Chained PRs recommended | Yes |
| Suggested split | C1 → C2 → C3 → C4 → C5 → C6 → C7 (sequential local commits on `main`) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Commit | Base/Notes |
|------|------|--------|-----------|
| 1a | Scaffold + config + error envelope + `/health` + docs + `.gitignore` | C1 | `main`; tests ship with code |
| 1b | `domain` + `store.UserStore` port + memory adapter | C2 | depends on 1a |
| 1c | JWT issuer + bcrypt hasher | C3 | depends on 1a |
| 2 | `POST /auth/register` (reject `admin`) | C4 | depends on 1b/1c |
| 3 | `POST /auth/login` | C5 | depends on 2 |
| 4 | `GET /auth/me` + bearer middleware | C6 | depends on 2 |
| 5 | kin-openapi guard + auth conformance tests | C7 | depends on 3/4 |

## Phase 1: Foundation / Shared Kernel

Strict-TDD per task: **RED** (write the named tests first; they fail to compile/pass) → **GREEN** (minimal implementation) → commit when `go test ./...` is green. Evidence table filled in `sdd-verify`.

### WU1a — Scaffold, config, health

- **ID 1.1** — Create module + composition root + config + health.
  - Files: `backend/go.mod`, `backend/go.sum`, `backend/cmd/server/main.go`, `backend/internal/config/config.go`, `backend/internal/httpapi/errors.go`, `backend/internal/httpapi/router.go`, `backend/README.md`, `backend/.env.example`, `backend/Makefile`; modify `.gitignore`.
  - Tests + cases: `internal/config/config_test.go` — `TestLoad_DefaultsPortAndTTL`, `TestLoad_MissingJWTSecretFails`, `TestLoad_RejectsInvalidPort`, `TestLoad_ReadsOverrides`; `internal/httpapi/router_test.go` — `TestHealth_Returns200`.
  - RED: tests reference `config.Load` / `httpapi.NewRouter` before they exist (compile failure).
  - Admin: `go mod tidy` pins gin `v1.12.0`, uuid `v1.6.0`.
  - **Commit boundary C1**: `feat(backend): scaffold cca/backend module, config, health (p3-backend-foundation)`.

### WU1b — Domain + store port + memory adapter

- **ID 1.2** — Create domain types, `UserStore` port, in-memory adapter.
  - Files: `backend/internal/domain/domain.go`, `backend/internal/store/store.go`, `backend/internal/store/memory/memory.go`.
  - Tests + cases: `internal/domain/domain_test.go` — `TestRole_Valid`, `TestError_JSONEnvelopeShape`; `internal/store/memory/memory_test.go` — `TestUserStore_CreateThenFindByEmail`, `TestUserStore_DuplicateEmailReturnsErrEmailExists`, `TestUserStore_FindByEmailNotFound`, `TestUserStore_FindByID` (table-driven, `t.Parallel()`).
  - RED: types/port/adapter absent → compile failure.
  - **Commit boundary C2**: `feat(backend): add domain, UserStore port and in-memory adapter (p3-backend-foundation)`.

### WU1c — JWT issuer + bcrypt hasher

- **ID 1.3** — Create HS256 issuer/verifier and bcrypt hasher.
  - Files: `backend/internal/auth/token.go`, `backend/internal/auth/hash.go`.
  - Tests + cases: `internal/auth/token_test.go` — `TestJWT_IssueVerifyRoundTrip`, `TestJWT_RejectsExpired` (negative TTL), `TestJWT_RejectsWrongSecret`, `TestJWT_RejectsTampered`; `internal/auth/hash_test.go` — `TestBcrypt_HashIsNotPlaintext`, `TestBcrypt_Compare` (table).
  - RED: `auth.NewJWT` / `auth.Bcrypt` absent → compile failure.
  - **Commit boundary C3**: `feat(backend): add JWT issuer and bcrypt hasher (p3-backend-foundation)`.

## Phase 2: Core Implementation

### WU2 — Register

- **ID 2.1** — Implement `service.Auth.Register` + `POST /auth/register` handler/route.
  - Files: `backend/internal/service/service.go`, `backend/internal/service/auth_register.go`, `backend/internal/httpapi/auth_register.go`; modify `internal/httpapi/router.go`.
  - Tests + cases: `internal/service/auth_register_test.go` — `worker registers`, `company registers`, `admin rejected`, `duplicate email`, `password hashed never plaintext` (table, fake store + fake hasher); `internal/httpapi/auth_register_test.go` — `TestRegister_201`, `TestRegister_AdminRejected400`, `TestRegister_DuplicateEmail400`, `TestRegister_MalformedJSON400`.
  - RED: handler/service missing → fail. GREEN: reject `admin` **before** any write; mint token on success.
  - **Commit boundary C4**: `feat(backend): implement POST /auth/register (p3-backend-foundation)`.

### WU3 — Login

- **ID 3.1** — Implement `service.Auth.Login` + `POST /auth/login` handler/route.
  - Files: `backend/internal/service/auth_login.go`, `backend/internal/httpapi/auth_login.go`; modify `internal/httpapi/router.go`.
  - Tests + cases: `internal/service/auth_login_test.go` — `valid credentials`, `wrong password`, `unknown email`, `role matches stored` (table); `internal/httpapi/auth_login_test.go` — `TestLogin_200`, `TestLogin_WrongPassword401`, `TestLogin_UnknownEmail401`, `TestLogin_ExtraFieldsRejected400`.
  - RED → GREEN. Unknown email and wrong password both return 401 `invalid_credentials` (no enumeration).
  - **Commit boundary C5**: `feat(backend): implement POST /auth/login (p3-backend-foundation)`.

### WU4 — Current user + bearer middleware

- **ID 4.1** — Implement `RequireAuth` middleware + `service.Auth.Me` + `GET /auth/me` handler/route.
  - Files: `backend/internal/httpapi/middleware.go`, `backend/internal/httpapi/auth_me.go`, `backend/internal/service/auth_me.go`; modify `internal/httpapi/router.go`.
  - Tests + cases: `internal/httpapi/middleware_test.go` — `TestRequireAuth_MissingHeader401`, `TestRequireAuth_MalformedHeader401`, `TestRequireAuth_ExpiredToken401`, `TestRequireAuth_ValidTokenSetsContext`; `internal/service/auth_me_test.go` — `TestMe_ReturnsProfile`, `TestMe_UnknownUserIsNotAuthenticated`; `internal/httpapi/auth_me_test.go` — `TestMe_200`, `TestMe_NoToken401`, `TestMe_BadToken401`.
  - RED → GREEN. Middleware verifies **before** handler; `Me` fetches email from store by `sub` (D5).
  - **Commit boundary C6**: `feat(backend): implement GET /auth/me with bearer middleware (p3-backend-foundation)`.

## Phase 3: Contract Guard / Verification

### WU5 — kin-openapi guard + auth conformance

- **ID 5.1** — Create `contract.Guard` (path resolution, load+validate, request/response validation) and drive the 3 auth ops.
  - Files: `backend/internal/contract/guard.go`, `backend/internal/contract/guard_test.go`, `backend/internal/httpapi/auth_contract_test.go`; modify `backend/go.mod`/`go.sum` (kin-openapi `v0.149.0` + `routers/gorillamux`).
  - Tests + cases: `guard_test.go` — `TestGuard_LoadsAndValidatesContract` (**spike first**, D8), `TestGuard_RejectsMutatedResponse` (a `getMe` body missing `email` → non-nil error), `TestResolvePath_EnvOverrideWins`, `TestResolvePath_DefaultsToRepoContract`; `httpapi/auth_contract_test.go` — `TestAuthContract_Register`, `_RegisterRoleNotAllowed`, `_RegisterDuplicateEmail`, `_Login`, `_LoginInvalidCredentials`, `_Me`, `_MeNotAuthenticated`.
  - RED: guard absent → fail. GREEN: pass buffered request body to `Validate` (Gin consumes `req.Body`); `AuthenticationFunc: openapi3filter.NoopAuthenticationFunc`. **No build tags, no `testing.Short()`.**
  - **Blocker path**: if the spike fails on OpenAPI 3.1 → stop and escalate; do not swap libs nor edit the contract.
  - **Commit boundary C7**: `test(backend): add kin-openapi contract guard and auth conformance tests (p3-backend-foundation)`.

## Phase 4: Final Verification (no new commit)

- [x] 6.1 Run `go build ./...` and `go test ./...` from `backend/` with no Postgres/Docker. ✅ (48 top-level + 26 subtests, vet clean, build ok)
- [x] 6.2 Confirm every spec scenario in `backend-runtime`, `backend-auth`, `api-conformance` maps to a passing named test. ✅ (see apply-progress traceability)
- [x] 6.3 Verify each commit ≤400 changed lines (`git diff --stat`); confirm `.gitignore` ignores `/backend/bin`, `backend/.env`. ⚠️ C4=595 (documented deviation — commit boundaries locked, `size:exception` forbidden); C5=244, C6=315, C7=380 authored. `.gitignore` ok.

**Work-unit rule**: tests ship with code; one deliverable per commit; every commit ends with `(p3-backend-foundation)`.
