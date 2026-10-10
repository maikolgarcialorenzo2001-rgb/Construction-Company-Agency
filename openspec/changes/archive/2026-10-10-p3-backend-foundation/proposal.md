# Proposal: p3-backend-foundation

> Change: `p3-backend-foundation` · Repo: `construction-company-agency` · Phase: propose · Date: 2026-10-10
> Grounded in `openspec/changes/p3-backend-foundation/explore.md` and `contracts/openapi.yaml` (read-only).

## Intent (WHAT/WHY)

- **WHAT**: Stand up the Go backend foundation — a `backend/` module with a Gin HTTP server, JWT bearer auth implementing the contract's 3 auth operations (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`), password hashing, an in-memory user store behind a `Store` port interface, and the `api-conformance` R3 contract guard (kin-openapi) that runs under `go test ./...` with **no external service**.
- **WHY**: The frontend platform is done and demo-only (mock gateways). HANDOFF §5 hands off the Go backend. This change establishes every cross-cutting concern exactly once (routing, JSON, error envelope, store port, hashing, JWT, middleware, contract guard) so the four resource domains land as independent follow-on changes.

## Locked Decisions (maintainer delegation — recorded, not open)

| # | Decision | Value |
|---|----------|-------|
| L1 | **Multi-change track** | This change is FOUNDATION ONLY. jobs/profiles/feed/applications are follow-on changes. |
| L2 | **Scope IN** | `backend/` + own `go.mod`; Gin server; JWT auth (3 auth ops); password hashing; in-memory user store behind a `Store` interface; kin-openapi contract guard gated by `go test ./...`, no external service. |
| L3 | **Scope OUT (deferred)** | Postgres, migrations/goose, pgx adapter, jobs/feed/profiles/applications, deployment, TLS, refresh tokens. |
| L4 | **Rules** | `contracts/openapi.yaml` read-only (contract changes via SDD only); `register` rejects `admin` self-assignment; `CONTRACT_PATH` env override for the contract file; artifacts/commits English. |
| L5 | **Delivery** | Sequential work-unit commits on `main` (no branches/PRs/pushes), each ≤400 changed lines, tag `(p3-backend-foundation)`. |

### Decisions I make (asked to pick ONE, justified)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module path | `cca/backend` | Repo-internal, never published → host-agnostic short imports; avoids coupling to a GitHub username/org that can change. (Alt: `github.com/.../backend` if it is ever published.) |
| HTTP router | **Gin** | Confirmed by exploration; net/http-compatible, so the kin-openapi gorillamux guard works with `httptest`. |
| JWT lib | `github.com/golang-jwt/jwt/v5` | HS256, `JWT_SECRET` env; claims `sub`, `role`, `exp`. |
| Password hashing | `golang.org/x/crypto/bcrypt` | Standard, no CGO; argon2id is a later upgrade. |
| kin-openapi | Pin a recent v0.1xx supporting OpenAPI 3.1 | Contract is `openapi: 3.1.0`; kin-openapi README confirms v2/v3.0/v3.1. WU4 spike proves `LoadFromFile` + `doc.Validate` on the real contract. |
| API error language | **`message` = es-AR; `code` = English snake_case** | API messages are user-surfaced copy for an es-AR product; the frontend mock already fixes the exact strings (`'Credenciales inválidas'`, `'Rol no permitido para el registro'`, `'Ya existe una cuenta con ese email'`, `'No autenticado'`) and W5 chose Spanish. Matching keeps demo↔real copy consistent. `code` stays a stable, language-neutral machine contract. Artifacts/commits remain English. |

Contract confirms: `register` → 201 `{userId, token}`, `login` → 200 `{token, role}`, `getMe` (bearerAuth) → 200 `{userId, email, role}`; all error bodies are `Error {code, message, details?}` (`additionalProperties: false`). Registration description states "admin role cannot be self-assigned".

## Scope

**In scope**
- `backend/go.mod` (module `cca/backend`) + `backend/cmd/server/main.go` composition root.
- `backend/internal/config` — env loading (`PORT`, `JWT_SECRET`, `CONTRACT_PATH`) + validation.
- `backend/internal/domain` — contract-shaped structs + `Error`/pagination envelope.
- `backend/internal/store/store.go` — `UserStore` port interface; `backend/internal/store/memory` in-memory adapter.
- `backend/internal/service/auth` — register/login/me logic; rejects `role=admin`.
- `backend/internal/httpapi` — Gin engine, JWT middleware, error-envelope middleware, route registration; `internal/httpapi/auth` handlers.
- `backend/internal/contract` — contract-guard harness (`guard.go`) + self-test; per-operation contract tests for the 3 auth ops.
- Operational `GET /health` (NOT added to the contract).
- `.gitignore` additions (`/backend/bin`, `backend/.env`).

**Out of scope**
- Postgres, pgx adapter, goose migrations, SQL, integration tests against a DB.
- jobs/feed/profiles/applications resources; deployment/TLS; refresh tokens.
- Any edit to `contracts/openapi.yaml`.

## Capabilities

### New Capabilities
- `backend-runtime`: Go module + Gin server composition, env config, JSON error-envelope helper, `GET /health`, `Store` port + in-memory `UserStore` adapter.
- `backend-auth`: JWT bearer auth — `register` (201, rejects `admin`), `login` (200, 401 on bad creds), `getMe` (200, 401); bcrypt hashing; role in JWT claims.

