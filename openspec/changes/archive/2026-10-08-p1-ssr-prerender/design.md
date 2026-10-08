# Design: `p1-ssr-prerender` — build-time prerender + client hydration

## 1. Context / Approach

Today every route ships the same `dist/browser/index.html`: non-JS crawlers and unfurls see the home title, no `og:image`/`og:url`/`twitter:card`, no canonical, no JSON-LD (explore §2). **Chosen: Option B — `outputMode: "static"` + `provideClientHydration()`, no Node runtime** (locked). A and C both force the undecided host decision; content never varies per request, so SSR's per-request power has nothing to spend on (explore §3–4). B meets every SEO/social goal for linked URLs, turns render failures into build failures, and keeps the upgrade path open (`outputMode: "server"` + `ssr.entry` + `**→RenderMode.Server`). Satisfies `server-rendering` reqs 1–6 and `seo-analytics-performance` reqs 8–13.

## 2. Architecture / Flow

```
bunx ng build  (angular.json: browser + server="src/main.server.ts", outputMode="static")
  app.config.server.ts ── provideServerRendering(withRoutes(serverRoutes)) over appConfig
  app.routes.server.ts ── 7 static + 2 param paths → RenderMode.Prerender
                           `**` → RenderMode.Client (never prerendered)
        │ per route: bootstrap(App, {...appConfig, ...appConfigServer}, BootstrapContext)
        ▼
  SeoService.start() runs as provideAppInitializer ON THE SERVER (same code path):
  NavigationEnd → apply() mutates injected DOCUMENT head (title, description, robots,
  canonical, og:*, twitter:card, one JSON-LD script)
        │ platform serializes <head> after router + render stability
        ▼
  dist/browser/<route>/index.html ×21  +  index.csr.html
        │ browser boot
        ▼
  provideClientHydration() attaches to existing DOM (head preserved);
  SeoService re-applies identical values in place on client NavigationEnd → progressive
  enhancement, selector-based reuse ⇒ no duplicate nodes (Req 8/11/12)
```

**One code path, no SEO fork**: `SeoService` touches only injected `DOCUMENT`; app initializers and router events run during prerender; Angular waits for initial navigation before stability, so the head serializes for free (explore §4). `provideClientHydration()` plain — no `withHttpTransferCache` (zero HTTP at bootstrap, content is bundled).

Angular 22 wiring (verified against angular.dev):

| File | Action | Content |
|---|---|---|
| `src/main.server.ts` | Create | default export `(ctx: BootstrapContext) => bootstrapApplication(App, {...appConfig, ...appConfigServer}, ctx)` — NG0401 otherwise |
| `src/app/app.config.server.ts` | Create | `provideServerRendering(withRoutes(serverRoutes))` merged over `appConfig` |
| `src/app/app.routes.server.ts` | Create | `ServerRoute[]` per §4; imports params helper from shared module |
| `src/app/app.server-routes.shared.ts` | Create | pure enumeration helpers (`slugParams`, static-path derivation) — importable by jsdom specs **without** pulling `@angular/ssr` |
| `angular.json` | Modify | build options: `"server"`, `"outputMode": "static"`; budgets untouched |
| `package.json` | Modify | `bun add @angular/ssr` (only dep added; never hand-edit `bun.lock`) |
| `src/app/app.config.ts` | Modify | add `provideClientHydration()` |
| `src/app/core/seo/seo.service.ts` | Modify | §3: og:image/og:url/twitter:card + SITE_URL origin |
| `src/app/environments/*` | Modify | `siteUrl` on model + 3 variants (§3 OD-1) |
| `src/index.html` | Modify | static `og:image` fallback (Req 11) |
| detail pages ×2 | Modify | `SeoService.override()` call (§3 OD-2) |
| `scripts/verify-prerender.ts` | Create | post-build dist assertions (§5) |

## 3. Resolved Open Decisions

**OD-1 / R1 — SITE_URL**: extend the existing `ENVIRONMENT` token pattern: add `siteUrl: string` to `Environment` (`environment.model.ts`); `environment.ts` (prod baseline) and `environment.prod.ts` carry the absolute origin `https://constructora-ejemplo.com.ar` (PROVISIONAL, same RFC-style posture as `apiUrl`; json-ld.spec already uses this origin); `environment.development.ts` carries `''`. `SeoService` injects `ENVIRONMENT` and computes `origin = siteUrl.trim() || document.location.origin` — dev falls back to `document.location.origin` (Req 9), prerender/prod never sees localhost. Guards: unit spec asserts prod variants are absolute http(s) and not localhost; verify script greps `dist/` for `localhost` (must be absent). If someone blanks prod `siteUrl`, the dist grep still fails the gate (belt and braces). Value swap later = one-line content change.

