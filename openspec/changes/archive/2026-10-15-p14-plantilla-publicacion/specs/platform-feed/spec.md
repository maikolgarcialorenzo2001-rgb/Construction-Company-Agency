# Delta for platform-feed

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Fixture media URLs are renderable

Feed fixtures MUST give posts external absolute `https` attachment URLs (ImageAsset-style, no bare filenames) spanning 1–10 images, so the media grid never references missing binaries.

#### Scenario: Fixtures cover the grid range

- GIVEN `FEED_POSTS`
- WHEN the fixtures are inspected
- THEN every attachment is an absolute `https` URL
- AND attachment counts span 1 through 10
