# platform-comments Specification

## Requirements

### Requirement: Comment domain model

The platform MUST define `Comment { id, postId, authorId, authorName, authorRole, body, createdAt }` and `CommentInput { postId, body }` in the domain models, re-exported via the domain barrel. `Comment` MUST NOT be added to `contract-conformance.ts` (no OpenAPI schema exists).

#### Scenario: Comment shape type-checks

- GIVEN the domain models
- WHEN a `Comment` is constructed with every field
- THEN it type-checks under strict TS
- AND no `contract-conformance.ts` entry is required

### Requirement: Comments gateway port

Comments MUST be read and written through a `CommentsGateway` port — `list(postId): Promise<Comment[]>` and `create(input): Promise<Comment>` — bound to a `COMMENTS_GATEWAY` InjectionToken whose default is `MockCommentsGateway`. Swapping to a real adapter MUST be a provider change only.

#### Scenario: Mock lists one post thread

- GIVEN the mock gateway and seeded comments
- WHEN `list('post-1')` resolves
- THEN only that post's comments are returned

#### Scenario: Port is swappable

- GIVEN a TestBed overriding `COMMENTS_GATEWAY`
- WHEN the token is injected
- THEN the alternative adapter resolves

#### Scenario: Create is deterministic

- GIVEN the mock gateway
- WHEN `create({ postId, body })` resolves
- THEN a `Comment` with a synthetic `comment-new-<n>` id, the demo author, and an ISO `createdAt` is returned

### Requirement: Seeded placeholder comment fixtures

Fixtures MUST seed 2 comments on `post-1`, 1 on `post-3`, and 0 on `post-2`, each flagged `isPlaceholder: true`; the flag MUST be discoverable by a single search and MUST NOT fail build, lint, or tests.

#### Scenario: Seed counts per post

- GIVEN the comment fixtures
- WHEN grouped by `postId`
- THEN `post-1` has 2, `post-3` has 1, `post-2` has 0

#### Scenario: Placeholders are flagged and non-blocking

- GIVEN the seeded comments
- WHEN inspected and the suite/build run
- THEN each carries `isPlaceholder: true`
- AND build, lint and tests pass

### Requirement: Comments store (zoneless, per post)

Comments MUST render from a `CommentsStore` whose state is a `signal` keyed by post id — `Record<string, { status: 'idle' | 'loading' | 'ready' | 'empty'; comments: Comment[] }>` — with gateway responses written into the signal so the zoneless app paints. A `computed` MUST NOT be created per post inside the view loop.

#### Scenario: Load a post thread

- GIVEN a post with seeded comments
- WHEN `load(postId)` settles
- THEN status is `ready` and that post's comments are exposed

#### Scenario: Empty thread state

- GIVEN a post with no comments
- WHEN `load(postId)` settles
- THEN status is `empty`

#### Scenario: Loading state

- GIVEN `load(postId)` is pending
- WHEN the state is read
- THEN status is `loading`

#### Scenario: Add appends chronologically

- GIVEN a loaded thread
- WHEN `add(postId, body)` resolves
- THEN the new comment appears after the existing ones and status is `ready`

### Requirement: Authenticated comment composer

Every authenticated role (`worker`, `company`, `admin`) MUST see a per-post comment composer and MAY create comments; anonymous MUST NOT see it and MUST NOT create comments.

#### Scenario: Every authenticated role has a composer

- GIVEN a `worker`, `company`, or `admin` session
- WHEN `/plataforma` renders
- THEN each post shows a comment composer

#### Scenario: Anonymous has no composer

- GIVEN no session
- WHEN the feed renders
- THEN no comment composer is present
- AND no comment can be created

### Requirement: Per-post composer accessibility

Each per-post composer MUST expose a unique control id `comment-content-<postId>` bound to a real `<label>`, so the feed a11y scan finds no `duplicate-id` violation.

#### Scenario: Control ids are unique per post

- GIVEN multiple posts render
- WHEN the composer ids are collected
- THEN each equals `comment-content-<postId>` and all are distinct

#### Scenario: Feed a11y scan passes

- GIVEN the feed renders with an authenticated session
- WHEN AXE scans `/plataforma`
- THEN no `duplicate-id` or `label` violation occurs
