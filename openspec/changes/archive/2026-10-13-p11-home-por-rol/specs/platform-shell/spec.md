# Delta for platform-shell

## MODIFIED Requirements

### Requirement: Platform subtree route table

The app MUST register exactly one top-level route, `plataforma`, whose children are `/plataforma` (feed), `/plataforma/inicio` (role-aware home), `/plataforma/trabajos`, `/plataforma/trabajos/:id`, `/plataforma/login`, `/plataforma/registro` and `/plataforma/perfil`. Each child MUST be lazy `loadComponent`. `/plataforma/inicio` MUST sit with the other platform siblings in the declared child order. The subtree MUST NOT alter the marketing route table or its order.

(Previously: the child set had no `/plataforma/inicio` home route.)

#### Scenario: Every platform path resolves

- GIVEN the router configuration
- WHEN each `/plataforma/**` path is navigated to
- THEN its component renders without error
- AND an unknown `/plataforma/x` path renders the not-found route

#### Scenario: Home child is registered

- GIVEN the router configuration
- WHEN the `plataforma` children are read
- THEN `/plataforma/inicio` is present among the platform children
- AND `/plataforma` still renders the feed

#### Scenario: Marketing routes are unchanged

- GIVEN the router configuration
- WHEN the marketing top-level paths are read
- THEN they match the baseline order with `plataforma` inserted before `**`
