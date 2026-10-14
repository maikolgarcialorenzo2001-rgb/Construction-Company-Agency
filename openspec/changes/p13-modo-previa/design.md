# Design: p13-modo-previa — Public static `/previa` preview + demo role switcher

## Technical Approach

Top-level grouping route `previa` (sibling of `plataforma`) rendered **synchronously** from
`fixtures.ts` constants, so `prerenderStaticPaths` auto-includes `/previa` with **zero shared-helper
change** and the "platform subtree stays client-only" invariant is untouched. `:role` is a **child**
of `previa`, so the pinned top-level table stays `[...marketing, 'plataforma', 'previa', '**']`; its
per-role HTML is emitted by one explicit `Prerender` server entry (mirrors `servicios/:slug`). The
role switcher is a client-only control on the page (WU2) that reuses `SessionService.login` over the 6
`DEMO_ACCOUNTS`. Two stacked work units. Strict TDD: each WU lands specs RED first.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Route shape | ONE top-level grouping `previa`; children `{path:''}` (WU1) + `{path:':role'}` (WU2), both lazy `previa.page` | Matches `plataforma` grouping precedent; pins top-level table to a single `previa`; `/previa` (no segment) needs the `''` child, `:role` cannot be optional in Angular |
| D2 | Prerender derivation | Reuse `prerenderStaticPaths(routes, [PLATFORM_PREFIX])` unchanged; add explicit `previa/:role` entry | Top-level `previa` is auto-kept; `:role` (has `:`) is excluded from static and enumerated explicitly, exactly like `servicios/:slug` |
| D3 | R2 chrome | **ACCEPT** marketing header + footer + sticky CTA | Zero shell change; `/previa` is a public site page, so site chrome reads intentional. Locked by a shell test; reversible in WU2 (add `isPreviewPath` hide in `sticky-cta`) |
| D4 | R1 data path | Page reads fixtures synchronously via a pure selector — **no store, no `await`, no `PendingTasks`** | Zoneless `whenStable` does not track bare store awaits → empty prerender; fixtures are deterministic |
| D5 | Shared role list | Pure module `core/platform/preview/preview-fixtures.ts` (no Angular imports) | Single source for roles + selector; correct layering (app routes + page → core); tree-shakeable in the server bundle |
| D6 | Role source | `PREVIEW_ROLES = ['worker','company','admin']` global list + `resolvePreviewRole` fallback | Spec "shared preview role list"; unknown role → `null` → default view, deterministic |
| D7 | Admin directory | Map `DEMO_ACCOUNTS` → `{userId,email,role}`, drop `password` | Same guard as `MockAdminGateway`; test asserts no `demo1234` in markup |
| D8 | NOINDEX | `data: NOINDEX(...)` on the `previa` parent AND both children; **do not** touch `verify-prerender.ts` `STATIC_PATHS` | `SeoService` removes JSON-LD when `indexable:false`; script only head-checks indexable routes, so previa stays out |
| D9 | Representative entities | Default: first worker/company profile; `worker`→first worker account; `company`→first company account | Deterministic (no random/`Date.now`) → hydration-stable |

## Data Flow

```
BUILD (prerender, Node)
  app.routes.server.ts
    prerenderStaticPaths(routes,[plataforma]) ─▶ { path:'previa', Prerender }        (+1)
    explicit param entry ─────────────────────▶ { path:'previa/:role', Prerender,
                                                   fallback:Client,
                                                   getPrerenderParams:()=>PREVIEW_ROLES.map(role=>({role})) } (+3)
  PreviaPage ──input('role')──▶ resolvePreviewRole ──▶ previewViewModelFor ──▶ fixtures.ts constants
             (pure, sync)                                  │
                                             FEED_POSTS/JOBS/APPLICATIONS/WORKER_PROFILES/
                                             COMPANY_PROFILES/DEMO_ACCOUNTS  → static HTML per role
RUNTIME (client, hydrated)
  PreviaRoleSwitcher (6 DEMO_ACCOUNTS) ─click─▶ SessionService.login(email,'demo1234')
                       ─▶ AUTH_GATEWAY(MockAuthGateway) ─▶ localStorage ─▶ navigate('/plataforma/inicio')
  role links ─▶ plain <a routerLink="/previa/:role"> (prerendered; JS-off safe)
```

## File Changes

| File | Action | WU | Description |
|------|--------|----|-------------|
| `core/platform/preview/preview-fixtures.ts` (+`.spec`) | Create | 1 | `PREVIEW_ROLES`, `PreviewRole`, `resolvePreviewRole`, `previewRoleParams`, `previewViewModelFor` (pure) |
| `pages/previa/previa.page.ts` (+`.spec`) | Create | 1 | `app-previa`: `input('role')` → VM; default + role sections |
| `pages/previa/preview-role-switcher.component.ts` (+`.spec`) | Create | 2 | Client-only demo login + role anchors |
| `app.routes.ts` | Modify | 1,2 | `previa` grouping + `''` (WU1) + `:role` (WU2) |
| `app.routes.spec.ts` | Modify | 1,2 | Exact table, partition, guard/lazy, nav rows |
| `app.routes.server.ts` | Modify | 2 | `previa/:role` Prerender entry |
| `app.routes.server.spec.ts` | Modify | 2 | `+PREVIEW_ROLES.length` + focused param test |
| `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | Modify | 1,2 | `/previa` (+`/previa/worker`) rows; chrome lock |
| `scripts/verify-prerender.ts` | **unchanged** | — | `STATIC_PATHS` keeps previa out (D8) |

## Interfaces / Contracts

```ts
// core/platform/preview/preview-fixtures.ts — pure, no Angular imports
export const PREVIEW_ROLES = ['worker', 'company', 'admin'] as const;
export type PreviewRole = (typeof PREVIEW_ROLES)[number];
export const resolvePreviewRole = (raw: string | null | undefined): PreviewRole | null =>
  PREVIEW_ROLES.includes(raw as PreviewRole) ? (raw as PreviewRole) : null;
