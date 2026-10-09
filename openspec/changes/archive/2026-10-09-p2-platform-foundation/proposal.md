# Proposal: `p2-platform-foundation` — platform subtree under `/plataforma` with gateway ports + mocks

## Intent

This change operationalizes the exploration's chosen approach: deliver Phase 1 of the two-sided platform as a **`/plataforma` subtree** with a **port/adapter (gateway) data layer**, using **hand-written domain types** against the contract, and close the inherited W1 gap (build-time conformance guard). It keeps the marketing site at `/` intact while enabling feed/jobs/auth/profile with deterministic mock data.

## Scope

### In Scope
- **Platform subtree IA**: `/plataforma` (feed), `/plataforma/trabajos`, `/plataforma/trabajos/:id`, `/plataforma/login`, `/plataforma/registro`, `/plataforma/perfil` with dedicated platform chrome.
- **Gateway ports**: `FeedGateway`, `JobsGateway`, `ApplicationsGateway`, `AuthGateway`, `ProfilesGateway` (DI tokens), plus `Mock*Gateway` implementations using deterministic fixtures.
- **Domain/types + stores**: hand-written domain models in `core/platform/domain`, signal stores (`FeedStore`, `JobsStore`) bound to gateway responses (zoneless).
- **Session/auth**: `SessionService` (mock, localStorage), role `computed`, guard on platform children; auth flows must be visibly demo.
- **Spec deltas (intentional)**: update specs for `site-shell-navigation`, `server-rendering`, `seo-analytics-performance`, `app.routes.*`, `app.release-matrix.spec.ts` and add platform route rows (CTA `false` for platform).
- **W1 closure**: frontend conformance guard binding domain types to `components['schemas'][...]` so `ng build` fails on divergence (not only `ng test`).
- **Route/prerender/noindex/CTA**: exclude platform subtree from prerender derivation, set `noindex` on platform pages, suppress sticky CTA/end-of-page CTA on platform (except where specified). 
- **Slices for chained PRs** (target ≤400 lines per PR): (a) shell + routing/prerender/noindex/deltas, (b) gateway ports + mocks + DI + stores, (c) feed, (d) jobs + applications, (e) auth + profile.

### Out of Scope
- Real HTTP (`Http*Gateway`) — deferred to backend integration.
- MSW — deferred (overkill pre-backend).
- Backend implementation (owned by other session).
- Real auth, file uploads, notifications, payments, realtime.
- Changes to marketing home `/` beyond nav/CTA exemptions required by platform.

## Capabilities

### New Capabilities
- `platform-shell`: platform chrome/layout, `/plataforma` subtree routing, prerender exclusion, noindex, CTA suppression, guarded children.
- `platform-identity`: mock auth (demo), roles (`worker|company|admin`), profiles, session service, guard behavior.
- `platform-feed`: company feed posts, composer (role-gated), feed rendering via signals.
- `platform-jobs`: job board/detail, applications flow, jobs store, status handling.

### Modified Capabilities
- `site-shell-navigation`: allow `/plataforma` subtree; header nav includes platform entry; CTA rules exempt platform routes (and keep `/presupuesto` exception).
- `server-rendering`: mark platform subtree as Client render mode; exclude from static prerender derivation; handle prefix matching explicitly.
- `seo-analytics-performance`: enforce `noindex` on `/plataforma/**`; route spec must accept platform routes with `indexable: false`.
- `api-contract`: (already defined by `p2-api-contract`; this change consumes it; domain types must conform to `contracts/openapi.yaml` via build-time guard).
- `api-conformance`: consume/extend frontend conformance guard to fire under `ng build` (bind to `components['schemas'][...]`).

## Approach

