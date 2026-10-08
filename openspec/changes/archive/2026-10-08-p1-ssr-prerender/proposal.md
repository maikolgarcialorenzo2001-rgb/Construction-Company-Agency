# Proposal: `p1-ssr-prerender` — build-time prerender + client hydration for the marketing site

## Intent

Deliver crawlable, shareable head metadata for every known route of the Angular 22 standalone/zoneless es-AR marketing site by switching to build-time prerender (`outputMode: "static"`) with `provideClientHydration()`. Non-JS crawlers and social unfurls (LinkedIn, WhatsApp) must see per-route `<title>`, description, `og:*`, `twitter:card`, canonical, and serialized JSON-LD. This is a config + SEO adjustment, not a re-architecture of the app logic.

## Scope

### In Scope

| Area | Deliverable |
|---|---|
| SSR plumbing | Add `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts`. |
| Build config | `angular.json`: add `server: "src/main.server.ts"`, `outputMode: "static"`. |
| Dependency | `bun add @angular/ssr` (Bun-only). |
| Hydration | Add `provideClientHydration()` to `app.config.ts`. |
| Head completeness | `SeoService`: write `og:image` (from `site.ogImage`), `og:url`, `twitter:card`; canonical origin via explicit `SITE_URL` with `document.location.origin` fallback (fix R1). |
| Static fallback | `src/index.html`: add static `og:image` (belt-and-braces for CSR fallback). |
| Per-slug titles (R2) | For `/servicios/:slug` and `/proyectos/:slug`, derive per-route title/description and apply via `SeoService.override()` (or equivalent) so each detail page gets its own title/description during prerender. Canonical, og:title/og:description follow per-route data. |
| Prerender enumeration | `getPrerenderParams()` in `app.routes.server.ts` enumerates slugs from `src/content` (services/projects). Enumerate all known static routes to produce 19 prerendered HTML files (home + static + services + projects). |
| JSON-LD | Keep existing JSON-LD generation (already pure, server-safe); serialized in prerendered HTML. |
| Release gate | Build is the render check; watch initial budget (hydration delta) — current headroom ~68 kB (381.64 kB vs 450 kB warn). |
| Test guard (light) | Add/adjust a small spec asserting prerender route count matches content to prevent dropped slugs. |

### Out of Scope

| Area | Rationale |
|---|---|
| Full SSR/server runtime (Options A/C) | Host undecided (p0). Explicitly rejected in favor of Option B. |
| Deploy target / image host decisions | Kept open. `og:image` ships using current `site.ogImage.src` (placeholder) — swap is content-only later (R3). |
| Content placeholder replacement (31 `isPlaceholder` entries) | Separate change; prerendering placeholder content is acceptable. |
| Backend/leads/quote flow | Untouched (`apiUrl` provisional). |
| Analytics/consent behavior changes | SSR-safe as-is; no logic changes. |
| a11y manual checklist/axe expansion | Untouched. |
| New pages, routes, copy, Tailwind/design changes, zone.js reintroduction, framework migration | Not this change. |

## Capabilities

### New Capabilities

- **ssr-prerender-plumbing**: server bootstrap/config/routes for Angular SSR (build-time prerender).
- **seo-head-enrichment**: complete `og:*`/`twitter:card` + explicit canonical origin + static fallback.

### Modified Capabilities

- **seo-service**: extend head emission (og:image, og:url, twitter:card) and make canonical origin explicit (env-driven). Add per-slug title/description application for detail routes.
- **build-config** (angular.json): add `server` + `outputMode: "static"`.
- **app-config**: add `provideClientHydration()`.
- **index.html**: add static `og:image` fallback.

## Approach

### Option B (locked)

Build-time prerender only (`outputMode: "static"`, no `server.ts`, no Express, no Node runtime). `app.routes.server.ts` sets `RenderMode.Prerender` for known routes; unknown paths fall back to `PrerenderFallback.Client` (`index.csr.html`) with client hydration. This matches maintainer decision: keep host freedom, smallest surface, build fails on render errors, upgrade path to hybrid trivial.

### Slices (validate/adjust)

| Slice | Scope | Goal |
|---|---|---|
| **1** | Hydration + prerender plumbing green (build outputs static HTML for home). Add server files skeleton, update angular.json (server + outputMode static), `bun add @angular/ssr`, add `provideClientHydration()` to app.config. | `ng build` succeeds; prerender emits home. Baseline stable. |
| **2** | Per-route head correctness: og:image/og:url/twitter:card, SITE_URL canonical, index.html fallback. Update SeoService head emission and canonical origin. | Non-JS crawlers see complete head for prerendered routes; CSR fallback has og:image. |
| **3** | Per-slug detail titles (R2) + JSON-LD serialized correctly. Wire `SeoService.override()` (or prerender-time data) for `/servicios/:slug` and `/proyectos/:slug` using content-derived titles/descriptions. | 14 detail pages freeze with correct per-slug titles/descriptions; canonical/og follow same data. |
| **4** | Release gate hardening: budgets check (measure hydration delta), prerender route count spec (19) matches content, lint/test/build green, document behavior (404 fallback, image host note). | Guardrails in place; clear handoff. |

## Open Decisions

