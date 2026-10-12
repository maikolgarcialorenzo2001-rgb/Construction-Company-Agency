# Design: p9-comentarios — Comments domain model + fixtures (demo mode)

## Architecture Overview

Comments are demo-only (static fixtures) with no backend and no OpenAPI change. 
- New capability: `platform-comments` (model, port, in-memory mock gateway, fixtures, zoneless per-post store). 
- Modified: `platform-feed` (attach inline comment thread + composer inside each post `<li>`). 
- DI follows the existing pattern: `CommentsGateway` interface + `COMMENTS_GATEWAY` `InjectionToken` with factory returning `MockCommentsGateway` (all in `api/ports.ts`). No changes to `app.config.ts`. 
- Data model mirrors existing conventions (`Post`/plain string ids). Comments are indexed by `postId` and stored per-post in `CommentsStore` using zoneless signals.

## Component/File Map (paths)

| Component | Path | Type | Notes |
|---|---|---|---|
| Comment model + CommentInput | `src/app/core/platform/domain/models.ts` | Modified | Add next to `Post`/`PostInput`. Re-exported via `domain/index.ts`. |
| CommentsGateway + token | `src/app/core/platform/api/ports.ts` | Modified | Interface + `COMMENTS_GATEWAY` token with `providedIn: 'root'`, factory `() => new MockCommentsGateway()`. |
| MockCommentsGateway | `src/app/core/platform/api/mock-comments.gateway.ts` | New | In-memory mock gateway; mirrors `MockFeedGateway` conventions (sequence id, `new Date().toISOString()`, demo author). |
| Fixtures (comments seed) | `src/app/core/platform/mocks/fixtures.ts` | Modified | Add `seededComments` (satisfies `readonly Placeholder<Comment>[]`) and export `COMMENTS = seededComments satisfies readonly Comment[]`. Seed: post-1 (2), post-3 (1), post-2 (0). |
| CommentsStore (zoneless) | `src/app/core/platform/store/comments.store.ts` | New | Per-post state (idle/loading/ready/empty), `load(postId)`, `add(postId, body)`. Read-only via record; no per-post `computed` inside `@for`. |
| Feed page (inline thread + composer + effect) | `src/app/pages/plataforma/feed.page.ts` | Modified | Attach thread/composer inside each `feed-post` `<li>` (after post body). Unique per-post composer ids, labeled textarea, `aria-live="polite"` on thread, gated on `effectiveRole() !== null`. Add effect to load per post (guarded). |

## Data Flow

1. Feed renders posts via `FeedStore.posts()`. 
2. For each post, `CommentsStore.state()[post.id]` is read to render thread status (loading/empty/ready) and comments (chronological by `createdAt`). 
3. On first render/change of `store.posts()`, an `effect` calls `commentsStore.load(post.id)` once per post (idempotent/guarded). 
4. Composer (authenticated only): user types body, submit calls `commentsStore.add(post.id, body)`; store uses `COMMENTS_GATEWAY.create(...)` to produce a new `Comment` (demo author), appends to in-memory list, updates state to `ready` with comments in ascending `createdAt` order. 
5. UI re-renders; `aria-live="polite"` announces appended comment.

## Interfaces (exact signatures)

### Model (`src/app/core/platform/domain/models.ts`)
```ts
export interface Comment {
  id: string;          // e.g. 'comment-1' or 'comment-new-N'
  postId: string;      // Post.id
  authorId: string;    // demo author id
  authorName: string;  // denormalized display name (mock-only)
  authorRole: Role;    // 'worker'|'company'|'admin'
  body: string;
  createdAt: string;   // ISO8601
}

export interface CommentInput {
  postId: string;
  body: string;
}
```

Notes: `Comment` lives in `domain/models.ts` (next to `Post`/`PostInput`). Barrel `domain/index.ts` already re-exports `./models`; no barrel change required. 

### Port + token (`src/app/core/platform/api/ports.ts`)
```ts
export interface CommentsGateway {
  list(postId: string): Promise<Comment[]>;
  create(input: CommentInput): Promise<Comment>;
}

export const COMMENTS_GATEWAY = new InjectionToken<CommentsGateway>('COMMENTS_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockCommentsGateway()
});
```

