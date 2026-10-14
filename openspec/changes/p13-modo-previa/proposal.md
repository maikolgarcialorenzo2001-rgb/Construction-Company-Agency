# Proposal: p13-modo-previa — Public static preview + demo-account role switcher

## Intent

The platform is only reachable by logging in, and it is never prerendered, so it cannot be shown or hosted without a running app. `p10-fixtures` shipped the demo data and `p12-admin` completed the 6 role-playable accounts, but deliberately deferred public reachability (`fixtures.ts:544-552`, `HANDOFF.md:64-67`). Close that gap: publish a **truly static, hostable `/previa` showcase** rendered synchronously from fixtures (fictional data), plus a **client-only role switcher** that enters the live platform as any of the 6 demo accounts without registering. Isolated on `feature/p13-modo-previa`.

## Scope

### In Scope
- **Top-level, prerenderable `/previa`** route (sibling of `plataforma`, outside the guarded `/plataforma` subtree) + optional `/previa/:role` param variant.
- **Synchronous snapshot**: page renders directly from `mocks/fixtures.ts` exports — no async mock-store awaits during prerender (R1 de-risk).
- **Client-only role switcher** over the 6 existing demo accounts via `SessionService.login(email, 'demo1234')`; no registration. Links target the prerendered `/previa/:role` pages.
- **NOINDEX** for `/previa` (fictional data; JSON-LD intentionally dropped by `SeoService.apply()`).
- Route-table + prerender specs: mandatory edits to `src/app/app.routes.spec.ts` (exact top-level equality + indexable/noindex partition); `verify-prerender.ts` expectation if `/previa` becomes a prerendered route.

### Out of Scope
- Changing `/plataforma` behavior, its guards, or its chrome.
- Prerendering the platform subtree (invariant stays green).
- New backend / contract; `contracts/openapi.yaml` (READ-ONLY).
- Anything on `main`; `noUncheckedIndexedAccess` (separate ticket).

## Capabilities

### New Capabilities
- `platform-preview`: public, prerenderable `/previa` showcase rendered synchronously from fixtures, plus the demo-account role switcher reachability.

### Modified Capabilities
- `platform-shell`: route table gains a top-level `previa` (and optional `previa/:role`).
- `server-rendering`: prerender set now includes the public `previa` subtree; invariant re-worded to "the platform subtree stays client-only".
- `platform-identity` (light): switcher exposes the 6 demo accounts on `/previa` (login screen unchanged unless design says otherwise).

## Approach

**Camino A** (locked). Add `/previa` as a **top-level** browser route → auto-included by `prerenderStaticPaths` with **zero shared-helper change** and no platform-invariant break. Render the snapshot **synchronously** from fixture constants (`FEED_POSTS`, `COMMENTS`, `JOBS`, `APPLICATIONS`, `WORKER_PROFILES`, `COMPANY_PROFILES`, `DEMO_ACCOUNTS`, `paginate`) — deterministic, hydration-stable under `provideClientHydration`. Role switcher is client-only (`localStorage`/session required). Per-role static HTML via a `previa/:role` param route mirroring `servicios/:slug`.

Two stacked work units:
- **WU1** — static `/previa` route + synchronous snapshot (prerenderable) + route/prerender spec updates. Invariant green.
- **WU2** — client-only role switcher (live login + per-role links) + `previa/:role` param route + specs.

**Open decision for design (R2)**: whether marketing chrome / sticky CTA is visible on `/previa`. Accepting it is zero-cost; suppressing it shell-wide touches `platform-paths`/`sticky-cta` + specs. Design must resolve.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/app.routes.ts` (+server) | Modified | Top-level `previa` (+`previa/:role`, `NOINDEX`) |
| `src/app/pages/previa/*.page.ts` (+spec) | New | Synchronous snapshot page(s) |
| `src/app/pages/previa/preview-fixtures.ts` (+spec) | New | Sync role→fixtures selector |
| Role-switcher component/block (+spec) | New | Client-only demo login + links |
| `src/app/app.routes.spec.ts` | Modified | Exact top-level table + indexable/noindex partition |
| `src/app/app.routes.server.spec.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | Modified | Prerender count (auto) + optional coverage rows |
| `scripts/verify-prerender.ts` | Modified | Add `previa` to prerendered expectations if applicable |
| `openspec/specs/**`, `HANDOFF.md` | Deltas | `platform-preview` + 3 MODIFIED |

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|------------|
| R1 | Async store data under zoneless prerender not awaited (`whenStable` tracks `PendingTasks` only) → empty static HTML | High | Render fixtures synchronously (locked); no bare await in snapshot path |
| R2 | Marketing chrome / sticky CTA visible on `/previa` (not `isPlatformPath`) | Med | Design decision; accept or extend hide rule (touches shell + specs) |
| R3 | `app.routes.spec.ts` exact-table + partition specs fail until edited | Med | WU1 updates `app.routes.spec.ts` in the same unit |
| R6 | 400-line review budget (~350–550 lines, ~8–10 files) | Med | Split into 2 stacked WUs; user pre-authorized |
| R4 | `verify-prerender.ts` scans paths for `/plataforma/i` | Low | Ensure `previa` output dir name never contains "plataforma" (chunks are hashed) |
| R5 | NOINDEX drops JSON-LD | Low | Keep `previa` out of `verify-prerender` `STATIC_PATHS` unless INDEXABLE |
| R7 | Hydration mismatch on `/previa` | Low | Fixtures use static `createdAt`; avoid `Date.now()`/random in templates |

## Rollback Plan

Revert the 2 `(p13-modo-previa)` WU commits on the `feature/p13-modo-previa` branch (no `main` changes). WU2 reverts independently to leave a static, no-switcher `/previa`; WU1's revert removes the route + page and restores `app.routes.spec.ts`. No contract/backend to unwind.

## Dependencies

- `SessionService` + `AUTH_GATEWAY` → `MockAuthGateway`; `DEMO_ACCOUNTS`/fixtures; `prerenderStaticPaths` / `app.routes.server.ts`; `app.routes.spec.ts`; `SeoService`.
- Locked: Camino A (top-level, prerenderable); client-only switcher; synchronous fixture snapshot; NOINDEX.

## Success Criteria

- [ ] `/previa` builds as a static, prerendered page from fixtures with no app running.
- [ ] Platform subtree remains client-only (invariant spec green); no shared-helper change.
- [ ] Role switcher enters the live platform as any of the 6 demo accounts without registering.
- [ ] `/previa/:role` renders per-role static HTML (works with JS disabled).
- [ ] `/previa` is NOINDEX and emits no JSON-LD.
- [ ] `bunx ng test --watch=false` green (incl. updated `app.routes.spec.ts`).
- [ ] `bunx ng lint` and `bunx ng build` green.

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Estimated changed lines | ~350–550 (additions + deletions) |
| Files | ~8–10 |
| 400-line budget risk | **Medium** |
| Chained PRs recommended | **Yes — 2 stacked WUs** (`stacked-to-main`) |
| Decision needed before apply | **Yes** (R2 chrome resolution in design) |

Work-unit sketch:

| Unit | Goal | Independently revertible |
|------|------|--------------------------|
| **WU1** | Static `/previa` route + synchronous fixture snapshot + route/prerender spec updates | Yes — leaves invariant green, no switcher |
| **WU2** | Client-only role switcher + `previa/:role` param route + specs | Yes — reverts to static no-switcher preview |

The user pre-authorized splitting (`ask-on-risk` → 2 stacked WUs); **no `size:exception` required**.