1. **Separate contract first**: `p2-api-contract` is archived (already satisfied); contract live at `contracts/openapi.yaml`, TS types at `src/app/core/platform/api/generated/schema.gen.ts`, conformance spec exists.
2. **Subtree, not replacement**: keep marketing at `/`. Platform under `/plataforma` minimizes collision with closed route table; one prefix simplifies prerender exclusion + noindex + CTA suppression.
3. **Gateway/adapter**: define ports with DI tokens; `Mock*Gateway` backed by fixtures now. Hand-written domain types mapped from API shapes; conformance checked at build (W1 closure).
4. **Zoneless signals**: stores hold signals/computed, gateway calls write to signals; OnPush throughout. Treat "unsignalized async never paints" as a testing invariant.
5. **Spec deltas first**: route/table specs (`app.routes.spec.ts`, `app.routes.server.ts`, `app.server-routes.shared.ts`, `app.release-matrix.spec.ts`) and capability specs updated intentionally (they will fail until deltas applied) — follow SDD: deltas land before apply.
6. **Chained PRs**: split into (a)-(e) slices (each ≤~400 LOC), reviewable independently.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/app.routes.ts` | Modified | Add `/plataforma` subtree with platform children; keep marketing routes intact. |
| `src/app/app.routes.spec.ts` | Modified (delta) | Route table exact paths, guards contract adjusted (platform guarded), `noindex` includes `/plataforma/**`. |
| `src/app/app.routes.server.ts`, `app.server-routes.shared.ts` | Modified (delta) | Exclude `/plataforma/**` from prerender derivation; Client render for subtree. |
| `src/app/app.html`, header/footer/sticky-cta | Modified | Platform chrome + CTA suppression on platform routes (except `/presupuesto` preserved). |
| `src/app/app.release-matrix.spec.ts` | Modified (delta) | Add platform route rows with `cta: false`, correct image/priority per route. |
| `src/app/core/platform/{domain,api,auth,mocks,store}/` | New | Domain models, ports/DI, mocks/fixtures, session, stores (signals). |
| `src/app/pages/plataforma/**` | New | Feed, jobs list/detail, login, registro, perfil (standalone, zoneless, OnPush). |
| `src/app/core/platform/api/conformance.spec.ts` + conformance guard | Modified | Bind domain types to `components['schemas'][...]` so build fails on divergence (W1). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prerender leakage of platform HTML | Med | Explicit exclusion in server routes + tests; verify prefix matching semantics for `/plataforma/**`. |
| Zoneless signal binding (unsignalized async never paints) | High | Signal-bound tests for stores/gateways; OnPush; detectChanges+whenStable; avoid untracked reads. |
| Spec collisions intentional | High | Apply spec deltas before implementation/tests pass for new behavior; document in tasks. |
| Demo auth confusion | Med | UI copy "DEMO" / "modo demo"; never imply real credentials/production auth. |
| Hydration/transfer cache with future HTTP | Med | Platform is Client-rendered + lazy; revisit transfer cache when adding `Http*Gateway`. |
| Review size (400-line budget) | High | Chained PRs (a)-(e); keep each slice reviewable; track work units per slice. |
| Marketing/platform IA regression | Med | Keep `/` unchanged; CTA exemptions explicit; header/nav deltas tested. |

## Rollback Plan

1. Revert platform subtree routes + server-route exclusions (restore previous prerender set).
2. Remove platform pages, stores, gateways, mocks, domain types.
3. Restore spec files to pre-change state (`app.routes.spec.ts`, server routes, release matrix, capability deltas).
4. Restore header/footer/CTA to prior behavior.
5. Revert conformance guard changes (keep contract types if needed, but remove W1 binding if problematic) — atomic revert of the change set.

## Dependencies

- `p2-api-contract` (archived, commit `bc7488d`): `contracts/openapi.yaml` live; TS schema generated; conformance spec present.
- Existing spec suite: `site-shell-navigation`, `server-rendering`, `seo-analytics-performance`, `api-conformance`, `api-contract` baseline specs.

## Success Criteria

- [ ] Platform routes load under `/plataforma/**`; marketing routes unchanged.
- [ ] Prerender excludes platform subtree (no platform HTML in prerender output). 
- [ ] Platform pages `noindex`; CTA suppressed on platform (exceptions preserved).
- [ ] Gateway ports + mocks + stores work with signals (zoneless); tests pass.
- [ ] W1: conformance guard fires under `ng build` (binds domain types to `components['schemas'][...]`).
- [ ] Spec deltas applied intentionally; closed specs updated without breaking unrelated behavior.
- [ ] Chained PRs ≤400 lines each; reviewable work units per slice.
- [ ] Mock auth visibly marked demo; no real auth introduced.
