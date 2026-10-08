# Tasks: `p2-api-contract` — API contract as single source of truth

**Change:** `p2-api-contract` (project: `construction-company-agency`)  
**Mode:** hybrid (Engram + filesystem)  
**Delivery strategy:** chained slices (4 slices), stacked 1→2→3→4  
**Chain strategy:** stacked-to-main  
**Constraints:** Bun-only (`bunx`, `bun add`, `bun run`); never hand-edit `bun.lock`; strict TDD mode active (RED→GREEN where meaningful); test runner `bunx ng test --watch=false`. Code/comments English; no UI copy changes here.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 total YAML + ~10 hand code + ~700 generated (review-exempt) |
| 400-line budget risk | Low (1–3), Medium (4) |
| Chained PRs recommended | Yes |
| Suggested split | 4 slices, stacked to `main` |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No  
Chained PRs recommended: Yes  
Chain strategy: stacked-to-main  
400-line budget risk: Low (1–3), Medium (4)

## Slice 1: Skeleton, envelopes, auth paths, ruleset, `contract:lint`

**Goal:** Create `contracts/` structure with OpenAPI 3.1 skeleton, shared envelopes (Error, Pagination, PageEnvelope), auth paths/schemas, Role enum, bearerAuth, Spectral ruleset, and working `contract:lint` gate.  
**Dependencies:** None (first).  
**PR size target:** ~260 LOC. ≤400? Yes.

### T1.1 — Create Spectral ruleset
- **ID:** 1.1
- **Description:** Create `contracts/.spectral.yaml` with `extends: spectral:oas`; turn off `info-contact`; promote `operation-operationId`, `operation-tags`, `operation-description`, `operation-success-response`, `oas3-api-servers` to error.
- **Files touched:** `contracts/.spectral.yaml` (new)
- **TDD step:** N/A (config). Just create file.
- **Work-unit commit message:** `chore(contract): add Spectral ruleset for OpenAPI 3.1 linting (p2-api-contract)`
- **Acceptance criteria:**
  - [x] File exists at `contracts/.spectral.yaml`
  - [x] Extends `spectral:oas`; rules set as specified
- **Effort:** S

### T1.2 — Create OpenAPI 3.1 skeleton with shared components
- **ID:** 1.2
- **Description:** Create `contracts/openapi.yaml` (OpenAPI 3.1) with `info.title`, `info.description`, `info.version` starting at `1.0.0`, `openapi: 3.1.0`, `servers: []`, `tags` for domains (auth, profiles, feed, jobs, applications). Define shared components: `Error` (code, message, details?), `Pagination` (page, pageSize, total), `PageEnvelope` (items array + meta referencing `Pagination`), `Role` enum `worker|company|admin`, `bearerAuth` security scheme.
- **Files touched:** `contracts/openapi.yaml` (new)
- **TDD step:** N/A (YAML authoring). Write skeleton.
- **Work-unit commit message:** `feat(contract): add OpenAPI 3.1 skeleton and shared envelopes (p2-api-contract)`
- **Acceptance criteria:**
  - [x] Valid OpenAPI 3.1 structure
  - [x] Shared components defined as specified
  - [x] `info.version` is `1.0.0`
- **Effort:** M

### T1.3 — Add auth paths and schemas
- **ID:** 1.3
- **Description:** Add auth domain paths: `POST /auth/register`, `POST /auth/login`, `GET /auth/me` with operationId, tags, descriptions, request/response schemas, 2xx/4xx using shared `Error`.
- **Files touched:** `contracts/openapi.yaml` (modified)
- **TDD step:** N/A (YAML). Ensure lint-clean after adding.
- **Work-unit commit message:** `feat(contract): add auth paths and schemas to OpenAPI contract (p2-api-contract)`
- **Acceptance criteria:**
  - [x] Paths defined with operationId, tags, description, success response
  - [x] Error responses reference shared `Error`
  - [x] Role constrained appropriately
- **Effort:** M

