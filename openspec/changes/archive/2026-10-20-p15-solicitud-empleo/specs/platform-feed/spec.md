# Delta for platform-feed

## MODIFIED Requirements

### Requirement: Role-differentiated post composer

The post composer MUST render differently by role: `worker` sees a solicitud (job-request) form; `company` sees the existing textarea composer; `admin` MUST NOT see a composer (flagged for design). `worker` and anonymous users MUST NOT see the company-only composer and MUST NOT create standard company posts via the textarea while the solicitud form is active. The never-empty invariant is enforced per composer path.

(Previously: The post composer MUST render only for the `company` role; `worker` and anonymous users MUST NOT see it and MUST NOT be able to create posts.)

#### Scenario: Company sees textarea composer

- GIVEN a `company` session
- WHEN `/plataforma` renders
- THEN the textarea composer is present
- AND the solicitud form is absent

#### Scenario: Worker sees solicitud form (job-request)

- GIVEN a `worker` session
- WHEN `/plataforma` renders
- THEN the solicitud form is present
- AND the textarea composer is absent
- AND the worker can create a `job-request` post

#### Scenario: Admin does not see composer

- GIVEN an `admin` session
- WHEN `/plataforma` renders
- THEN the composer is absent

#### Scenario: Worker cannot create via company composer

- GIVEN a `worker` session
- WHEN the feed renders
- THEN only the solicitud form is available for publishing
- AND publishing from company composer path is not possible

## ADDED Requirements

### Requirement: Job-request posts project structured card via `[postExtra]`

When rendering a `job-request` post, the feed MUST project the structured card into the post's `[postExtra]` slot. The projection MUST NOT populate `[postBody]` with structured fields. The feed's render predicate `isRenderablePostView` MUST remain unchanged.

#### Scenario: Job-request projected into postExtra

- GIVEN a timeline containing a `job-request` post
- WHEN `/plataforma` renders
- THEN the structured card appears inside that post's `[postExtra]`
- AND the post body slot remains free of structured fields

#### Scenario: Standard posts unchanged by projection

- GIVEN a timeline containing a `standard` post
- WHEN `/plataforma` renders
- THEN no job-request card is projected for that post
- AND standard rendering behavior is preserved
