# Design: `p2-platform-foundation` — platform subtree, gateway ports, W1 closure

## Technical Approach

One lazy top-level `plataforma` route subtree (dedicated chrome, Client-rendered, noindex) over a port/adapter data layer: `Mock*Gateway` behind `providedIn: 'root'` DI tokens → signal stores → OnPush pages. Hand-written domain types are bound to `contracts/openapi.yaml` by a **non-spec** bidirectional type assertion so `bunx ng build` fails on drift (W1). Marketing `/` is untouched. Delivered as 5 stacked slices.

## Resolved: prefix-match semantics (verified in installed `@angular/ssr`)

Traced `node_modules/@angular/ssr/fesm2022/ssr.mjs` — `RouteTree.traverseBySegments` (L409–432) matches **segment-exact with a `**` fallback**; there is no substring/prefix matching. Consequences:

- A server route `{path:'plataforma', renderMode:Prerender}` matches `/plataforma` itself, not its children (children fall through to root `**` → Client). So the leak is **`/plataforma` emitted as `dist/browser/plataforma/index.html`**.
- Current derivation `prerenderStaticPaths` filters only `**` and `:` — it is *not* a naive `startsWith`; it has **no platform handling**, so adding the browser parent route silently prerenders `/plataforma`.

Fix — exclusion in the pure shared helper, boundary-exact (guards `plataformas-curso`):

```ts
export const isWithinPrefix = (p: string, prefix: string) => p === prefix || p.startsWith(`${prefix}/`);
export const prerenderStaticPaths = (paths: readonly string[], excluded: readonly string[] = []) =>
  paths.filter(p => p !== '**' && !p.includes(':') && !excluded.some(x => isWithinPrefix(p, x)));
```

`app.routes.server.ts` passes `[PLATFORM_PREFIX]` **and** adds explicit `{ path: 'plataforma/**', renderMode: RenderMode.Client }` so subtree resolution is local, not implicit via `**`. Unknown `/plataforma/x` still backtracks to the top-level `**` 404. Guards: unit scenario `prerenderStaticPaths(['plataforma','plataforma/trabajos','servicios','plataformas-curso'], ['plataforma']) === ['servicios','plataformas-curso']`; `app.routes.server.spec.ts` asserts no Prerender path is under `plataforma` and a Client entry covers it; build gate asserts `dist/browser/plataforma` is absent.

## Architecture Decisions

| # | Decision | Choice | Alternatives (tradeoff) | Rationale |
|---|---|---|---|---|
| 1 | IA | `/plataforma` subtree | replace `/` (breaks 21 prerendered pages/SEO/LCP) | one prefix ⇒ one exclusion, one noindex rule, one CTA rule |
| 2 | Data | port/adapter + signals | MSW (deps, HTTP before HTTP exists) | zero deps; swap = one provider; TestBed-friendly |
| 3 | Chrome | URL-aware `App` switch | nested layout (chrome stays inside `<main>`) | one `<main>`, platform nav in a real `<header>` landmark |
| 4 | Auth | `SessionService` localStorage mock | real auth (out of scope) | demo-honest, zero HTTP |
| 5 | W1 | bidirectional `AssertExtends` in non-spec domain file | spec-only `expectTypeOf` (test-only, the gap) | constraint violation fails `ng build` |

## W1 closure mechanics

`src/app/core/platform/domain/contract-conformance.ts` (non-spec, in the build program via `tsconfig.app.json` `include`) uses a zero-runtime type-argument constraint; a mismatch is a compile error at the alias, regardless of usage:

```ts
type Schema = components['schemas'];
export type AssertExtends<Target, Candidate extends Target> = Candidate;
export type PostCovered = AssertExtends<Schema['FeedPost'], Post>;  // catches removed/renamed
export type PostExact  = AssertExtends<Post, Schema['FeedPost']>;   // catches added-required/narrowed
```

Both directions are required: schema field removal only fails the reverse side. Domain interfaces mirror schema shape (mutable arrays) so structural assignability holds. Gateways/stores import the `domain` barrel ⇒ runtime graph. Type-level probe in `conformance.spec.ts` proves the mechanism: `// @ts-expect-error` on `AssertExtends<Schema['FeedPost'], { id: number }>` — if the assertion ever stops rejecting, the test itself fails.

## Gateway ports + mocks + stores

`core/platform/api/ports.ts`: `FeedGateway`, `JobsGateway`, `ApplicationsGateway`, `AuthGateway`, `ProfilesGateway` — interfaces returning `Promise<...>`, each behind an `InjectionToken` with a `providedIn:'root'` factory returning its `Mock*Gateway` (mirrors `ENVIRONMENT`). `v1` swap = change the factory / add one `{provide: TOKEN, useClass: Http*}` line. Mocks return deterministic fixtures (`mocks/fixtures.ts`, `satisfies readonly Post[]`, `isPlaceholder: true`). No zod: compile-time types + `satisfies` only (minimal).

