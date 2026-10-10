# Exploration: p3-backend-foundation (Go + Gin + Postgres backend track)

> Change: `p3-backend-foundation` · Repo: `construction-company-agency` · Date: 2026-10-10
> Artifact store: openspec · Phase: explore (read-only investigation, no implementation)

## TL;DR (the answer first)

1. **Environment is a hard blocker today.** `go`, `docker`, `psql` are all absent. `scoop` is present and can install everything: `go 1.27.1`, `postgresql 18.6-5`, `make 4.4.1` are all in the `main` bucket. Nothing else needs a manual download.
2. **This is a MULTI-change track, not one change.** 21 operations + layered backend + migrations + auth + the R3 contract guard is far beyond the 400-line review budget. `p3-backend-foundation` should be the *foundation change only*: scaffolding + config + store ports + migration infra + JWT auth + the contract-guard harness + the 3 auth operations. Four follow-on changes carry the remaining resources.
3. **The contract guard must be dependency-free so it is never skippable.** Run it in-process against **in-memory store adapters** (not Postgres, not Docker). Postgres correctness lives in a *separate, `testing.Short()`-skippable* integration package. This is what makes "gated by `go test ./...`" literally true in any environment.
4. **Auth is JWT bearer (HS256)** — the contract's security scheme is `bearerAuth` / `bearerFormat: JWT`. Registration auto-mints a token; `role=admin` must be rejected server-side at the service layer (this is the backend realization of frontend warning W5).
5. **Recommended first slice:** scaffolding + `GET /health` (operational, out-of-contract) + contract-guard harness + `POST /auth/register`, `POST /auth/login`, `GET /auth/me` end-to-end. It proves every cross-cutting concern exactly once.

---

## 1. Environment prerequisites (verified — exact results)

### 1.1 Read-only checks run

| Tool | Command | Result |
|---|---|---|
| Go | `where go` / `go version` | ❌ **absent** — no `/c/Program Files/Go`, no `/c/Go` |
| Scoop | `scoop --version` | ✅ **v0.6.0** (`main` + `gentleman` buckets) |
| Docker | `docker version` / `docker info` | ❌ **absent** — `docker: command not found` |
| Postgres CLI | `psql --version` | ❌ **absent** |
| Make | (not installed) | ❌ absent |
| Node / Bun | `node -v` / `bun -v` | ✅ v24.15.0 / 1.3.14 (frontend only) |

### 1.2 What scoop can provide (verified via `scoop search`)

| Need | Scoop package | Version | Notes |
|---|---|---|---|
| Go toolchain | `go` | **1.27.1** | main bucket; adds `go` to PATH |
| Postgres server | `postgresql` | **18.6-5** | main bucket; needs init + service |
| GNU Make | `make` | **4.4.1** | main bucket |
| Docker | — | — | **not offered by scoop**; requires Docker Desktop (WSL2/virtualization). Treat as unavailable for now. |

### 1.3 Recommended install path

```bash
scoop install go postgresql make
go version          # expect go1.27.x windows/amd64
psql --version      # expect psql (PostgreSQL) 18.x
```

Fallback if scoop is disliked: official Go MSI from go.dev (same result). **Do not** plan around Docker unless the maintainer installs Docker Desktop.

### 1.4 Postgres strategy — options and recommendation

The contract target is **Postgres**, so the production store must be Postgres. The question is only how to get Postgres for dev + integration tests.

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **in-memory adapters for the contract guard** | Zero deps; guard always runs; no skip | Does not exercise SQL | ✅ **Use for R3 guard** |
| **`scoop install postgresql`** (local server) | Real Postgres; no Docker; matches prod dialect | Manual init/service; CI must provision separately | ✅ **Dev + integration runtime** |
| **`fergusstrange/embedded-postgres`** (embedded binary in tests) | No Docker; real Postgres in-process | Downloads a ~30 MB binary on first run; slower | ⚠️ Optional for CI integration tests |
| **testcontainers-go** | Hermetic; real PG in Docker | **Requires Docker (absent)** | ❌ Blocked now |
| **`modernc.org/sqlite` (pure Go) for tests** | Zero deps | SQL dialect drift vs Postgres; false confidence | ❌ Avoid for store tests |
| **pgx (`jackc/pgx/v5`) + pgxpool** | Pure Go, **no CGO** (Windows-friendly), Postgres-native | New API to learn | ✅ **Driver choice** |

**Key design consequence:** because the contract guard uses in-memory adapters, the R3 gate is **unblocked even before Postgres is installed**. Only dev runtime and integration tests need Postgres.

