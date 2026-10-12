# Delta for platform-feed

## MODIFIED Requirements

### Requirement: Feed renders via signals (zoneless)

The feed MUST render from a `FeedStore` whose state is signals/computed; gateway responses MUST be written into a signal so the zoneless app paints. There MUST be no zone-based change detection. The feed MUST also surface, inside each post's list item, an inline comment thread sourced from that post's `CommentsStore` signals.

(Previously: the feed rendered only the post list from `FeedStore`, with no comment thread.)

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
