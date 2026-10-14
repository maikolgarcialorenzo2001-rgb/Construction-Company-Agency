# server-rendering Specification

## Purpose

Option B: build-time prerender (`outputMode: "static"`) + client hydration (`provideClientHydration()`), no Node runtime. Covers proposal capabilities `ssr-prerender-plumbing`, `build-config`, `app-config`. Enumeration relies on `content-model` Req 5 (unique slugs) — no content-model delta needed.

## Requirements

### Requirement: 1. [B] Prerender every public route at build

`bunx ng build` MUST emit one prerendered HTML file per public route: home + all static marketing routes + one per content slug + the preview set — `/previa` (1) and one page per preview role for `/previa/:role` (3 roles) — 25 today. The `/plataforma/**` subtree MUST NOT be prerendered and MUST NOT contribute to the derivation; the invariant is "the platform subtree stays client-only". The `**` wildcard MUST NOT be prerendered. Enumeration MUST derive from the route table, `src/content`, and the shared preview role list, never a hardcoded count; a broken derivation MUST fail the suite.

(Previously: the public set was the marketing routes and content slugs only; the preview routes did not exist and the platform exclusion was the whole invariant.)

#### Scenario: Complete prerender set

- GIVEN `src/content`, the route table, and the preview role list unchanged
- WHEN `bunx ng build` completes
- THEN `dist/browser` contains an `index.html` for every public path, including `previa` and one per preview role
- AND contains none for any `/plataforma/**` path

#### Scenario: Existing static routes are unregressed

- GIVEN the unchanged marketing routes
- WHEN `bunx ng build` completes
- THEN home plus the six static marketing routes still emit prerendered HTML
- AND the platform leak scan still passes

#### Scenario: Enumeration guard

- GIVEN `getPrerenderParams()` and the shared preview role list
- WHEN a preview role is added to or removed from that list
- THEN the preview count spec passes without a hardcoded count edit

### Requirement: Platform subtree render mode

`plataforma` and every path under it MUST resolve to `RenderMode.Client` and MUST never resolve to `RenderMode.Prerender`. The exclusion MUST match by prefix, dropping any browser path equal to `plataforma` or beginning with `plataforma/`, and MUST NOT drop `previa`. The `previa/:role` param route MUST use `PrerenderFallback.Client` and enumerate exactly the preview roles.

(Previously: the invariant applied only to the platform prefix and the preview routes did not exist.)

#### Scenario: Client render for the subtree

- GIVEN the server route table
- WHEN `/plataforma/trabajos/42` is resolved
- THEN the render mode is `RenderMode.Client`

#### Scenario: Prefix exclusion is exact and keeps the preview

- GIVEN browser paths `['plataforma', 'plataforma/trabajos', 'previa', 'previa/worker', 'plataformas-curso']`
- WHEN the prerender derivation runs
- THEN `plataforma` and `plataforma/trabajos` are dropped
- AND `previa`, `previa/worker`, and `plataformas-curso` are kept

#### Scenario: Preview param route is prerendered with client fallback

- GIVEN the server route table
- WHEN the `previa/:role` route is inspected
- THEN its `renderMode` is `RenderMode.Prerender`
- AND its `fallback` is `PrerenderFallback.Client`
- AND `getPrerenderParams()` yields exactly the preview roles

#### Scenario: Platform never prerenders

- GIVEN the server route table
- WHEN prerendered entries are inspected
- THEN no path equals or nests under `plataforma`

### Requirement: Platform hydration without transfer cache

Client-rendered platform pages MUST hydrate from their own browser output and MUST NOT depend on prerender transfer state. Bootstrapping the platform subtree MUST NOT require any HTTP. A bootstrap test MUST assert that bootstrapping/navigating `/plataforma/**` issues zero HTTP requests, proven with `HttpTestingController` (zero pending requests). The `provideClientHydration()` configuration comment in `app.config.ts` MUST accurately state that no HTTP is issued at platform bootstrap while the HTTP transfer cache remains enabled by default.

(Previously: zero-HTTP bootstrap was asserted without an automated test, and the in-code comment misleadingly read "Plain, no transfer cache".)

#### Scenario: Platform hydrates with zero HTTP

- GIVEN a client-rendered platform page
- WHEN the app boots
- THEN no HTTP request is issued during bootstrap
- AND the page renders after lazily loading its chunk