Choice: `list(postId)` returns `Comment[]` (thread-sized, no pagination UI). Consistent with "indexed by post". 

### Mock gateway (`src/app/core/platform/api/mock-comments.gateway.ts`)
```ts
@Injectable({ providedIn: 'root' }) // or just class constructed by token factory
export class MockCommentsGateway implements CommentsGateway {
  private static seq = 0;
  private readonly comments: Comment[] = [...COMMENTS];

  async list(postId: string): Promise<Comment[]> {
    const list = this.comments.filter(c => c.postId === postId);
    // return copy to avoid external mutation of internal array
    return list.map(c => ({ ...c }));
  }

  async create(input: CommentInput): Promise<Comment> {
    const now = new Date().toISOString();
    const c: Comment = {
      id: `comment-new-${++MockCommentsGateway.seq}`,
      postId: input.postId,
      authorId: 'worker-1',        // demo author
      authorName: 'Demo Worker',    // denormalized (mock-only)
      authorRole: 'worker',
      body: input.body.trim(),
      createdAt: now
    };
    this.comments.push(c);
    return { ...c };
  }
}
```

Conventions mirror `MockFeedGateway` (synthetic id, `new Date().toISOString()`, hard-coded demo author). Returns copies on read/write where practical. 

### Fixtures (`src/app/core/platform/mocks/fixtures.ts`)
```ts
const seededComments = [
  { id: 'comment-1', postId: 'post-1', authorId: 'worker-1', authorName: 'Demo Worker', authorRole: 'worker', body: 'Buen punto, comparto la misma inquietud.', createdAt: '2025-10-01T09:15:00.000Z', isPlaceholder: true as const },
  { id: 'comment-2', postId: 'post-1', authorId: 'company-1', authorName: 'Constructora Norte', authorRole: 'company', body: 'Te respondemos por interno para coordinar.', createdAt: '2025-10-01T10:00:00.000Z', isPlaceholder: true as const },
  { id: 'comment-3', postId: 'post-3', authorId: 'worker-1', authorName: 'Demo Worker', authorRole: 'worker', body: 'Gracias por el aviso.', createdAt: '2025-10-01T11:30:00.000Z', isPlaceholder: true as const },
] satisfies readonly Placeholder<Comment>[];

export const COMMENTS = seededComments satisfies readonly Comment[];
```

Counts: post-1 has 2, post-3 has 1, post-2 has 0 (exercises ready+empty states). Ascending `createdAt`. Uses `isPlaceholder: true` and the existing `Placeholder<T>` type.

### Store (`src/app/core/platform/store/comments.store.ts`)
```ts
export type CommentsStatus = 'idle' | 'loading' | 'ready' | 'empty';
export interface CommentsState {
  status: CommentsStatus;
  comments: Comment[];
}

@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly gateway = inject(COMMENTS_GATEWAY);
  readonly state = signal<Record<string, CommentsState>>({});

  async load(postId: string): Promise<void> {
    const current = this.state()[postId];
    // Guard: avoid re-loading if already loading or ready (prevents effect loops)
    if (current?.status === 'loading' || current?.status === 'ready') return;
    this.state.update(s => ({ ...s, [postId]: { status: 'loading', comments: current?.comments ?? [] } }));
    try {
      const comments = await this.gateway.list(postId);
      const sorted = [...comments].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      this.state.update(s => ({ ...s, [postId]: { status: sorted.length ? 'ready' : 'empty', comments: sorted } }));
    } catch {
      // Demo-only: keep previous state or mark empty; no error UI required by spec
      this.state.update(s => ({ ...s, [postId]: { status: (current?.comments?.length ? 'ready' : 'empty'), comments: current?.comments ?? [] } }));
    }
  }

  async add(postId: string, body: string): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) return;
    const created = await this.gateway.create({ postId, body: trimmed });
    this.state.update(s => {
      const prev = s[postId] ?? { status: 'ready', comments: [] };
      const nextComments = [...prev.comments, created].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      return { ...s, [postId]: { status: 'ready', comments: nextComments } };
    });
  }
}
```

