# Design: p2-api-contract — API contract as single source of truth

## Technical Approach

One hand-written `contracts/openapi.yaml` (OpenAPI 3.1) grown across 4 stacked PRs; every slice gated by Spectral, the last adds openapi-typescript codegen + type-level conformance. Verified under Bun: spectral-cli 6.17.0 (valid→0; error→exit 1+location; needs `--ruleset`), openapi-typescript 7.13.0 (`--check`→exit 1 stale/tampered, non-rewriting). Specs: `specs/api-contract`, `specs/api-conformance`.

## Architecture Decisions

| # | Decision | Options → tradeoff | Choice |
|---|----------|--------------------|--------|
| D1 | Linter | Spectral: de-facto, runs on `bunx` ✅ / Redocly, swagger-cli: heavier | **Spectral**, ruleset `contracts/.spectral.yaml` |
| D2 | TS codegen | openapi-typescript: types-only, has `--check` ✅ / ng-openapi-gen, hey-api: client codegen presuming server shape (explore rejected) | **openapi-typescript** via `bunx` |
| D3 | Layout | Single: spec mandates it, no ref-resolution risk / `$ref` split: nicer diffs, multi-file ≠ one document | **Single file**, append-only: header → `paths` (one contiguous block per domain) → `components` |
| D4 | Generated git policy | Committed: build fails on divergence without generate step; delta visible in PR / generate-in-CI: no CI | **Committed** |
| D5 | Guard shape | Compile-time only (spec) / MSW-Prism runtime: explore Q2 rejected | **Generated types + type-level vitest spec** |

**Ruleset**: `extends: spectral:oas`; `info-contact` off; promote to `error`: `operation-operationId`, `operation-tags`, `operation-description`, `operation-success-response`, `oas3-api-servers`.

**Scripts** (exact-pinned devDeps `@stoplight/spectral-cli@6.17.0`, `openapi-typescript@7.13.0`, committed `bun.lock`):

```json
"contract:lint": "bunx @stoplight/spectral-cli lint contracts/openapi.yaml --ruleset contracts/.spectral.yaml",
"contract:generate": "bunx openapi-typescript contracts/openapi.yaml -o src/app/core/platform/api/generated/schema.gen.ts",
"contract:check": "bunx openapi-typescript contracts/openapi.yaml -o src/app/core/platform/api/generated/schema.gen.ts --check",
"gate": "bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build"
```

Hook: existing gates untouched; apply/verify run `gate`. Slices 1–3: `contract:lint` + 3 ng gates; slice 4+: full `gate`.

**Shared components**: `Error` (code, message, details?), `Pagination` (page, pageSize, total), `PageEnvelope` (items + meta→`Pagination`; `*Page` refines items via `allOf` — meets the spec's "same shared component" scenario), `Role` (enum `worker|company|admin`), `bearerAuth`.

## Data Flow

```
contracts/openapi.yaml ──spectral──▶ contract:lint (exit 1 + location)
        ├─openapi-typescript──▶ generated/schema.gen.ts (committed)
        │     domain types + conformance.spec.ts bind to it
        │     ng build / ng test ──▶ RED at the offending type
        └─ --check ──▶ contract:check (exit 1 stale/tampered)
backend (later): kin-openapi loads the SAME file ──▶ go test RED
```

## Interfaces / Contracts

```ts
export type JobPost = components['schemas']['JobPost']; // contract drops field ⇒ ng build red
// conformance.spec.ts (RED → GREEN):
expectTypeOf<components['schemas']['Role']>().toEqualTypeOf<'worker' | 'company' | 'admin'>();
expectTypeOf<paths['/auth/login']['post']>().not.toBeNever(); // path gone ⇒ index error
```

**Backend inheritance (backend session)**: `backend/internal/contract/contract_test.go` with kin-openapi (`openapi3.Loader` + `openapi3filter.ValidateResponse`): (1) each implemented Gin route MUST map to a contract path+operationId, (2) recorded status/body MUST validate; gate `go test ./...`. Guard config is contract-adjacent → SDD-only.

## File Changes

| File | Action | Slice |
|------|--------|-------|
| `contracts/openapi.yaml` | Create, grows per slice | 1–3 |
| `contracts/.spectral.yaml` | Create | 1 |
| `package.json`, `bun.lock` | Modify (+2 devDeps, +4 scripts) | 1, 4 |
| `src/app/core/platform/api/generated/schema.gen.ts` | Create (derived) | 4 |
| `src/app/core/platform/api/conformance.spec.ts` | Create | 4 |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Gate (1–3) | valid + lint-clean contract | `contract:lint` RED-first (rule → YAML) |
| Gate (4) | fresh types + role/paths/envelope locks | conformance spec before generate → RED → GREEN |
| Regression | site suite unaffected | `ng lint`, `ng test --watch=false`, `ng build` green each slice |
| Backend (inherited) | responses match contract | kin-openapi tests, `go test ./...` |

## Slices (stacked → main)

| # | Delivers | Δ lines | Forecast |
|---|----------|---------|----------|
| 1 | Skeleton, envelopes, auth paths, ruleset, `contract:lint` | ~260 | ✅ <400 |
| 2 | Jobs CRUD/search + applications | ~270 | ✅ <400 |
| 3 | Feed posts + profiles | ~240 | ✅ <400 |
| 4 | Codegen scripts, generated types, conformance spec | ~10 hand + ~700 generated (review-exempt) | ⚠️ Medium |

Forecast: `Decision needed before apply: No` · `Chained PRs recommended: Yes` · `400-line budget risk: Low (1–3), Medium (4)`.
Lint tooling moves 4 → 1: spec requires lint-clean at *every* mainline commit.

## Migration / Rollout

No migration. Stacked chained PRs; **archive is the hard gate** for `p2-platform-foundation` + backend session.

## Risks

| Risk | Mitigation |
|------|------------|
| YAML ~900 lines vs review budget | counts PR delta, not final file; blocks ≤270 |
| Tool-version drift | pinned devDeps + `bun.lock`; `bunx` resolves local first |
| Generated tampering / stale types | `contract:check` in `gate` (verified exit 1) |
| Backend session starts before archive | archive gate recorded; no partial-folder reads |
| Pagination wording ("same shared component") | `PageEnvelope` composition; verify checks it literally |
| No CI → gates skippable | apply/verify re-run `gate` |

## Open Questions

None.
