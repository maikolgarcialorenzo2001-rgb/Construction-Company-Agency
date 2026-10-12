# Tasks: p10-fixtures — Expanded demo fixtures (§10 Paso 4)

> Mode: hybrid · Data-only (no capability delta → spec/design skipped).
> Grounding: `explore.md` (#937). **`proposal.md` absent — see Provenance.**
> Strict TDD · `bunx ng test --watch=false` · commits on `main`, suffix `(p10-fixtures)`.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~190–260 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | WU1 → WU2 (2 sequential local commits on `main`, no branches) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Files | Commit |
|------|------|-------|--------|
| WU1 | Expand core fixtures (posts/comments/jobs/applications) + `fixtures.spec.ts` + feed-id re-pin | `mocks/fixtures.ts`, `mocks/fixtures.spec.ts`, `pages/plataforma/feed.page.spec.ts` | `test(mocks): expand demo fixtures and re-pin feed composer ids (p10-fixtures)` |
| WU2 | Profiles + accounts + gateway Map seeding + R1 verification | `mocks/fixtures.ts`, `api/mock-profiles.gateway.ts`, `mocks/fixtures.spec.ts` | `feat(mocks): seed extra profiles and demo accounts (p10-fixtures)` |

Targets: posts **9** · comments **12** · jobs **7** · applications **7** · profiles **3W/2C** · accounts **5**. All entries `isPlaceholder: true`; every list ≤ 20.

## WU1 — Core fixtures (posts · comments · jobs · applications)

RED:
- [x] 1.1 `src/app/core/platform/mocks/fixtures.spec.ts`: counts FEED_POSTS 9 / JOBS 7 / APPLICATIONS 7 / COMMENTS 12; every entry `isPlaceholder === true`; all lists ≤ 20.
- [x] 1.2 `fixtures.spec.ts`: referential integrity — every `comment.postId ∈` post ids; every `application.jobId ∈` job ids; every `application.applicantId ∈ {worker-1,worker-2,worker-3}`; each thread ascending `createdAt`.
- [x] 1.3 `src/app/pages/plataforma/feed.page.spec.ts:314`: replace the hard-coded id array with `FEED_POSTS.map((p) => 'comment-content-' + p.id)`.

GREEN:
- [x] 1.4 `fixtures.ts` `seededPosts` → 9: keep `post-1..3` verbatim (order + content); append `post-4..9`, varying `authorId` (company-1 / worker-1/2/3), content kind, optional `attachments` (data-only — the feed renders no `<img>`).
- [x] 1.5 `fixtures.ts` `seededComments` → 12: keep `comment-1`/`comment-2` (post-1, first two entries) and `comment-3` (post-3); append to post-1/3/4..9. **Sentinels exact: post-1 = 2, post-2 = 0, post-3 = 1.**
- [x] 1.6 `fixtures.ts` `seededJobs` → 7: keep `job-1` (open, Vicente López) / `job-2` (open, Villa Crespo CABA) / `job-3` (closed, Rosario); append `job-4..7` (varied rubro/location/status/budget, ≥ 1 closed).
- [x] 1.7 `fixtures.ts` `seededApplications` → 7 per **R1** below.
- [x] 1.8 Align seeded comment `createdAt` to 2026 (cosmetic, explore gotcha).

Verify: `bunx ng test --watch=false` — all green.

## WU2 — Profiles · accounts · gateway seeding

RED:
- [x] 2.1 `fixtures.spec.ts`: WORKER_PROFILES 3 (worker-1/2/3), COMPANY_PROFILES 2 (company-1/2), DEMO_ACCOUNTS 5, all `isPlaceholder`; every account `password === 'demo1234'`.

GREEN:
- [x] 2.2 `fixtures.ts`: add `WORKER_PROFILES` / `COMPANY_PROFILES` arrays (vary `skills`/`bio`/`location`); keep `WORKER_PROFILE` / `COMPANY_PROFILE` singletons `= [0]` so `perfil.page.ts:221,232` is untouched.
- [x] 2.3 `fixtures.ts`: `DEMO_ACCOUNTS` → 5 (keep `[0]`=worker-1, `[1]`=company-1; append worker-2, worker-3, company-2). `mock-gateways.spec.ts:133,170` use `[0]/[1]` → unchanged.
- [x] 2.4 `src/app/core/platform/api/mock-profiles.gateway.ts:16-21`: seed `workers` Map from `WORKER_PROFILES`, `companies` Map from `COMPANY_PROFILES`.

Verify: `bunx ng test --watch=false` + `bunx ng build`.

## R1 — one-application-per-job (enforced)

- `app-1` → job-1 / worker-1 / **accepted** — first row for job-1 (`APPLICATIONS[0]`).
- `app-2` → job-2 / worker-2 / **pending** — first row for job-2 (`APPLICATIONS[1]`).
- `job-3` → **zero** applications (`jobs.store.ts:76-77` filters by `jobId` only; `loadApplication(job-3)` → `none`).
- Whole array: exactly **one** `accepted`, exactly **one** `pending`.
- worker-1: exactly one app (`app-1`).
- `app-3..7`: status ∈ {`rejected`,`withdrawn`}; applicant ∈ {worker-2,worker-3}; `jobId ∈ {job-4..job-7}`; no extra app on job-1/job-2.

## Re-pin checklist — every literal (explore file:line)

| Spec | Lines | Pinned literal | Action |
|---|---|---|---|
| `mocks/fixtures.spec.ts` | 9-11, 22-37 | post-1=2/post-3=1/post-2=0; `COMMENTS[0]` identity; thread ts | keep (sentinels) |
| `api/mock-gateways.spec.ts` | 74-76, 97-98 | `accepted`==1 & `[0].jobId`==JOBS[0]; `pending`==1 | keep (R1) |
| `api/mock-gateways.spec.ts` | 106, 112-117 | worker-1→`['app-1']`; job-2+worker-2→`['app-2']`; job-1+worker-2→`[]` | keep (R1) |
| `api/mock-gateways.spec.ts` | 249-251, 258-260, 270, 292-298 | post-1→`['comment-1','comment-2']`; post-2→`[]`; `COMMENTS[0].body`; post-3 len 3 (1 seeded + 2 new) | keep (sentinels) |
| `pages/plataforma/feed.page.spec.ts` | 43-44, 221-235, 262-271 | posts[0..2] content + comment counts (post-1=2, post-2=0, post-3=1) | keep (order) |
| `pages/plataforma/feed.page.spec.ts` | **314** | `['comment-content-post-1','-post-2','-post-3']` | **EDIT → derive** |
| `pages/plataforma/feed.page.spec.ts` | 332, 370 | contains `comment-content-post-1`; posts[0] count 2+1=3 | keep (post-1=2) |
| `store/comments.store.spec.ts` | 49, 72-75, 120, 147-152, 200-213 | post-1→`['comment-1','comment-2']` | keep |
| `store/comments.store.spec.ts` | 89-90 | post-2 empty | keep |
| `store/jobs.store.spec.ts` | 57, 65-73, 118-122, 128-131 | JOBS[0] 'Albañil'; JOBS[1] 'Electricista'; JOBS[0] accepted; JOBS[2] none | keep (order + R1) |
| `pages/plataforma/job-detail.page.spec.ts` | 26, 32-34, 76, 90, 194 | JOBS[1]='Villa Crespo, CABA'; JOBS[0] accepted; JOBS[1] pending; JOBS[2] no app | keep (order + R1) |
| `store/feed.store.spec.ts` | 63, 66-67, 102 | `FEED_POSTS.length`; posts[0] 'Avance de obra…' | keep (post-1 first) |
| `pages/plataforma/jobs-list.page.spec.ts` | 29-31 | cards len `JOBS.length`; [0] 'Albañil'; [1] 'Electricista' | keep (order) |
| `pages/plataforma/perfil.page.spec.ts` | 53-54, 76 | worker-1 / company-1 fields | keep |

## Guards (not literals, must stay green)

- `app.release-matrix.spec.ts:44-49`: `/plataforma/*` render **0** images → never render `attachments` as `<img>`.
- `app.a11y.spec.ts:19-33`: `/plataforma` scanned as company; keep composer ids unique (`comment-content-{postId}`) and labeled.
- `fixtures.ts` `satisfies` clauses: valid enum values only (compile-time proof via `bunx ng build`).

## Final Gate

- [x] `bunx ng test --watch=false` — all green.
- [x] `bunx ng build` — green (`satisfies`/type proof).
- [x] `bunx ng lint` — clean.
- [x] `contracts/openapi.yaml` untouched.

## Rollback

Revert the 2 WU commits on `main` (local). Fixtures are data-only: no migration, no contract change; drop the added profile/account exports and the gateway Map lines.

## Locations

- OpenSpec: `openspec/changes/p10-fixtures/tasks.md`
- Engram: `sdd/p10-fixtures/tasks` (project `construction-company-agency`, `type: architecture`, `capture_prompt: false`).

## Provenance

`openspec/changes/p10-fixtures/proposal.md` was **absent** and no `sdd/p10-fixtures/proposal` exists in Engram. Tasks are grounded in `explore.md` (#937) plus direct inspection of the affected specs. Confirm the target counts/before apply if a proposal is expected.
