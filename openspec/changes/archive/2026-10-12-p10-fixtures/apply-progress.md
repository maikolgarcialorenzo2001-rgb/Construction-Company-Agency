# Apply Progress: p10-fixtures — Expanded demo fixtures (§10 Paso 4)

> Mode: hybrid · **Strict TDD** · Data-only (no capability delta) · `bunx ng test --watch=false`
> Delivery: `ask-on-risk` · Chain: `stacked-to-main` (sequential local commits on `main`).

## Status

**Complete** — WU1 + WU2 implemented, verified, and committed. All tasks `[x]`.

## Commits (local, on `main`)

| WU | SHA | Message |
|----|-----|---------|
| WU1 | `fd28696` | `test(mocks): expand demo fixtures and re-pin feed composer ids (p10-fixtures)` |
| WU2 | `38f3725` | `feat(mocks): seed extra profiles and demo accounts (p10-fixtures)` |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 counts 9/7/7/12 + ≤20 + `isPlaceholder` | `mocks/fixtures.spec.ts` | Unit | ✅ 547/547 | ✅ Written (4 failed) | ✅ 557 passed | ✅ 4 datasets | ✅ Clean |
| 1.2 referential integrity | `mocks/fixtures.spec.ts` | Unit | ✅ 547/547 | ✅ Written | ✅ 557 passed | ✅ post/job/worker + per-thread order | ✅ Clean |
| 1.3 re-pin `feed.page.spec.ts:314` | `pages/plataforma/feed.page.spec.ts` | Unit | ✅ 547/547 | ➖ data-driven re-pin (was green pre + post expansion) | ✅ 557 passed | ➖ Single | ✅ Derives from `FEED_POSTS` |
| 1.4 posts → 9 | `mocks/fixtures.ts` | Unit | ✅ 547/547 | ✅ (via 1.1) | ✅ 557 passed | ✅ author/content/attachments varied | ✅ Doc comment updated |
| 1.5 comments → 12 | `mocks/fixtures.ts` | Unit | ✅ 547/547 | ✅ (via 1.1) | ✅ 557 passed | ✅ sentinels 2/0/1 held | ✅ Doc comment kept |
| 1.6 jobs → 7 | `mocks/fixtures.ts` | Unit | ✅ 547/547 | ✅ (via 1.1) | ✅ 557 passed | ✅ ≥1 closed, varied | ✅ Doc comment updated |
| 1.7 applications → 7 (R1) | `mocks/fixtures.ts` | Unit | ✅ 547/547 | ✅ (via 1.1 R1 guard) | ✅ 557 passed | ✅ all 4 statuses | ✅ Doc comment updated |
| 1.8 comment dates → 2026 | `mocks/fixtures.ts` | Unit | ✅ 547/547 | ✅ (via 1.1 shape test) | ✅ 557 passed | ➖ Cosmetic | ✅ Clean |
| 2.1 profiles 3W/2C + accounts 5 | `mocks/fixtures.spec.ts` | Unit | ✅ 557/557 | ✅ Written (bundle fail: missing exports) | ✅ 563 passed | ✅ ids/order/skills/accounts | ✅ Clean |
| 2.2 `WORKER_PROFILES`/`COMPANY_PROFILES` | `mocks/fixtures.ts` | Unit | ✅ 557/557 | ✅ (via 2.1) | ✅ 563 passed | ✅ worker-2/3 + company-2 | ✅ Singletons `= [0]` kept |
| 2.3 `DEMO_ACCOUNTS` → 5 | `mocks/fixtures.ts` | Unit | ✅ 557/557 | ✅ (via 2.1) | ✅ 563 passed | ✅ `[0]`/`[1]` unchanged | ✅ Doc comment updated |
| 2.4 gateway Map seeding | `api/mock-gateways.spec.ts` | Unit | ✅ 557/557 | ✅ Written (worker-2 null) | ✅ 563 passed | ✅ worker-2/3 + company-2 resolve | ✅ Clean |