### T1.4 — Add contract tooling and verify lint passes
- **ID:** 1.4
- **Description:** Add devDependencies `@stoplight/spectral-cli@6.17.0`, `openapi-typescript@7.13.0` with `bun add -D`. Add scripts: `contract:lint`, `contract:generate`, `contract:check` as specified. Verify `bun run contract:lint` passes. Run slice gates (spectral lint + ng lint + ng test --watch=false + ng build).
- **Files touched:** `package.json` (modified), `bun.lock` (updated by bun)
- **TDD step:** N/A
- **Work-unit commit message:** `chore(contract): add contract linting tooling and scripts (p2-api-contract)`
- **Acceptance criteria:**
  - [x] DevDeps pinned correctly
  - [x] Scripts added
  - [x] `contract:lint` exits 0
  - [x] All slice gates pass
- **Effort:** S

**Slice 1 gate:** `bunx @stoplight/spectral-cli lint contracts/openapi.yaml --ruleset contracts/.spectral.yaml` && `bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build`

## Slice 2: Jobs CRUD/search + applications

**Goal:** Add Job posts (CRUD + listing/search) and Applications (create/postulación, list, status transitions). Keep contract lint-clean.  
**Dependencies:** Slice 1.  
**PR size target:** ~270 LOC. ≤400? Yes.

### T2.1 — Add Job posts paths and schemas
- **ID:** 2.1
- **Description:** Add jobs paths: `POST /jobs`, `GET /jobs`, `GET /jobs/{jobId}`, `PUT /jobs/{jobId}`, `DELETE /jobs/{jobId}`, `GET /jobs/search`. Include operationId/tags/descriptions; listing/search use `PageEnvelope`; errors use shared `Error`.
- **Files touched:** `contracts/openapi.yaml` (modified)
- **TDD step:** N/A
- **Work-unit commit message:** `feat(contract): add job posts CRUD, listing, and search endpoints (p2-api-contract)`
- **Acceptance criteria:**
  - [x] Job operations defined with required metadata
  - [x] Pagination via shared envelope
  - [x] Shared Error references
- **Effort:** M

### T2.2 — Add Applications paths and schemas
- **ID:** 2.2
- **Description:** Add applications: `POST /applications`, `GET /applications` with status transitions as needed. Pagination for list; shared envelopes/errors.
- **Files touched:** `contracts/openapi.yaml` (modified)
- **TDD step:** N/A
- **Work-unit commit message:** `feat(contract): add applications endpoints (postulación, list, transitions) (p2-api-contract)`
- **Acceptance criteria:**
  - [x] Applications operations defined
  - [x] Shared pagination/envelope usage
- **Effort:** M

### T2.3 — Verify lint and slice gates
- **ID:** 2.3
- **Description:** Run slice gates including `contract:lint`. All green.
- **Files touched:** none
- **TDD step:** N/A
- **Work-unit commit message:** `test(contract): verify jobs and applications paths lint-clean (p2-api-contract)`
- **Acceptance criteria:**
  - [x] `contract:lint` passes
  - [x] All slice gates pass
- **Effort:** S

**Slice 2 gate:** same as slice 1

## Slice 3: Feed posts + profiles

**Goal:** Add Feed posts (CRUD + timeline) and Profiles (worker/company read/update). Keep lint-clean.  
**Dependencies:** Slice 2.  
**PR size target:** ~240 LOC. ≤400? Yes.

### T3.1 — Add Feed posts paths and schemas
- **ID:** 3.1
- **Description:** Add feed: `POST /feed/posts`, `GET /feed/posts/{postId}`, `PUT /feed/posts/{postId}`, `DELETE /feed/posts/{postId}`, `GET /feed/timeline`. Timeline uses `PageEnvelope`.
- **Files touched:** `contracts/openapi.yaml` (modified)
- **TDD step:** N/A
- **Work-unit commit message:** `feat(contract): add feed posts CRUD and timeline endpoints (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] Feed operations with metadata
  - [ ] Timeline uses shared pagination
- **Effort:** M

### T3.2 — Add Profiles paths and schemas
- **ID:** 3.2
- **Description:** Add profiles: worker/company read/update paths. Reference `Role` enum.
- **Files touched:** `contracts/openapi.yaml` (modified)
- **TDD step:** N/A
- **Work-unit commit message:** `feat(contract): add worker and company profile endpoints (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] Profile operations defined
  - [ ] Role constraints maintained
