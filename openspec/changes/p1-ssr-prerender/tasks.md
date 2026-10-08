# Tasks: `p1-ssr-prerender` — build-time prerender + client hydration

**Change:** `p1-ssr-prerender` (project: `construction-company-agency`)  
**Mode:** Option B `outputMode: "static"`, NO Node runtime; `provideClientHydration()`  
**Delivery strategy:** `ask-on-risk` (Review Workload Forecast is decision gate before apply)  
**Constraints:** Bun-only (`bunx ng ...`, `bun add`); never hand-edit `bun.lock`; strict TDD (RED→GREEN→gate); 3-command gate per slice (`bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build`); route count derived from `src/content` everywhere; dist assertions in post-build Bun script; scripts/ sits outside `src/**` lint/tsconfig patterns — wiring decided in Slice 4.

## Slice 1: Plumbing + hydration green (independent work unit, ≤ ~400 changed lines expected)
**Goal:** Static prerender plumbing emits full route set; enumeration guard lands with the code it protects; hydration wired. Build green with `index.csr.html` present.  
**Dependencies:** None (first).  
**PR size target:** ~S–M; flag if >400 (data/config-dominant: No).

### T1.1 — Add Angular SSR deps and build config (plumbing)
- **ID:** T1.1
- **Description:** Add `@angular/ssr` via Bun; update `angular.json` build options to include `server: "src/main.server.ts"` and `outputMode: "static"`. Budgets untouched. 
- **Files touched:** `package.json`, `angular.json`
- **TDD step (RED test first):** N/A (config/deps). Add a light jsdom guard spec in T1.3 that will fail until server routes exist; no unit test required for build config itself. 
- **Work-unit commit message:** `feat(build): add @angular/ssr and enable static prerender in angular.json (p1-ssr-prerender)`
- **Acceptance criteria (tied to spec reqs):**  
  - [x] Req 1,5: `bun add @angular/ssr` recorded (Bun-only); `angular.json` has `server` and `outputMode: "static"`; no root `server.ts` added yet (Req 5).  
  - [x] Req 3: build config valid (will be exercised by T1.4).  
- **Effort:** S