| # | Decision | Status |
|---|---|---|
| OD-1 | SITE_URL source (env var name/token) and where to inject in prod build (fileReplacements or build-time token). Existing `ENVIRONMENT` pattern preferred. | Open (small) |
| OD-2 | When to apply per-slug overrides (call `SeoService.override()` from detail pages on init, or have route data carry derived values). `SeoService.override()` exists and is tested but unused — reuse it. | Open (small) |
| OD-3 | R3: og:image host — accept current placeholder `https://images.example.com/og-cover.webp` now, or swap to real asset/host before merge? Mechanism is independent of host; flagged below. | Open (content/asset) |

## Affected Areas

| File/Path | Change | Notes |
|---|---|---|
| `angular.json` | Modified | Add `"server": "src/main.server.ts"`, `"outputMode": "static"`. Keep budgets. |
| `package.json` | Modified | `bun add @angular/ssr` (Bun-only; never hand-edit `bun.lock`). |
| `src/app/app.config.ts` | Modified | Add `provideClientHydration()`. |
| `src/main.server.ts` | New | Server bootstrap (BootstrapContext). |
| `src/app/app.config.server.ts` | New | `provideServerRendering(withRoutes(serverRoutes))` merged over `appConfig`. |
| `src/app/app.routes.server.ts` | New | `ServerRoute[]` with `RenderMode.Prerender` + `getPrerenderParams()` for services/projects; static routes enumerated. |
| `src/app/core/seo/seo.service.ts` | Modified | Write `og:image`, `og:url`, `twitter:card`; canonical origin via SITE_URL with dev fallback; support per-slug overrides (R2). |
| `src/index.html` | Modified | Add static `og:image` fallback. |
| `src/app/core/seo/seo.service.spec.ts` | Modified (if needed) | Head rules updated; coverage for new meta tags/origin behavior. |
| `src/app/pages/*/detail pages` (services/projects) | Modified (minimal) | Call `SeoService.override()` with per-slug title/description on component init (reuse dead code path) to satisfy R2. |
| `src/app/app.routes.server.spec.ts` (new, light) | New (optional but recommended) | Assert prerender route count matches content (19). |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Canonical/JSON-LD URL published with prerender origin (`localhost`) | High | Med | Introduce explicit `SITE_URL` (env/token, following existing ENVIRONMENT pattern) for canonical building; use `document.location.origin` only as dev fallback. Add spec asserting absolute prod origin when SITE_URL set. |
| R2 | Duplicate generic `<title>` frozen into 14 detail pages | High | Med | **Resolved by scope**: per-slug override via existing `SeoService.override()` (or prerender-time data) for `/servicios/:slug` and `/proyectos/:slug`. Canonical/og follow same per-route data. |
| R3 | `og:image` points at `images.example.com` placeholder (image host undecided) | Med | Low | Mechanism ships with current `site.ogImage.src`; URL swap is content-only later. Flag: unfurls may 404 until host/asset decided. Document in progress/hand-off (OD-3). |
| R4 | Hydration CLS (deferred photo gallery) | Low | Med | Placeholders already reserve final aspect ratio (S6). Verify prerendered HTML + hydration in gate; measure in slice 1–4. |
| R5 | Unknown-slug URLs serve CSR fallback (late `noindex`) | Med | Low | Accept for v1 (no internal links to bad slugs; content spec catches dangling refs). Can add host-level `404.html` later; do not introduce Node runtime. |
| R6 | Build time grows; a render failure now fails the gate | Med | Low | Net win (fail-fast). Measure first apply slice; budget delta tracked. Prerender count small (~19). |
| R7 | If A/C ever chosen later, root `server.ts` escapes lint/tsconfig/tests | Low | Low | Note: wire `lintFilePatterns`, `tsconfig.server.json` (or appropriate includes) the day `server.ts` appears. Not needed for B. |

## Rollback Plan

Additive-only for new files; changes are localized to config + SEO head emission. Revert in reverse order (slices 4→1) via `git revert`/restore. No data migrations. If prerender causes unexpected build regression, revert angular.json outputMode/server and remove server files/hydration changes to return to pure CSR with minimal blast radius.

## Dependencies

- **@angular/ssr** (via `bun add @angular/ssr`; Bun-only).
- **SITE_URL** configuration for canonical (prod). Follow existing `ENVIRONMENT` token/fileReplacement pattern; dev fallback to `document.location.origin`.
- **Content graph**: `src/content/services.ts`, `src/content/projects.ts` must remain importable server-side (no DOM). Already true per exploration.
- **Image host/asset** for `og:image` (OD-3) — not blocking mechanism.

## Success Criteria

- [ ] `bunx ng lint` green
- [ ] `bunx ng test --watch=false` green (existing suite remains valid; 336 tests/38 specs)
- [ ] `bunx ng build` green with `outputMode: "static"`; prerender emits HTML for known routes (~19). Build fails on render errors.
- [ ] Non-JS crawlers see per-route head: title/description, `og:title/og:description/og:type/og:image/og:url`, `twitter:card`, canonical (absolute prod origin), robots, JSON-LD.
- [ ] CSR fallback (`index.csr.html`) has static `og:image`.
- [ ] Per-slug detail pages (`/servicios/:slug`, `/proyectos/:slug`) have correct per-slug titles/descriptions (R2 satisfied).
- [ ] Initial bundle budget respected (<= 450 kB warn / 500 kB error); hydration delta measured and acceptable (headroom ~68 kB baseline).
- [ ] Prerender route count spec guards against dropped slugs.
- [ ] No Node runtime introduced (no `server.ts`, no Express). Static host compatible.