**OD-2 / R2 — override call site**: the detail components (`ServiceDetailPage`, `ProjectDetailPage`) inject `SeoService` and call `override()` reacting to their bound `slug` input (constructor `effect()`), resolving the entry via `findService`/`findProject` from `src/content/lookup.ts`: title = `` `${entry.name | entry.title} | ${site.nap.name}` `` pattern, description = `entry.summary` / `entry.brief`. `override()` self-applies, so the head converges whether the call lands before or after `NavigationEnd`; `NavigationStart` clears stale overrides between navigations (existing behavior, unchanged). Generic route `data.seo` stays as fallback (unknown-slug detail renders 404 component without a bogus override). Reuses the tested-but-dead `override()` path — no second SEO mechanism.

**og serialization**: `SeoService.apply()` additionally writes `og:image` = `site.ogImage.src`, `og:url` = canonical URL, `twitter:card` = `summary_large_image`, each via the existing `setMeta` in-place reuse (exactly one node, Req 8). `og:type` already ships statically in `index.html` and survives prerender. `src/index.html` gains the static `og:image` (absolute `site.ogImage.src`) so the CSR fallback unfurls pre-JS (Req 11); the runtime write finds and updates that node — no duplicates. JSON-LD: `buildJsonLd(site, url)` already pure; `url` now comes from SITE_URL (Req 9/12).

## 4. Route Enumeration (Req 1, R5)

- **Static entries**: derive from the browser route table — paths without `:` other than `**` (`''`, `servicios`, `proyectos`, `proceso`, `testimonios`, `nosotros`, `presupuesto`) each get `{ path, renderMode: RenderMode.Prerender }`; the builder emits `<path>/index.html`.
- **Param entries**: `{ path: 'servicios/:slug', renderMode: Prerender, fallback: PrerenderFallback.Client, getPrerenderParams: () => slugParams(services) }`, same for `proyectos/:slug` with `projects`. `slugParams` is a pure map over `src/content` (6 + 8 slugs today). `fallback: Client` is **required**: the default is `PrerenderFallback.Server`, which needs a runtime static mode doesn't have (verified in angular.dev API).
- **`**` → `RenderMode.Client`**: never prerendered (Req 1) and drives emission of `index.csr.html` (Req 4) — the document static hosts serve for unknown paths (host mapping = follow-up).
- **Count guard never literal**: expected set = non-param browser routes + `services.length` + `projects.length`, computed inside the spec (21 today; a new content entry passes with zero spec edits). Dist-level equivalent derives the same way in the verify script.
- **Accepted limitation (R5, v1)**: unknown slug serves the CSR shell with home head until JS applies `noindex`; no internal link produces one; no Node runtime allowed to do better.

## 5. Testing Strategy (mapped to spec verification)

| Layer | Covers | Approach |
|---|---|---|
| jsdom suite (existing 336 tests stay green) | Req 6, 13 | `bunx ng test --watch=false` unchanged; axe + analytics/consent specs untouched |
| jsdom: enumeration guard (Req 1) | `getPrerenderParams` vs content-derived expectation via `app.server-routes.shared.ts`; plus static-path set vs browser routes minus `**` | pure-function spec, no server platform import |
| jsdom: head units (Req 9, 10, 11) | `SeoService` with `SITE_URL` set/unset; detail pages assert `override()` receives content-derived values; extend `app.document.spec.ts` for static `og:image`; env-prod guard spec | existing patterns (`app.document.spec.ts` already reads files with `node:fs`) |
| post-build: `scripts/verify-prerender.ts` (Req 8, 9-dist, 10-dist, 11, 12, 1/4-file) | walks `dist/browser`, derives expected paths from `src/content`, asserts per-route head (title/description/robots/canonical/og:*/twitter:card exactly once, og:image = `site.ogImage.src`), absolute non-localhost canonical, valid JSON-LD with absolute url, per-slug title distinctness + `title == og:title`, `index.csr.html` + its `og:image`, no `localhost` anywhere | **Chosen: standalone Bun TS script, run after `bunx ng build` in the gate.** Justification: `dist/` doesn't exist when `ng test` runs — a jsdom spec would skip or false-green; a second vitest Node project adds config and splits the suite; Bun runs TS natively (Bun-only constraint) and imports `src/content` directly, so no hardcoded counts. Exits non-zero ⇒ gate (Req 3) |
| Gate | `bunx ng lint` → `bunx ng test --watch=false` → `bunx ng build` → `bun scripts/verify-prerender.ts`; build delta + initial-bundle size recorded (baseline 381.64 kB vs 450 kB warn; hydration expected low single-digit kB — measured, not assumed, Req 6/R6) | commands unchanged, one appended step |
| Hydration smoke (Req 2) | headless serve of `dist/`: no hydration errors, head identical pre/post boot | verify phase (mechanism guaranteed by §2; asserted in verify) |

