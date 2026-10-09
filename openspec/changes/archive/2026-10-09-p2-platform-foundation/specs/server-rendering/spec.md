# Delta for server-rendering

## MODIFIED Requirements

### Requirement: 1. [B] Prerender every public route at build

`bunx ng build` MUST emit one prerendered HTML file per public marketing route: home + all static marketing routes + one per content slug — 21 today (7 static + 6 servicios + 8 proyectos). The `/plataforma/**` subtree MUST NOT be prerendered and MUST NOT contribute to the derivation. The `**` wildcard MUST NOT be prerendered. Enumeration MUST derive from the route table and `src/content`, never a hardcoded list; a broken derivation MUST fail the suite.

(Previously: every public route derived from the table was prerendered; the platform subtree is now excluded from the derivation.)

#### Scenario: Complete prerender set

- GIVEN `src/content` and the route table unchanged
- WHEN `bunx ng build` completes
- THEN `dist/browser` contains an `index.html` for every public marketing path (21 today)
- AND contains none for any `/plataforma/**` path

#### Scenario: Enumeration guard

- GIVEN `getPrerenderParams()` and content collections
- WHEN a slug is added to or removed from `src/content`
- THEN the count spec comparing params to content passes without edits

## ADDED Requirements

### Requirement: Platform subtree render mode

`plataforma` and every path under it MUST resolve to `RenderMode.Client` and MUST never resolve to `RenderMode.Prerender`. The exclusion MUST match by prefix, dropping any browser path equal to `plataforma` or beginning with `plataforma/`.

#### Scenario: Client render for the subtree

- GIVEN the server route table
- WHEN `/plataforma/trabajos/42` is resolved
- THEN the render mode is `RenderMode.Client`

#### Scenario: Prefix exclusion is exact

- GIVEN browser paths `['plataforma', 'plataforma/trabajos', 'servicios', 'plataformas-curso']`
- WHEN the prerender derivation runs
- THEN `plataforma` and `plataforma/trabajos` are dropped
- AND `servicios` and `plataformas-curso` are kept

### Requirement: Platform hydration without transfer cache

Client-rendered platform pages MUST hydrate from their own browser output and MUST NOT depend on prerender transfer state. Bootstrapping the platform subtree MUST NOT require any HTTP.

#### Scenario: Platform hydrates with zero HTTP

- GIVEN a client-rendered platform page
- WHEN the app boots
- THEN no HTTP request is issued during bootstrap
- AND the page renders after lazily loading its chunk
