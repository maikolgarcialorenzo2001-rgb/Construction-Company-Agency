# Delta for site-shell-navigation

## MODIFIED Requirements

### Requirement: 3. [B] Header navigation, phone reachability and promo strip

The header MUST render a link to every marketing top-level route and one phone action whose `tel:` target comes from the NAP single source (`content-model`). The header MUST expose a **single** platform entry point linking to `/plataforma` (exactly one `a[href="/plataforma"]`). The header MUST also render a **static promo strip inside the header landmark**, advertising the trial→paid offer (7 días de uso gratis, después planes de pago) with a CTA linking to `/plataforma/registro`. The strip MUST NOT be dismissible and MUST NOT contain any images.

Within the platform chrome, the platform header MUST render a role-aware work navigation. `worker` and `admin` MUST render the same item set: Novedades (`/plataforma`), Trabajos (`/plataforma/trabajos`), Mi perfil (`/plataforma/perfil`). `company` MUST render the same destinations with relabeled items: Novedades (`/plataforma`), Vacantes (`/plataforma/trabajos`), Mi empresa (`/plataforma/perfil`). Destinations (slugs) MUST be identical across roles; only `company` labels change. The work nav MUST NOT render when there is no session, and when the item set is empty the `<nav>` landmark MUST be absent — never an empty landmark. The "Modo demo" pill MUST remain present in all states. The nav MUST react to session changes (login/logout) via the session signals.

(Previously: the platform chrome rendered one flat, role-agnostic platform nav for every visitor, including anonymous.)

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

#### Scenario: Worker and admin render the shared work nav

- GIVEN a `worker` or an `admin` session
- WHEN the platform header renders
- THEN it lists Novedades → `/plataforma`, Trabajos → `/plataforma/trabajos`, Mi perfil → `/plataforma/perfil`

#### Scenario: Company renders the relabeled work nav

- GIVEN a `company` session
- WHEN the platform header renders
- THEN it lists Vacantes → `/plataforma/trabajos` and Mi empresa → `/plataforma/perfil`
- AND Novedades → `/plataforma` is unchanged

#### Scenario: Anonymous renders no work nav

- GIVEN no session on `/plataforma/login` or `/plataforma/registro`
- WHEN the platform header renders
- THEN no work nav items are present
- AND no `<nav>` landmark is rendered (not an empty landmark)

#### Scenario: Nav reacts to login

- GIVEN the platform header rendered with no session
- WHEN a session becomes active
- THEN the role-appropriate work nav items appear without a reload

#### Scenario: Nav reacts to logout

- GIVEN the platform header rendered with a session
- WHEN the session is cleared
- THEN the work nav and its `<nav>` landmark disappear

#### Scenario: Modo demo pill survives every state

- GIVEN any session state and any role
- WHEN the platform header renders
- THEN the "Modo demo" pill is present