### 1.5 Migration tool — options and recommendation

| Tool | Pros | Cons | Verdict |
|---|---|---|---|
| **pressly/goose** | Pure Go; `//go:embed` migrations; up/down; simple | Fewer features than Atlas | ✅ **Recommended** |
| golang-migrate/migrate | Widely used; CLI + lib | CLI install; verbose naming | Viable |
| ariga/atlas | Declarative; schema diffing; strong CI story | Heavier; steeper setup | Overkill for now |

**CI implication:** add a backend job that runs `go test ./...` (contract guard + unit) and `go vet ./...`. A Postgres service container is only needed for the *integration* job (skippable locally via `testing.Short()`).

---

## 2. Full operation surface (21 operations, from `contracts/openapi.yaml`)

### auth (3)
| Operation | Method / Path | Security | Success | Errors |
|---|---|---|---|---|
| `register` | POST `/auth/register` | — | 201 `{userId, token}` | 400, 500 |
| `login` | POST `/auth/login` | — | 200 `{token, role}` | 401, 500 |
| `getMe` | GET `/auth/me` | bearer | 200 `{userId, email, role}` | 401, 500 |

### jobs (6)
| Operation | Method / Path | Security | Success | Errors |
|---|---|---|---|---|
| `createJob` | POST `/jobs` | bearer | 201 `Job` | 400, 401, 500 |
| `listJobs` | GET `/jobs` | — | 200 `JobPage` | 500 |
| `searchJobs` | GET `/jobs/search?q=` | — | 200 `JobPage` | 500 |
| `getJob` | GET `/jobs/{jobId}` | — | 200 `Job` | 404, 500 |
| `updateJob` | PUT `/jobs/{jobId}` | bearer | 200 `Job` | 400, 401, 404, 500 |
| `deleteJob` | DELETE `/jobs/{jobId}` | bearer | 204 (no body) | 401, 404, 500 |

### applications (3)
| Operation | Method / Path | Security | Success | Errors |
|---|---|---|---|---|
| `createApplication` | POST `/applications` | bearer | 201 `Application` | 400, 401, 404, 500 |
| `listApplications` | GET `/applications?jobId&status&page&pageSize` | bearer | 200 `ApplicationPage` | 401, 500 |
| `updateApplicationStatus` | PATCH `/applications/{applicationId}/status` | bearer | 200 `Application` | 400, 401, 404, 500 |

### feed (5)
| Operation | Method / Path | Security | Success | Errors |
|---|---|---|---|---|
| `createFeedPost` | POST `/feed/posts` | bearer | 201 `FeedPost` | 400, 401, 500 |
| `getTimeline` | GET `/feed/timeline` | — | 200 `FeedPostPage` | 500 |
| `getFeedPost` | GET `/feed/posts/{postId}` | — | 200 `FeedPost` | 404, 500 |
| `updateFeedPost` | PUT `/feed/posts/{postId}` | bearer | 200 `FeedPost` | 400, 401, 404, 500 |
| `deleteFeedPost` | DELETE `/feed/posts/{postId}` | bearer | 204 (no body) | 401, 404, 500 |

### profiles (4)
| Operation | Method / Path | Security | Success | Errors |
|---|---|---|---|---|
| `getWorkerProfile` | GET `/profiles/worker/{userId}` | — | 200 `WorkerProfile` | 404, 500 |
| `updateWorkerProfile` | PUT `/profiles/worker/{userId}` | bearer | 200 `WorkerProfile` | 400, 401, 404, 500 |
| `getCompanyProfile` | GET `/profiles/company/{companyId}` | — | 200 `CompanyProfile` | 404, 500 |
| `updateCompanyProfile` | PUT `/profiles/company/{companyId}` | bearer | 200 `CompanyProfile` | 400, 401, 404, 500 |

**Total = 3 + 6 + 3 + 5 + 4 = 21 ✓**

**Cross-cutting contract facts the guard will enforce:**
- All error bodies MUST be `Error {code, message, details?}` with `additionalProperties: false`.
- All pages MUST be `{items, meta:{page,pageSize,total}}` with `additionalProperties: false`.
- `page` default 1 (min 1), `pageSize` default 20 (1–100).
- All `date-time` fields MUST be RFC 3339.
- `204` responses MUST have **no body**.
- `Role` enum = `worker | company | admin`; `JobStatus` = `open | closed`; `ApplicationStatus` = `pending | accepted | rejected | withdrawn`.

---

## 3. Scope of the first slice + change-boundary decision