### T1.2 — Add server bootstrap + server config + server routes + shared helpers
- **ID:** T1.2
- **Description:** Create `src/main.server.ts` (default export `(ctx: BootstrapContext)=>bootstrapApplication(...)`), `src/app/app.config.server.ts` (`provideServerRendering(withRoutes(serverRoutes))` merged over `appConfig`), `src/app/app.routes.server.ts` (ServerRoute[]: 7 static + 2 param paths with RenderMode.Prerender; `**` → RenderMode.Client; param entries use `getPrerenderParams: () => slugParams(...)` and `fallback: PrerenderFallback.Client` per design), `src/app/app.server-routes.shared.ts` (pure helpers: `slugParams`, static-path derivation) importable without `@angular/ssr`. 
- **Files touched:** `src/main.server.ts` (new), `src/app/app.config.server.ts` (new), `src/app/app.routes.server.ts` (new), `src/app/app.server-routes.shared.ts` (new)
- **TDD step (RED test first):** Write `src/app/app.server-routes.shared.spec.ts` (jsdom, pure) that asserts slugParams derived from `src/content/services` and `src/content/projects` (lengths) and that static-path set equals browser routes minus `**`. This MUST fail before implementation (no hardcoded 19). 
- **Work-unit commit message:** `feat(ssr): add server bootstrap, server config, server routes and shared enumeration helpers (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 1: server routes enumerate all public routes; `**` not prerendered; param entries specify `fallback: PrerenderFallback.Client` (R5).  
  - [x] Req 5: no Node server framework artifacts introduced.  
  - [ ] RED→GREEN for shared enumeration spec.  
- **Effort:** M

### T1.3 — Enumeration guard spec (content-derived count)
- **ID:** T1.3
- **Description:** Add/extend jsdom spec asserting prerender route count matches content-derived expectation (non-param browser routes + services.length + projects.length) via `getPrerenderParams()` and shared helpers. Ensures guard fails if derivation broken. 
- **Files touched:** `src/app/app.routes.server.spec.ts` (new or extended)
- **TDD step (RED test first):** Create this spec now (or before T1.2 finalization) expecting content-derived count; it will fail until T1.2 complete. 
- **Work-unit commit message:** `test(ssr): add content-derived prerender route count guard (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 1 (Scenario: Enumeration guard): spec passes without edits when content changes (uses derived values).  
  - [x] Req 1 (Scenario: Complete prerender set): count derived from route table + `src/content`, never literal.  
- **Effort:** S

### T1.4 — Wire hydration + build smoke + budget baseline
- **ID:** T1.4
- **Description:** Add `provideClientHydration()` to `src/app/app.config.ts`. Run build smoke: `bunx ng build`. Record build-time delta vs baseline (381.64 kB initial bundle) and confirm `dist/browser` contains expected files including `index.csr.html`. Execute full gate for Slice 1: `bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build`. 
- **Files touched:** `src/app/app.config.ts`
- **TDD step (RED test first):** N/A (integration). Existing suite must remain green (Req 6). 
- **Work-unit commit message:** `feat(app): enable client hydration; verify static prerender plumbing (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 2: hydration enabled via `provideClientHydration()`.  
  - [x] Req 1,4: build emits prerendered files for known routes (count matches) and `index.csr.html` present.  
  - [x] Req 3,6: gate passes; initial bundle ≤ 450 kB warn / 500 kB error; build-time delta recorded vs 381.64 kB baseline (R6).  
- **Effort:** S

**Slice 1 total changed lines (estimate):** ~150–220 LOC (config + 4 new server files + 1–2 specs). **≤400?** Yes. **Data/config-dominant?** Config-heavy (angular.json/package.json + server wiring) but still ≤400.

## Slice 2: Head completeness (independent work unit, ≤ ~400)
**Goal:** og:image/og:url/twitter:card, SITE_URL canonical, static `index.html` og:image; env model + guards; SeoService head enrichment.  
**Dependencies:** Slice 1 (plumbing present).  
**PR size target:** S–M. **Data/config-dominant?** Yes (env files + small service changes + specs). Expected ≤400.

### T2.1 — Environment model + SITE_URL wiring (OD-1)
- **ID:** T2.1
- **Description:** Extend `Environment` model to include `siteUrl: string`. Update `environment.ts`, `environment.prod.ts`, `environment.development.ts` per design (prod absolute `https://constructora-ejemplo.com.ar` provisional; dev empty). Add env guard unit spec asserting prod variants absolute http(s), non-localhost. 
- **Files touched:** `src/environments/environment.model.ts`, `src/environments/environment.ts`, `src/environments/environment.prod.ts`, `src/environments/environment.development.ts`, `src/environments/environment.guard.spec.ts` (new or extended)
- **TDD step (RED test first):** Write env guard spec expecting prod `siteUrl` absolute and != localhost; dev may be empty. Must fail before implementation. 
- **Work-unit commit message:** `feat(env): add siteUrl to Environment and set prod/dev values with guards (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 9 (Scenarios): follows `ENVIRONMENT` token pattern (fileReplacements unchanged).  
  - [ ] Guard spec RED→GREEN (belt-and-braces).  
- **Effort:** S

### T2.2 — SeoService: og:* / twitter:card / SITE_URL origin + head reuse
- **ID:** T2.2
- **Description:** Modify `SeoService` to write `og:image` (from `site.ogImage`), `og:url`, `twitter:card = summary_large_image` in addition to existing tags; compute canonical/og:url from `SITE_URL` with `origin = siteUrl.trim() || document.location.origin` (dev fallback); ensure in-place reuse (no duplicates). Keep JSON-LD `url` absolute via same origin (Req 9/12). 
- **Files touched:** `src/app/core/seo/seo.service.ts`, `src/app/core/seo/seo.service.spec.ts` (extended as needed)
- **TDD step (RED test first):** Extend unit specs to assert `og:image`, `og:url`, `twitter:card` written once; dev fallback uses `document.location.origin`; prod uses `SITE_URL`. Must fail before implementation. 
- **Work-unit commit message:** `feat(seo): enrich head with og:* and twitter:card; add SITE_URL origin (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 8: complete social head written; `og:image == site.ogImage.src`; each appears once (in-place rewrite).  
  - [x] Req 9: absolute canonical/og:url/JSON-LD url from SITE_URL in prod; dev fallback to `document.location.origin`.  
  - [x] Req 12: head completeness preserved (JSON-LD absolute).  
  - [ ] RED→GREEN for SeoService specs.  
- **Effort:** M

### T2.3 — Static og:image fallback in index.html
- **ID:** T2.3
- **Description:** Add static `og:image` (`site.ogImage.src` value) beside existing og tags in `src/index.html` so CSR fallback unfurls without JS; runtime write must supersede without duplicates (verified in T2.4/T4). 
- **Files touched:** `src/index.html`
- **TDD step (RED test first):** Extend `app.document.spec.ts` to assert static `og:image` present and non-empty (and post-boot still exactly one). Must fail before implementation. 
- **Work-unit commit message:** `feat(seo): add static og:image fallback to index.html (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 11 (Scenario: CSR fallback unfurls): static `og:image` present in `index.html`.  
  - [x] Req 8 duplication guard: runtime supersedes without duplicates (tested).  
- **Effort:** S

### T2.4 — Head units + document specs + slice gate
- **ID:** T2.4
- **Description:** Extend `app.document.spec.ts` to cover static `og:image`, no-duplication after boot, and head consistency. Run full Slice 2 gate: `bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build`. Verify sample heads conceptually (dist checks land in Slice 4). 
- **Files touched:** `src/app/app.document.spec.ts` (extended)
- **TDD step (RED test first):** Specs from T2.2–T2.3 must be RED before their implementations; now GREEN gate. 
- **Work-unit commit message:** `test(seo): add head completeness and duplication specs; gate slice 2 (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 8–9,11: all unit specs GREEN.  
  - [x] Req 6,13: existing suite green; lint/test/build GREEN for slice.  
- **Effort:** S

**Slice 2 total changed lines (estimate):** ~120–180 LOC (env files small + service + specs + index.html). **≤400?** Yes. **Data/config-dominant?** Yes.

## Slice 3: Per-slug heads (R2) (independent work unit, ≤ ~400)
**Goal:** Detail pages (`/servicios/:slug`, `/proyectos/:slug`) call `SeoService.override()` with content-derived values so each prerendered detail has per-slug title/description; canonical/og follow. Distinctness asserted.  
**Dependencies:** Slice 2 (SeoService enriched).  
**PR size target:** S–M. **Data/config-dominant?** No (logic minimal). Expected ≤150.

### T3.1 — ServiceDetailPage override (OD-2)
- **ID:** T3.1
- **Description:** Inject `SeoService` into `ServiceDetailPage`; in constructor `effect()` react to bound `slug` input, resolve via `findService` from `src/content/lookup.ts` (or existing lookup), call `SeoService.override({ title: \`${entry.name} | ${site.name}\`, description: entry.summary, ... })` with per-slug values. Clear/stale behavior unchanged (NavigationStart clears). 
- **Files touched:** `src/app/pages/servicios/service-detail/service-detail.page.ts`
- **TDD step (RED test first):** Add jsdom unit spec for `ServiceDetailPage` asserting `SeoService.override()` called with content-derived title/description when slug set (mock/spy). Must fail before implementation. 
- **Work-unit commit message:** `feat(pages): apply per-slug SEO override for service detail (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 10 (Scenarios): override uses content-derived values; generic route title not frozen.  
  - [x] Canonical/og:url follow per-slug URL (via SeoService + override path).  
  - [x] RED→GREEN.  
- **Effort:** S

### T3.2 — ProjectDetailPage override (OD-2)
- **ID:** T3.2
- **Description:** Same as T3.1 for `ProjectDetailPage`: inject `SeoService`, effect on `slug`, resolve via `findProject`, call `override()` with `entry.title/name` and `entry.brief/summary` per existing content shape. 
- **Files touched:** `src/app/pages/proyectos/project-detail/project-detail.page.ts`
- **TDD step (RED test first):** Add spec asserting override called with content-derived values for project slug. Must fail before implementation. 
- **Work-unit commit message:** `feat(pages): apply per-slug SEO override for project detail (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 10: per-slug head on detail pages.  
  - [x] RED→GREEN.  
- **Effort:** S

### T3.3 — Slice gate + distinctness coverage
- **ID:** T3.3
- **Description:** Ensure unit specs cover distinctness conceptually (two different slugs produce different override args). Run full Slice 3 gate: `bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build`. 
- **Files touched:** (spec files added in T3.1–T3.2)
- **TDD step (RED test first):** Specs RED before implementations; now GREEN. 
- **Work-unit commit message:** `test(pages): add per-slug override specs and gate slice 3 (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [x] Req 10: override specs GREEN; existing suite green.  
  - [x] Gate passes; no regressions (Req 6,13).  
- **Effort:** S

**Slice 3 total changed lines (estimate):** ~70–120 LOC (page changes + specs). **≤400?** Yes. **Data/config-dominant?** No.

## Slice 4: Gate hardening (verify script + lint wiring + end-to-end assertions) (independent work unit)
**Goal:** Create post-build Bun script `scripts/verify-prerender.ts` that derives expected paths from `src/content`, asserts per-route head (title/description/robots/canonical/og:*/twitter:card exactly once, og:image == site.ogImage.src), absolute non-localhost canonical, valid JSON-LD with absolute url, per-slug title distinctness + title==og:title, `index.csr.html` + its og:image, no `localhost` anywhere. Decide and wire `scripts/` lint/tsconfig handling (outside `src/**` patterns) — state decision in implementation notes and in commit. Append script run to gate.  
**Dependencies:** Slices 1–3 (full build+head in place).  
**PR size target:** S–M (script ~150–200 lines). **Data/config-dominant?** Config/tooling (script + lint wiring). Expected ~150–220 LOC. **≤400?** Yes.

### T4.1 — Decide and wire scripts/ lint/tsconfig
- **ID:** T4.1
- **Description:** Decide how `scripts/verify-prerender.ts` is linted/typechecked (e.g. add `lintFilePatterns` include for `scripts/**/*.ts` in `angular.json`, or minimal `tsconfig.scripts.json` and reference) — `scripts/` sits outside `src/**`. Implement the minimal wiring consistent with repo style (Bun-only). 
- **Files touched:** `angular.json` (lint patterns) and/or `tsconfig.scripts.json` (new minimal) as decided
- **TDD step (RED test first):** N/A (tooling). 
- **Work-unit commit message:** `chore(lint): wire scripts/ for linting/typecheck (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [ ] Decision recorded in commit body; lint passes on `scripts/verify-prerender.ts`.  
  - [ ] No change to `bun.lock`.  
- **Effort:** S

### T4.2 — Post-build verify script (content-derived)
- **ID:** T4.2
- **Description:** Create `scripts/verify-prerender.ts` (Bun TS). Import `src/content/services`, `src/content/projects` and derive expected set: non-param browser routes + services.length + projects.length (never hardcoded 19/21). Walk `dist/browser`, assert per-route files exist, parse heads: title/description/robots/canonical/og:title/og:description/og:type/og:image/og:url/twitter:card each exactly once; `og:image == site.ogImage.src`; canonical absolute http(s), no `localhost`; JSON-LD valid, has absolute `url`; per-slug titles distinct and `title==og:title`; `index.csr.html` exists with og:image non-empty; grep no `localhost` in `dist/`. Exit non-zero on failure. 
- **Files touched:** `scripts/verify-prerender.ts` (new)
- **TDD step (RED test first):** N/A (post-build integration script). Test by running against fresh build after Slices 1–3 (will fail until all in place) — RED phase is “script fails when assertions missing”. 
- **Work-unit commit message:** `feat(verify): add content-derived post-build prerender assertions (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [ ] Req 1,4,8–12: all dist assertions implemented (content-derived).  
  - [ ] Req 3: script exits non-zero on failure (render gate).  
  - [ ] Req 9: `localhost` grep fails build.  
  - [ ] Uses Bun (native TS).  
- **Effort:** M

### T4.3 — End-to-end gate + final verification
- **ID:** T4.3
- **Description:** Update gate to include script: `bunx ng lint` && `bunx ng test --watch=false` && `bunx ng build` && `bun scripts/verify-prerender.ts`. Run full end-to-end. Measure/confirm budget delta recorded (R6), CLS/head stability noted (R4), Req 13 satisfied by existing suite. 
- **Files touched:** (no code change except script; document behavior in commit)
- **TDD step (RED test first):** Existing suite must remain green (Req 13). 
- **Work-unit commit message:** `test(verify): run full gate with post-build prerender checks (p1-ssr-prerender)`
- **Acceptance criteria:**  
  - [ ] Req 3,6,8–13: full gate GREEN end-to-end.  
  - [ ] Req 1,4,5: file inventory satisfied; no server runtime artifacts (Req 5).  
  - [ ] Hydration delta measured vs baseline (recorded).  
- **Effort:** S

**Slice 4 total changed lines (estimate):** ~150–200 LOC (script + lint wiring). **≤400?** Yes. **Data/config-dominant?** Yes.

## Coverage Map: every spec requirement → task ids (no orphans)

| Spec | Req ID | Requirement summary | Covered by | Notes |
|---|---|---|---|---|
| server-rendering | Req 1 | Prerender every public route at build; `**` NOT prerendered; enumeration derived from route table + `src/content`; guard fails if broken | T1.1–T1.4, T2.4, T4.2–T4.3 | Shared helpers (T1.2), count guard (T1.3), build smoke (T1.4), dist checks (T4.2) |
| server-rendering | Req 2 | Hydration reuses prerendered DOM; preserves prerendered head | T1.4, T2.2, T2.4, T4.2–T4.3 | `provideClientHydration()` (T1.4); SeoService in-place reuse (T2.2); dist head consistency (T4.2) |
| server-rendering | Req 3 | Build is render gate; build fails on render error; build-time delta recorded | T1.4, T4.2–T4.3 | Build smoke + gate (T1.4); script exits non-zero + full gate (T4.2–T4.3); delta recorded (T1.4/T4.3) |
| server-rendering | Req 4 | Unknown routes → CSR fallback (`PrerenderFallback.Client`, `index.csr.html`); shows not-found after hydration | T1.2, T1.4, T4.2–T4.3 | `**→Client` + `fallback: Client` (T1.2); `index.csr.html` present (T1.4); dist check (T4.2) |
| server-rendering | Req 5 | Static-host compatible; no server runtime (no root `server.ts`, no Express); only `@angular/ssr` added | T1.1–T1.2, T4.3 | Deps + server files added (no Express/server.ts) (T1.1–T1.2); file inventory in verify (T4.3) |
| server-rendering | Req 6 | Budgets & regressions: initial ≤450/500 kB; CLS < 0.05; axe suite; all 336 tests green | T1.4, T2.4, T3.3, T4.3 | Budget check + gate (T1.4); slice gates (T2.4,T3.3); full gate (T4.3); existing suite preserved |
| seo-analytics-performance | Req 8 | Complete social head in prerendered HTML: og:image, og:url, twitter:card (`summary_large_image`), og:type — once each; og:image == site.ogImage.src; no duplication after hydration | T2.2–T2.4, T4.2–T4.3 | SeoService enrichment + reuse (T2.2); static fallback + duplication specs (T2.3–T2.4); dist checks (T4.2) |
| seo-analytics-performance | Req 9 | Absolute canonical origin from SITE_URL (prod); dev fallback to `document.location.origin`; no `localhost` in prod canonical/og:url/JSON-LD url | T2.1–T2.4, T4.2–T4.3 | Env model+guards (T2.1); SeoService origin (T2.2); unit specs (T2.4); dist `localhost` grep + absolute checks (T4.2) |
| seo-analytics-performance | Req 10 | Per-slug heads on detail pages (`/servicios/:slug`, `/proyectos/:slug`) via SeoService.override(); distinct frozen titles; title==og:title; canonical/og:url follow per-slug URL | T3.1–T3.3, T4.2–T4.3 | Page overrides + specs (T3.1–T3.3); dist distinctness + consistency checks (T4.2) |
| seo-analytics-performance | Req 11 | Static og:image fallback in `index.html`; runtime supersedes without duplicates | T2.3–T2.4, T4.2–T4.3 | Static fallback (T2.3); duplication specs (T2.4); `index.csr.html` og:image check (T4.2) |
| seo-analytics-performance | Req 12 | Full head + valid JSON-LD present before JS; absolute `SITE_URL` url; no placeholder leak; route-appropriate (never home) | T2.2, T2.4, T3.1–T3.3, T4.2–T4.3 | SeoService JSON-LD absolute url (T2.2); per-slug consistency (T3.1–T3.3); dist JSON-LD parse + full head checks (T4.2) |
| seo-analytics-performance | Req 13 | Hydration preserves consent/analytics contracts (reqs 3–5); existing suite green | T1.4, T2.4, T3.3, T4.3 | All slice gates + full gate run existing suite (T1.4,T2.4,T3.3,T4.3) |

**Coverage:** All 12 requirements (6+6 added) mapped to tasks. No orphans.

## Slice boundaries & PR-sizing notes
- Each slice is an independently green work unit (separate commit sequence per slice; each slice’s gate must pass before next). 
- Slice 1: config+plumbing — expected ~150–220 LOC. **≤400?** Yes. Data/config-dominant: No (mixed). 
- Slice 2: head+env — ~120–180 LOC. **≤400?** Yes. Data/config-dominant: Yes. 
- Slice 3: per-slug — ~70–120 LOC. **≤400?** Yes. Data/config-dominant: No. 
- Slice 4: verify script+lint wiring — ~150–200 LOC. **≤400?** Yes. Data/config-dominant: Yes (tooling). 
- **Any slice >400?** No. Verify script is largest single file (~150–200). 
- **Chained-PR consideration:** None required by 400-line budget. Slices are small and ordered; can be stacked or merged in order. If review prefers smaller review units, can chain S1→S2→S3→S4 (each ≤220). 

## Review Workload Forecast (verbatim)
**Estimated changed lines per slice (including new files + specs + minimal edits):**
- Slice 1 (Plumbing + hydration): ~150–220 LOC
- Slice 2 (Head completeness): ~120–180 LOC  
- Slice 3 (Per-slug heads): ~70–120 LOC
- Slice 4 (Gate hardening): ~150–200 LOC  
**Total:** ~490–720 LOC (range) — but note: many are new files/specs and each slice is independently reviewable; per-slice max ~220 ≤400.

**400-line budget risk:** No. Each slice is well under 400 changed lines. The verify script (Slice 4) is ~150–200 LOC (data/config-dominant: tooling). No slice must exceed 400.

**Chained-PR recommendation (Yes/No):** No. Single PR per slice is sufficient; chaining not required by size budget. If team prefers ultra-tight review slices, can chain S1→S2→S3→S4 (each < 250). Default: proceed slice-by-slice with independent green gates.

**Decision needed before apply: Yes/No:** No. Forecast is green (all slices ≤220). Proceed to apply per slice order (1→2→3→4). (R3 remains content decision only; mechanism complete.)
