# platform-feed Specification

## Requirements

### Requirement: Feed gateway port

The feed MUST be read and written through a `FeedGateway` port bound with a DI token, with a `Mock*Gateway` adapter backed by deterministic fixtures. Swapping to a real adapter MUST be a provider change only.

#### Scenario: Mock adapter satisfies the port

- GIVEN the app configured with the mock `FeedGateway`
- WHEN the timeline is requested
- THEN a deterministic list of posts is returned

#### Scenario: Adapter is swappable

- GIVEN a test providing an alternative `FeedGateway`
- WHEN the feed loads
- THEN the feed renders from that adapter

### Requirement: Feed renders via signals (zoneless)

The feed MUST render from a `FeedStore` whose state is signals/computed; gateway responses MUST be written into a signal so the zoneless app paints. There MUST be no zone-based change detection. Each post MUST render through the shared `PostTemplateComponent` fed by a demo-only `PostView` (denormalized `authorName`/`authorRole`), not page-inline markup. The feed MUST also surface, inside each post's list item, an inline comment thread sourced from that post's `CommentsStore` signals.
(Previously: posts rendered as inline markup showing the raw `authorId`; no shared template, header, media or actions.)

#### Scenario: Async posts paint

- GIVEN the mock gateway resolves a timeline
- WHEN the store settles
- THEN the posts render in the view

#### Scenario: Loading and empty states

- GIVEN a pending or empty timeline
- WHEN the feed renders
- THEN a loading or empty state is shown

#### Scenario: Inline comment thread per post

- GIVEN the feed renders posts
- WHEN a post's comments have loaded
- THEN an inline comment thread appears inside that post's list item
- AND each post's thread reflects its own `CommentsStore` state

#### Scenario: Posts render through the shared template

- GIVEN a ready timeline
- WHEN `/plataforma` renders
- THEN each `feed-post` embeds the template's header, media and actions
- AND the denormalized author name shows instead of `authorId`

### Requirement: Role-differentiated post composer

The post composer MUST render differently by role: `worker` sees a solicitud (job-request) form; `company` sees a mode-differentiated composer — normal textarea mode (default; existing testids and behavior preserved byte-compatible) and "Buscar trabajadores" vacancy mode (scoped picker + optional text/photos); `admin` MUST NOT see a composer (flagged for design). The two modes MUST be exclusive: the normal textarea form renders only in normal mode, the vacancy form only in vacancy mode. `worker` and anonymous users MUST NOT see the company composer or its vacancy mode and MUST NOT create standard company posts via the textarea while the solicitud form is active. Publishing from vacancy mode MUST create a post with `kind: 'vacancy'` carrying the selected `jobIds` through the demo registry, authored by the session user. The never-empty invariant is enforced per composer path.

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

### Requirement: Fixture media URLs are renderable

Feed fixtures MUST give posts external absolute `https` attachment URLs (ImageAsset-style, no bare filenames) spanning 1–10 images, so the media grid never references missing binaries.

#### Scenario: Fixtures cover the grid range

- GIVEN `FEED_POSTS`
- WHEN the fixtures are inspected
- THEN every attachment is an absolute `https` URL
- AND attachment counts span 1 through 10

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