### 3.1 Recommended first slice: `p3-backend-foundation` = scaffolding + guard + auth

Smallest coherent vertical that establishes every cross-cutting concern exactly once:

```
backend/
  go.mod                          # module github.com/.../construction-company-agency/backend
  cmd/server/main.go              # composition root: config → store adapter → service → router → ListenAndServe
  internal/config/                # env loading (DATABASE_URL, JWT_SECRET, PORT) + validation
  internal/domain/                # contract-shaped structs + Error/Pagination/Page envelope
  internal/store/store.go         # port interfaces (UserStore, JobStore, ...)
  internal/store/memory/          # in-memory adapters (contract guard + unit tests)
  internal/store/postgres/        # pgx adapter (real)
  internal/service/auth/          # register/login/me logic; role enforcement (no admin)
  internal/httpapi/               # Gin engine, middleware (JWT, error envelope), route registration
  internal/httpapi/auth/          # auth handlers
  internal/contract/              # R3 guard: loader + router + ValidateHTTP + self-test
  migrations/                     # goose SQL (users table first)
```

Operations in this change: **register, login, getMe (3 of 21)** + operational `GET /health` (not in contract — operational only; must NOT be added to the contract out-of-band).

### 3.2 Why this boundary

- `register`/`login`/`me` exercise **every** foundation concern: routing, JSON bind/unbind, error envelope, pagination-free happy path, store port, password hashing, JWT mint/verify, auth middleware, and the contract guard (201/200/401/400 shapes).
- It leaves each later resource as an **autonomous, testable work unit** with no forward dependencies (except applications → jobs).
- It matches the change name (`foundation`), mirroring how `p2-platform-foundation` bundled shell+ports+stores before feature slices.

### 3.3 Recommended multi-change track

| Change | Scope | Ops | Depends on |
|---|---|---|---|
| **`p3-backend-foundation`** (this) | scaffolding, config, store ports, memory+pgx adapters, migrations infra, JWT auth, contract-guard harness, `register/login/me`, health | 3 | — |
| `p3-backend-jobs` | jobs CRUD + list + search + pagination | 6 | foundation |
| `p3-backend-profiles` | worker + company profiles GET/PUT + owner/admin authz | 4 | foundation |
| `p3-backend-feed` | feed create/timeline/get/update/delete + author authz | 5 | foundation |
| `p3-backend-applications` | apply + list + status transitions (state machine) | 3 | foundation, jobs |
| `p3-backend-deploy` (optional) | replace provisional server URL, secrets/config, CI wiring, container image | — | all |

**Recommendation:** run `p3-backend-foundation` now; propose the resource changes one at a time after it archives.

---

## 4. R3 contract-guard design (`api-conformance` Requirement: Backend contract tests)

### 4.1 Where it lives

- `backend/internal/contract/guard.go` — **non-test** helper, importable by every domain test package (so each future change reuses one guard).
- `backend/internal/contract/guard_test.go` — the **self-test** that proves the guard rejects bad responses.
- `backend/internal/httpapi/auth/contract_test.go` — per-operation tests that drive real handlers and call the guard.

### 4.2 Mechanism (kin-openapi, API confirmed)

```go
loader := openapi3.NewLoader()
doc, err := loader.LoadFromFile(contractPath)   // resolve from repo root, env override
_ = doc.Validate(ctx)                            // contract validity is itself asserted
router, _ := gorillamux.NewRouter(doc)           // maps *http.Request → Route + PathParams
route, pathParams, _ := router.FindRoute(req)
reqInput := &openapi3filter.RequestValidationInput{
    Request: req, PathParams: pathParams, Route: route,
    Options: &openapi3filter.Options{
        AuthenticationFunc: openapi3filter.NoopAuthenticationFunc, // app auth is authoritative
        MultiError:         true,
    },
}
_ = openapi3filter.ValidateRequest(ctx, reqInput)
respInput := &openapi3filter.ResponseValidationInput{
    RequestValidationInput: reqInput,
    Status:                 rr.Code,
    Header:                 rr.Header(),
}
respInput.SetBodyBytes(rr.Body.Bytes())
_ = openapi3filter.ValidateResponse(ctx, respInput)
```

- **Path resolution:** contract lives at repo root `contracts/openapi.yaml`; backend is a separate module so `//go:embed` cannot reach upward. Resolve a documented default (`../../../contracts/openapi.yaml` from the package) with `CONTRACT_PATH` env override for CI. **Do not copy the contract** — it is a read-only source of truth.
- **Router:** `github.com/getkin/kin-openapi/routers/gorillamux` builds a route matcher from the doc. Gin serves `net/http`, so an `httptest.ResponseRecorder` → `*http.Response` conversion is all that is needed.

