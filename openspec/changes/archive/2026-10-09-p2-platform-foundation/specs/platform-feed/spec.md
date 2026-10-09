# Delta for platform-feed

## ADDED Requirements

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

The feed MUST render from a `FeedStore` whose state is signals/computed; gateway responses MUST be written into a signal so the zoneless app paints. There MUST be no zone-based change detection.

#### Scenario: Async posts paint

- GIVEN the mock gateway resolves a timeline
- WHEN the store settles
- THEN the posts render in the view

#### Scenario: Loading and empty states

- GIVEN a pending or empty timeline
- WHEN the feed renders
- THEN a loading or empty state is shown

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
