# Exploration: `p1-ssr-prerender` — SSR / prerender + hydration for the marketing site

**Change**: `p1-ssr-prerender` · **Phase**: explore · **Mode**: hybrid (disk + Engram `sdd/p1-ssr-prerender/explore`)
**Verdict up front**: **Option B — build-time prerender only** (`outputMode: "static"` + `provideClientHydration`). It delivers every SEO/social goal of this change, keeps the still-undecided host decision open, and costs one config-level escape hatch to upgrade to hybrid later.

---

## 1. Current render path

### How it builds today

`angular.json` uses `@angular/build:application` with only `browser: "src/main.ts"` — no `server`, no `ssr.entry`, no `outputMode`, no prerender. `src/main.ts` calls `bootstrapApplication(App, appConfig)` in the browser. **Every one of the 10 routes serves the identical `dist/browser/index.html`.**

### What the head actually contains

| Layer | Where | What it writes | When |
|---|---|---|---|
| Static baseline | `src/index.html` | `<title>` (home), `meta description` (home), `og:title`/`og:description`/`og:type` (home values, **same for all 10 routes**), theme-color. **No `og:image`, no `og:url`, no `twitter:card`, no canonical, no robots, no JSON-LD** | Build time |
| Runtime rewrite | `src/app/core/seo/seo.service.ts` | On every `NavigationEnd`: title, description, `og:title`, `og:description`, `robots` (`noindex,nofollow` only on `**`), `link[rel=canonical]` (from `document.location.origin` + `router.url`), one in-place `application/ld+json` (`buildJsonLd`) | Client-side, after JS boots |
| Structured data | `src/app/core/seo/json-ld.ts` | `HomeAndConstructionBusiness` + `GeneralContractor` graph; `image: [site.ogImage.src]` | Called by SeoService |

SeoService is started by `provideAppInitializer(() => inject(SeoService).start())` in `app.config.ts` so the first rewrite isn't missed. All DOM access goes through injected `DOCUMENT` (SSR-compatible pattern by construction).

### What a raw-HTML crawler sees per route

LinkedInBot / WhatsApp / other non-JS scrapers get, for **every** URL including `/servicios/reformas-integrales` and the 404:

- Home `<title>` and home description (the `index.html` values).
- Home `og:title`/`og:description`/`og:type` — **no `og:image` anywhere**, so the unfurl renders without an image.
- Empty `<app-root></app-root>`: **no visible content, no canonical, no robots meta, no JSON-LD**.
- The `**` route's `noindex` never reaches them — it only exists after JS runs.

Googlebot (JS-rendering) sees the correct per-route head after executing Angular — that's why the site "looks fine" in Search Console while social shares look generic.

### Findings discovered during this exploration

1. **`og:image` gap confirmed and worse than stated**: `site.ogImage` (1200×630, `src/content/site.ts:54`) exists and is already consumed by JSON-LD — but **no code path ever writes an `og:image` meta tag** (not `index.html`, not `SeoService`). Same for `og:url` and `twitter:card`. Its `src` points at `https://images.example.com/og-cover.webp` (placeholder — the p0 "image host undecided" open decision).
2. **`SeoService.override()` is dead code**: declared, tested (`seo.service.spec.ts:131`), never called by any page. Consequence: all **6 service detail + 8 project detail pages ship the identical generic title/description** from route `data.seo` (`app.routes.ts:39,55`). Today that's a client-side duplicate-title issue; once prerendered it becomes 14 frozen HTML files with near-identical `<title>`.
3. **Content is a plain-TS graph**: `services` (6 slugs) and `projects` (8 slugs) in `src/content/*.ts` are importable server-side with zero DOM dependency — build-time route enumeration is trivial.
4. **SSR-safety audit of eager code (app initializers run on the server)**: `SeoService` (DOCUMENT-only, safe), `AnalyticsService` (`document.defaultView` null-guarded, `gaMeasurementId: ''` ⇒ `enabled=false`, safe), `ConsentService` (pure signals, **no localStorage anywhere in `src/app`**), `quote.page` `window.open` only inside an event handler (never during render). **No `isPlatformBrowser`/`PLATFORM_ID` usage exists — nothing is browser-guarded today, and nothing currently needs to be.**
5. **Only `photo-gallery.component.html` uses `@defer (on viewport)`** — image content only, placeholders already reserve the final aspect ratio (S6 fix). All text/SEO-relevant copy renders eagerly, so prerendered HTML carries the real copy.

