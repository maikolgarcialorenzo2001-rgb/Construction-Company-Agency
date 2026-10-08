# server-rendering Specification

## Purpose

Option B: build-time prerender (`outputMode: "static"`) + client hydration (`provideClientHydration()`), no Node runtime. Covers proposal capabilities `ssr-prerender-plumbing`, `build-config`, `app-config`. Enumeration relies on `content-model` Req 5 (unique slugs) — no content-model delta needed.

## Requirements

### Requirement: 1. [B] Prerender every public route at build

`bunx ng build` MUST emit one prerendered HTML file per public route: home + all static routes + one per content slug — 21 today (7 static + 6 servicios + 8 proyectos). The `**` wildcard MUST NOT be prerendered. Enumeration MUST derive from the route table and `src/content`, never a hardcoded list; a broken derivation MUST fail the suite.

#### Scenario: Complete prerender set

- GIVEN `src/content` and the route table unchanged
- WHEN `bunx ng build` completes
- THEN `dist/browser` contains an `index.html` for every public path (21 today)

#### Scenario: Enumeration guard

- GIVEN `getPrerenderParams()` and content collections
- WHEN a slug is added to or removed from `src/content`
- THEN the count spec comparing params to content passes without edits

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
