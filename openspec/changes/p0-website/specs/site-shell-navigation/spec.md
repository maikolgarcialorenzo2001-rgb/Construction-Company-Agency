# site-shell-navigation Specification

## Context

The buyer is on a phone, distrusting contractors, and needs to reach a human NOW. The shell (header, footer, sticky mobile CTA, 404) is the always-present trust + reachability surface. It must exist on every route and must never contradict itself.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [B] Complete es-AR route table

The app MUST register these routes, each lazy-loaded, and MUST NOT register any other top-level route:

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
| `**` | 404 |

#### Scenario: Every declared route resolves

- GIVEN the router configuration
- WHEN each top-level path is navigated to
- THEN its component renders without error
- AND an unknown path renders the 404 route

### Requirement: 2. [B] Document language

The document MUST declare `lang="es-AR"`, and all shipped copy MUST be es-AR.

#### Scenario: Language attribute

- GIVEN the served document
- WHEN the root element is inspected
- THEN its `lang` attribute equals `es-AR`

### Requirement: 3. [B] Header navigation and phone reachability

The header MUST render a link to every top-level route and MUST render one phone action whose `tel:` target comes from the NAP single source (`content-model`).

#### Scenario: Header exposes phone and all sections

- GIVEN the header renders
- WHEN it is inspected
- THEN a `tel:` action matching the NAP phone is present
- AND links exist for each top-level route

### Requirement: 4. [B] Footer NAP from a single source

The footer MUST render name, address, and phone taken from the NAP source, plus a WhatsApp action and an external Google Business Profile link. The footer MUST NOT contain its own NAP literals.

#### Scenario: Footer matches the source of truth

- GIVEN the NAP config declares name/address/phone
- WHEN the footer renders
- THEN each NAP value appears in the footer
- AND a `wa.me` link and an external GBP link are present

### Requirement: 5. [B] Sticky mobile CTA, suppressed on the quote route

A sticky CTA MUST be visible on every route EXCEPT `/presupuesto`, where the form is already the primary action.

#### Scenario: Suppressed on the quote route

- GIVEN the user is on `/presupuesto`
- WHEN the page renders
- THEN no sticky mobile CTA is present

#### Scenario: Present elsewhere

- GIVEN the user is on any other route
- WHEN the page renders
- THEN the sticky CTA offers a WhatsApp action and a `tel:` action

### Requirement: 6. [B] End-of-page CTA block

Every route MUST end its main content with a CTA block linking to `/presupuesto` and offering `tel:`.

#### Scenario: CTA closes every page

- GIVEN any top-level route
- WHEN the page finishes rendering
- THEN the last main-content section is the CTA block

## Out of Scope

- Service-area pages, FAQ, certifications, blog, `hreflang` (P1).
- Drawer/menu behavior beyond basic mobile navigation; design decides presentation.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | All 10 routes resolve; unknown path renders 404 | `bunx ng test --watch=false` |
| 2 | No sticky CTA on `/presupuesto`, present on the rest | `bunx ng test --watch=false` |
| 3 | `lang="es-AR"` present | `bunx ng test --watch=false` |
| 4 | No NAP literals outside the NAP source | `bunx ng lint` + grep guard |
| 5 | Build green, initial bundle < 500 kB | `bunx ng build` |