### 4.3 How test flow works (dependency-free)

```
httptest.NewRequest(method, path, body)
        │  (set Content-Type, Authorization from a real register/login call)
        ▼
ginEngine.ServeHTTP(recorder, req)      ← real handlers + in-memory store adapter
        ▼
contract.ValidateHTTP(t, req, recorder.Result())   ← request AND response validated
```

Because the store is behind a **port interface**, contract tests inject the in-memory adapter and seed data → **no Postgres, no Docker, runs in `go test ./...` on any machine.**

### 4.4 Why it is not skippable (and cannot be silently weakened)

1. Tests live in ordinary `*_test.go` files — **no build tags, no `testing.Short()` guard, no `-run` exclusions**. They run under the default `go test ./...`.
2. They require **no external service**, so there is no environmental excuse to skip them.
3. `guard_test.go` includes `TestContractGuard_RejectsBadResponse`: it pushes a deliberately contract-violating response through the same guard path and asserts a **non-nil error**. This is the Go analogue of the frontend `@ts-expect-error` probe — if the guard is ever neutered, the self-test fails.
4. The contract is also loaded + `doc.Validate`d at guard start, so an invalid contract fails the backend suite too (defense in depth alongside Spectral).
5. Postgres integration tests are the *only* DB-dependent tests and they are explicitly `testing.Short()`-skippable — the non-skippable guard never depends on them.

---

## 5. Layering (mirrors the frontend port/adapter idea)

| Frontend (p2) | Backend (p3) analogue |
|---|---|
| `domain/models.ts` (contract-bound via `AssertExtends`) | `internal/domain` — contract-shaped structs; **the guard is the binding** (a divergent JSON field fails `ValidateResponse`) |
| `api/ports.ts` — interfaces + `InjectionToken` | `internal/store/store.go` — Go interfaces (ports) |
| `Mock*Gateway` adapters | `internal/store/memory` adapter (tests/guard) |
| (future `Http*Gateway`) | `internal/store/postgres` adapter (pgx) |
| signal stores / services | `internal/service/*` — business logic + authz, depends only on ports |
| components | `internal/httpapi/*` — thin Gin handlers: HTTP ↔ service translation |
| Angular DI root factory | `cmd/server/main.go` — composition root wires adapter → service → router |

**Rules:** handlers contain no business logic; services depend on **interfaces only**; the Postgres adapter is the only place that imports `pgx`; the contract guard imports only the domain + memory adapter.

### 5.1 Auth / session model (from the contract)

- Security scheme: `bearerAuth`, `type: http`, `scheme: bearer`, `bearerFormat: JWT` → **JWT bearer tokens.**
- Recommend **HS256** with a secret from `JWT_SECRET` (env). Library: `github.com/golang-jwt/jwt/v5`.
- Claims: `sub` (userId), `role`, `exp`. `me` middleware validates and injects `userId`/`role` into Gin context.
- `POST /auth/register` → hash password (bcrypt, `golang.org/x/crypto/bcrypt`; argon2id as a later upgrade), insert user, **mint token**, return `{userId, token}`.
- `POST /auth/login` → verify hash, return `{token, role}`; bad creds → `401 Error`.
- **Role enforcement:** registration MUST reject `role=admin` with `400` at the service layer. Note the contract *schema* `Role` includes `admin` (OpenAPI 3.1 cannot easily express "not admin" inline); the description forbids self-assignment. This is the server-side realization of frontend warning **W5** and requires **no contract change**.

---

## 6. Work-unit / chained-slice breakdown (400-line review budget)

`p3-backend-foundation` is itself > 400 lines, so it must be delivered as **chained work-unit commits on `main`** (per the locked `stacked-to-main` / sequential local commits decision — no branches/PRs/pushes). Each unit is autonomous, verifiable, and reversible.

