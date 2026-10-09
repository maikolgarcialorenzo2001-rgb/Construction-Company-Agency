# Tasks: `p2-platform-foundation`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,900–2,400 total |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | S1a → S1b → S2 → S3 → S4 → S5 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

Chain realized as sequential work-unit commit batches on `main` (solo repo, no branches/PRs; apply does not push). S1 split into S1a (routing/prerender) + S1b (chrome) because it exceeds 400 lines.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| S1a | Routes + prerender/noindex + spec deltas (stub pages) | PR 1 | base main; tests with code |
| S1b | Platform chrome + CTA suppression | PR 2 | depends S1a |
| S2 | Domain + W1 `AssertExtends` + ports + mocks + stores | PR 3 | depends S1b |
| S3 | Feed + company composer | PR 4 | depends S2 |
| S4 | Jobs board/detail + applications | PR 5 | depends S3 |
| S5 | Session + guard + auth/profile + demo marks | PR 6 | depends S4 |

## Phase 1 — S1a: routing, prerender exclusion, noindex (red-first)

- [x] 1.1 RED `app.server-routes.shared.spec.ts`: `prerenderStaticPaths(['plataforma','plataforma/trabajos','servicios','plataformas-curso'],['plataforma'])` → `['servicios','plataformas-curso']`.
- [x] 1.2 GREEN `app.server-routes.shared.ts`: add `isWithinPrefix` + `excluded` arg (boundary-exact; keeps `plataformas-curso`).
- [x] 1.3 GREEN `app.routes.server.ts`: pass `[PLATFORM_PREFIX]`; add `{path:'plataforma/**', renderMode:Client}`.
- [x] 1.4 RED `app.routes.server.spec.ts`: no Prerender path under `plataforma`; Client entry covers subtree.
- [x] 1.5 RED `app.routes.spec.ts`: exact paths, `plataforma` before `**`; platform children `indexable:false`; marketing order unchanged.
- [x] 1.6 GREEN: `core/platform/platform-paths.ts` (`PLATFORM_PREFIX`), `nav.ts`; register `plataforma` parent + 6 lazy children in `app.routes.ts`.
- [x] 1.7 GREEN: stub `pages/plataforma/{feed,jobs-list,job-detail,login,registro,perfil,platform-header}` (lazy, OnPush, no HTTP).
- [x] 1.8 RED→GREEN `app.release-matrix.spec.ts`: platform rows `cta:false, images:0`.
- [x] 1.9 Gate S1a: `bunx ng test --watch=false` + `bunx ng lint` + `bunx ng build` + assert `dist/browser/plataforma` absent. Rollback: revert ⇒ today's static marketing site.

## Phase 2 — S1b: chrome switch + CTA suppression

- [x] 2.1 RED `app.spec.ts`/`sticky-cta.component.spec.ts`: on `/plataforma/**` no marketing header/footer/sticky/cta-block; platform-header present.
- [x] 2.2 GREEN `app.ts`+`app.html`: `isPlatform` signal (`toSignal(NavigationEnd)`); render `PlatformHeaderComponent` + "Modo demo" pill on platform.
- [x] 2.3 RED sticky-cta: reuse boundary-exact `isPlatformPath` alongside `/presupuesto`.
- [x] 2.4 GREEN `sticky-cta.component.ts`; platform pages never import `app-cta-block`.
- [x] 2.5 GREEN `layout/header.component.html`: one static "Plataforma" link (`site.nav` stays marketing-only).
- [x] 2.6 Gate S1b: test+lint+build. Rollback: revert ⇒ S1a shell.

## Phase 3 — S2: domain + W1 + ports + mocks + stores

