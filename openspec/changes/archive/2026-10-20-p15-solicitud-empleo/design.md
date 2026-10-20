# Design: p15-solicitud-empleo — Plantilla 2 (worker job-request)

## Technical Approach

Approach 1 (projected kind card). Widen the demo-only `PostKind`, carry the structured payload in a demo-only registry, and derive `kind`/`jobRequest` in `toPostView`. Structured fields render ONLY through `[postExtra]` (via a new card component); free text stays `[postBody]`. `isRenderablePostView` and the contract are byte-identical. The composer becomes role-differentiated; the worker form uses `ReactiveFormsModule` (quote.page precedent) with the Q1=a composite rule enforced at submit.

## Architecture Decisions

| # | Rejected | Decision (why) |
|---|---|---|
| D1 Registry | Widen `Post`; infer kind from author | Module `mocks/job-request.registry.ts`: `Map<postId, JobRequestPayload>` seeded from fixtures, `recordJobRequest`/`getJobRequest`/`resetJobRequestRegistry`. Author can't imply kind (post-3/5/7/8 are worker-authored *standard*). |
| D2 Mapper | Parametrize `toPostView` | Reads the registry: hit → `kind:'job-request'` + payload; miss → `'standard'` (key omitted). Stays side-effect-free (`computed()`-safe); existing `toEqual` specs hold. |
| D3 Create port | Add fields to `PostInput` | New demo `CreatePostDraft {authorId, kind, content, attachments?, jobRequest?}`; `FeedGateway.create(draft)`. `PostInput` is conformance-locked; `authorId` leaves hardcoded `company-1`. |
| D4 Composer shape (**Q2**) | Kind selector; admin company-style | Role-differentiated, **admin → none**. Role maps 1:1 to its marketplace action; admin is moderation-only (`/plataforma/admin`); and the release/a11y gates seed admin, so keeping admin composer-free preserves `/plataforma` `images: 11` and the axe surface. |
| D5 Worker form | Inline in feed.page | Extracted `JobRequestComposerComponent` (NonNullableFormBuilder + Validators); company textarea stays signal-based. Isolates the form + module import; keeps the page lean. |
| D6 Composite rule (**Q1=a**) | Extend predicate | Submit-time: 4 requireds valid AND (text OR ≥1 photo). Predicate untouched. Reject → `markAllAsTouched()` + es-AR `role=alert` + focus first invalid (quote.page precedent). |
| D7 Photos (**Q3**) | URL text fields | File picker → object URLs, cap 10, labeled input + alt previews; `URL.createObjectURL` stubbed in jsdom (clipboard/IO precedent). Session-scoped exactly like the in-memory gateway. Admin-only gates never render the composer, so previews can't break the matrix. |
| D8 Card | Shell switch on kind | `PostJobRequestComponent` projected into the always-present `[postExtra]` when `kind==='job-request' && jobRequest`. Shell untouched; free text remains `[postBody]`. |
| D9 Seeds (**Q5**) | Insert at top; photo seeds | **Append** 2–3 **text-only** job-request posts at the `FEED_POSTS` tail: `/plataforma` `images` stays 11, index-based feed specs (`posts[5]/[8]`) stay stable, and each seed is renderable + meaningful in `/previa`. |
| D10 `/previa` (**Q6**) | Sync composer there | **Unchanged.** `/previa` renders `previewViewModelFor` fixtures, never `PlatformFeedPage`; no composer is visible. Structured card is a `/plataforma` feature. |
| D11 a11y gate | Rely on `app.a11y.spec` | The release gate seeds admin (no composer); add explicit label/accessible-name assertions for every worker control in `feed.page.spec.ts`. |
| D12 R1 isolation | Rely on vitest `isolate` | `resetJobRequestRegistry()` re-seeds from fixtures; call in `beforeEach`/`afterEach` of any spec that creates job-request posts. Gateway instance state is already per-`TestBed`. |

## Data Flow