### Modified Capabilities
- `api-conformance`: the inherited R3 "Backend contract tests" requirement is now realized — response validation against `contracts/openapi.yaml` via kin-openapi, gated by `go test ./...`, dependency-free (in-memory store) so it is not skippable.

## Approach

- Layered port/adapter mirroring the p2 frontend: domain → service (interfaces only) → Gin handlers (thin) → composition root. The memory adapter is the only store wired in this change; the port keeps the pgx adapter a drop-in follow-on.
- Contract guard: load + `doc.Validate` the real contract, `gorillamux.NewRouter`, `openapi3filter.ValidateRequest`/`ValidateResponse` with `NoopAuthenticationFunc` (app auth is authoritative). Tests drive real handlers with `httptest` + the in-memory adapter → **no Postgres, no Docker, cannot be skipped**.
- Guard lives in non-test `internal/contract/guard.go` (reused by future changes); `guard_test.go` proves the guard rejects a deliberately non-conforming response.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `contracts/openapi.yaml` | Unchanged (read-only) | Consumed by the guard; never edited here |
| `openspec/specs/api-conformance/spec.md` | Modified | R3 backend contract tests realized |
| `backend/**` | New | Module, server, config, domain, store port + memory adapter, auth, guard |
| `.gitignore` | Modified | Ignore `/backend/bin`, `backend/.env`, build artifacts |
| `HANDOFF.md` §5 | Read-only | Executes the backend handoff |

## Work-Unit / Commit Plan (400-line review budget)

**Decision needed before apply**: No (`auto` mode). **Chained PRs recommended**: Yes (realized as sequential local commits). **400-line budget risk**: Low per unit if kept tight.

This change does **NOT fit a single unscoped apply** (~1,470 est total > 400). It needs **chained work-unit slices**, delivered as 5 sequential commits on `main`.

| WU | Deliverable | ~LOC | Verify |
|----|-------------|------|--------|
| WU1 | Scaffolding: `go.mod`, `cmd/server` skeleton, `internal/config`, error envelope + JSON helpers, `GET /health`, `.gitignore` | ~350 | `go build ./...`, `go test ./...` (health test) |
| WU2 | `internal/domain` + `store.UserStore` port + `store/memory` adapter | ~300 | table-driven memory-adapter tests |
| WU3 | JWT (`golang-jwt/v5`) + bcrypt + `service/auth` (`register`/`login`/`me`, `role=admin` rejected) | ~350 | table-driven service tests (admin forbidden, bad creds, duplicate email) |
| WU4 | Contract guard (`guard.go` + self-test) + auth `contract_test.go` for the 3 ops | ~350 | self-test rejects a mutated response; 3 ops validated against `openapi.yaml` |
| WU5 | `backend/README.md` (build/test/run, `CONTRACT_PATH`) + optional root `gate` wiring | ~120 | docs accurate; `go test ./...` green |

Ordering: WU1 → WU2 → WU3 → WU4 → WU5. Tests ship with code in each WU. WU4 needs WU3 (the 3 ops must exist to validate).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| kin-openapi OpenAPI **3.1** support gaps (`items: {}`, `additionalProperties: false`, 3.1 semantics) | Med | Pin a recent version; early WU4 spike runs `LoadFromFile`+`doc.Validate` on the real contract before writing per-op tests; fallback to libopenapi if a 3.1 construct is unsupported |
| Contract path resolution outside the module (`//go:embed` cannot reach up) | Med | Documented default `../../../contracts/openapi.yaml` + `CONTRACT_PATH` override; never copy the contract |
| Windows test quirks (path separators, CRLF, `./...` recursion) | Low | Use `filepath.Join`, normalize path in guard; run `go test ./...` locally on win |
| No Postgres | Low | In-memory adapter satisfies the foundation; DB is a deferred follow-on |
| Guard silently weakened over time | Low | `guard_test.go` self-test fails if the guard stops rejecting; SDD-only guard config |
| Missing Go module downloads (network) | Low | Module cache on D:; `go mod tidy` in WU1 |

## Rollback Plan

All work is **additive** (`backend/**`, `.gitignore` lines). Rollback = `git revert` of the WU commit(s) or delete `backend/` and restore `.gitignore`. No existing code, contract, or frontend is touched (`contracts/openapi.yaml` is never modified), so rollback carries zero blast radius.

## Dependencies

- Go 1.27.2 (installed). Module cache on D:.
- `github.com/gin-gonic/gin`, `github.com/golang-jwt/jwt/v5`, `golang.org/x/crypto/bcrypt`, `github.com/getkin/kin-openapi`, `github.com/getkin/kin-openapi/routers/gorillamux`.
- `contracts/openapi.yaml` present at repo root.

## Success Criteria

- [ ] `go build ./...` and `go test ./...` pass with **no external service** (no Postgres/Docker).
- [ ] `POST /auth/register`, `POST /auth/login`, `GET /auth/me` respond per contract; responses validated by the guard against `contracts/openapi.yaml`.
- [ ] Guard self-test proves a non-conforming response is rejected (guard cannot be neutered silently).
- [ ] `register` with `role=admin` returns 400 (`role_not_allowed`) and creates no user.
- [ ] `backend/` has its own `go.mod`; `contracts/openapi.yaml` is unchanged.
- [ ] Each work unit ≤400 changed lines; commits tagged `(p3-backend-foundation)`.

## Next Recommended

`none` (next is enabled).
