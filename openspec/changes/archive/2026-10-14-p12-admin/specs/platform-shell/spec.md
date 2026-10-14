# Delta for platform-shell

## MODIFIED Requirements

### Requirement: Platform subtree route table

The app MUST register exactly one top-level route, `plataforma`, whose children are `/plataforma` (feed), `/plataforma/inicio` (role-aware home), `/plataforma/admin` (admin-only area), `/plataforma/trabajos`, `/plataforma/trabajos/:id`, `/plataforma/login`, `/plataforma/registro` and `/plataforma/perfil`. Each child MUST be lazy `loadComponent`. `/plataforma/inicio` and `/plataforma/admin` MUST sit with the other platform siblings in the declared child order, with `admin` following `inicio`. The subtree MUST NOT alter the marketing route table or its order.

(Previously: the child set had no `/plataforma/admin` admin route.)

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

#### Scenario: Marketing routes are unchanged

- GIVEN the router configuration
- WHEN the marketing top-level paths are read
- THEN they match the baseline order with `plataforma` inserted before `**`

### Requirement: Guarded platform children

Platform children other than `login` and `registro` MUST be protected by an auth guard; `login` and `registro` MUST remain reachable without a session; the marketing routes MUST remain unguarded (no `canActivate`, `canActivateChild`, or `resolve`). The `/plataforma/admin` child MUST additionally be protected by a `roleGuard` reading `data.roles`, composed as `[authGuard, roleGuard]` with `data.roles` equal to `['admin']`.

(Previously: children were only auth-guarded; no role-guarded child existed.)

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

#### Scenario: Marketing routes stay unguarded

- GIVEN the route table
- WHEN marketing routes are inspected
- THEN none declares `canActivate`, `canActivateChild`, or `resolve`
