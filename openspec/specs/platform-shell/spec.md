# platform-shell Specification

## Requirements

### Requirement: Platform subtree route table

The app MUST register exactly one new top-level route, `plataforma`, whose children are `/plataforma` (feed), `/plataforma/trabajos`, `/plataforma/trabajos/:id`, `/plataforma/login`, `/plataforma/registro` and `/plataforma/perfil`. Each child MUST be lazy `loadComponent`. The subtree MUST NOT alter the marketing route table or its order.

#### Scenario: Every platform path resolves

- GIVEN the router configuration
- WHEN each `/plataforma/**` path is navigated to
- THEN its component renders without error
- AND an unknown `/plataforma/x` path renders the not-found route

#### Scenario: Marketing routes are unchanged

- GIVEN the router configuration
- WHEN the marketing top-level paths are read
- THEN they match the baseline order with `plataforma` inserted before `**`

### Requirement: Platform chrome and CTA suppression

`/plataforma/**` MUST render dedicated platform chrome (its own header/nav) and MUST NOT render the marketing sticky mobile CTA or the end-of-page `app-cta-block`. Marketing routes MUST keep the baseline CTA behavior, and `/presupuesto` MUST keep its own exception.

#### Scenario: CTAs are suppressed on platform

- GIVEN the user is on any `/plataforma/**` route
- WHEN the page renders
- THEN no sticky CTA and no `app-cta-block` are present

#### Scenario: Marketing CTA is preserved

- GIVEN the user is on `/servicios`
- WHEN the page renders
- THEN the sticky CTA and the end-of-page CTA block are present

#### Scenario: Quote exception is preserved

- GIVEN the user is on `/presupuesto`
- WHEN the page renders
- THEN no sticky CTA is present, as before

### Requirement: Platform subtree excluded from prerender

The platform subtree MUST be client-rendered. The prerender derivation MUST exclude any browser path equal to or nested under `plataforma`, so `bunx ng build` emits no platform HTML.

#### Scenario: No platform server route

- GIVEN the server route table
- WHEN the prerendered entries are inspected
- THEN no path equals `plataforma` or starts with `plataforma/`

#### Scenario: No platform HTML is emitted

- GIVEN `bunx ng build`
- WHEN `dist/browser` is scanned
- THEN no `plataforma` directory or `index.html` exists

> **Archive annotation (verify PARTIAL — no gate coverage, W3):** Covered by `app.routes.server.spec.ts` (no `Prerender` path under `plataforma`) and verified manually during verify (`find dist -iname '*plataforma*'` empty). There is **no automated gate step** scanning `dist/browser` for the platform subtree, so a regression would not be caught by CI. Tracked as follow-up W3.

### Requirement: Platform pages are noindex

Every `/plataforma/**` route MUST declare `data.seo.indexable === false`.

#### Scenario: Platform routes opt out of indexing

- GIVEN the route table
- WHEN platform routes are inspected
- THEN each carries `indexable: false`

### Requirement: Guarded platform children

Platform children other than `login` and `registro` MUST be protected by an auth guard; `login` and `registro` MUST remain reachable without a session; the marketing routes MUST remain unguarded (no `canActivate`, `canActivateChild`, or `resolve`).

#### Scenario: Protected child redirects anonymous users

- GIVEN no active session
- WHEN `/plataforma/perfil` is navigated to
- THEN navigation redirects to `/plataforma/login`

#### Scenario: Auth entry points stay open

- GIVEN no active session
- WHEN `/plataforma/login` or `/plataforma/registro` is navigated to
- THEN the page renders without redirect

#### Scenario: Marketing routes stay unguarded

- GIVEN the route table
- WHEN marketing routes are inspected
- THEN none declares `canActivate`, `canActivateChild`, or `resolve`

### Requirement: Platform release-matrix rows

`app.release-matrix.spec.ts` MUST include one row per platform route with `cta: false`, so platform routes are never counted among the marketing CTA rows.

#### Scenario: Platform rows are declared

- GIVEN the release matrix
- WHEN a `/plataforma/**` route is inspected
- THEN a row exists with `cta: false`
- AND the route renders no marketing CTA block