- [x] 3.1 RED `conformance.spec.ts`: `// @ts-expect-error AssertExtends<Schema['FeedPost'],{id:number}>` probe.
- [x] 3.2 GREEN `core/platform/domain/*`: `User/Profile/Post/JobOpening/Application` + DTOs bound by bidirectional `AssertExtends` in `contract-conformance.ts`; ensure included in `tsconfig.app.json` build graph (W1 closure).
- [x] 3.3 GREEN `api/ports.ts`: `Feed/Jobs/Applications/Auth/Profiles` tokens + `providedIn:'root'` mock factories.
- [x] 3.4 GREEN `api/mock-*.gateway.ts` + `mocks/fixtures.ts` (`satisfies readonly Post[]`, `isPlaceholder:true`).
- [x] 3.5 RED store specs: async lands via `.set()`; `detectChanges`+`whenStable` paints (zoneless).
- [x] 3.6 GREEN `store/feed.store.ts`, `store/jobs.store.ts` (signals/computed).
- [x] 3.7 Gate S2: `bunx ng build` proves W1 fails on drift + test+lint. Rollback: revert ⇒ S1 shell, no data layer.

## Phase 4 — S3: feed + composer

- [x] 4.1 RED `feed.page.spec.ts`: timeline renders; loading/empty states.
- [x] 4.2 RED: composer visible only for `company`; absent for `worker`/anonymous.
- [x] 4.3 GREEN `feed.page` wired to `FeedStore`; role-gated composer.
- [x] 4.4 Gate S3: test+lint+build. Rollback: revert ⇒ S2.

## Phase 5 — S4: jobs + applications

- [x] 5.1 RED: board lists openings; detail resolves one; unknown id → not-found state, no error.
- [x] 5.2 RED: apply creates `Application` via `ApplicationsGateway`; status shown.
- [x] 5.3 GREEN `jobs.list.page`, `jobs.detail.page` via `JobsStore`; apply flow.
- [x] 5.4 Gate S4: test+lint+build. Rollback: revert ⇒ S3.

## Phase 6 — S5: session + guard + auth/profile + demo

- [x] 6.1 RED `session.service.spec.ts`: login persists `localStorage`, `computed` role, logout clears; no HTTP.
- [x] 6.2 RED `auth.guard.spec.ts`: anonymous `/plataforma/perfil` → `/plataforma/login`; login/registro open; marketing unguarded.
- [x] 6.3 GREEN `auth/session.service.ts`, `auth/auth.guard.ts`; `canActivate` on protected children only.
- [x] 6.4 GREEN login/registro/perfil pages: visible "DEMO"/"modo demo"; roles `worker|company` only; worker/company profile round-trip via `ProfilesGateway`.
- [x] 6.5 Gate S5: full `bun run gate` (test+lint+build+contract:lint+contract:check). Rollback: revert ⇒ S4.

## Requirement → Task Coverage Map

N = NEW capability; M = MODIFIED. ADDED reqs inside an M capability marked M/A.

| Requirement | Cap | Task(s) |
|---|---|---|
| Platform subtree route table | N | 1.5,1.6,1.7 |
| Chrome + CTA suppression | N | 2.1–2.4 |
| Subtree excluded from prerender | N | 1.1–1.4,1.9 |
| Platform pages noindex | N | 1.5,1.6 |
| Guarded platform children | N | 6.2,6.3 |
| Platform release-matrix rows | N | 1.8 |
| Role model | N | 6.4 |
| Mock session, visibly demo | N | 6.1,6.4 |
| Auth+profiles gateway ports | N | 3.3,3.4,6.4 |
| Profiles round-trip | N | 6.4 |
| Feed gateway port | N | 3.3,3.4,4.3 |
| Feed signals (zoneless) | N | 3.5,3.6,4.1,4.3 |
| Company-gated composer | N | 4.2,4.3 |
| Jobs port + board | N | 3.3,3.4,5.1,5.3 |
| Jobs signal store | N | 3.5,3.6,5.3 |
| Applications flow | N | 5.2,5.3 |
| Complete es-AR route table | M | 1.5,1.6 |
| Header nav + platform entry | M | 2.5 |
| Sticky CTA suppressed on platform | M | 2.3,2.4 |
| End-of-page CTA excluded | M | 2.4 |
| Prerender every public route (exclude platform) | M | 1.1–1.4 |
| Platform render mode Client | M/A | 1.3,1.4 |
| Platform hydration, no transfer cache | M/A | 1.7,1.9,6.5 |
| Platform subtree noindex (robots) | M/A | 1.5,1.6 |
| Frontend compile-time conformance | M | 3.2 |
| Platform domain type bindings | M/A | 3.2 |
