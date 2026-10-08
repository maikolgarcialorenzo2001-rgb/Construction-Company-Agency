# Proposal: p2-api-contract — API contract as single source of truth

## Intent

The site pivots to a two-sided platform built in parallel by two sessions — Angular frontend (mock gateways) and Go/Gin backend. Without a shared contract they drift silently. This change defines the OpenAPI 3.1 contract FIRST at `contracts/openapi.yaml` — a language-neutral peer of `src/` and `backend/` — plus both-side conformance guards, so neither consumer implements a different API.

## Scope

### In Scope
- `contracts/openapi.yaml` (OpenAPI 3.1): auth (register/login/me), roles `worker|company|admin`, worker/company profiles, feed posts (CRUD + timeline), jobs (CRUD + listing/search), applications (postulación lifecycle), pagination + error envelope conventions
- Ownership/versioning rules: contract edits only via SDD change; major = breaking, minor = additive
- Conformance: frontend compile-time guard (`openapi-typescript`-generated types back hand-written domain types) + backend contract tests (requirement in spec; built by backend session)
- Contract validation/lint gate

### Out of Scope
- Any `src/` UI, any Go code, real persistence
- Notifications, file uploads — deferred, no phase committed
- Mock gateways/fixtures (→ `p2-platform-foundation`)

## Capabilities

### New Capabilities
- `api-contract`: contract coverage, envelope conventions, ownership, versioning/change control
- `api-conformance`: drift guards — frontend compile-time conformance, backend contract-test requirement, validation gate

### Modified Capabilities
None — existing specs are marketing-site scoped; no requirements change.

## Approach

Single hand-written YAML refined across 4 slices; frontend guard via `bunx openapi-typescript`; backend guard recorded as an inheritable spec requirement.

Slices (sketch; delivery strategy at tasks):
1. Skeleton + envelopes + auth
2. Jobs + applications
3. Feed + profiles
4. Conformance tooling + gates

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `contracts/openapi.yaml` | New | Contract document |
| tooling config / `package.json` scripts | Modified | Lint + type-generation scripts |
| `openspec/specs/api-contract/`, `api-conformance/` | New | Capability specs |

No `src/` changes.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Drift across two sessions | Med | SDD-only edits + both conformance guards |
| Wrong abstraction pre-consumer (YAGNI) | Med | Scope to Phase-1 UI needs; additive versioning |
| Backend session starts before archive | Med | Archive is the hard gate |
| Contract YAML vs 400-line budget | Med | Chained-PR forecast at tasks |

## Rollback Plan

No consumer exists yet: revert chained PRs, delete `contracts/` + tooling config. Nothing references the contract until `p2-platform-foundation` starts.

## Dependencies

- Exploration `p2-platform-foundation/explore.md` (done)
- `p2-platform-foundation` + backend session blocked until this archives

## Success Criteria

- [ ] `contracts/openapi.yaml` valid OpenAPI 3.1, linter-clean
- [ ] In-scope areas covered: auth, profiles, feed, jobs, applications, envelopes
- [ ] Conformance generation script runs green
- [ ] Archived → backend session unblocked
