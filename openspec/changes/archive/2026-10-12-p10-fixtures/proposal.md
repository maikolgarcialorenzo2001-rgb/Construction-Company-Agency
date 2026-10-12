# Proposal: p10-fixtures — Expanded demo fixtures (§10 Paso 4)

> Mode: hybrid · **Data-only** (no capability delta → spec/design skipped) · Strict TDD.
> Grounding: `explore.md` (#937), `tasks.md` (#938).
> Delivery: `ask-on-risk` · Chain: `stacked-to-main` (sequential local commits on `main`).

## Intent (WHAT/WHY)
Expand the demo dataset so the static preview shows a richer, more varied `/plataforma`: more
publications, jobs (vacantes), profiles and applications (postulaciones) — while preserving the
`isPlaceholder: true` marker and existing consumer expectations. Purely data in
`src/app/core/platform/mocks/fixtures.ts`; **no behavior changes**.

## Scope
**In**
- Expand `FEED_POSTS` (~9), `COMMENTS` (~12), `JOBS` (7), `APPLICATIONS` (7 covering all 4 statuses),
  `WORKER_PROFILE` (+2), `COMPANY_PROFILE` (+1).
- Seed the new profiles in `mock-profiles.gateway.ts` Map.
- Add `fixtures.spec.ts` validating shape + referential integrity + sentinel thread counts.
- Re-pin the affected literal assertions (see tasks checklist).
- Every list ≤ 20 (the `paginate` default); preserve sentinel ids/semantics
  (`post-1/2/3`, `job-1/2/3`) and thread counts (post-1=2, post-2=0, post-3=1).

**Out**
- No contract change (`contracts/openapi.yaml` READ-ONLY).
- No `JobsStore.loadApplication` behavior change (keep exactly one application per job).
- No account/switcher wiring (reachability of the new profiles via login is deferred to Paso 8).
- No spec delta, no design phase (mirrors `p8-warnings-closure`).

## Capabilities
**None — no delta.** No capability requirements/scenarios change; this is placeholder data only.

## Approach
1. **Preserve sentinels**: keep `post-1`, `post-2` (empty thread), `post-3` and `job-1` open,
   `job-2` open + CABA, `job-3` closed with no seeded application.
2. **R1 mitigation**: keep **exactly one application per job**; `app-1` remains the first row for
   `job-1` (worker-1, accepted) and `app-2` the first row for `job-2` (pending) so the store's
   `items[0]` semantics are not exposed as a wrong-status bug.
3. **Variety**: vary `authorId`/`authorRole`, locations, rubros, budgets, statuses
   (pending/accepted/rejected/withdrawn), skills/bios; keep all `isPlaceholder: true` and the
   `satisfies readonly Placeholder<T>[]` shape proof.
4. **Strict TDD**: tests travel with the code; `bunx ng test --watch=false` after each work unit.

## Affected Areas
| Area | Action | Notes |
|---|---|---|
| `src/app/core/platform/mocks/fixtures.ts` | Expand arrays | Preserve sentinels; cover all 4 app statuses; ≤20 each. |
| `src/app/core/platform/mocks/mock-profiles.gateway.ts` | Seed new profiles in Map | worker-2/3, company-2 (Map seeding only). |
| `src/app/core/platform/mocks/fixtures.spec.ts` | Add/extend | Referential integrity (comment.postId∈posts, app.jobId∈jobs, app.applicantId∈workers), thread counts, `isPlaceholder===true`, shape conformance. |
| `src/app/core/platform/pages/plataforma/feed.page.spec.ts` | Re-pin | `:314` exact `comment-content-post-*` id array → derive it. |
| other specs (`mock-gateways`, `comments.store`, `jobs.store`, `job-detail.page`, `feed.store`, `jobs-list.page`, `perfil.page`) | Keep (guards) | They derive from `*.length` or pin kept sentinels; break **only** if order changes or an app is added to job-1/2/3. |

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| R1 — `loadApplication` first-item semantics (filters by `jobId` only, shows `items[0]`) | HIGH | Exactly one app per job; keep `app-1`→job-1 accepted, `app-2`→job-2 pending as first rows; `job-3` stays application-free. |
| R2 — literal count/id assertions | MED (revised) | Tasks found only **one** hard literal actually breaks (`feed.page.spec.ts:314`); the rest are guards satisfied by sentinel/order preservation. |
| R3 — list size >20 | MED | Enforce ≤20 per array. |
| R4 — a11y over a larger feed | LOW | Unique ids (`comment-content-{postId}`); run a11y specs. |
| R5 — `satisfies`/enum drift | LOW | Valid `JobStatus`, `ApplicationStatus`, `Role`; build/typecheck must pass. |
| R6 — new profiles unreachable until Paso 8 | LOW | Seeded in the Map now; switcher wiring deferred. |

## Rollback Plan
Revert `fixtures.ts`, `mock-profiles.gateway.ts`, `fixtures.spec.ts` and the re-pinned specs.
No schema/contract change → pure code revert.

## Artifact Locations
- `openspec/changes/p10-fixtures/proposal.md` (this file)
- Engram: `sdd/p10-fixtures/proposal` (`capture_prompt: false`, project `construction-company-agency`)

## Success Criteria
- [ ] All lists ≤20; every entry `isPlaceholder: true`.
- [ ] Sentinels preserved (`post-1/2/3`, `job-1/2/3`); thread counts post-1=2, post-2=0, post-3=1; `job-3` has no application.
- [ ] Exactly one application per job; all 4 statuses covered across 7 applications.
- [ ] `mock-profiles.gateway.ts` Map seeded with worker-2/3, company-2.
- [ ] `fixtures.spec.ts` validates referential integrity + sentinel thread counts; affected specs re-pinned.
- [ ] `bunx ng test --watch=false` and `bunx ng build` pass.

## Next Recommended
`sdd-apply` (WU1 fixtures core + `fixtures.spec.ts`; WU2 profiles/accounts + gateway seeding + re-pins),
then `sdd-verify`, then `sdd-archive`.