---

## 2. Affected areas

| File | Why |
|---|---|
| `angular.json` | Add `server`, `outputMode`, (A/C: `ssr.entry`), keep budgets |
| `package.json` | Add `@angular/ssr` (A/C also `express`), Bun-only |
| `src/app/app.config.ts` | Add `provideClientHydration()` |
| `src/main.server.ts` *(new)* | Server bootstrap (`BootstrapContext`) |
| `src/app/app.config.server.ts` *(new)* | `provideServerRendering(withRoutes(serverRoutes))` merged over `appConfig` |
| `src/app/app.routes.server.ts` *(new)* | `ServerRoute[]`: render modes + `getPrerenderParams()` from content slugs |
| `server.ts` *(new, A/C only)* | Express + `AngularNodeAppEngine` + `createNodeRequestHandler` — **lives at repo root, outside `src/` ⇒ invisible to `tsconfig.app.json`, `tsconfig.spec.json` and lint patterns until wired** |
| `src/app/core/seo/seo.service.ts` | Write `og:image`/`og:url`/`twitter:card`; make canonical origin explicit (see risk R1) |
| `src/index.html` | Static `og:image` belt-and-braces for the CSR fallback document |
| `tsconfig.json` + `angular.json` lint `lintFilePatterns` | Only if a root `server.ts` is introduced (A/C) |
| `src/app/core/seo/seo.service.spec.ts`, new route-server spec | Head rules + prerender enumeration coverage |

---

## 3. Approaches (Angular 22 mechanics verified against current docs)

All three share the same new scaffolding: `ng add @angular/ssr` style files — `src/main.server.ts`, `src/app/app.config.server.ts` (`provideServerRendering(withRoutes(serverRoutes))`), `src/app/app.routes.server.ts` (`ServerRoute[]` with `RenderMode.Prerender | Server | Client`), plus `provideClientHydration()` in the browser `app.config.ts`. They differ in `outputMode` and whether a runtime Node server exists.

### Option A — full SSR (`outputMode: "server"` + Express `server.ts`)

Every request rendered by Node at request time (`AngularNodeAppEngine`, `RenderMode.Server` for all routes).

- **Pros**: correct head for *any* URL (typos get a real server-rendered 404 with `noindex`); no build-time route enumeration required; head always current.
- **Cons**: **forces a Node host** — the deploy target is an explicit undecided decision carried from p0; cold starts, server ops, patching, observability for a 19-page brochure site; per-request CPU cost; needs a server test story; slowest TTFB of the three.
- **Hosting**: Render / Railway / Fly / VPS / Node-capable PaaS. Static-only hosts (Cloudflare Pages, S3, GH Pages) are out.
- **Build-time cost**: none added (render happens per request).
- **Effort**: Medium-High.

### Option B — build-time prerender only (`outputMode: "static"`, no `ssr.entry`)

`angular.json` gains `server: "src/main.server.ts"` + `outputMode: "static"` — **no `server.ts`, no Express, no Node runtime in production**. `app.routes.server.ts` declares every route `RenderMode.Prerender`; `:slug` routes get their params from content:

```ts
// src/app/app.routes.server.ts (sketch)
{ path: 'servicios/:slug', renderMode: RenderMode.Prerender,
  getPrerenderParams: async () => services.map((s) => ({ slug: s.slug })) },
{ path: 'proyectos/:slug', renderMode: RenderMode.Prerender,
  getPrerenderParams: async () => projects.map((p) => ({ slug: p.slug })) },
```

Unknown paths fall back to `PrerenderFallback.Client` (the builder emits `index.csr.html`); after first paint `provideClientHydration()` hydrates, client navigation stays instant.

- **Pros**: **any static host** — keeps the undecided-host decision open; fastest TTFB, zero ops, cheapest; broken render **fails `bunx ng build`** (the gate catches regressions at build time); identical SEO/social outcome for every *linked* URL; smallest code surface; no server code to test.
- **Cons**: unknown/typo URLs get the CSR fallback document (home title until JS runs — `noindex` arrives late; mitigated by host-level `404.html`, host-dependent); head/content changes require a rebuild (already true — all content lives in `src/content/*.ts` and ships with the code); prerender adds build time.
- **Hosting**: static anywhere (Netlify, Cloudflare Pages, S3+CDN, nginx, GH Pages).
- **Build-time cost**: ~19 page renders (1 + 6 + 1 + 8 + 4 static + home) added to `ng build` — realistically +10–45 s on top of today's build.
- **Effort**: Medium (mostly config; SEO adjustments are the real code work).