```
worker form ──(4 requireds ∧ (text ∨ photo))──▶ JobRequestComposerComponent
   └─ output JobRequestDraft ─▶ feed.page ─▶ FeedStore.create(draft)
         └─▶ MockFeedGateway.create  ──recordJobRequest(postId,payload)──▶ Registry
                                              └─ returns contract Post (no kind)
render: store.posts() ─▶ toPostView(post) ──getJobRequest(id)──▶ PostView{kind,jobRequest?}
        ─▶ [postBody]=content   [postExtra]=app-post-job-request[payload]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `core/platform/domain/models.ts` | Modify | Widen `PostKind`; add `JobRequestPayload`; `PostView.jobRequest?` |
| `core/platform/mocks/job-request.registry.ts` (+spec) | Create | Seeded map, record/get/reset |
| `core/platform/mocks/fixtures.ts` (+spec) | Modify | 2–3 appended text-only seeds + `JOB_REQUEST_SEEDS` |
| `core/platform/mocks/post-views.ts` (+spec) | Modify | Derive kind/payload from registry |
| `core/platform/api/ports.ts` | Modify | `CreatePostDraft`; `create(draft)` |
| `core/platform/api/mock-feed.gateway.ts` | Modify | Author-aware + registry write |
| `core/platform/api/mock-gateways.spec.ts` | Modify | Draft-arg create |
| `core/platform/store/feed.store.ts` (+spec) | Modify | `create(draft)` |
| `components/job-request-composer/*` | Create | Reactive worker form, composite rule, photos |
| `components/post-job-request/*` | Create | Structured card (es-AR labels, testids) |
| `pages/plataforma/feed.page.ts` (+spec) | Modify | Role diff, composer wiring, `[postExtra]` projection, composer a11y asserts |

## Interfaces / Contracts

```ts
// demo-only, no contract-conformance entry
export type PostKind = 'standard' | 'job-request';
export interface JobRequestPayload { position: string; availability: string; modality: string; experience: string; }
export interface PostView { /* unchanged fields */ kind: PostKind; jobRequest?: JobRequestPayload; }

// api/ports.ts — demo provenance, not the contract
export interface CreatePostDraft { authorId: string; kind: PostKind; content: string; attachments?: string[]; jobRequest?: JobRequestPayload; }
export interface FeedGateway { timeline(page?: number, pageSize?: number): Promise<Page<Post>>; create(draft: CreatePostDraft): Promise<Post>; }
```

## Testing Strategy

| Slice | Spec (RED first) | Proves |
|---|---|---|
| WU1 | `job-request.registry.spec`, `post-views.spec`, `fixtures.spec` | record/get/reset from seeds; kind+payload derivation; standard unchanged; seeds renderable & author-resolvable |
| WU2 | `mock-gateways.spec`, `feed.store.spec`, `post-job-request.spec`, `feed.page.spec` | author-aware create + registry write; card projected via `[postExtra]`, `[postBody]` clean |
| WU3 | `job-request-composer.spec`, `feed.page.spec`, `app.a11y.spec` | 4 requireds; text-or-photo; structured-only rejected; admin none; labels/names |

Per slice: `bunx ng test --watch=false` + `bunx ng build` + `bunx ng lint`.

## Migration / Rollout — Chained PRs

Additive; no migration. Rollback = revert the owning commit (composer → company-only; card/registry unreferenced). Forecast ~600–740 lines → `Decision needed before apply: Yes · Chained PRs recommended: Yes · 400-line budget risk: High`. Chain (stacked-to-main):

- **WU1 data foundation** (~200–240): models + registry + fixtures + mapper + specs. Start: `PostKind` widen. Finish: `post-views.spec` green on kind derivation + reset. Rollback: revert commit.
- **WU2 create path + card** (~260–320): ports + gateway + store + card + `feed.page` projection + specs. Dep: WU1. Finish: seeded card renders via `[postExtra]`. Rollback: revert commit.
- **WU3 composer + gates** (~260–320): composer + role-diff + composer a11y/label specs + release-matrix review. Dep: WU2. Finish: worker publishes end-to-end; gates green. Rollback: revert commit.

## Open Questions

None blocking. Non-blocking: (a) whether a later slice should render structured cards on `/previa` (out of scope here); (b) Plantilla 3 vocabulary/contact edge (flagged in explore R4, not designed).
