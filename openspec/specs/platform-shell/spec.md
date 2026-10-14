# platform-shell Specification

## Requirements

### Requirement: Platform subtree route table

The app MUST register `plataforma` as a top-level grouping route whose children are `/plataforma` (feed), `/plataforma/inicio` (role-aware home), `/plataforma/admin` (admin-only area), `/plataforma/trabajos`, `/plataforma/trabajos/:id`, `/plataforma/login`, `/plataforma/registro` and `/plataforma/perfil`. Each child MUST be lazy `loadComponent`. The app MUST additionally register a top-level `previa` preview route (with an optional `:role` param) outside the platform subtree. `/plataforma/inicio` and `/plataforma/admin` MUST sit with the other platform siblings in the declared child order, with `admin` following `inicio`. The subtree MUST NOT alter the marketing route table or its order.

(Previously: `plataforma` was the only top-level grouping route and the top-level table was `[...marketing, 'plataforma', '**']`.)

#### Scenario: Every platform path resolves

- GIVEN the router configuration
- WHEN each `/plataforma/**` path is navigated to
- THEN its component renders without error
- AND an unknown `/plataforma/x` path renders the not-found route

#### Scenario: Admin child is registered

- GIVEN the router configuration
- WHEN the `plataforma` children are read
- THEN `/plataforma/admin` is present among the platform children
- AND it follows `/plataforma/inicio`

#### Scenario: Top-level table gains the preview route

- GIVEN the router configuration
- WHEN top-level paths are read
- THEN `previa` is present after `plataforma` and before `**`
- AND the marketing order is unchanged

#### Scenario: Marketing routes are unchanged

- GIVEN the router configuration
- WHEN the marketing top-level paths are read
- THEN they match the baseline order with `plataforma` and `previa` inserted before `**`

#### Scenario: Preview and platform are structurally separate

- GIVEN the router configuration
- WHEN `/previa` and its `:role` param are inspected
- THEN neither is a child of `plataforma`

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

The platform subtree MUST be client-rendered. The prerender derivation MUST exclude any browser path equal to or nested under `plataforma`, so `bunx ng build` emits no platform HTML. The build gate MUST run an automated scan of the built client output (robust to both `dist/browser` and `dist/<project>/browser`) that fails when any `*plataforma*` artifact is present.

(Previously: exclusion was verified only by a server-route spec plus a manual `find dist -iname '*plataforma*'`; there was no automated gate scan.)

#### Scenario: No platform server route

- GIVEN the server route table
- WHEN the prerendered entries are inspected
- THEN no path equals `plataforma` or starts with `plataforma/`

#### Scenario: No platform HTML is emitted

- GIVEN `bunx ng build`
- WHEN `dist/browser` is scanned
- THEN no `plataforma` directory or `index.html` exists

#### Scenario: Leak scan fails the gate

- GIVEN a built client output containing a `plataforma` artifact
- WHEN the gate scan runs
- THEN it exits non-zero and names the offending artifact

> **Archive annotation (verify W3 — CLOSED by this change):** `scripts/verify-prerender.ts` now runs `findPlatformArtifacts()` (single pass over resolved `DIST_ROOT` — recursive, files AND dirs, repository-relative `/plataforma/i` matching) and fails naming every `*plataforma*` artifact; `package.json` wires `verify:prerender` into `gate` after `bunx ng build`. Re-proven adversarially during verify: a seeded `dist/.../browser/plataforma/index.html` exits 1 with 2 named hits (dir AND file), a clean build exits 0 with `· no plataforma leak`, and the root-agnostic override handles both `dist/browser` and `dist/<project>/browser`. The no-gate-coverage gap recorded by `p2-platform-foundation` W3 is resolved.

#### Scenario: Gate wires the leak scan

- GIVEN `bun run gate`
- WHEN it runs after `bunx ng build`
- THEN the leak scan executes and passes on a clean build

### Requirement: Platform pages are noindex

Every `/plataforma/**` route MUST declare `data.seo.indexable === false`.

#### Scenario: Platform routes opt out of indexing

- GIVEN the route table
- WHEN platform routes are inspected
- THEN each carries `indexable: false`

### Requirement: Guarded platform children

Platform children other than `login` and `registro` MUST be protected by an auth guard; `login` and `registro` MUST remain reachable without a session; the marketing routes MUST remain unguarded (no `canActivate`, `canActivateChild`, or `resolve`). The top-level `previa` route and its `:role` param MUST also remain unguarded. The `/plataforma/admin` child MUST additionally be protected by a `roleGuard` reading `data.roles`, composed as `[authGuard, roleGuard]` with `data.roles` equal to `['admin']`.

(Previously: only the marketing routes were declared unguarded; the preview route did not exist.)

#### Scenario: Protected child redirects anonymous users

- GIVEN no active session
- WHEN `/plataforma/perfil` is navigated to
- THEN navigation redirects to `/plataforma/login`

#### Scenario: Admin child is role-guarded

- GIVEN the route table
- WHEN the `/plataforma/admin` child is inspected
- THEN it declares `canActivate` composed of `authGuard` and `roleGuard`
- AND its `data.roles` equals `['admin']`

#### Scenario: Auth entry points stay open

- GIVEN no active session
- WHEN `/plataforma/login` or `/plataforma/registro` is navigated to
- THEN the page renders without redirect

#### Scenario: Marketing and preview routes stay unguarded

- GIVEN the route table
- WHEN marketing routes and `/previa` are inspected
- THEN none declares `canActivate`, `canActivateChild`, or `resolve`

### Requirement: Platform release-matrix rows

`app.release-matrix.spec.ts` MUST include one row per platform route with `cta: false`, so platform routes are never counted among the marketing CTA rows.

#### Scenario: Platform rows are declared

- GIVEN the release matrix
- WHEN a `/plataforma/**` route is inspected
- THEN a row exists with `cta: false`
- AND the route renders no marketing CTA block
