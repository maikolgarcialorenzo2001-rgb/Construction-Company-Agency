# site-shell-navigation Specification

## Context

The buyer is on a phone, distrusting contractors, and needs to reach a human NOW. The shell (header, footer, sticky mobile CTA, 404) is the always-present trust + reachability surface. It must exist on every route and must never contradict itself.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

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

### Requirement: 2. [B] Document language

The document MUST declare `lang="es-AR"`, and all shipped copy MUST be es-AR.

#### Scenario: Language attribute

- GIVEN the served document
- WHEN the root element is inspected
- THEN its `lang` attribute equals `es-AR`

### Requirement: 3. [B] Header navigation, phone reachability and promo strip

The header MUST render a link to every marketing top-level route and one phone action whose `tel:` target comes from the NAP single source (`content-model`). The header MUST expose a **single** platform entry point linking to `/plataforma` (exactly one `a[href="/plataforma"]`). The header MUST also render a **static promo strip inside the header landmark**, advertising the trial→paid offer (7 días de uso gratis, después planes de pago) with a CTA linking to `/plataforma/registro`. The strip MUST NOT be dismissible and MUST NOT contain any images.

(Previously: the header exposed marketing links, a phone action and the platform entry; it carried no promo strip.)

#### Scenario: Header exposes phone, marketing sections and one platform entry

- GIVEN the header renders
- WHEN it is inspected
- THEN a `tel:` action matching the NAP phone is present
- AND links exist for each marketing top-level route
- AND exactly one link targets `/plataforma`

#### Scenario: Promo strip renders inside the header with a registration CTA

- GIVEN the marketing header renders
- WHEN it is inspected
- THEN a promo strip sits inside the header landmark
- AND it shows the trial→paid copy
- AND its CTA links to `/plataforma/registro`

#### Scenario: Promo strip is static, non-dismissible and image-free

- GIVEN the promo strip renders
- WHEN it is inspected
- THEN it offers no dismiss control
- AND it contains no images

#### Scenario: Platform chrome owns the platform nav

- GIVEN the user is on `/plataforma`
- WHEN the platform chrome renders
- THEN the platform header provides platform navigation independently of the marketing nav
- AND the marketing promo strip is absent

### Requirement: 4. [B] Footer NAP from a single source

The footer MUST render name, address, and phone taken from the NAP source, plus a WhatsApp action and an external Google Business Profile link. The footer MUST NOT contain its own NAP literals.

#### Scenario: Footer matches the source of truth

- GIVEN the NAP config declares name/address/phone
- WHEN the footer renders
- THEN each NAP value appears in the footer
- AND a `wa.me` link and an external GBP link are present

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

## Out of Scope

- Service-area pages, FAQ, certifications, blog, `hreflang` (P1).
- Drawer/menu behavior beyond basic mobile navigation; design decides presentation.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | All 10 routes resolve; unknown path renders 404 | `bunx ng test --watch=false` |
| 2 | No sticky CTA on `/presupuesto`, present on the rest | `bunx ng test --watch=false` |
| 2a | CTA closes every route except `/presupuesto` (404 included) | `bunx ng test --watch=false` |
| 3 | `lang="es-AR"` present | `bunx ng test --watch=false` |
| 4 | No NAP literals outside the NAP source | `bunx ng lint` + grep guard |
| 5 | Build green, initial bundle < 500 kB | `bunx ng build` |
