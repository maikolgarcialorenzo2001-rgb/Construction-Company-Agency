# Tasks: p9-comentarios — Comments domain model + fixtures

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~380–430 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | WU1 → WU2 → WU3 (3 sequential local commits on `main`) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Base |
|---|---|---|---|
| WU1 | Model + port + fixtures + mock gateway | PR 1 | main |
| WU2 | CommentsStore (zoneless) | PR 2 | main (depends WU1) |
| WU3 | Feed inline thread + composer + a11y | PR 3 | main (depends WU1+WU2) |

Each commit message ends with `(p9-comentarios)`.

## WU1 — Model + Port + Fixtures + Mock Gateway

RED:
- [x] 1.1 `api/ports.spec.ts`: `inject(COMMENTS_GATEWAY)` resolves `MockCommentsGateway`; TestBed override swaps the adapter.
- [x] 1.2 `api/mock-gateways.spec.ts`: `list('post-1')` filters + returns copies; unknown post → `[]`; `create` → `comment-new-1`, ISO `createdAt`, demo author.
- [x] 1.3 `mocks/fixtures.spec.ts` (new if absent): `COMMENTS` by postId → post-1:2, post-3:1, post-2:0; all `isPlaceholder: true`.

GREEN:
- [x] 1.4 `domain/models.ts`: add `Comment` + `CommentInput` (no barrel edit).
- [x] 1.5 `api/ports.ts`: add `CommentsGateway` + `COMMENTS_GATEWAY` token (providedIn root, factory `new MockCommentsGateway()`).
- [x] 1.6 `api/mock-comments.gateway.ts` (new): seq id, `new Date().toISOString()`, demo author, copy on read/write.
- [x] 1.7 `mocks/fixtures.ts`: add `seededComments` + `export const COMMENTS` (`satisfies readonly Placeholder<Comment>[]`).

GUARD:
- [x] 1.8 Do NOT add `Comment` to `domain/contract-conformance.ts`; run `bunx ng build`, confirm green.

Verify: `bunx ng test --watch=false` (WU1 green) + `bunx ng build` green.

## WU2 — CommentsStore

RED:
- [x] 2.1 `store/comments.store.spec.ts` (new; zoneless `TestBed.inject` + `detectChanges`/`whenStable`): load → `loading`→`ready` sorted; no comments → `empty`; duplicate `load` guarded (gateway once); `add` appends+sorts+`ready`; whitespace no-op; error keeps prior state.

GREEN:
- [x] 2.2 `store/comments.store.ts` (new): `signal<Record<string, CommentsState>>`, guarded `load(postId)`, `add(postId, body)`. No per-post `computed` in the view loop.

Verify: `bunx ng test --watch=false` — WU2 spec green.

## WU3 — Feed inline thread + composer + a11y

RED:
- [x] 3.1 `pages/plataforma/feed.page.spec.ts`: seeded threads (post-1:2, post-3:1, post-2 empty); composer hidden anon, visible worker/company/admin; ids `comment-content-post-1`/`-post-3` unique with matching `<label>`; submit appends; `aria-live="polite"`; no `duplicate-id`.

GREEN:
- [x] 3.2 `pages/plataforma/feed.page.ts`: inline thread + composer inside each `feed-post` `<li>`; unique ids, labeled textarea, `aria-live="polite"`, gated on `effectiveRole() !== null`; guarded `effect` loads per post; submit → `add` + `form.reset()`.

Verify: `bunx ng test --watch=false` + `bunx ng lint` green.

## Final Gate

- [x] `bunx ng test --watch=false` — all green (60 files / 547 passed).
- [x] `bunx ng lint` — no violations.
- [x] `bunx ng build` — green, `Comment` NOT in `contract-conformance.ts`.

## Rollback

Revert the 3 WU commits on `main` (local). Drop `mock-comments.gateway.ts` + `comments.store.ts`; revert `models.ts`, `ports.ts`, `fixtures.ts`, `feed.page.ts` + specs. `contracts/openapi.yaml` untouched.

## Locations

- OpenSpec: `openspec/changes/p9-comentarios/tasks.md`
- Engram: `sdd/p9-comentarios/tasks` (project `construction-company-agency`, `capture_prompt: false`)
