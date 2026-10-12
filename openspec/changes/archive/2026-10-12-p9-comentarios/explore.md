# Exploration: p9-comentarios — Comment domain model + fixtures (HANDOFF §10 Paso 3)

**Change**: `p9-comentarios` · **Phase**: explore · **Date**: 2026-10-12
**Scope lock**: no contract change (`contracts/openapi.yaml` READ-ONLY). Comments are demo fixtures only (§10.2).

---

## TL;DR (the answers)

| Question | Answer |
|---|---|
| New capability or content-model delta? | **New capability `platform-comments`** (+ one MODIFIED requirement in `platform-feed` for the inline attach point). NOT `content-model` — that capability owns static marketing data under `src/content/`, not platform runtime domain. |
| Inline thread vs post-detail page? | **Inline thread.** Smaller, no route/guard/SEO/a11y-target churn, auto-covered by the existing feed a11y scan. |
| Where does `Comment` live? | `src/app/core/platform/domain/models.ts`, next to `Post` (currently `models.ts:67-79`). |
| Can it break the build? | Only if `Comment` is added to `contract-conformance.ts` — **do not add it**; there is no `Comment` schema in `schema.gen.ts`. |
| Who can comment? | All authenticated roles (`effectiveRole() !== null`); anonymous cannot. (Confirm in proposal.) |
| Size | ~460 changed lines incl. tests → **400-line budget risk: Medium/High** → 3 sequential work-unit commits. |

---

## Current State (verified, file:line)

### Domain models — `src/app/core/platform/domain/models.ts`
- `Role = 'worker' | 'company' | 'admin'` (`models.ts:13`); ids are plain `string` (`Post.id: string`, `models.ts:68`).
- `Post` shape mirrors the generated `FeedPost` (`models.ts:67-74`): `id, authorId, content, attachments?, createdAt, updatedAt?`.
- `PostInput` (`models.ts:76-79`); arrays are non-`readonly` on purpose (header comment `models.ts:1-10`).
- Barrel: `domain/index.ts:8` re-exports `./models` only. **`Comment`/`CommentInput` would go in `models.ts` and flow through this barrel.**

### Ports + mocks — `src/app/core/platform/api/ports.ts`
- Port pattern (`ports.ts:24-33`): plain interface returning `Promise<...>`; each behind an `InjectionToken<T>(name, { providedIn:'root', factory: () => new Mock*Gateway() })` (`ports.ts:92-118`).
- `FeedGateway` (`ports.ts:61-64`): `timeline(page?, pageSize?): Promise<Page<Post>>` + `create(input): Promise<Post>`.
- Mocks: `MockFeedGateway` (`mock-feed.gateway.ts:10-31`), `MockApplicationsGateway` (`mock-applications.gateway.ts:6-33`), jobs, auth, profiles.
- Mock create convention: synthetic id `post-new-${++sequence}` / `app-new-${…}`, `new Date().toISOString()`, hard-coded demo author (`mock-feed.gateway.ts:22-26`, `mock-applications.gateway.ts:14-16`).
- **DI wiring is inside `ports.ts` itself** (token factories), not `app.config.ts`. `app.config.ts:17-40` has no gateway providers — nothing to touch there.

### Fixtures — `src/app/core/platform/mocks/fixtures.ts`
- `Placeholder<T> = T & { readonly isPlaceholder: true }` (`fixtures.ts:22`).
- Seed pattern: `const seededX=[...] satisfies readonly Placeholder<T>[]` then `export const X = seededX satisfies readonly T[]` (e.g. feed `fixtures.ts:34-62`, jobs `66-105`, applications `109-132`).
- Posts seeded `post-1`/`post-2`/`post-3` authored by `company-1`,`company-1`,`worker-1` (`fixtures.ts:34-59`).
- `paginate<T>` helper (`fixtures.ts:197-199`) shared by list endpoints.