| WU | Deliverable | ~Changed lines | Verify |
|---|---|---|---|
| **WU1** | Scaffolding: `go.mod`, `cmd/server` skeleton, `internal/config`, `internal/httpx` (error envelope + JSON helpers), `GET /health`, `.gitignore` additions, `Makefile` | ~350 | `go build ./...`, `go test ./...` (health test) |
| **WU2** | Store ports + memory adapter + goose migration infra + `users` table + pgx adapter skeleton | ~380 | unit tests on memory adapter; migration up/down |
| **WU3** | JWT + password hashing + auth service (`register/login/me`) with role enforcement | ~350 | table-driven service tests (forbid admin, bad creds, duplicate email) |
| **WU4** | Contract-guard harness (`guard.go` + self-test) + auth `contract_test.go` wiring all three ops | ~350 | guard rejects a mutated response (self-test); 3 ops validated |
| **WU5** | Postgres integration tests (`testing.Short()`-skippable) for the auth store + README/run docs | ~250 | `go test ./...` (skips), `go test -short=false ./...` with PG |

**Forecast:** 5 chained work units; ~1,650 lines total for the foundation change. `Decision needed before apply: Yes` (confirm the chained local-commit strategy) · `Chained PRs recommended: Yes` · `400-line budget risk: Medium` per unit if WU2/WU5 are kept tight.

**Ordering constraint:** WU4 (guard) can land before the full auth service if it first validates the error envelope + a stub; but it is cleanest after WU3 so the three auth ops exist to validate.

---

## 7. Risks / unknowns

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Go not installed** | HARD BLOCKER for apply/verify | `scoop install go` before any backend work; re-verify `go version` |
| R2 | **No Docker** (testcontainers unusable) | High | Contract guard uses in-memory adapters; integration tests use `scoop install postgresql` or `embedded-postgres`; never depend on Docker for the gate |
| R3 | **Postgres/psql not installed** | Medium | `scoop install postgresql`; contract guard still runs without it |
| R4 | Contract guard path resolution outside module | Medium | `CONTRACT_PATH` env override + documented default; never copy the contract |
| R5 | Contract-vs-implementation gaps | Medium | Enforce `role≠admin` server-side; keep `/health` out of the contract; honour `additionalProperties:false`, RFC 3339, bodyless 204, pagination meta |
| R6 | Strict-TDD vs DB-backed tests | Medium | Separate packages: non-skippable contract guard (no DB) vs `testing.Short()`-skippable store integration |
| R7 | Migration tool undecided | Low | Recommend goose; decide at design |
| R8 | Secrets/config | Low | Env vars + `.env.example` (already gitignored pattern); no hardcoded secrets |
| R9 | Provisional server URL | Low | Replace before deploy (config note); not a blocker for foundation |
| R10 | `pgx` vs `lib/pq` on Windows (CGO) | Low | Use pure-Go `jackc/pgx/v5` (no CGO) |
| R11 | Guard becomes skippable via build tags over time | Low | The `guard_test.go` self-test rejects any neutered guard; review rule from `api-conformance` R4 |
| R12 | gin + kin-openapi router compatibility | Low | Confirmed pattern (gorillamux router over `net/http`); validate in WU4 |

**Open questions for proposal/design:**
1. Confirm `scoop install go postgresql make` is acceptable (vs official Go MSI).
2. Confirm goose as the migration tool.
3. Confirm the multi-change boundary (§3.3) and that `p3-backend-foundation` = auth + guard only.
4. Confirm bcrypt vs argon2id for password hashing.
5. Decide whether `p3-backend-deploy` (URL/secrets/CI) is its own change or folded into foundation.

---

## 8. Affected areas (files/dirs)

- `contracts/openapi.yaml` — **read-only** source of truth; consumed by the guard (never edited here).
- `openspec/specs/api-conformance/spec.md` — R3 "Backend contract tests" is the inherited requirement.
- `backend/**` — **to be created** (does not exist yet; this change creates it).
- `HANDOFF.md` §5 — the backend handoff this change executes.
- `.gitignore` — needs `/backend/bin`, `backend/.env`, build artifacts.
- Root `package.json` `gate` script — consider adding a backend gate step *after* Go is installed (optional; not required for R3).

---

## Recommendation

Proceed to `sdd-propose` for **`p3-backend-foundation`** scoped strictly to: scaffolding + config + store ports (memory + pgx) + migration infra + JWT auth (`register/login/me` with server-side `role≠admin`) + the kin-openapi contract-guard harness. Treat the four resource domains as **separate follow-on changes**. Before `sdd-apply`, install the toolchain via `scoop install go postgresql make` (Go is a hard blocker). Keep the R3 guard dependency-free (in-memory adapters) so it genuinely gates `go test ./...` in every environment.

## Ready for Proposal

**Yes** — with one confirmable precondition: the maintainer accepts `scoop install go postgresql make` (or an equivalent Go install), since Go absence blocks apply/verify. The contract and baseline spec are fully read; the operation surface and guard design are grounded in the real artifacts.
