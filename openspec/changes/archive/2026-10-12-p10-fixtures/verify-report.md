# Verify Report: p10-fixtures — Expanded demo fixtures (§10 Paso 4)

> Mode: hybrid · **Strict TDD** · Data-only (no delta spec → verified against proposal Success Criteria + tasks R1)
> Verdict: **PASS WITH WARNINGS** · Archive safe: **YES**

## Command Evidence

| Command | Result |
|---|---|
| `bunx ng test --watch=false` | ✅ **563 passed / 60 files** (0 failed, 0 skipped) — matches apply-progress final count |
| `bunx ng lint` | ✅ "All files pass linting." |
| `bunx ng build` | ✅ Application bundle generation complete (SSG 21 routes) — `satisfies`/type proof green |
| `git diff bf628d8..HEAD -- contracts/openapi.yaml` | ✅ empty (untouched) |
| `git status --short` | ⚠️ `M angular.json` uncommitted (incidental, as reported) · `openspec/changes/p10-fixtures/` untracked · no other changes |

## Completeness

| Metric | Value |
|---|---|
| Tasks total | 12 (WU1: 1.1–1.8, WU2: 2.1–2.4) |
| Tasks complete | 12 — all `[x]` |
| Tasks incomplete | 0 |
| Commits | `fd28696` WU1, `38f3725` WU2 (messages match tasks table) |
| Changed files | 5 (fixtures.ts, fixtures.spec.ts, feed.page.spec.ts, mock-gateways.spec.ts, mock-profiles.gateway.ts) — matches apply-progress |

## Spec Compliance Matrix (proposal Success Criteria)

| Success Criterion | Evidence | Result |
|---|---|---|
| All lists ≤20; every entry `isPlaceholder: true` | fixtures.ts: max list = COMMENTS 12; `satisfies readonly Placeholder<…>[]` on every array; fixtures.spec.ts:26-36 asserts both | ✅ COMPLIANT |
| Sentinels preserved: post-1/2/3, job-1/2/3; threads 2/0/1; job-3 zero apps | fixtures.ts:117-147 (comment-1/2→post-1, comment-3→post-3); fixtures.spec.ts:69-73; `job-3` has no application (fixtures.spec.ts:115) | ✅ COMPLIANT |
| Exactly one application per job; 4 statuses across 7 apps | **job-4 carries app-3 + app-7 (both rejected)** — see WARN-1; all 4 statuses covered (accepted 1, pending 1, rejected 3, withdrawn 2); sentinel jobs 1/2 exactly one each, job-3 zero (fixtures.spec.ts:114-129) | ⚠️ PARTIAL (job-4 deviation, safe) |
| `mock-profiles.gateway.ts` Map seeded with worker-2/3, company-2 | mock-profiles.gateway.ts:16-21; mock-gateways.spec.ts:243-254 resolves all three | ✅ COMPLIANT |
| `fixtures.spec.ts` validates referential integrity + sentinel threads; affected specs re-pinned | fixtures.spec.ts:43-63 (comment.postId∈posts, jobId∈jobs, applicantId∈workers, thread asc); feed.page.spec.ts:314 derives `FEED_POSTS.map(p => 'comment-content-'+p.id)` | ✅ COMPLIANT |
| `bunx ng test --watch=false` and `bunx ng build` pass | ✅ 563 passed · build green | ✅ COMPLIANT |

## Adversarial Checks (falsification attempts)