> **Archive annotation (verify W2 — CLOSED by this change):** `app.config.spec.ts` now boots the platform subtree through a `bootstrapPlatform()` helper (navigating `/plataforma/login` and `/plataforma/registro`) with `provideHttpClientTesting()` after `provideHttpClient()`, asserting `httpMock.verify()` passes with zero pending requests — probe-re-proven during verify: an injected `GET /__probe__` fails the test, and the run is reverted. The `provideClientHydration()` comment in `app.config.ts` now states zero HTTP at platform bootstrap while the transfer cache stays enabled by default. The untested-gap recorded by `p2-platform-foundation` W2 is resolved.

#### Scenario: Zero-HTTP bootstrap is asserted by a test

- GIVEN the platform app bootstrapped in a TestBed with `provideHttpClientTesting()`
- WHEN the platform subtree is bootstrapped/navigated (e.g. `/plataforma/login`)
- THEN no HTTP request is issued during bootstrap or navigation
- AND `HttpTestingController.verify()` passes with zero pending requests

#### Scenario: Hydration comment is accurate

- GIVEN the `provideClientHydration()` block in `app.config.ts`
- WHEN the comment is inspected
- THEN it states zero HTTP is issued at platform bootstrap
- AND it states the HTTP transfer cache remains enabled by default

### Requirement: 2. [B] Hydration reuses prerendered DOM

The browser app MUST bootstrap with `provideClientHydration()`. Hydration MUST attach to the prerendered DOM without re-rendering it and MUST preserve the prerendered head (title, meta, canonical) through boot.

#### Scenario: Hydrated page keeps its head

- GIVEN prerendered `/servicios` HTML
- WHEN the browser boots
- THEN Angular attaches to the existing DOM without duplicates
- AND title, description and canonical keep the per-route values

### Requirement: 3. [B] Build is the render gate

A route that fails to render MUST fail `bunx ng build` (non-zero exit); no release path may ship a known route without its prerendered file. Build time MAY grow (est. +10–45 s, R6); the delta vs baseline MUST be recorded during verify.

#### Scenario: Render error fails the build

- GIVEN any route that throws during prerender
- WHEN `bunx ng build` runs
- THEN the build exits non-zero

**ACCEPTED: framework guarantee.** Angular prerender fails the build when a route render throws; no induced-failure test was added by design (verify report WARNING 1). The verify script's own negative path IS proven (`4a95927`: bogus dist root → exit 1).

### Requirement: 4. [B] Unknown routes fall back to client rendering

Unmatched paths MUST resolve to the CSR fallback (`PrerenderFallback.Client`, emitted as `index.csr.html`) and render the not-found page after hydration (late `noindex` accepted for v1, R5).

#### Scenario: Unknown slug serves CSR fallback

- GIVEN a URL matching no route
- WHEN a static host serves `index.csr.html` for it
- THEN the app boots and shows the not-found page after JS

### Requirement: 5. [B] Static-host compatible output only

The production build MUST contain no server runtime: no root `server.ts`, no Express, no `ssr.entry`. Deployment MUST work on any static host; the hybrid (C) upgrade path stays open.

#### Scenario: No server artifacts

- GIVEN `bunx ng build`
- WHEN `dist/` and `package.json` are inspected
- THEN no Node server entry exists and only `@angular/ssr` was added (no server framework)

### Requirement: 6. [NFR] Budgets and regressions stay green

Hydration MUST NOT breach: initial bundle ≤ 450 kB warn / 500 kB error (baseline 381.64 kB, ~68 kB headroom; hydration delta measured), CLS < 0.05 (R4), the axe a11y suite, or any of the 336 existing tests.

**ACCEPTED-DEFERRED (CLS < 0.05, R4):** cannot be measured without real browser tooling (PerformanceObserver); the project has no E2E/browser tooling by design. Measure when browser tooling lands (verify report WARNING 3).

#### Scenario: Bundle budget after hydration

- GIVEN hydration enabled
- WHEN `bunx ng build` reports sizes
- THEN the initial bundle stays under 450 kB warn

#### Scenario: No a11y or suite regression

- GIVEN hydration wired
- WHEN `bunx ng lint` and `bunx ng test --watch=false` run
- THEN both pass, including the axe specs

## Verification

| Requirement | How |
|---|---|
| 1 | Count spec over `getPrerenderParams()`; per-route file check in `dist/browser` |
| 2 | Headless serve of `dist`: no hydration errors, head unchanged |
| 3 | Build exit code; build-time delta in verify report |
| 4 | `index.csr.html` present in build output |
| 5 | File inventory (no `server.ts`, no Express) + static output |
| 6 | Build size report; lint + test; CLS measure in verify |
