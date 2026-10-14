# Exploration: p13-modo-previa — Preview mode (role switcher + static `/previa` showcase)

> Mode: hybrid · Strict TDD (`bunx ng test --watch=false`) · BUN only · `contracts/openapi.yaml` **READ-ONLY** · UI copy es-AR · artifacts/commits English · base `origin/main` @ `bc70c3a` · delivery `ask-on-risk`, chain `stacked-to-main`.
> Exploration only — **no production code written**.

## TL;DR

- **Deliverable is two parts**: (1) a **client-side role switcher** to enter the running platform as any of the 6 fixture accounts without registering; (2) **Camino A** — a dedicated, prerenderable, top-level `/previa` (optionally `/previa/:role`) that renders a **static HTML snapshot** with fixture data, hostable with no app running.
- **Route placement is decisive**: `/previa` MUST be **top-level** (sibling of `plataforma`), never a platform child. Top-level placement is auto-prerendered by `prerenderStaticPaths` and keeps the **"never prerender the platform" invariant green with zero shared-helper or allow-list changes** (`app.server-routes.shared.ts:19-28`, `app.routes.server.spec.ts:90-94`).
- **Biggest feasibility risk (R1)**: the platform pages read data through **async** mock gateways, and this app is **zoneless**. Angular prerender serializes after `ApplicationRef.whenStable`, which in zoneless mode tracks only `PendingTasks` — a bare `await` in a store is **not** tracked. So reusing the store-coupled pages "as-is" **may serialize the `loading`/empty state**. Recommendation: render the snapshot from `src/app/core/platform/mocks/fixtures.ts` **synchronously**.
- **Second risk (R2)**: `/previa` is not `isPlatformPath` → it renders the **marketing chrome** (header/footer/**sticky CTA**) and, if NOINDEX, drops JSON-LD. Both are decisions, not blockers.
- **Spec-despite-NO-data / size**: likely **~350–550 changed lines across ~8–10 files** → **medium/high 400-line budget risk**; forecast 2 work units.
- **Precedent**: `p10-fixtures` deliberately deferred reachability to "Paso 8" (`mocks/fixtures.ts:544-552`; `HANDOFF.md:64-67`). This change closes exactly that gap.

---

## 1. Route placement (Q1)

### Decision: top-level `previa` route (with an optional `previa/:role` param child)

Evidence — the three mechanisms that pin this:

| Mechanism | Code | Consequence for placement |
|---|---|---|
| Prerender derivation | `prerenderStaticPaths(routePaths, excluded)` keeps every non-param, non-wildcard path unless it is under an excluded prefix (`app.server-routes.shared.ts:19-28`); called with `excluded = [PLATFORM_PREFIX]` (`app.routes.server.ts:25-28`) | A **top-level** `previa` is **auto-included → prerendered**. A `plataforma/previa` path would be **excluded → client-only**, defeating the goal. |
| Invariant test | `isPlatform()` = `path === 'plataforma' || path.startsWith('plataforma/')` (`app.routes.server.spec.ts:17-19`); asserted in *"never prerenders the platform subtree"* (`app.routes.server.spec.ts:90-94`) | A **prerendered** `plataforma/**` path **fails** the invariant. Top-level `previa` passes (`isPlatform('previa') === false`). |
| Route table spec | exact top-level equality `[...MARKETING, 'plataforma', '**']` (`app.routes.spec.ts:46-57`) and indexable/noindex partition (`app.routes.spec.ts:77-85`) | Adding a top-level `previa` **requires** editing `app.routes.spec.ts` (unavoidable and expected). |

**Why NOT a platform child without a guard**: (a) it would be inside the excluded subtree → never prerendered; (b) if it were prerendered it directly violates the invariant test; (c) it would inherit the platform chrome/`noindex` convention. None of that matches "public, prerenderable, hostable".

**How to add it without touching the shared helper**: nothing to touch. `app.routes.server.ts:25-28` builds the static prerender set from the browser table; a new top-level `previa` entry flows through automatically. No allow-list exception, no broader helper change.

Per-role static HTML (`/previa/worker`, `/previa/company`, `/previa/admin`, or one per demo account) follows the **existing param pattern** — a browser route `previa/:role` plus an explicit server entry mirroring `servicios/:slug` / `proyectos/:slug` (`app.routes.server.ts:32-43`) with `fallback: PrerenderFallback.Client` and `getPrerenderParams` returning the role list. This is additive; it does not alter `prerenderStaticPaths`.

**Auto-adapting specs (no edit needed)**: `app.routes.server.spec.ts:54-68` derives `expectedCount = STATIC_BROWSER_PATHS.length + services.length + projects.length`; adding `previa` grows both sides equally. `app.server-routes.shared.spec.ts:38-53` derives counts from `BROWSER_PATHS`.

**Specs that MUST change**: `app.routes.spec.ts:46-57` (top-level equality) and `app.routes.spec.ts:77-85` (indexable/noindex lists). **Optionally** add coverage rows to `app.release-matrix.spec.ts:34-53` and `app.a11y.spec.ts:19-35` (explicit lists; they do **not** break automatically).

**Indexability decision**: `/previa` is fictional demo data. Recommend **NOINDEX**. Note `SeoService.apply()` **removes JSON-LD** on `indexable === false` (`seo.service.ts:99-105`). `verify-prerender.ts` checks JSON-LD only for its **hardcoded** `STATIC_PATHS` list (`verify-prerender.ts:26-27`), which does **not** include `previa`, so no verification failure either way. (If `previa` were ever added to that list, it would have to be INDEXABLE.)

---

## 2. Prerender feasibility (Q2)

| Concern | Verdict | Evidence |
|---|---|---|
| Route guards | **Not blocking** — `/previa` carries no `authGuard`/`roleGuard` | guards live per-child in `app.routes.ts:104-183`; top-level marketing routes carry none (`app.routes.ts:24-97`) |
| `localStorage`/session during SSR | **SSR-safe by construction** — `storage()` returns `null` when `localStorage` is undefined, so `SessionService`/`AdminConfigStore` construct with defaults | `session.service.ts:54-61,66`; `admin-config.store.ts:17-24,63` |
| Data for platform pages | **Blocked by session gating** — page `effect`s no-op when `session.currentUser()` is `null`, so stores stay `idle` and nothing renders | `perfil.page.ts:160-167`; `platform-home.page.ts:151-164` |
| Data via mock gateways | **Timing-uncertain** — gateways are `async` over `Promise` (`mock-feed.gateway.ts:13-15`; `mock-jobs.gateway.ts:9-11`); the app is **zoneless**, so `whenStable` tracks `PendingTasks` only, and a bare store `await` is untracked | `core.mjs` `PendingTasks` provided at root (`_pending_tasks-chunk.mjs:3204`); no `PendingTasks` use anywhere in `src` (grep) |
| Existing prerendered pages | use **synchronous** `src/content` only (e.g. `home.page.ts:31-33`), so the async-store pattern is **unproven** in this repo | — |

**SSR-safe data seeding — recommended shape**: keep the snapshot page **synchronous**. Import the fixtures constants directly and render them:

- `FEED_POSTS` (`fixtures.ts:113`), `COMMENTS` (`:244`), `JOBS` (`:338`), `APPLICATIONS` (`:420`), `WORKER_PROFILES` (`:461`), `COMPANY_PROFILES` (`:492`), `DEMO_ACCOUNTS` (`:552`), `paginate` (`:560`).
- These are plain exported arrays — no environment access, no `localStorage`, no promises → deterministic HTML on first render, and hydration-stable (`provideClientHydration`, `app.config.ts:25`).
- If reuse of the store-coupled pages is preferred, wrap each load in `inject(PendingTasks)` + `pendingTasks.run(...)` so `whenStable` waits — **more invasive** and unproven; do not choose this without a spike.

---

## 3. Role switcher (Q3)

**Fixture accounts (6), all `password: 'demo1234'`** (`fixtures.ts:499-542`):

| userId | email | role | profile |
|---|---|---|---|
| `worker-1` | `lucia@demo.test` | worker | `WORKER_PROFILES[0]` Lucía Fernández |
| `worker-2` | `martin@demo.test` | worker | Martín Gómez |
| `worker-3` | `sofia@demo.test` | worker | Sofía Ruiz |
| `company-1` | `norte@demo.test` | company | `COMPANY_PROFILES[0]` Constructora Norte SAC |
| `company-2` | `delta@demo.test` | company | Grupo Delta Construcciones |
| `admin-1` | `admin@demo.test` | admin | (admin area / directory) |

**Two distinct mechanisms — use both, for two distinct jobs:**

1. **Enter the live platform (Part 1, client-only).** A switcher that calls the existing `SessionService.login(email, 'demo1234')` (`session.service.ts:76-81`) then navigates to `/plataforma/inicio`. No new gateway needed: `SessionService` already injects `AUTH_GATEWAY` → `MockAuthGateway`, which resolves `DEMO_ACCOUNTS` (`mock-auth.gateway.ts:17-23,44-53`). This is the only path that satisfies "enter as any demo account without registering". It **must be client-only** (needs `localStorage`).
2. **Static showcase role (Part 2, prerenderable).** Driven by the URL:
   - **Query param** `/previa?role=worker` — `withComponentInputBinding` binds **`queryParams` + `params` + `data`** to component inputs by default (`_router-chunk.mjs:1646` `queryParams ??= true`; `:1676-1682` spreads `queryParams`/`params`/`data`). So an existing `input<Role|null>` such as `feed.page.ts:150`, `platform-home.page.ts:121`, `job-detail.page.ts:99`, `platform-header.component.ts:57` **already accepts** a `role` query param. **But query params are not prerenderable** (Angular's `getPrerenderParams` binds path params only).
   - **Route segment** `/previa/:role` — prerenderable per role via `getPrerenderParams` (see §1). Gives baked per-role HTML that works with JS disabled.

**Recommendation**: role switcher = **client-only** (a small control that (a) links to the prerendered `/previa/:role` pages and optionally (b) logs into the live platform via `session.login`). Per-role static content = **route segments**, so the published snapshot needs no JS to show a chosen role.

---

## 4. Scope of the static showcase (Q4)

| Scope | Content | Routes | Effort |
|---|---|---|---|
| **Minimal viable** | one `/previa` page: feed timeline + jobs board + one worker/company profile card, all from fixtures synchronously; a role link/select | `previa` | Low–Med |
| **Rich (recommended)** | `/previa/:role` (or per account) for `worker` / `company` / `admin`, each with role-specific sections (worker → "Mis postulaciones" from `APPLICATIONS`+`JOBS`; company → "Mis vacantes" filtered by `companyId`; admin → directory from `DEMO_ACCOUNTS`), plus feed + jobs | `previa` + `previa/:role` | Med |

**Role switcher prerendered or client-only?** The **switcher control** is client-only (session/localStorage). Its **links/targets are prerendered** (plain `<a routerLink>`), so the showcase remains navigable and publishable with JS off.

---

## 5. Reuse vs new (Q5)

### Reuse as-is

- **Fixtures / data**: `fixtures.ts` exports (`FEED_POSTS`, `COMMENTS`, `JOBS`, `APPLICATIONS`, `WORKER_PROFILES`, `COMPANY_PROFILES`, `DEMO_ACCOUNTS`, `paginate`) — synchronous, deterministic.
- **Ports & mock gateways**: `ports.ts` tokens + all `mock-*.gateway.ts` (in-memory, no HTTP) — for the client-only switcher path and any hydrated interaction.
- **Auth**: `SessionService` (`login`/`logout`/`role`/`currentUser`) + `AUTH_GATEWAY` → `MockAuthGateway`.
- **Domain**: `domain/models.ts` (`Role`, `User`, profiles, `Page<T>`), `domain/index.ts` barrel.
- **Chrome/presentational**: `PlatformHeaderComponent` (has a `role` input seam, `platform-header.component.ts:57-63`), `platformNavFor()` (`nav.ts`), `applicationStatusLabel` (`application-status.ts`), `SectionHeadingComponent`, `CtaBlockComponent`, `ProjectCardComponent`, `ServiceCardComponent` (marketing look, optional).
- **Stores** (`FeedStore`, `JobsStore`, `ApplicationsStore`, `CommentsStore`, `AdminStore`): reusable **only** if data is guaranteed loaded before serialization (see R1) — treat as *reusable-with-care*, not as-is, for the static snapshot.

### Must create new

- `src/app/pages/previa/previa.page.ts` (+ optional `previa-role.page.ts`) — the static showcase.
- A small synchronous **preview view-model** selector (e.g. `pages/previa/preview-fixtures.ts`) mapping role → fixtures, OR a `PreviewStore` that seeds synchronously from fixtures — keeps the page declarative and testable without async.
- The **role-switcher** control (client-only): either a new block on `login.page.ts` or a dedicated component on the `/previa` page.
- Route entries in `app.routes.ts` (top-level `previa`; optional `previa/:role`) and, for the param route, `app.routes.server.ts`.

### Protected — do NOT touch

- `contracts/openapi.yaml` (READ-ONLY).
- `contract-conformance.ts` — do **not** add `DirectoryUser`/`AdminGateway` (`domain/models.ts:139-150` documents why adding an unschema'd pair breaks `ng build`).
- `angular.json` (never commit).

---

## 6. Risks / unknowns / alternatives (Q6)

### Approaches compared

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| **A. Top-level prerendered `/previa` (+ `/previa/:role`) from synchronous fixtures** *(recommended)* | Truly static/publishable; invariant untouched; no helper change; deterministic + hydration-safe; works without JS | New presentational markup (some duplication of platform look); must update `app.routes.spec.ts`; marketing chrome by default | Med |
| **A′. Same route; reuse store-coupled platform pages + `PendingTasks` around async loads** | Less markup duplication; reuses real pages | Unproven async-in-prerender; touches production stores; risk of empty static HTML; harder to verify | Med–High |
| **B. Client-only switcher, no `/previa` route** | Tiny; no prerender risk; zero shell impact | **Does NOT meet the goal** — cannot be shown/hosted without running the app; not publicable | Low |
| **C. Nest preview under `plataforma/previa`** | Reuses platform chrome | Excluded from prerender; violates the "never prerender the platform" invariant; defeats the purpose | — (rejected) |

**Chosen: A.** B is complementary (it *is* Part 1's switcher) but **not a substitute** for the deliverable; C is structurally wrong.

### Risks / unknowns

- **R1 (HIGH)** — Async store data under zoneless prerender is not guaranteed to be awaited (`whenStable` tracks `PendingTasks`; bare `await` untracked). *Mitigation*: render fixtures synchronously (Approach A); if A′ is chosen, wrap loads in `PendingTasks` and add a prerender **spike** before committing. **This is the one unknown worth de-risking first.**
- **R2 (MED)** — `/previa` is not `isPlatformPath` → marketing header/footer render and the **sticky CTA shows** (`sticky-cta.component.ts:36-38` hides only on `/presupuesto` and platform). Decide: accept marketing chrome, or extend the shell hide rule (touches `platform-paths`/`sticky-cta` + specs).
- **R3 (MED)** — `app.routes.spec.ts:46-57,77-85` **will fail** until updated (exact top-level table + indexable/noindex partition). `app.release-matrix.spec.ts` / `app.a11y.spec.ts` are explicit lists → optional coverage only.
- **R4 (LOW)** — `verify-prerender.ts` `findPlatformArtifacts` scans **relative file paths** for `/plataforma/i` (`verify-prerender.ts:201-213,278-283`). Lazy chunks are hashed (`chunk-<hash>.js`, confirmed in `dist/…/browser`), so reusing platform components on `/previa` will **not** produce a `plataforma`-named artifact. Ensure the `previa` output dir name never contains "plataforma".
- **R5 (LOW)** — NOINDEX removes JSON-LD (`seo.service.ts:99-105`); `verify-prerender` does not check `previa`, so no failure. Do not add `previa` to `verify-prerender`'s `STATIC_PATHS` unless it is INDEXABLE.
- **R6 (MED)** — **400-line budget**: see §7. If both a rich `/previa/:role` showcase and the switcher land together, forecast **2 work-unit commits** / a stacked slice.
- **R7 (LOW)** — `provideClientHydration` re-hydrates `/previa` (`app.config.ts:25`): keep the snapshot deterministic (fixtures are static `createdAt` strings — safe; avoid `Date.now()`/random in templates).

### Open questions

1. **Indexable or NOINDEX** for `/previa`? (Recommend NOINDEX — fictional data.)
2. **Granularity** of the static snapshot: single `/previa`, per **role** (`/previa/:role`, 3 pages), or per **account** (6 pages)?
3. **Chrome**: accept marketing chrome (sticky CTA visible) on `/previa`, or suppress it shell-wide for the preview path?
4. **Reuse depth**: minimal presentational preview components (robust) vs reusing the real platform pages behind a `PendingTasks` spike (richer, riskier)?
5. Should the **live-platform switcher** (Part 1) live on `/plataforma/login` (extend the existing demo-credentials block, `login.page.ts:64-67`) or on `/previa`?

---

## 7. Size estimate (Q7)

| Area | Files | Est. lines |
|---|---|---|
| Preview page(s) | `pages/previa/previa.page.ts` (+ `previa-role.page.ts`) | +120–200 |
| Preview page spec(s) | `pages/previa/*.spec.ts` | +80–140 |
| Synchronous preview selector | `pages/previa/preview-fixtures.ts` | +30–60 |
| Role switcher (component/block) + spec | 1–2 files | +60–140 |
| Route entries | `app.routes.ts` (+`app.routes.server.ts`) | +15–25 |
| Spec updates | `app.routes.spec.ts` (+ optional release-matrix/a11y) | +15–30 |
| **Total** | **~8–10 files** | **~350–550** |

**400-line budget: MEDIUM–HIGH risk** (the rich variant likely exceeds 400). Forecast guard for `sdd-tasks`:
- `Decision needed before apply: Yes`
- `Chained PRs recommended: Yes` (if rich variant) / `No` (if minimal)
- `400-line budget risk: Medium` (minimal) → `High` (rich)

Suggested work units if chained: **WU1** = static `/previa` from synchronous fixtures + route + specs (invariant green); **WU2** = role switcher (client-only login + per-role links) + `/previa/:role` param route + specs.

## Spec-delta decision

**YES — modification.** This is a **new public capability**, not data-only (unlike `p10`). Likely:
- **NEW** `platform-preview` (public, prerenderable showcase + role switcher reachability).
- **MODIFIED** `platform-shell` (route table gains a top-level `previa`; optional `previa/:role`) and **MODIFIED** `server-rendering` (prerender set now includes the public `previa` subtree; invariant re-worded to "platform subtree stays client-only").
- **MODIFIED (light)** `platform-identity` if the switcher exposes the 6 demo accounts on the login screen.

`contracts/openapi.yaml` untouched. Run **proposal → spec → design → tasks** (design should carry the R1 `PendingTasks`-vs-synchronous decision and the R2 chrome decision).

## Ready for Proposal

**Yes** — subject to the 5 open questions; none block a strawman. **De-risk R1 first** (a tiny prerender spike or the synchronous-fixture decision fixes the one real unknown).
