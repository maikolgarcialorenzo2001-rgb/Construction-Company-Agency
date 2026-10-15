# platform-engagement Specification

## Purpose

Demo-only follow/like/save: swappable port, SSR-safe localStorage mock, signal store; share stays outside the port.

Scope (deferred to future changes): saved-collection view, feed prioritization by follow, post types 2/3.

## Requirements

### Requirement: Engagement port with swappable adapter

Engagement MUST flow through an `EngagementGateway` DI token with a localStorage mock adapter; swapping adapters MUST be a provider change only.

#### Scenario: Adapter swap

- GIVEN a test providing an alternative `EngagementGateway`
- WHEN the store loads and toggles
- THEN reads and writes hit that adapter only

### Requirement: Follow is a stored edge only

Follow MUST persist a viewer→author edge with no counts, notifications or feed reordering.

#### Scenario: Edge persists, no counts

- GIVEN a viewer following an author
- WHEN a fresh store loads and the header renders
- THEN the edge persists; no follower-count or notification UI exists

### Requirement: Like/save persist across reload

Like/save MUST key by viewer + post under `constructora.platform.engagement` and survive store re-creation; absent/corrupt storage MUST initialize empty without throwing (SSR-safe).

#### Scenario: State survives reload

- GIVEN a liked, saved post
- WHEN a fresh `EngagementStore` loads
- THEN the post is still reported liked and saved

#### Scenario: Storage missing or corrupt

- GIVEN `localStorage` undefined or holding invalid JSON
- WHEN the store initializes
- THEN state starts empty; no exception propagates

### Requirement: Signal-based store state

Store state MUST be signals with computed selectors; mutations MUST use `.set()` so the zoneless app repaints.

#### Scenario: Computed selector flips

- GIVEN an engagement store
- WHEN `toggleLike(viewer, post)` runs
- THEN `isLiked(viewer, post)` reflects the change in the same tick
