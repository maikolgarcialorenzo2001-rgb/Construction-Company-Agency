# Delta for platform-feed

## MODIFIED Requirements

### Requirement: Role-differentiated post composer

The post composer MUST render differently by role: `worker` sees a solicitud (job-request) form; `company` sees a mode-differentiated composer — normal textarea mode (default; existing testids and behavior preserved byte-compatible) and "Buscar trabajadores" vacancy mode (scoped picker + optional text/photos); `admin` MUST NOT see a composer (flagged for design). The two modes MUST be exclusive: the normal textarea form renders only in normal mode, the vacancy form only in vacancy mode (design D4a). `worker` and anonymous users MUST NOT see the company composer or its vacancy mode and MUST NOT create standard company posts via the textarea while the solicitud form is active. Publishing from vacancy mode MUST create a post with `kind: 'vacancy'` carrying the selected `jobIds` through the demo registry, authored by the session user. The never-empty invariant is enforced per composer path.

(Previously: company saw a single fixed textarea composer with no mode toggle.)

#### Scenario: Company sees textarea composer in normal mode

- GIVEN a `company` session
- WHEN `/plataforma` renders
- THEN the textarea composer is present in normal mode
- AND the solicitud form is absent
- AND the vacancy mode form is absent until the toggle is activated

#### Scenario: Vacancy mode creates vacancy post

- GIVEN a `company` session in vacancy mode with ≥1 own open vacancy and text
- WHEN the company publishes
- THEN a post with `kind: 'vacancy'` is created
- AND its `jobIds` match the selection
- AND its `authorId` equals the session author

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
- AND neither the company textarea nor vacancy mode is reachable

## ADDED Requirements

### Requirement: Vacancy posts project card via `[postExtra]`

When rendering a `vacancy` post, the feed MUST project the vacancy card into the post's `[postExtra]` slot. The projection MUST NOT populate `[postBody]` with vacancy fields. The feed's render predicate `isRenderablePostView` MUST remain unchanged.

#### Scenario: Vacancy projected into postExtra

- GIVEN a timeline containing a `vacancy` post
- WHEN `/plataforma` renders
- THEN the vacancy card appears inside that post's `[postExtra]`
- AND the post body slot remains free of vacancy fields

#### Scenario: Standard and job-request posts unaffected

- GIVEN a timeline containing `standard` and `job-request` posts
- WHEN `/plataforma` renders
- THEN no vacancy card is projected for those posts
- AND their existing rendering behavior is preserved
