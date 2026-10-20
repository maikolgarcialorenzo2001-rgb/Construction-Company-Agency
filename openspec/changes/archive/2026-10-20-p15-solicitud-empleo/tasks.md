# Tasks: p15-solicitud-empleo — Plantilla 2 (worker job-request)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600–740 (WU1 200–240 · WU2 260–320 · WU3 260–320) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base boundary |
|------|------|-----------|---------------|
| WU1 | Data foundation (kind, registry, seeds, mapper) | PR 1 | `feature/p15-solicitud-empleo` tracker branch |
| WU2 | Create path + structured card | PR 2 | WU1 branch |
| WU3 | Worker composer + a11y gates | PR 3 | WU2 branch |

### Slice dependency diagram

```
feature/p15-solicitud-empleo
   └─ WU1 ──▶ WU2 ──▶ WU3 ──▶ merge to main
```

Per slice: `bunx ng test --watch=false` + `bunx ng build` + `bunx ng lint`. TDD RED→GREEN→REFACTOR. R3: never stage `angular.json`.

## Slice WU1 — Data foundation

- [x] 1.1 RED `mocks/job-request.registry.spec.ts`: seeded record/get; reset empties (specs/platform-job-request: registry scenarios).
- [x] 1.2 GREEN create `mocks/job-request.registry.ts`: `Map<postId,JobRequestPayload>`, `recordJobRequest`/`getJobRequest`/`resetJobRequestRegistry` seeded from fixtures.
- [x] 1.3 RED `post-views.spec.ts`: registry hit → `kind:'job-request'`+payload; miss → key omitted; `isRenderablePostView` unchanged.
- [x] 1.4 GREEN widen `PostKind`+add `JobRequestPayload`/`PostView.jobRequest?` (`domain/models.ts`); derive in `toPostView` (`mocks/post-views.ts`).
- [x] 1.5 RED `fixtures.spec.ts`: ≥2 seeds renderable, author-resolvable; `JOB_REQUEST_SEEDS`.
- [x] 1.6 GREEN append 2–3 TEXT-ONLY seeds at `FEED_POSTS` tail (`mocks/fixtures.ts`) — `images: 11` invariant.
- [x] 1.7 Add `resetJobRequestRegistry()` to `beforeEach`/`afterEach` of every spec creating job-request posts (R1). Verify WU1; commit.

## Slice WU2 — Create path + structured card

- [x] 2.1 RED `mock-gateways.spec.ts`: `create(draft)` author-aware write → registry entry (author-aware scenario).
- [x] 2.2 GREEN `api/ports.ts` add `CreatePostDraft`; widen `FeedGateway.create(draft)`; `mock-feed.gateway.ts` author-aware + `recordJobRequest`.
- [x] 2.3 Update all `create` call sites in `mock-gateways.spec.ts` to draft arg.
- [x] 2.4 RED `feed.store.spec.ts`: `create(draft)` carries payload/attachments.
- [x] 2.5 GREEN `store/feed.store.ts` `create(draft)`.
- [x] 2.6 RED `post-job-request.component.spec.ts`: es-AR labels + testids render.
- [x] 2.7 GREEN create `components/post-job-request/*` structured card.
- [x] 2.8 RED `feed.page.spec.ts`: card projected into `[postExtra]`, `[postBody]` clean, standard unchanged.
- [x] 2.9 GREEN `feed.page.ts` project card when `kind==='job-request' && jobRequest` (shell untouched). Verify WU2; commit.

## Slice WU3 — Composer + a11y gates

- [x] 3.1 RED `job-request-composer.component.spec.ts`: 4 requireds; text-or-photo (Q1=a); structured-only rejected; no *zona*.
- [x] 3.2 GREEN create `components/job-request-composer/*` (NonNullableFormBuilder + Validators; `markAllAsTouched` + `role=alert` + focus).
- [x] 3.3 RED `feed.page.spec.ts`: worker→form, company→textarea, admin→none; worker cannot use company composer.
- [x] 3.4 GREEN `feed.page.ts` role-differentiated composer wiring; company path stays signal-based.
- [x] 3.5 RED `feed.page.spec.ts`: explicit label/accessible-name assertions for every worker control (D11); unique ids.
- [x] 3.6 Review `app.release-matrix.spec.ts` (`/plataforma` `images: 11`) + `app.a11y.spec.ts` (admin-seeded; composer-free) still green.
- [x] 3.7 Verify full suite, build, lint; commit. Rollback: revert owning commit per slice.