### Option C — hybrid (prerender known routes + SSR fallback)

`outputMode: "server"` + `server.ts`, with `app.routes.server.ts` mixing `RenderMode.Prerender` for the 19 known routes and `** → RenderMode.Server` for everything else.

- **Pros**: static speed for known routes **and** a exactly-correct head/404 for every request; the "best of both".
- **Cons**: **inherits A's full hosting lock-in** — the Node server must run in production anyway, so the prerender half buys build speed, not hosting freedom; two render paths to reason about, test and debug; most complex config; highest total effort. For a site with zero per-request data it solves a problem that doesn't exist here.
- **Hosting**: Node required (same as A).
- **Build-time cost**: same prerender cost as B, plus a server bundle.
- **Effort**: High.

### Comparison

| | A: full SSR | B: prerender only | C: hybrid |
|---|---|---|---|
| SEO/social head for linked routes | ✅ | ✅ | ✅ |
| Host freedom (undecided host) | ❌ Node lock-in | ✅ any static host | ❌ Node lock-in |
| Ops burden / cost | Server to run | None | Server to run |
| Unknown-slug 404 correctness | ✅ exact | ⚠️ CSR fallback | ✅ exact |
| Build time impact | none | +19 renders | +19 renders |
| Runtime bundle impact (browser `initial` budget) | hydration only | hydration only | hydration only |
| Server test surface | High | None | High |
| Complexity / effort | Medium-High | Medium | High |
| Upgrade path | — | → C = flip `outputMode` + add `ssr.entry` + `**→Server` | — |

**Hydration budget note (all options)**: `provideClientHydration()` pulls hydration runtime already shipped inside `@angular/platform-browser`/`core` — historically low single-digit kB minified; the transfer-state script is inlined in HTML and does **not** count against the JS budget. Current initial: **381.64 kB vs 450 kB warn / 500 kB error ⇒ ~68 kB headroom**. The server bundle is not covered by the browser `initial` budget. Must be measured at the gate, not assumed.

**Test impact (all options)**: the jsdom/Vitest suite (38 specs / 336 tests) stays valid — it exercises browser components/services, and `SeoService` keeps running on the client. What is *not* covered: a root `server.ts` sits outside `tsconfig.app.json`/`tsconfig.spec.json` `include: ["src/**"]` and outside lint's `lintFilePatterns: ["src/**", ...]` → invisible to type-check, lint and tests until explicitly wired. Worth testing in the *existing* jsdom suite: the prerender route enumeration (pure function over `services`/`projects`). A true "server renders HTML" smoke test needs a Node-environment Vitest config — optional spike, not required for B.

---

## 4. Recommendation: **Option B (prerender only)**

Why for *this* site specifically:

1. **The content never varies per request** — everything is static in `src/content/*.ts`; no auth, no per-user data, `apiUrl` is provisional and unused at render time. SSR's per-request superpower has nothing to spend on.
2. **The host is undecided by explicit decision** — B is the only option that doesn't force that decision early (p0 open decision: deploy target AND image host). A and C both *are* a hosting decision.
3. **The actual goal is met**: non-JS crawlers/unfurls (LinkedIn, WhatsApp) read the prerendered `<head>` and body. Googlebot already executes JS — prerender upgrades everyone *else* to Googlebot's view.
4. **Small team, marketing site**: zero servers to observe, scale or patch; the release gate stays three commands, plus a build that *fails* when a route can't render (a feature, not a bug).
5. **Preserves the escape hatch**: when the host is chosen, going hybrid is a small, known change: `outputMode: "server"` + add `ssr.entry`/`server.ts` + flip `**` to `RenderMode.Server` — no rework of SEO or hydration.

---

## 5. Scope sketch

### Must change