### Stores — `src/app/core/platform/store/`
- `FeedStore` (`feed.store.ts:20-43`): single `signal<State>` with `status: 'idle'|'loading'|'ready'|'empty'` + computed selectors; every gateway promise lands via `.state.set(...)` (zoneless rationale `feed.store.ts:14-19`).
- `JobsStore` (`jobs.store.ts:36-90`): **multiple independent signals** (`list`, `selection`, `applicationState`) — precedent for a per-key/independent signal design.
- `application-status.ts` (`store/application-status.ts`) — pure label mapper, precedent for a pure `Comment` selector/helper.

### UI surface — `src/app/pages/plataforma/feed.page.ts`
- `PlatformFeedPage` (`feed.page.ts:71-105`), standalone, OnPush, `inject(FeedStore)`, `inject(SessionService)`.
- `effectiveRole = input<Role|null> ?? session.role()` (`feed.page.ts:76-79`) — the p7 seam reused everywhere.
- Post render: `@for (post of store.posts(); track post.id)` → `<li data-testid="feed-post">` with content + `post.authorId` (`feed.page.ts:59-64`). **This `<li>` is the inline-thread attach point.**
- Composer is company-gated and uses a labeled `<textarea id="feed-post-content">` (`feed.page.ts:23-48`); template-reset gotcha handled at `feed.page.ts:100-103`.
- **No post-detail route exists.** Route table `app.routes.ts:97-162`: `/plataforma` (feed), `trabajos`, `trabajos/:id`, `login`, `registro`, `perfil` — all children behind `canActivate:[authGuard]` (per-route, `app.routes.ts:106,115,125,153`). `withComponentInputBinding()` is on (`app.config.ts:30`), so a `:id` would bind to an `input()` like `job-detail.page.ts:96`.

### Roles/permissions
- No role guard today; only `authGuard` (`app.routes.ts:106…`). Role awareness is per-component via `effectiveRole` (`feed.page.ts:79`, `job-detail.page.ts:102`, `nav.ts:39-40`).
- `SessionService.role` is `null` when anonymous (`session.service.ts:72`).

### Tests / a11y
- Store specs drive a zoneless harness with `detectChanges`+`whenStable` (`feed.store.spec.ts:16-35,53-68`).
- Page specs seed a session via `SESSION_STORAGE_KEY` and gate on `role` input (`feed.page.spec.ts:11-18,98-131`).
- Gateway/DI specs: `mock-gateways.spec.ts` (per-gateway describe) and `ports.spec.ts` (resolve + swap).
- a11y: `app.a11y.spec.ts:19-33` `TARGET_PATHS` includes `/plataforma`; rules (`:35-46`) include **`label`, `list`, `duplicate-id`, `button-name`**; the feed is scanned with a seeded **company** session (`:82-88`).

---

## Proposed Shape

### `Comment` (in `models.ts`)
```ts
export interface Comment {
  id: string;          // 'comment-1'
  postId: string;      // → Post.id
  authorId: string;    // 'worker-1' | 'company-1'
  authorName: string;  // denormalized display name (no network, no join)
  authorRole: Role;    // role badge / styling
  body: string;
  createdAt: string;
}
export interface CommentInput { postId: string; body: string; }
```
**Tradeoff**: denormalized `authorName`/`authorRole` are *not* contract-shaped, but there is no comments contract and the mock has no session/join (same rationale as `authorId: 'company-1'` hard-coding in `mock-feed.gateway.ts:21-23`). Alternative: keep only `authorId` and resolve the name in the mock from `WORKER_PROFILE`/`COMPANY_PROFILE` — more "honest" but couples the mock to profiles. Recommend denormalized for the demo.