## Test Summary

- **Baseline (Safety Net)**: 547 tests / 60 files passing.
- **Final**: **563 tests / 60 files passing** (+16).
- **Tests written**: 16 (fixtures.spec 4 → 19; mock-gateways +1).
- **Layers used**: Unit (16).
- **Approval tests**: None — no refactoring tasks.
- **Pure functions created**: 0 (data-only change).
- **Other gates**: `bunx ng build` green · `bunx ng lint` clean.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/app/core/platform/mocks/fixtures.ts` | Modified | `FEED_POSTS` 3→9, `COMMENTS` 3→12 (dates aligned to 2026), `JOBS` 3→7, `APPLICATIONS` 2→7 (all 4 statuses); profiles → `WORKER_PROFILES` (3) / `COMPANY_PROFILES` (2) arrays with `WORKER_PROFILE`/`COMPANY_PROFILE` kept as `[0]`; `DEMO_ACCOUNTS` 2→5. Sentinels + `isPlaceholder` preserved. |
| `src/app/core/platform/mocks/fixtures.spec.ts` | Rewritten | Counts/limits/`isPlaceholder`, referential integrity, per-thread ascending `createdAt`, sentinel threads (2/0/1), R1 application guards, profile/account assertions. |
| `src/app/pages/plataforma/feed.page.spec.ts` | Modified | Re-pinned `:314` literal id array → `FEED_POSTS.map((p) => 'comment-content-' + p.id)` (single breaking literal). |
| `src/app/core/platform/api/mock-profiles.gateway.ts` | Modified | `workers`/`companies` Maps seeded from `WORKER_PROFILES`/`COMPANY_PROFILES`. |
| `src/app/core/platform/api/mock-gateways.spec.ts` | Modified | Added RED test: worker-2/3 + company-2 resolve from the seeded Map. |

## Deviations from Tasks/Design

1. **Comments only appended to `post-4..post-9`.** Task 1.5 text said "append to post-1/3/4..9", but the locked sentinels (post-1 = **2**, post-3 = **1**, post-2 = **0**) are binding and asserted by `feed.page.spec.ts`, `comments.store.spec.ts` and `mock-gateways.spec.ts:251`. Adding to post-1/post-3 would break them, so the 9 new comments land on post-4..9 only. Sentinel thread counts hold exactly.
2. **`job-4` carries two applications** (`app-3` rejected, `app-7` rejected). The itemized R1 spec allows `app-3..7` on `jobId ∈ {job-4..job-7}` (5 apps over 4 jobs). The binding invariant — exactly one app on `job-1` (accepted) / `job-2` (pending), zero on `job-3` — is preserved; no consumer reads `job-4`. `loadApplication` unchanged.
3. **Added one test to `mock-gateways.spec.ts`** (not listed in the tasks RED block) to TDD the gateway Map seeding (task 2.4), which would otherwise have no failing test. Strict-TDD compliant.

## Risks

| Risk | Status |
|------|--------|
| R1 — `loadApplication` first-row semantics | **Mitigated** — sentinels pinned + asserted in `fixtures.spec.ts`. |
| R2 — literal count/id assertions | **Mitigated** — only `feed.page.spec.ts:314` was a real literal; re-pinned to derive. All other guards pass unchanged. |
| R3 — list size >20 | **Mitigated** — max list is 12; asserted. |
| R4 — a11y over larger feed | **Green** — `app.a11y.spec.ts` passes (unique `comment-content-{postId}` ids). |
| R5 — `satisfies`/enum drift | **Green** — `bunx ng build` compiles. |
| R6 — new profiles unreachable until Paso 8 | **Acceptable** — seeded in the Map; switcher wiring deferred (out of scope). |

## Notes

- `contracts/openapi.yaml` untouched (`git status` clean for it).
- `angular.json` left unstaged (incidental `M`); `HANDOFF.md` / `fg.json` / `openspec/changes/p10-fixtures/` left untracked.
- `JobsStore.loadApplication` not modified.