export const previewRoleParams = (): readonly Record<string, string>[] =>
  PREVIEW_ROLES.map((role) => ({ role }));
export interface DirectoryRow { userId: string; email: string; role: Role; } // no password
export interface PreviewViewModel {
  role: PreviewRole | null;
  feed: readonly Post[]; jobs: readonly JobOpening[];
  worker: WorkerProfile | null; company: CompanyProfile | null;
  applications: readonly { application: Application; job: JobOpening | null; label: string }[];
  vacancies: readonly JobOpening[]; directory: readonly DirectoryRow[];
}
export const previewViewModelFor = (role: PreviewRole | null): PreviewViewModel => {/*…*/};

// pages/previa/previa.page.ts
readonly role = input<string>();                                    // bound from :role
protected readonly resolvedRole = computed(() => resolvePreviewRole(this.role()));
protected readonly vm = computed(() => previewViewModelFor(this.resolvedRole()));
```

Route entry (top-level, before `**`):

```ts
{ path: 'previa', data: NOINDEX('Modo previa | Constructora Ejemplo', '…'),
  children: [
    { path: '',      data: NOINDEX(…), loadComponent: () => import('./pages/previa/previa.page').then(m => m.PreviaPage) }, // WU1
    { path: ':role', data: NOINDEX(…), loadComponent: () => import('./pages/previa/previa.page').then(m => m.PreviaPage) }  // WU2
  ] }
```

Server entry (WU2): `{ path: 'previa/:role', renderMode: RenderMode.Prerender, fallback: PrerenderFallback.Client, getPrerenderParams: () => Promise.resolve(previewRoleParams()) }`.

## Testing Strategy (Strict TDD — RED first)

| WU | New/changed spec | RED-first assertions |
|----|------------------|----------------------|
| 1 | `preview-fixtures.spec.ts` | role list order; resolver known/unknown/empty; `previewViewModelFor(null)` = feed+open jobs+first worker+first company; determinism (two calls deep-equal); dir rows password-free |
| 1 | `previa.page.spec.ts` | one `<h1>`; default section non-empty **synchronously** (no `whenStable`); `role` input per value renders its section; admin never renders `demo1234`; unknown role → default, no throw; two renders identical |
| 1 | `app.routes.spec.ts` | top-level `[...marketing,'plataforma','previa','**']`; noindex = `['plataforma','previa','**']`; marketing filter excludes `previa`; `previa` + `''` child unguarded/lazy/noindex; nav `/previa`→`app-previa` |
| 1 | `app.release-matrix.spec.ts` | add `/previa` row (images 0, cta false) + chrome-lock: `app-header` not `app-platform-header` |
| 1 | `app.a11y.spec.ts` | add `/previa` to `TARGET_PATHS` |
| 2 | `app.routes.server.spec.ts` | `expectedCount = … + PREVIEW_ROLES.length`; `previa/:role` Prerender + Client fallback + params === `PREVIEW_ROLES` |
| 2 | `app.routes.spec.ts` | nav `/previa/worker`→`app-previa`; `:role` child lazy/noindex/unguarded |
| 2 | `preview-role-switcher.component.spec.ts` | 6 accounts, no password rendered; click → `login(email,'demo1234')` + navigate `/plataforma/inicio`; no `register`; anchors to `/previa/{worker,company,admin}`; render performs no write |
| 2 | `previa.page.spec.ts`, `app.a11y.spec.ts` | switcher present, labelled controls; add `/previa/worker` |

Run: `bunx ng test --watch=false`; gates `bunx ng lint`, `bunx ng build`.

## Work Units

| Unit | Scope | Files | Est. lines | Depends on |
|------|-------|-------|-----------|------------|
| **WU1** | Static `/previa` + sync selector/VM (all role branches) + `/previa` route + route/matrix/a11y specs | `preview-fixtures.*`, `previa.page.*`, `app.routes.ts`, `app.routes.spec.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | ~330–420 | — |
| **WU2** | `:role` browser child + `previa/:role` server param + switcher + server/route specs | `app.routes.ts`, `app.routes.server.ts` (+`.spec`), `app.routes.spec.ts`, `preview-role-switcher.*`, `previa.page.*`, `app.a11y.spec.ts` | ~300–400 | WU1 (needs the `previa` parent, page, selector, roles) |

WU1 is independently revertible (leaves invariant green, no switcher, no `:role`); WU2 reverts to a
static no-switcher `/previa`. Both ≤ 400 lines targeted; WU1 may reach the ceiling if the page
template grows — keep sections compact and reuse `SectionHeadingComponent`.

## Migration / Rollout

No migration. Work lands on `feature/p13-modo-previa`, suffix `(p13-modo-previa)`, no `main` changes.
`contracts/openapi.yaml` untouched; `angular.json` never committed.

## Open Questions

- [ ] **R2 confirm**: accept marketing chrome + sticky CTA on `/previa` (chosen) vs suppress? Suppress
  mechanism if reversed: add `isPreviewPath` and `|| isPreviewPath(url)` in `sticky-cta.shouldHide`.
- [ ] Exact es-AR copy for the preview heading/sections and switcher labels (`tasks` may pin strings).
- [ ] Optional: add a post-build assertion that `/previa/index.html` exists with `noindex` and no
  JSON-LD, **without** joining `verify-prerender.ts` `STATIC_PATHS` (spec currently forbids the latter only).
