# Design: p3-backend-foundation

> Change: `p3-backend-foundation` · Repo: `construction-company-agency` · Phase: design · Date: 2026-10-10
> Inputs: `proposal.md`, `explore.md`, delta specs (`backend-runtime`, `backend-auth`, `api-conformance`), `contracts/openapi.yaml` (read-only). Go 1.27.2 `windows/amd64`, `CGO_ENABLED=0`.

## Technical Approach

A self-contained Go module under `backend/` implementing a layered port/adapter mirror of the p2 frontend. Composition (`cmd/server`) wires env config → in-memory `UserStore` → `service.Auth` → Gin router. The three auth operations and the kin-openapi contract guard form one vertical slice; every cross-cutting concern (routing, JSON error envelope, store port, hashing, JWT, middleware, guard) lands exactly once so the four resource domains are drop-in follow-ons. Everything is pure Go / CGO-free; the default suite needs no Postgres or Docker.

**WU reconciliation.** The orchestrator's operation-oriented WUs (register / login / me / guard) are used below. WU1 is the shared foundation and subsumes the proposal's layer WU1–WU3; it is delivered as **3 commits** to honor the 400-line budget (proposal's slice plan remains the finer commit sequence).

## Architecture Decisions

| # | Decision | Choice | Alternatives / Trade-off |
|---|----------|--------|--------------------------|
| D1 | Module | `cca/backend`, `go 1.27`, exact deps pinned | `github.com/…/backend` (rejected: unpublished, host churn). `toolchain` line omitted (avoid forced downloads). |
| D2 | Layout | `cmd/server` + `internal/{config,domain,store,store/memory,auth,service,httpapi,contract}` | Task's `internal/guard` rejected: `api-conformance` spec names `backend/internal/contract/guard.go`. No `auth` subpackage triple (avoids package-name collisions). |
| D3 | `CONTRACT_PATH` | Env override (abs/rel) wins; default = walk up ≤8 levels from the guard **source** dir (`runtime.Caller`) to `contracts/openapi.yaml`; never copy/embed | CWD-walk-up (fragile across `cmd/server` vs package CWD). Prod sets `CONTRACT_PATH`; guard is test-only. |
| D4 | `userId` | `github.com/google/uuid` v4 (`uuid.NewString()`), generated in service via injectable `newID func() string` | `crypto/rand` hex (zero dep, less canonical). Contract only requires `type: string` — no `format: uuid`. |
| D5 | `/auth/me` email | **Fetch from store by `sub`**; claims carry only `sub`,`role`,`exp` | Embed email in JWT (rejected: spec fixes claims to sub/role/exp; store stays authoritative, 401 if user gone). +1 store read per `/me`. |
| D6 | Password | `bcrypt` cost **10**; **no min-length** (contract request has no `minLength`); non-empty enforced | Contract-faithful: a longer min would 400 a contract-valid password. |
| D7 | JWT | HS256, `jwt.RegisteredClaims` (`sub`,`exp`) + `Role`; TTL `TOKEN_TTL` default `24h` | Expiry tested by minting with negative TTL (no clock injection). |
| D8 | Guard lib | **kin-openapi v0.149.0 only** (`IsOpenAPI31OrLater()` confirmed; 3.1 supported). Early spike = `TestGuard_LoadsAndValidatesContract`. If it fails on the real contract → **blocked, escalate** (no mid-change libopenapi swap, no contract edit) | libopenapi (rejected as primary: gorillamux router + `ValidateResponse` confirmed; contract is read-only). |
| D9 | Errors | `{code,message,details?}`; `code` English snake_case, `message` es-AR matching the mock; generic binding → `invalid_request` / `Solicitud inválida` | Contract `code` has no enum, so generic code is valid. |

Pinned deps (go.mod `require`, go.sum committed): gin `v1.12.0`, golang-jwt/jwt/v5 `v5.3.1`, kin-openapi `v0.149.0` (+`routers/gorillamux`), google/uuid `v1.6.0`, `golang.org/x/crypto` (bcrypt, latest).

## Data Flow

    cmd/server ──> config.Load() ──> memory.NewUserStore()
         │                                 │
         │             auth.JWT(secret,ttl) + auth.Bcrypt{}
         ▼                                 ▼
      httpapi.NewRouter ──> httpapi handlers ──> service.Auth ──> store.UserStore (port)
         │                                                 └──> auth.Issuer / auth.Hasher
         ▼
      net/http :PORT   GET /health · /auth/register · /auth/login · /auth/me(RequireAuth)

    tests: httptest.NewRequest ─> gin.ServeHTTP ─> contract.Guard.ValidateRequest/ValidateResponse (kin-openapi)

## File Changes

| WU | File | Action | Description |
|----|------|--------|-------------|
| 1 | `backend/go.mod`, `backend/go.sum` | Create | `cca/backend`, `go 1.27`, pinned deps; `go mod tidy` |
| 1 | `backend/cmd/server/main.go` | Create | Composition root; `ListenAndServe` on `PORT` |
| 1 | `backend/internal/config/config.go` | Create | `Load()` reads `PORT`(def 8080), `JWT_SECRET`(required), `CONTRACT_PATH`(opt), `TOKEN_TTL`(def 24h) |
| 1 | `backend/internal/domain/domain.go` | Create | `Role`, `User`, `Error` |
| 1 | `backend/internal/store/store.go` | Create | `UserStore` port + `ErrEmailExists`/`ErrUserNotFound` |
| 1 | `backend/internal/store/memory/memory.go` | Create | In-memory adapter (mutex + map) |
| 1 | `backend/internal/auth/token.go`, `hash.go` | Create | JWT issuer/verifier; bcrypt hasher |
| 1 | `backend/internal/httpapi/errors.go`, `router.go` | Create | Error envelope writer; `NewRouter(Deps)`; `GET /health` |
| 1 | `backend/README.md`, `backend/Makefile`, `backend/.env.example` | Create | build/test/run, env docs (Makefile optional) |
| 1 | `.gitignore` | Modify | add `/backend/bin`, `backend/.env`, build artifacts |
| 2 | `backend/internal/service/service.go`, `auth_register.go` | Create | `service.Auth`, sentinel errors, `Register` |
| 2 | `backend/internal/httpapi/auth_register.go`; `router.go` | Create/Modify | bind + handler; register route |
| 3 | `backend/internal/service/auth_login.go`; `httpapi/auth_login.go`; `router.go` | Create/Modify | `Login` + handler + route |
| 4 | `backend/internal/httpapi/middleware.go`; `auth_me.go`; `router.go`; `service/auth_me.go` | Create/Modify | `RequireAuth`; `Me` handler + service; protected route |
| 5 | `backend/internal/contract/guard.go` | Create | `ResolvePath` (D3), `Load`, `Guard.Validate`, `ValidateHTTP` |
| 5 | `backend/go.mod`/`go.sum` | Modify | add kin-openapi + gorillamux |

## Interfaces / Contracts

```go
// internal/domain
type Role string // RoleWorker|RoleCompany|RoleAdmin
type User struct { ID, Email, PasswordHash string; Role Role }
type Error struct { Code, Message string; Details map[string]any `json:"details,omitempty"` }

// internal/store
var ErrEmailExists, ErrUserNotFound error
type UserStore interface {
    Create(ctx context.Context, u domain.User) error
    ByEmail(ctx context.Context, email string) (domain.User, error)
    ByID(ctx context.Context, id string) (domain.User, error)
}

// internal/auth
type Claims struct { UserID string; Role domain.Role }
type Issuer interface { Issue(userID string, role domain.Role) (string, error); Verify(token string) (Claims, error) }
func NewJWT(secret string, ttl time.Duration) *JWT
type Hasher interface { Hash(p string) (string, error); Compare(hash, p string) error }
type Bcrypt struct{ Cost int } // Cost=10

// internal/service
type Auth struct { /* users store.UserStore; tokens auth.Issuer; hasher auth.Hasher; newID func() string */ }
func NewAuth(users store.UserStore, tokens auth.Issuer, hasher auth.Hasher, opts ...Option) *Auth
var ErrRoleNotAllowed, ErrEmailAlreadyExists, ErrInvalidCredentials, ErrNotAuthenticated error
func (s *Auth) Register(ctx, email, password string, role domain.Role) (RegisterResult, error) // {UserID,Token}
func (s *Auth) Login(ctx, email, password string) (LoginResult, error)                          // {Token,Role}
func (s *Auth) Me(ctx, userID string) (MeResult, error)                                         // {UserID,Email,Role}

// internal/httpapi
func NewRouter(deps Deps) *gin.Engine
func RequireAuth(tokens auth.Issuer) gin.HandlerFunc // 401 not_authenticated; sets ctxUserID,ctxRole

// internal/contract
func ResolvePath() (string, error)
func Load(path string) (*Guard, error)                       // LoadFromFile + doc.Validate
func (g *Guard) Validate(req *http.Request, body []byte, resp *http.Response) error
func (g *Guard) ValidateHTTP(t testing.TB, req *http.Request, body []byte, resp *http.Response)
```

Error map: `ErrRoleNotAllowed`→400`role_not_allowed`/"Rol no permitido para el registro"; `ErrEmailAlreadyExists`→400`email_already_exists`/"Ya existe una cuenta con ese email"; `ErrInvalidCredentials`→401`invalid_credentials`/"Credenciales inválidas"; `ErrNotAuthenticated`→401`not_authenticated`/"No autenticado"; bind/JSON→400`invalid_request`/"Solicitud inválida".

## Work Units (strict TDD)

**WU1 — scaffolding + shared kernel (3 commits).**
Files: see table. TDD:
- `internal/config/config_test.go`: `TestLoad_DefaultsPortAndTTL`, `TestLoad_MissingJWTSecretFails`, `TestLoad_RejectsInvalidPort`, `TestLoad_ReadsOverrides` (table).
- `internal/domain/domain_test.go`: `TestRole_Valid`, `TestError_JSONEnvelopeShape`.
- `internal/store/memory/memory_test.go`: `TestUserStore_CreateThenFindByEmail`, `TestUserStore_DuplicateEmailReturnsErrEmailExists`, `TestUserStore_FindByEmailNotFound`, `TestUserStore_FindByID` (table).
- `internal/auth/token_test.go`: `TestJWT_IssueVerifyRoundTrip`, `TestJWT_RejectsExpired`, `TestJWT_RejectsWrongSecret`, `TestJWT_RejectsTampered`; `hash_test.go`: `TestBcrypt_HashIsNotPlaintext`, `TestBcrypt_Compare` (table).
- `internal/httpapi/router_test.go`: `TestHealth_Returns200`.
- RED: tests reference `config.Load`, `memory.NewUserStore`, `auth.NewJWT` before they exist (compile fail). GREEN: implement. Commits: `1a` scaffold+config+health+docs, `1b` domain+store+memory, `1c` JWT+bcrypt.
Commit: `feat(backend): scaffold cca/backend module, config, health and shared kernel (p3-backend-foundation)`.

**WU2 — register.**
Files: `service/service.go`, `service/auth_register.go`, `httpapi/auth_register.go` (+route).
Tests: `service/auth_register_test.go` (table, fake store+hasher): `worker registers`, `company registers`, `admin rejected`, `duplicate email`, `password hashed never plaintext`; `httpapi/auth_register_test.go`: `TestRegister_201`, `TestRegister_AdminRejected400`, `TestRegister_DuplicateEmail400`, `TestRegister_MalformedJSON400`.
RED: handler/service missing → fail. GREEN: implement; register mints token (contract requires it), rejects `admin` before any write.
Commit: `feat(backend): implement POST /auth/register (p3-backend-foundation)`.

**WU3 — login.**
Files: `service/auth_login.go`, `httpapi/auth_login.go` (+route).
Tests: `service/auth_login_test.go` (table): `valid credentials`, `wrong password`, `unknown email`, `role matches stored`; `httpapi/auth_login_test.go`: `TestLogin_200`, `TestLogin_WrongPassword401`, `TestLogin_UnknownEmail401`, `TestLogin_ExtraFieldsRejected400` (login request is `additionalProperties:false`).
RED → GREEN. Unknown email and wrong password both → 401 `invalid_credentials` (no enumeration).
Commit: `feat(backend): implement POST /auth/login (p3-backend-foundation)`.

**WU4 — me + bearer middleware.**
Files: `httpapi/middleware.go`, `httpapi/auth_me.go`, `service/auth_me.go` (+protected route).
Tests: `httpapi/middleware_test.go`: `TestRequireAuth_MissingHeader401`, `TestRequireAuth_MalformedHeader401`, `TestRequireAuth_ExpiredToken401`, `TestRequireAuth_ValidTokenSetsContext`; `service/auth_me_test.go`: `TestMe_ReturnsProfile`, `TestMe_UnknownUserIsNotAuthenticated`; `httpapi/auth_me_test.go`: `TestMe_200`, `TestMe_NoToken401`, `TestMe_BadToken401`.
RED → GREEN. Middleware verifies before handler; `Me` fetches email from store (D5).
Commit: `feat(backend): implement GET /auth/me with bearer middleware (p3-backend-foundation)`.

**WU5 — contract guard.**
Files: `internal/contract/guard.go`, `guard_test.go`, `httpapi/auth_contract_test.go`.
Tests: `guard_test.go`: `TestGuard_LoadsAndValidatesContract` (spike, D8), `TestGuard_RejectsMutatedResponse` (pushes a `getMe` body missing `email`→ asserts non-nil error), `TestResolvePath_EnvOverrideWins`, `TestResolvePath_DefaultsToRepoContract`; `httpapi/auth_contract_test.go`: `TestAuthContract_Register`, `_RegisterRoleNotAllowed`, `_RegisterDuplicateEmail`, `_Login`, `_LoginInvalidCredentials`, `_Me`, `_MeNotAuthenticated`.
RED: guard absent → fail. GREEN: implement; buffered request body passed to `Validate` (Gin consumes `req.Body`); `AuthenticationFunc: openapi3filter.NoopAuthenticationFunc`. No build tags / `testing.Short()`.
Commit: `test(backend): add kin-openapi contract guard and auth conformance tests (p3-backend-foundation)`.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | config, domain, store, auth primitives, service | Table-driven, fakes at boundaries (`t.TempDir()` where files used); no external service |
| Integration (in-process) | handlers via `httptest` + in-memory store | `gin.TestMode`; assert status + JSON body |
| Contract | 3 auth ops + request/response | kin-openapi `ValidateRequest`/`ValidateResponse` against real `contracts/openapi.yaml`; non-skippable |
| Integrity | guard cannot be neutered | `TestGuard_RejectsMutatedResponse` fails if the guard stops rejecting |

## Traceability

| WU | Spec requirement(s) |
|----|---------------------|
| WU1 | backend-runtime: Self-contained module, Composition root, Environment config, In-memory user store, Uniform JSON error envelope, Health, Contract-path resolution |
| WU2 | backend-auth: Register (201, admin rejected, duplicate email, bcrypt) |
| WU3 | backend-auth: Login (200, 401 invalid_credentials) |
| WU4 | backend-auth: Current user, JWT issuance and verification |
| WU5 | api-conformance: Backend contract tests + Contract guard integrity self-test; backend-runtime: Contract-path resolution (override/default) |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| kin-openapi 3.1 gaps (`items:{}`, `additionalProperties:false`) | Early spike (WU5 first task); on failure → **blocked, escalate**; contract untouched |
| WU1 exceeds 400 lines | Split into 3 commits (1a/1b/1c); verify `git diff --stat` per commit |
| `runtime.Caller` default path invalid in a deployed binary | Production must set `CONTRACT_PATH`; guard is test-only today |
| bcrypt cost 10 slows contract suite | Service unit tests use a fake hasher; contract tests accept ~1s |
| Service returns token → coupled to `auth.Issuer` port | Acceptable: port interface, swap-in later |
| Windows paths / CRLF | `filepath.Join`; normalize in guard; run `go test ./...` on win |
| `cca/backend` non-canonical module path | Intended (repo-internal, never published) |

## Open Questions

- [ ] Whether `bun run gate` should also invoke `go test ./backend/...` — deferred, not required for R3. No blocking questions.