### `CommentsGateway` (in `ports.ts`)
```ts
export interface CommentsGateway {
  list(postId: string): Promise<Comment[]>;      // thread for one post
  create(input: CommentInput): Promise<Comment>;
}
export const COMMENTS_GATEWAY = new InjectionToken<CommentsGateway>('COMMENTS_GATEWAY', {
  providedIn: 'root', factory: () => new MockCommentsGateway()
});
```
**Tradeoff**: `list` returns `Comment[]` (a thread is small/unbounded) instead of `Page<Comment>` (the list-endpoint convention). Simpler and matches "indexed by post". A `Page<Comment>` would be more consistent with `timeline`/`list` but adds envelope noise with no pagination UI.

### `MockCommentsGateway` (`api/mock-comments.gateway.ts`, new)
- `private readonly comments: Comment[] = [...COMMENTS]`; `list` filters by `postId` and returns a **copy** (or `paginate`-free array); `create` pushes `comment-new-${++sequence}` with `authorId: 'worker-1'` (demo), `createdAt: now` (mirrors `mock-feed.gateway.ts:18-30`).

### Fixtures (`mocks/fixtures.ts`)
- `seededComments satisfies readonly Placeholder<Comment>[]`, exported as `COMMENTS satisfies readonly Comment[]`.
- Seed **2 comments on `post-1`, 1 on `post-3`, 0 on `post-2`** to exercise ready + empty thread states. Ascending `createdAt`.

### `CommentsStore` (`store/comments.store.ts`, new)
- Zoneless, indexed by post id (precedent: `JobsStore` multiple signals, `feed.store.ts` set-only idiom).
```ts
export type CommentsStatus = 'idle' | 'loading' | 'ready' | 'empty';
export interface CommentsState { status: CommentsStatus; comments: Comment[]; }

@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly gateway = inject(COMMENTS_GATEWAY);
  readonly state = signal<Record<string, CommentsState>>({});

  async load(postId: string): Promise<void>;              // per post
  async add(postId: string, body: string): Promise<void>; // append (chronological)
}
```
- Page reads `store.state()[post.id]` directly (a plain record read off the tracked signal — do **not** build a `computed` per post inside the `@for`, that creates a new computed each CD).

### UI attach point (`feed.page.ts` inside the `feed-post` `<li>`, after `:64`)
- `<ul data-testid="comment-thread">` with `<li data-testid="comment">` per comment.
- Composer `@if (effectiveRole() !== null)`: `<label [attr.for]>` + `<textarea [attr.id]="'comment-content-'+post.id">` + submit; same `form.reset()` handler as the post composer (`feed.page.ts:100-103`).
- An `effect` that, on `store.posts()` change, calls `commentsStore.load(post.id)` once per post (precedent: `job-detail.page.ts:108-115`).
- **a11y**: unique per-post ids (AXE `duplicate-id`), real `<label>` (`label`), semantic `<ul>/<li>` (`list`), and `aria-live="polite"` on the thread for new comments (our obligation; not AXE-checked).

---

## The Fork — inline thread vs post-detail page

| Dimension | Inline thread (recommended) | Post-detail page |
|---|---|---|
| New files | none (1 store + 1 mock gateway) | + route entry, + page, + page spec |
| Routes/guards | none | new `/plataforma/publicaciones/:id` behind `authGuard` |
| SEO data payload | none | must author `NOINDEX(...)` per convention (`app.routes.ts:12-16`) |
| a11y coverage | **automatic** — feed is already in `TARGET_PATHS` | must add a concrete seeded id to `TARGET_PATHS` |
| Feed page change | +~35 lines (thread + composer + effect) | feed needs a link per post (still a change) + new page |
| Test surface | extend `feed.page.spec.ts` | new `post-detail.page.spec.ts` |
| Effort | Low | Medium |
| Demo fit | Matches §10.3 wording "hilo inline" / "hilo funcional en modo demo" | Overkill for a static preview |

**Recommendation: inline thread.** It is the smaller, cleaner fit for a static demo, reuses the p7 `effectiveRole` seam and the existing a11y scan, and introduces no route/guard/SEO surface. Downside: the feed grows tall — acceptable for a demo (and can be collapsed per post later).

---

## Spec-delta candidates

