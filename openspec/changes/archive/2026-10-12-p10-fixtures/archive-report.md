# Archive Report: p10-fixtures — Expanded demo fixtures (§10 Paso 4)

> Archived: 2026-10-12 · Mode: hybrid · Data-only change.

## Verdict
`sdd-verify`: **PASS WITH WARNINGS** (0 CRITICAL). Archive safe.

## Spec sync
**NONE.** This is a data-only change with **no capability delta** (mirrors `p8-warnings-closure`).
No `openspec/specs/*` file was created or modified.

## Delivered
- `src/app/core/platform/mocks/fixtures.ts` — `FEED_POSTS` 3→9, `COMMENTS` 3→12, `JOBS` 3→7,
  `APPLICATIONS` 2→7 (all 4 statuses), `WORKER_PROFILES` (3) / `COMPANY_PROFILES` (2),
  `DEMO_ACCOUNTS` 2→5. Every entry keeps `isPlaceholder: true`.
- `src/app/core/platform/mocks/fixtures.spec.ts` — shape + placeholder flags + referential
  integrity + sentinel thread counts + R1 guards.
- `src/app/core/platform/api/mock-profiles.gateway.ts` — Maps seeded from the profile arrays.
- `src/app/pages/plataforma/feed.page.spec.ts` — re-pinned the one true literal
  (`comment-content-*` id array now derives from `FEED_POSTS`).

## Work units (stacked-to-main, local)
| WU | Commit | Message |
|---|---|---|
| WU1 | `fd28696` | `test(mocks): expand demo fixtures and re-pin feed composer ids (p10-fixtures)` |
| WU2 | `38f3725` | `feat(mocks): seed extra profiles and demo accounts (p10-fixtures)` |

Gate at archive time: **563 tests / 60 files** green · lint clean · build green (21 routes) ·
`contracts/openapi.yaml` untouched.

## Sentinels preserved
Thread counts `post-1`=2, `post-2`=0, `post-3`=1; `job-1`/`job-2` open, `job-3` closed and
application-free; `app-1` first row for `job-1` (accepted), `app-2` first row for `job-2` (pending).

## Carried warnings
- **W1 (carried to Paso 5 — worker experience):** `JobsStore.loadApplication` filters by `jobId`
  only and shows `items[0]`, so the demo worker sees a status ("Rechazada"/"Pendiente") on jobs
  they never applied to (e.g. `job-4` has two applications `app-3`/`app-7`, neither belonging to
  `worker-1`). This is **pre-existing behavior** codified by specs; fixing it is a behavior change
  → out of scope for this data-only paso.
- **W2 (note):** fixture expansion was 576 changed lines vs the ~190–260 forecast — recalibrate
  data-heavy estimates.
- **W3 (process):** the `sdd-propose` sub-agent reported success but did not persist the proposal;
  it was re-authored inline by the orchestrator. Verify artifacts on disk after each phase.

## Rollback
Revert `fd28696` and `38f3725`. No schema/contract change → pure code revert.