Constraints/notes: zoneless (no zone deps), indexed by post id. Never create a `computed` per post inside `@for` (read `state()[post.id]` directly). Guard in `load` prevents effect re-load loops. `add` appends optimistically via server result (gateway returns created comment) and sorts by `createdAt`. 

## UI/a11y decisions

- Attach point: inside `feed-post` `<li data-testid="feed-post">`, after the post content block (after line ~64 in `feed.page.ts`), render the comment thread block. 
- Thread: semantic `<ul class="comments-list" data-testid="comment-thread">` with `<li class="comment-item" data-testid="comment">` per comment. Show author name and role badge, body, timestamp (readable). 
- Composer: shown only when `effectiveRole() !== null` (all authenticated roles). 
- Unique ids: `comment-content-${post.id}` for textarea; label `for` must match. Avoid static ids (prevents AXE `duplicate-id`). 
- Labeling: real `<label for="comment-content-{{post.id}}">` in Spanish UI copy (es-AR) as requested for UI; the design artifact is English but runtime UI strings remain es-AR. 
- Live region: `aria-live="polite"` on the thread container (or status region) so appended comments are announced to AT. 
- Keyboard/access: submit button labeled (es-AR), textarea required/trimmed, same form reset pattern as post composer (`form.reset()` handler). 
- Effect: on `store.posts()` changes, iterate posts and call `commentsStore.load(post.id)` once per post (guarded). Do not call on every CD beyond guarded checks. 

## Critical build guard

**Do NOT add `Comment` to `contract-conformance.ts`.** `schema.gen.ts` contains no `Comment` schema; adding Comment pairs to `contract-conformance.ts` will cause type checking/build to break (`bunx ng build`). This is explicitly flagged as a risk and must not be done (no contract change). 

## TDD plan (what to assert first)

Write specs in this order (Strict TDD). Each spec asserts behavior before implementation of the corresponding production code.

1. **Model spec** (`domain/models.spec.ts` or covered via type tests where trivial) — assert `Comment` shape matches interface (required fields: id, postId, authorId, authorName, authorRole, body, createdAt). `CommentInput` has postId, body. 
2. **Port/token wiring spec** (`ports.spec.ts` extension) — `inject(COMMENTS_GATEWAY)` resolves to `MockCommentsGateway` (token factory). Ensure token is providedIn root and interface methods exist. 
3. **Fixtures spec** (`mocks/fixtures.spec.ts` or assert in gateway spec) — `COMMENTS` includes seeded entries with `isPlaceholder: true`, counts: post-1 has 2, post-3 has 1, post-2 has 0. Entries sorted by createdAt or at least include those ids. 
4. **Mock gateway spec** (`mock-gateways.spec.ts` extension) — `list(postId)` filters correctly (returns copies), returns empty array for unknown post, `create` produces synthetic id `comment-new-N`, sets createdAt ISO, demo author, appends to internal list and is returned to caller. 
5. **Store spec** (`comments.store.spec.ts`, new) — zoneless harness (`TestBed.createComponent` not required; use `TestBed.inject` + detectChanges/whenStable as in `feed.store.spec.ts`). Cases: load sets status 'loading' then 'ready' with sorted comments; load post with 0 comments -> 'empty'; consecutive load for same post is guarded (no duplicate gateway calls) when already loading/ready; add appends comment, sets status 'ready', sorts by createdAt; add with empty/whitespace trimmed -> no-op; error path keeps previous state safely. 
6. **Feed thread UI spec** (`feed.page.spec.ts` extension) — renders seeded threads for posts (post-1 shows 2 comments, post-3 shows 1, post-2 shows 0/empty). Composer hidden when anonymous (`effectiveRole()=null`), visible when authenticated (company/worker/admin). Unique per-post textarea id (`comment-content-post-1`, `comment-content-post-3`), label present. Submitting adds a comment and appears in thread (append). `aria-live="polite"` present on thread. No AXE `duplicate-id` in rendered DOM for multiple posts. 

All tests run with `bunx ng test --watch=false` (Strict TDD). 

## Work-Unit slicing (≤400 lines per commit, sequential)