Stores own signals; responses **must** land via `.set()` so zoneless paints:

```ts
readonly state = signal<{ status: 'idle'|'loading'|'ready'|'empty'; posts: Post[] }>({ status: 'idle', posts: [] });
async load() { this.state.set({status:'loading',posts:[]}); const p = await this.gateway.timeline();
  this.state.set({ status: p.items.length ? 'ready' : 'empty', posts: p.items }); }
```

## Platform shell / chrome

`App` gains an `isPlatform` signal (same `toSignal(NavigationEnd)` pattern as `sticky-cta`). On `/plataforma/**` it renders `PlatformHeaderComponent` (platform nav from `core/platform/nav.ts` + “Modo demo” pill) instead of marketing `app-header`/`app-footer`/`app-sticky-cta`; marketing routes keep baseline behavior. `sticky-cta` reuses `isPlatformPath` (boundary-exact) alongside its `/presupuesto` rule. Platform pages never import `app-cta-block`. `header.component.html` gains one static “Plataforma” link (`site.nav` stays marketing-only / `content-model`-clean). Auth screens render a visible “DEMO” notice.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/app.routes.ts` (+`.spec`) | Modify | `plataforma` parent + 6 lazy children; deltas |
| `src/app/app.routes.server.ts` (`+spec`), `app.server-routes.shared.ts` (`+spec`) | Modify | prefix exclusion + `plataforma/**` Client |
| `src/app/app.ts`, `app.html`, `layout/header.component.html`, `layout/sticky-cta.component.ts` (+spec) | Modify | chrome switch, platform entry, CTA suppression |
| `src/app/app.release-matrix.spec.ts` | Modify | platform rows `cta:false, images:0` |
| `src/app/core/platform/domain/*` (models + `contract-conformance.ts`), `api/ports.ts`, `api/mock-*.gateway.ts`, `mocks/fixtures.ts`, `store/{feed,jobs}.store.ts`, `auth/{session.service,auth.guard}.ts`, `nav.ts`, `platform-paths.ts` | Create | data layer + W1 |
| `src/app/core/platform/api/conformance.spec.ts` | Modify | probe test |
| `src/app/pages/plataforma/*` (feed, jobs-list, job-detail, login, registro, perfil, `platform-header`) | Create | pages + platform chrome |

## Slices → chained PRs (stacked 1→5)

| Slice | Deliverable | Key files | Rollback boundary |
|---|---|---|---|
| S1 | IA + shell + prerender/noindex/CTA + route/server/release spec deltas (stub pages) | routes/server/shared/app/header/sticky-cta/platform-header, `pages/plataforma/*` stubs | revert ⇒ static marketing site exactly as today |
| S2 | domain + `AssertExtends` (W1) + ports + mocks + stores | `core/platform/{domain,api,mocks,store}` | revert ⇒ S1 shell only, no data layer |
| S3 | feed + company composer | `feed.page`, `feed.store`, mock-feed | revert ⇒ S2 |
| S4 | jobs board/detail + applications | `jobs-*.page`, `jobs.store`, mock-jobs/applications | revert ⇒ S3 |
| S5 | session + guard + login/registro/perfil + demo marks | `session.service`, `auth.guard`, auth/profile pages | revert ⇒ S4 |

Each slice gate: `bunx ng test --watch=false` + `bunx ng lint` + `bunx ng build` (+ S1 build-artifact check). Review Workload Forecast: `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `400-line budget risk: High` (S1 highest; split S1a routing/prerender, S1b chrome if it exceeds 400).

## Risks

| Risk | Mitigation |
|---|---|
| Prerender leakage | boundary-exact exclusion + no-Prerender-under-plataforma test + `dist/browser/plataforma` absence check |
| Zoneless: async never paints | every gateway response written to `signal.set`; store tests use `detectChanges`+`whenStable` |
| Spec deltas land before apply | phase test additions per slice so each gate is green; deltas documented in tasks |
| Hydration / transfer cache | platform = Client + lazy, zero-HTTP bootstrap; revisit when `Http*Gateway` lands |
| Marketing vs platform IA | `/` untouched; `site.nav` marketing-only; explicit header platform entry |
| Mock honesty | “Modo demo”/“DEMO” copy; no network on auth |

## Open Questions

None blocking. Verification to confirm at apply: `prerenderStaticPaths` second-argument signature accepted by both `app.routes.server.spec.ts` and the shared spec (same helper, single delta).
