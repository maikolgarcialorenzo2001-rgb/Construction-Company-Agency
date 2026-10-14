# Delta for server-rendering

## MODIFIED Requirements

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