- **Effort:** M

### T3.3 — Verify lint and slice gates
- **ID:** 3.3
- **Description:** Run slice gates including `contract:lint`. All green.
- **Files touched:** none
- **TDD step:** N/A
- **Work-unit commit message:** `test(contract): verify feed and profiles paths lint-clean (p2-api-contract)`
- **Acceptance criteria:**
  - [x] `contract:lint` passes
  - [x] All slice gates pass
- **Effort:** S

**Slice 3 gate:** same as slice 1

## Slice 4: Codegen scripts, generated types, conformance spec

**Goal:** Generate `src/app/core/platform/api/generated/schema.gen.ts` (committed), add type-level conformance spec, run full gate including `contract:check`.  
**Dependencies:** Slice 3.  
**PR size target:** ~10 hand + ~700 generated.

### T4.1 — Generate types
- **ID:** 4.1
- **Description:** Ensure scripts exist; create output dir; run `bun run contract:generate` to produce schema.gen.ts (committed).
- **Files touched:** `src/app/core/platform/api/generated/schema.gen.ts` (new - derived)
- **TDD step:** N/A
- **Work-unit commit message:** `feat(contract): generate TypeScript types from OpenAPI contract (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] Generated file exists with do-not-edit header
  - [ ] Deterministic from current contract
- **Effort:** S

### T4.2 — Add type-level conformance spec (RED→GREEN)
- **ID:** 4.2
- **Description:** Create `src/app/core/platform/api/conformance.spec.ts` with vitest type assertions: `expectTypeOf<components['schemas']['Role']>().toEqualTypeOf<'worker' | 'company' | 'admin'>();` and `expectTypeOf<paths['/auth/login']['post']>().not.toBeNever();` plus key endpoint checks.
- **Files touched:** `src/app/core/platform/api/conformance.spec.ts` (new)
- **TDD step:** Write spec first conceptually (RED) → GREEN when types match.
- **Work-unit commit message:** `test(contract): add type-level API conformance spec (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] Conformance spec compiles and passes
  - [ ] Role and key paths assertions hold
- **Effort:** S

### T4.3 — Verify full gate passes
- **ID:** 4.3
- **Description:** Run full gate: `bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build`. All pass; `contract:check` exits 0.
- **Files touched:** none
- **TDD step:** N/A
- **Work-unit commit message:** `test(contract): run full contract gate (lint, check, lint, test, build) (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] All commands in full gate pass with exit 0
- **Effort:** S

### T4.4 — Final verification of contract completeness
- **ID:** 4.4
- **Description:** Verify coverage matches api-contract spec: auth/register/login/me, roles constrained, profiles (worker/company), feed (CRUD+timeline), jobs (CRUD+listing/search), applications (create/list). Verify pagination envelope shared and Error referenced.
- **Files touched:** none
- **TDD step:** N/A
- **Work-unit commit message:** `docs(contract): verify API surface coverage against spec (p2-api-contract)`
- **Acceptance criteria:**
  - [ ] All required domains covered
  - [ ] Pagination envelope shared across list endpoints
  - [ ] Error envelope referenced where applicable
  - [ ] `info.version` is 1.0.0
- **Effort:** S

**Slice 4 gate:** full gate `bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build`

## Execution Notes

- Strict TDD mode active. YAML/config/tooling: TDD step N/A as noted. T4.2: RED→GREEN conceptually (type-level).
- Slices in order 1→2→3→4. Gate green before next slice.
- Commit each work unit as soon as gate passes. No PRs/branches/pushes.
- Generated `schema.gen.ts` committed (D4); `contract:check` enforces freshness.
- Existing Angular tests must remain green.