Flag for tasks: `scripts/` sits outside `src/**` lint/tsconfig patterns — wire `lintFilePatterns` (+ minimal tsconfig) or accept untyped-script tradeoff; decide at task time (echoes R7 lesson).

## 6. Slices (refined from proposal; 400-line PR budget each)

| Slice | Deliverable | Key files | Gate | Rollback |
|---|---|---|---|---|
| **1** Plumbing + hydration green | static prerender emits full route set; enumeration guard lands with the code it protects | `angular.json`, `package.json`, `main.server.ts`, `app.config.server.ts`, `app.routes.server.ts`, `app.server-routes.shared.ts` (+guard spec), `app.config.ts` | build green, all expected files + `index.csr.html` present, baseline/budget + build-time delta recorded (R6) | revert → pure CSR (remove server files, `outputMode`, hydration) |
| **2** Head completeness | og:image/og:url/twitter:card, SITE_URL canonical, static `index.html` og:image | `seo.service.ts` + spec, `environments/*` + guard spec, `index.html`, `app.document.spec.ts` | jsdom green; sample dist heads complete, no `localhost` | revert; plumbing stays |
| **3** Per-slug heads (R2) | detail pages override with content-derived values | `service-detail.page.ts`, `project-detail.page.ts` + specs | unit: distinct overrides; dist: distinct frozen titles (checked by script in slice 4 — spot-check manually here) | revert; generic titles return (status quo) |
| **4** Gate hardening | dist verify script, lint wiring, behavior notes | `scripts/verify-prerender.ts`, `angular.json` lint patterns, progress/hand-off notes | full gate green end-to-end; budget delta documented | revert script; slices 1–3 unaffected |

Data/config exceptions to the 400-line rule: none material — env values are one-liners; the verify script (~150–200 lines) is the largest single file and still fits.

## 7. Risks (design status)

| # | Status | Design mitigation |
|---|---|---|
| R1 localhost canonical | **Resolved** (OD-1) | `Environment.siteUrl` + dev fallback + env guard spec + dist `localhost` grep |
| R2 duplicate detail titles | **Resolved by scope** (OD-2) | `override()` from content via `lookup.ts`; distinctness asserted dist-side |
| R3 placeholder og:image host | **Mechanism complete, value placeholder** | ships `site.ogImage.src` as-is; swap = content-only; unfurls may 404 — documented, non-blocking (OD-3 stays content decision) |
| R4 hydration CLS | **Measured, not assumed** | aspect-ratio placeholders already in place (S6); CLS + hydration smoke asserted in verify phase |
| R5 unknown-slug CSR fallback | **Accepted for v1** | `PrerenderFallback.Client` + `**→Client` by design; late `noindex` accepted; host `404.html` follow-up |
| R6 build-time growth | **Measured in slice 1** | delta vs baseline recorded at first apply slice; fail-fast is the feature (Req 3) |
| R7 root `server.ts` escaping lint | **N/A for B** | upgrade path note: wire `lintFilePatterns` + `tsconfig.server.json` the day `server.ts` exists |

## 8. Out of Scope / Follow-ups

Host-level `404.html` (map to `index.csr.html` or a custom noindex page) · real og:image asset + image host (OD-3) · real production domain swap for `siteUrl` (one line) · A→C upgrade path (flip `outputMode`, add `ssr.entry`/`server.ts`, `**→RenderMode.Server`, wire lint/tsconfig for root server file) · 31 `isPlaceholder` content replacements · backend/leads flow · analytics/consent logic · a11y expansion · new pages/copy/design.