- **New capability `platform-comments`** — the domain (model + port + mock + fixtures + store) is independent and mirrors the existing per-domain split (`platform-feed`, `platform-jobs`, `platform-identity`). Requirements: comment gateway port, zoneless per-post store, authenticated composer, seeded threads.
- **MODIFIED delta to `platform-feed`** — one requirement: the feed renders an inline comment thread per post. (The attach point is the only coupling.)
- **NOT `content-model`** — that capability is about typed static site content under `src/content/` (`content-model/spec.md:1-7`); comments are platform runtime domain.
- **No `api-conformance`/`contract-conformance` delta** — there is no `Comment` schema in `schema.gen.ts` (grep: zero `Comment` matches). Adding `Comment` pairs to `contract-conformance.ts` would be a **build break**.

---

## Risks

1. **`contract-conformance.ts` foot-gun** — must NOT gain `Comment` pairs; `bunx ng build` type-checks it against the generated schema.
2. **AXE `duplicate-id`** — per-post composer/textarea ids must be unique (`[attr.id]="'comment-content-'+post.id"`); a static `id` per post would fail the existing feed scan.
3. **Effect loop / double-load** — loading each thread in an `effect` keyed on `store.posts()` must guard against re-loading on every CD.
4. **Uncontrolled textarea reset** — the comment composer needs the same `form.reset()` handling (`feed.page.ts:100-103`).
5. **Store shape** — a `computed` per post inside `@for` is an anti-pattern; read the record from `state()` instead.
6. **Open question** — comment author identity in the mock is a hard-coded demo user (no session); seeded `authorName`/`authorRole` disambiguate within fixtures but a *new* comment always shows the demo author.

## Open Questions (for proposal/user)

1. Who comments? Recommendation: **all authenticated roles** (`effectiveRole() !== null`), anonymous excluded. Confirm.
2. Should the composer be visible only on demand (expand) or always per post? Recommendation: always (simplest demo).
3. `list` returns `Comment[]` vs `Page<Comment>`? Recommendation: `Comment[]`.

---

## Size estimate (rough)

| Area | Changed lines (incl. tests) |
|---|---|
| `models.ts` (+Comment/+CommentInput) | ~18 |
| `ports.ts` (+interface/+token) | ~12 |
| `mock-comments.gateway.ts` (new) | ~35 |
| `fixtures.ts` (+seeded comments) | ~40 |
| `comments.store.ts` (new) | ~45 |
| `feed.page.ts` (+thread/composer/effect) | ~38 |
| `comments.store.spec.ts` (new) | ~90 |
| `mock-gateways.spec.ts` / `ports.spec.ts` (+cases) | ~65 |
| `feed.page.spec.ts` (+cases) | ~60 |
| **Total** | **~400+** |

**400-line budget risk: Medium/High.** With strict TDD (tests ≈ production), split into 3 sequential work-unit commits: (1) domain+port+fixtures+gateway+tests, (2) store+tests, (3) UI attach+a11y+tests. Locked delivery mode is `auto` → sequential local commits on `main`, each ≤400 lines, no pushes.

**Files touched**: 4 prod modified (`models.ts`, `ports.ts`, `fixtures.ts`, `feed.page.ts`) + 2 prod new (`mock-comments.gateway.ts`, `comments.store.ts`) + 4 test files (`comments.store.spec.ts` new; `mock-gateways.spec.ts`, `ports.spec.ts`, `feed.page.spec.ts` extended). `app.a11y.spec.ts` unchanged (inline lands on the already-scanned feed).

---

## Ready for Proposal

**Yes.** The proposal should lock: (a) new capability `platform-comments` + MODIFIED `platform-feed` requirement; (b) inline thread; (c) `Comment` denormalized author shape; (d) `list(postId): Promise<Comment[]>`; (e) all-authenticated composer; (f) the 3-slice work-unit plan. Get a yes/no on the composer audience (Open Question 1) before spec.
