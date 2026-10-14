# platform-home Specification

## Requirements

### Requirement: Role-aware entry home

The platform MUST render a dedicated entry home at `/plataforma/inicio`. Successful `login` and `registro` flows MUST land the user on `/plataforma/inicio`. The home route MUST sit behind `authGuard`; role gating is NOT part of this change (`roleGuard` deferred to `p12-admin`). `/plataforma` MUST keep rendering the feed.

#### Scenario: Login lands on the home

- GIVEN valid credentials are submitted on `/plataforma/login`
- WHEN authentication succeeds
- THEN the router navigates to `/plataforma/inicio`

#### Scenario: Registration lands on the home

- GIVEN a valid registration is submitted on `/plataforma/registro`
- WHEN registration succeeds
- THEN the router navigates to `/plataforma/inicio`

#### Scenario: Home requires a session

- GIVEN no active session
- WHEN `/plataforma/inicio` is navigated to
- THEN navigation redirects to `/plataforma/login`

#### Scenario: Every authenticated role reaches the home

- GIVEN a `worker`, `company`, or `admin` session
- WHEN `/plataforma/inicio` renders
- THEN the role-appropriate home content renders without error

### Requirement: Worker home — my applications

For a `worker` role, the home MUST list only the current worker's own applications, scoped by `applicantId` from the session `userId`, and MUST show each application's status label. A worker's applications MUST NOT include any other worker's rows.

#### Scenario: Worker sees only their own applications

- GIVEN a `worker` session whose `userId` is `worker-1`
- WHEN the home renders "Mis postulaciones"
- THEN only applications whose `applicantId` equals `worker-1` are listed
- AND each row shows its status label

#### Scenario: Worker with no applications

- GIVEN a `worker` session with no seeded applications
- WHEN the home renders
- THEN "Mis postulaciones" shows an empty state
- AND no other worker's application is listed

### Requirement: Company home — my vacancies and publish affordance

For a `company` role, the home MUST list only the current company's own job openings, filtered client-side by `companyId` against the session `userId` (no gateway filter), and MUST expose a "Publicar novedad" affordance.

#### Scenario: Company sees only its own vacancies

- GIVEN a `company` session whose `userId` is `company-1`
- WHEN the home renders "Mis vacantes"
- THEN only openings whose `companyId` equals `company-1` are listed

#### Scenario: Publish affordance is present

- GIVEN a `company` session
- WHEN the home renders
- THEN a "Publicar novedad" affordance is present

### Requirement: Admin home — overview linking to the admin area

For an `admin` role, the home MUST render a short overview (retaining the `data-testid="home-admin-placeholder"` element) and MUST expose a link into `/plataforma/admin`. The home MUST NOT be limited to a "no controls" placeholder: the link into the admin area is required. Full admin tooling lives at `/plataforma/admin`, not on the home.

(Previously: the admin home was a minimal "en preparación" placeholder with no controls and no link.)

#### Scenario: Admin sees the overview and the area link

- GIVEN an `admin` session
- WHEN the home renders
- THEN a short overview is shown (the `home-admin-placeholder` element is present)
- AND a link to `/plataforma/admin` is present

#### Scenario: Non-admin never sees the admin link

- GIVEN a `worker` or `company` session
- WHEN the home renders
- THEN no link to `/plataforma/admin` is present