| Check | Finding |
|---|---|
| R1: one app per job-1/2/3, app-1 first (accepted), app-2 first (pending), job-3 none | ✅ Holds — fixtures.ts:343-361, spec :104-118. `loadApplication` filters by `jobId`, `items[0]` (jobs.store.ts:76-77 fails to falsify) |
| job-4 has TWO apps (app-3, app-7 rejected) — consumers? | ⚠️ See WARN-1. Reachable via jobs-list → detail route, but `list({jobId})` preserves array order (mock-applications.gateway.ts:24-32) → `items[0]` = app-3 (rejected); both rejected, so no wrong status is ever surfaced. No test/spec references job-4/app-3/app-7 (grep: only fixtures.ts matches) |
| Referential integrity | ✅ comment.postId ∈ posts (fixtures.spec.ts:44); app.jobId ∈ jobs (:51); applicantId ∈ {worker-1,2,3} (:52) |
| Sentinels: threads post-1=2, post-2=0, post-3=1; no FEED_POSTS/JOBS reordering | ✅ Order untouched (post-1 first, JOBS[0] Albañil / [1] Electricista); guard specs (feed.store.spec:63-67, jobs.store.spec:57-73, jobs-list.page.spec:29-31, job-detail.page.spec:26-34) all pass |
| All lists ≤20 | ✅ max 12 (asserted fixtures.spec.ts:26-30) |
| `contracts/openapi.yaml` untouched; `angular.json` uncommitted | ✅ openapi zero diff · `M angular.json` left unstaged per apply-progress note |
| Statuses across 7 apps | ✅ exactly one accepted (app-1), exactly one pending (app-2), rejected×3, withdrawn×2; worker-1 exactly one app (fixtures.spec.ts:120-135) |
| comment `createdAt` 2026 + thread ascending | ✅ all 2026; every thread ascending (fixtures.spec.ts:56-63, ISO-8601 lexicographic = chronological) |
| `WORKER_PROFILE`/`COMPANY_PROFILE` singletons `= [0]` | ✅ fixtures.ts:464, 495 — perfil.page untouched |

## TDD Compliance (Strict TDD)

| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | apply-progress.md:19-32 table present |
| All tasks have tests | ✅ 12/12 | fixtures.spec.ts (RED 1.1/1.2/2.1), mock-gateways.spec.ts (RED 2.4, +1 extra), feed.page.spec.ts (:314 derive) |
| RED confirmed (tests exist) | ✅ | Files exist in codebase, contain the described assertions |
| GREEN confirmed | ✅ | 563/563 pass on re-run |
| Triangulation adequate | ✅ | 4 count datasets, 3-domain integrity, R1 guards, profile/account shape; `➖ Single` only for data-driven re-pin |
| Safety net | ✅ | 547/547 (WU1), 557/557 (WU2) baselines reported; final 563 |

**Assertion quality**: ✅ All assertions verify real behavior — no tautologies; loops iterate statically non-empty arrays each guarded by an exact-length companion test (fixtures.spec.ts:19-24); no ghost loops; no type-only-only assertions; mock-gateways addition asserts real values (fullName/name).

**Test layer**: Unit 16 tests (fixtures.spec + mock-gateways) + component/guards re-run (feed.page, stores, etc.) — all executed. Coverage tool: not configured → "Coverage analysis skipped — no coverage tool detected" (informational, not a failure).

## Issues Found

**CRITICAL**: None

**WARNING**:
1. **WARN-1 — job-4 has 2 applications (fixtures.ts:363-371, 403-411)** deviates from the proposal Success Criteria literal "Exactly one application per job". Not treatable as a defect: the criterion is internally contradictory (7 apps, 6 applicant-bearing jobs → max 6 with exactly-one). tasks.md R1 itemized rule (`app-3..7` → `job-4..job-7`, no extra app on job-1/2) is the operative spec and is honored; binding sentinel invariant (1/1/0 on job-1/2/3) holds and is asserted. Safe because both job-4 apps are `rejected` — `loadApplication('job-4')` `items[0]` can never surface a wrong status, no test pins job-4, and the demo worker (worker-1) never applied there. Note demo-realism wart: job-detail for job-4 shows "Rechazada" attributed to the demo worker via `applicationStatusLabel` (job-detail.page.ts:55-59) — a seeded app belonging to worker-2/3, acceptable for placeholder data; same pre-existing first-row shadowing on post-apply revisit applies to all jobs, not introduced here.

**SUGGESTION**:
1. **S1 — line forecast understated**: combined diff is 521+/55− (576 lines) vs the ~190–260 forecast ("400-line budget risk: Low"). Safe here: two stacked local commits on `main`, each individually under budget (373 / 201). Recalibrate estimates for data-heavy fixture work.
2. **S2 — demo realism on job-4**: consider tagging seeded apps with their real applicant or deferring job-4's app-7 until Paso 8 account wiring; purely cosmetic for placeholder data.

## Verdict

**PASS WITH WARNINGS** — all gates green (563 tests, lint, build), sentinel/R1/integrity invariants hold, `contracts/openapi.yaml` untouched, `angular.json` intentionally uncommitted. WARN-1 is a documented, safe deviation from a self-contradictory Success Criterion literal that the itemized tasks.md R1 honors. **Archive is safe.**