Total estimated ~400 lines (tests + production). Split into 3 reviewable work units:

| WU | Scope | Files | Key changes | Test focus |
|---|---|---|---|---|
| WU1 — Model + Port + Fixtures + Mock Gateway | domain + API surface + fixtures + mock impl + related specs | `models.ts`, `ports.ts`, `fixtures.ts`, `mock-comments.gateway.ts`, `ports.spec.ts` (ext), `mock-gateways.spec.ts` (ext), `mocks/fixtures.spec.ts` (new minimal) or assertions | Add `Comment`/`CommentInput`; add `CommentsGateway` + `COMMENTS_GATEWAY` token; seed comments (2/1/0); implement in-memory mock with sequence + copies. | Model shape, token wiring resolves mock, fixtures counts/shape, mock list/filter/create behavior (copies, ids, createdAt, demo author). |
| WU2 — CommentsStore (zoneless) | store + store specs | `comments.store.ts`, `comments.store.spec.ts` (new) | Implement per-post state, guarded `load`, `add` with sort, safe error handling. | status transitions, guard against duplicate loads, empty vs ready, add appends+sorts, trim/no-op, error path resilience. |
| WU3 — Feed inline thread + composer + a11y | UI + page specs | `feed.page.ts`, `feed.page.spec.ts` (ext) | Attach thread/composer inside each post `<li>`, unique per-post ids, labeled textarea, `aria-live="polite"`, effect to load per post (guarded), submit flow via store. | seeded thread rendering, role gating (anon vs auth), unique ids, append on submit, aria-live present, no duplicate-id across posts. |

Notes: each commit ≤ ~400 lines, sequential (auto delivery mode). Tests land with code (work-unit-commits requirement). No branches/pushes. `app.a11y.spec.ts` unchanged (feed already scanned). 

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `Comment` added to `contract-conformance.ts` breaks `ng build` | Med | High | Explicitly do NOT add it; no Comment schema in `schema.gen.ts`. Build guard noted in design and verify via build. |
| AXE `duplicate-id` on per-post composer | Med | Med | Use `[attr.id]="'comment-content-'+post.id"` and matching label `for`; test DOM for unique ids across multiple posts. |
| Effect re-load / loop | Med | Med | Guard in `load` (return if `loading` or `ready`); effect iterates posts and calls load (idempotent). Avoid per-post `computed` inside `@for`. |
| Uncontrolled textarea reset | Low | Low | Reuse same `form.reset()` handler as post composer in `feed.page.ts`. |
| Size ~400 lines | High | Med | 3 sequential work-unit commits (WU1–WU3) with tests included per unit. |
| Mock author identity (demo) | Low | Low | Denormalized `authorName`/`authorRole` in fixtures and mock; new comments use fixed demo author (documented as demo-only). |

## Rollback

Revert the 3 sequential work-unit commits on `main` (local). Production changes are additive except `feed.page.ts` (adds thread/composer block inside post `<li>`). Removing new files (`mock-comments.gateway.ts`, `comments.store.ts`), reverting modified files (`models.ts`, `ports.ts`, `fixtures.ts`, `feed.page.ts`) and test files restores feed to previous state. `contracts/openapi.yaml` remains untouched.

## Open Questions (resolved)

- Composer audience: **all authenticated roles** (`effectiveRole() !== null`); anonymous excluded (matches proposal). 
- List shape: `list(postId): Promise<Comment[]>` (no Page envelope). 
- Inline vs detail: inline thread (smaller, reuses feed a11y scan, no route/SEO surface). 

## Success Criteria (verification)

- [ ] `bunx ng build` passes (with Comment NOT in `contract-conformance.ts`). 
- [ ] `bunx ng test --watch=false` passes (Strict TDD, all specs green). 
- [ ] Feed shows seeded threads: post-1 has 2 comments, post-3 has 1, post-2 has 0/empty. 
- [ ] New comments append in demo mode; sorted by `createdAt`. 
- [ ] Composer only for authenticated roles; anonymous excluded. 
- [ ] Feed a11y scan passes (no `duplicate-id`); labels present; semantic list; `aria-live="polite"` on thread.