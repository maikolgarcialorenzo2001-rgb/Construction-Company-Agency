# Delta for platform-shell

## MODIFIED Requirements

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
