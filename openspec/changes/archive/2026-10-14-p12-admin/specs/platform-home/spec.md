# Delta for platform-home

## MODIFIED Requirements

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