- **New files**: `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts` (render modes + `getPrerenderParams()` enumerating 6 service + 8 project slugs from `src/content`).
- **`angular.json`**: add `"server": "src/main.server.ts"`, `"outputMode": "static"`; keep budgets untouched initially.
- **`package.json`**: `bun add @angular/ssr` (no Express for B). Never touch `bun.lock` by hand.
- **`app.config.ts`**: add `provideClientHydration()` (plain — no `withHttpTransferCache`: the app fetches zero HTTP data at bootstrap, content is bundled).
- **`SeoService` — keep it where it is, running on both sides**: the elegant part of this plan is that the *same* `DOCUMENT` mutations executed during server render are serialized into the prerendered HTML (platform-server serializes head state after render + app stability waits for initial navigation). It then keeps re-applying on client navigations as **progressive enhancement**. Do NOT fork a second "server SEO" implementation — one code path, one source of truth.
  - **Must add**: `og:image` (from `site.ogImage`), `og:url`, recommended `twitter:card` — closes the unfurl gap.
  - **Must fix**: canonical origin. `new URL(router.url, document.location.origin)` during prerender resolves against the *render* origin, not production → risk of publishing `http://localhost/...` canonicals (risk R1). Introduce an explicit canonical origin (e.g. `SITE_URL` via the existing `ENVIRONMENT`/token pattern) with `document.location.origin` as dev fallback.
  - **Should add (recommended, can slice out)**: per-slug title/description for `/servicios/:slug` and `/proyectos/:slug` — derive from `service.name`/`project.title`, using the existing-but-unused `SeoService.override()` hook or prerender-time data. Without it, 14 detail pages freeze with duplicate titles (finding #2).
- **`src/index.html`**: add static `og:image` (+ keep existing og tags) so the CSR fallback document unfurls correctly too; runtime rewrite supersedes it per route — SeoService updates by selector, so **no duplicate meta tags** (it reuses the static nodes rather than appending).
- **JSON-LD**: prerendered for free via the same head path; `buildJsonLd` is already pure and server-safe.
- **Canonical/robots**: robots meta per route already correct (`indexable` in route data); the `**` NOINDEX becomes real for the prerendered 404 output only if a host-level `404.html` is emitted — document as a host-config follow-up, not a blocker.
- **Release gate**: `bunx ng lint` / `bunx ng test --watch=false` / `bunx ng build` unchanged as commands; `ng build` gets slower (+19 renders) and now *is* the render check. Watch the 450 kB warn budget for the hydration delta; add a spec asserting the prerendered route count (19) matches content (guards against a dropped slug).

### Risks (scoped to this change)

| # | Risk | Mitigation |
|---|---|---|
| R1 | Canonical/JSON-LD URL published with prerender origin (`localhost`) | Explicit `SITE_URL` for canonical building; assert absolute prod origin in a spec |
| R2 | Duplicate generic `<title>` frozen into 14 detail pages | Per-slug override via existing `SeoService.override()` (recommended in-scope) |
| R3 | `og:image` points at `images.example.com` placeholder (image host undecided) | Mechanism ships with current `site.ogImage.src`; URL swap is content-only later. Flag: unfurls 404 until then |
| R4 | Hydration CLS (deferred photo gallery) | Placeholders already reserve final aspect ratio (S6); verify prerendered HTML + hydration in the gate |
| R5 | Unknown-slug URLs serve CSR fallback (late `noindex`) | Accept for v1 (no internal links to bad slugs; content spec catches dangling refs); host `404.html` later |
| R6 | Build time grows; a render failure now fails the gate | Net win (fail-fast); measure in first apply slice |
| R7 | If A/C ever chosen, root `server.ts` escapes lint/tsconfig/tests | Note in design: wire `lintFilePatterns` + `tsconfig.server.json` the day `server.ts` appears |

---

## 6. Out of scope (explicitly NOT this change)

- **The 31 `isPlaceholder` content entries** — client data replacement is its own change; prerender must not wait on it (and prerendering placeholder content is fine: it's a content swap + rebuild).
- **Deploy-target and image-host decisions** — B is chosen precisely so neither has to be decided now.
- **og:image asset production** (real 1200×630 photo) — content/asset work; mechanism uses the existing field.
- **Analytics/consent behavior** — audited SSR-safe as-is (finding #4); no logic changes, only "don't break it" coverage.
- **Backend/leads/quote flow** (`apiUrl` provisional, WhatsApp handoff) — untouched.
- **a11y**: axe suite and manual checklist — untouched.
- **Existing SEO spec requirements** (`seo-analytics-performance` 1–7) — must stay green, not be rewritten.
- **New pages, routes, copy, Tailwind/design changes**, zone.js reintroduction, any framework migration.

---

## 7. Ready for proposal

**Yes.** Recommended next phase: **sdd-propose** with Option B as the proposed approach, R1 (canonical origin) and the og:image/og:url/twitter head additions as named scope items, and the per-slug title override flagged as a strongly recommended slice (the orchestrator should ask the user whether it's in or a follow-up — it's the one judgment call with scope impact).
