# Delta for site-shell-navigation

## MODIFIED Requirements

### Requirement: 1. [B] Complete es-AR route table

The app MUST register these routes, each lazy-loaded, and MUST NOT register any other top-level route apart from the single `plataforma` subtree defined by `platform-shell`:

| Route | Purpose |
|---|---|
| `/` | Home |
| `/servicios` | Service list |
| `/servicios/:slug` | Service detail |
| `/proyectos` | Project list |
| `/proyectos/:slug` | Project detail |
| `/proceso` | Process steps |
| `/testimonios` | Reviews / "opiniones" |
| `/nosotros` | About + credentials |
| `/presupuesto` | Quote request + contact |
| `/plataforma` | Platform subtree (feed, jobs, auth, profile) |
| `**` | 404 |

(Previously: only the ten marketing routes; `plataforma` is now the one additional top-level route.)

#### Scenario: Every declared route resolves

- GIVEN the router configuration
- WHEN each top-level path is navigated to
- THEN its component renders without error
- AND an unknown path renders the 404 route

#### Scenario: No marketing route is displaced

- GIVEN the router configuration
- WHEN the marketing top-level paths are read
- THEN they match the baseline order with `plataforma` inserted before `**`

### Requirement: 3. [B] Header navigation and phone reachability

The header MUST render a link to every marketing top-level route and one phone action whose `tel:` target comes from the NAP single source (`content-model`). The header MUST also expose a single platform entry point linking to `/plataforma`.

(Previously: linked every top-level route; now scoped to marketing routes plus one platform entry.)

#### Scenario: Header exposes phone, marketing sections and platform entry

- GIVEN the header renders
- WHEN it is inspected
- THEN a `tel:` action matching the NAP phone is present
- AND links exist for each marketing top-level route
- AND one link targets `/plataforma`

#### Scenario: Platform chrome owns the platform nav

- GIVEN the user is on `/plataforma`
- WHEN the platform chrome renders
- THEN the platform header provides platform navigation independently of the marketing nav

### Requirement: 5. [B] Sticky mobile CTA, suppressed on the quote route

A sticky CTA MUST be visible on every marketing route EXCEPT `/presupuesto`, where the form is already the primary action. It MUST NOT render on any `/plataforma/**` route.

(Previously: only `/presupuesto` was exempt; the platform subtree is now exempt too.)

#### Scenario: Suppressed on the quote route

- GIVEN the user is on `/presupuesto`
- WHEN the page renders
- THEN no sticky mobile CTA is present

#### Scenario: Suppressed across the platform subtree

- GIVEN the user is on any `/plataforma/**` route
- WHEN the page renders
- THEN no sticky mobile CTA is present

#### Scenario: Present elsewhere

- GIVEN the user is on any other marketing route
- WHEN the page renders
- THEN the sticky CTA offers a WhatsApp action and a `tel:` action

### Requirement: 6. [B] End-of-page CTA block

Every marketing route EXCEPT `/presupuesto` MUST end its main content with a CTA block linking to `/presupuesto` and offering `tel:` — the quote form is already the primary action there. No `/plataforma/**` route MUST render this block.

(Previously: every route except `/presupuesto`; the platform subtree is now excluded.)

#### Scenario: CTA closes every marketing page

- GIVEN any marketing route other than `/presupuesto`
- WHEN the page finishes rendering
- THEN the last main-content section is the CTA block

#### Scenario: No self-referential CTA on the quote route

- GIVEN the user is on `/presupuesto`
- WHEN the page finishes rendering
- THEN no CTA block linking to the current page is present

#### Scenario: No marketing CTA on platform pages

- GIVEN any `/plataforma/**` route
- WHEN the page finishes rendering
- THEN no CTA block and no sticky CTA are present
