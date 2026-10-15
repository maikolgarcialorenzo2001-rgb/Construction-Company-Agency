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

### Requirement: Company-gated composer

The post composer MUST render only for the `company` role; `worker` and anonymous users MUST NOT see it and MUST NOT be able to create posts.

#### Scenario: Company sees the composer

- GIVEN a `company` session
- WHEN `/plataforma` renders
- THEN the composer is present

#### Scenario: Worker does not see the composer

- GIVEN a `worker` session
- WHEN `/plataforma` renders
- THEN the composer is absent

### Requirement: Fixture media URLs are renderable

Feed fixtures MUST give posts external absolute `https` attachment URLs (ImageAsset-style, no bare filenames) spanning 1–10 images, so the media grid never references missing binaries.

#### Scenario: Fixtures cover the grid range

- GIVEN `FEED_POSTS`
- WHEN the fixtures are inspected
- THEN every attachment is an absolute `https` URL
- AND attachment counts span 1 through 10
