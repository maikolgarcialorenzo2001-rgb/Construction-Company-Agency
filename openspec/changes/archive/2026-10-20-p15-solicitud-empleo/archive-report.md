# Archive Report: p15-solicitud-empleo

`p15-solicitud-empleo` is complete and archived. It gives the platform **Plantilla 2 — the worker "Solicitud de empleo" (job-request)**: a demo-only `PostKind = 'standard' | 'job-request'` widened on the view model only, a deterministic `postId → JobRequestPayload` registry, an author-aware mock-gateway create path, a reactive worker solicitud composer (4 requireds + optional free text + 1–10 photos) gated by role alongside the untouched company textarea, and a structured card rendered exclusively through p14's reserved `[postExtra]` slot — with `[postBody]`, `isRenderablePostView`, `PostTemplateComponent`, and the contract (`openapi.yaml` + `contract-conformance.ts`) all frozen. Verify passed **PASS WITH WARNINGS** (0 CRITICAL, 1 WARNING, 2 SUGGESTION); the post-verify fix-up resolved every finding (WU3 retro-split diff-identical, coverage tooling installed, tasks.md naming aligned). Spec sync ran: **1 capability CREATED** (`platform-job-request`) and **1 MODIFIED** (`platform-feed` — 1 requirement renamed/replaced, 1 requirement added).

> **Delivery note (chained-pr):** this change lives **only on branch `feature/p15-solicitud-empleo`** (HEAD `3464165`). It is **NOT merged to `main`** and **not pushed** — an isolated feature branch awaiting a merge/push decision, built as 5 commits (3 work units, with WU3 retro-split into two commits, plus one chore) from base `f8ce08a`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p15-solicitud-empleo` (Plantilla 2 — worker job-request; consumes p14's `[postExtra]` slot) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL, 1 WARNING, 2 SUGGESTION; 19/19 scenarios COMPLIANT) |
| Work units | 3/3 complete (WU1 → WU2 → WU3, WU3 retro-split into commits A+B post-verify) |
| Delivery | **feature-branch only** — branch `feature/p15-solicitud-empleo`; **NOT merged to `main`**, not pushed |
| Branch / HEAD | `feature/p15-solicitud-empleo` @ `3464165` (base `f8ce08a`) |
| Tasks | 23/23 checkbox tasks complete |
| Tests | **745/745 green (77 files)**; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (**25 static routes prerendered**) |
| Spec scenarios | **19/19 COMPLIANT** (0 UNTESTED, 0 FAILING) — 13 platform-job-request + 6 platform-feed |
| Capability changes | **1 CREATED** (`platform-job-request`), **1 MODIFIED** (`platform-feed`) |
| Contract | `contracts/openapi.yaml` untouched; `contract-conformance.ts` blind to `PostKind`/`jobRequest`; `Post`/`FeedPostInput`/`PostTemplateComponent` untouched |
| Archive location | `openspec/changes/archive/2026-10-20-p15-solicitud-empleo/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p15-solicitud-empleo/archive-report` |
| Remote state | branch-local commits only — **not merged, not pushed**, no PR/issue created |

## What shipped (work units)

| Work unit | Commit | What it is |
|---|---|---|
| **WU1 — data foundation** | `d42b94a` `feat(platform): job-request data foundation (kind, registry, seeds, mapper)` | `PostKind` widened to `'standard' \| 'job-request'` on the demo view model only; `JobRequestPayload` + `PostView.jobRequest?`; deterministic `mocks/job-request.registry.ts` (`record`/`get`/`reset`, seed snapshot); `JOB_REQUEST_SEEDS` (2 text-only posts at the `FEED_POSTS` tail); `toPostView` derives kind/payload from the registry (miss → `'standard'`, key omitted); predicate byte-identical (test counts 716 → 726). |
| **WU2 — create path + card** | `749a250` `feat(platform): author-aware create path and job-request structured card` | `CreatePostDraft` port extension; `MockFeedGateway.create` uses the session author id (no hardcoded `company-1`); store carries content + attachments + payload; new `PostJobRequestComponent` structured card projected **only** into `[postExtra]` in `feed.page.ts`; `[postBody]` keeps free text only; shell zero diff (726 → 734). |
| **WU3a — composer component** | `18af736` `feat(platform): worker job-request composer component` (413 lines) | `JobRequestComposerComponent` (reactive forms, `NonNullableFormBuilder`): 4 requireds (*Puesto/rubro*, *Disponibilidad/jornada*, *Modalidad*, *Experiencia*) + optional *Texto libre* + *Fotos* 1–10 via `URL.createObjectURL` previews capped at 10; composite publish rule **Q1=a** enforced in `submit()` (structured-only → `role=alert` + focus, no emit); a11y labels/describedby on all 6 inputs; 5+ composer tests. |
| **WU3b — role wiring + gates** | `094cfb3` `feat(platform): role-differentiated feed composer wiring` (199 lines) | `feed.page` template gates: `worker` → solicitud form, `company` → textarea (signal-based, untouched), admin/anonymous → no composer; end-to-end worker publish test (denormalized author ⇒ `worker-1`); projection + "standard posts unchanged" tests; a11y/release-matrix gates green without edits (734 → 745). |
| **Fix-up chore** | `3464165` `chore(platform): add @vitest/coverage-v8 dev dependency` | `@vitest/coverage-v8@4.1.11` pinned to installed `vitest@4.1.11` (`package.json` + `bun.lock` only, 44 lines); closes verify SUGGESTION 1. Suite re-verified 745/745 after install. |

**Post-verify fix-up (2026-10-20):** original WU3 commit `3345d39` (612 lines, verify WARNING 1) was retro-split via `git reset --soft HEAD~1` + path-scoped staging into `18af736` + `094cfb3`. Tree **byte-identical** to the pre-split chain (`cmp`-clean `git diff d42b94a..HEAD` vs `d42b94a..3345d39`); gates re-run green at the new HEAD. Old `3345d39` remains reachable via reflog. `tasks.md` spec-file shorthand naming aligned in the same pass (SUGGESTION 2 → RESOLVED).

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-job-request` | **Created** | NEW capability (no canonical dir existed). Full authored spec copied → `openspec/specs/platform-job-request/spec.md` (7 requirements: kind + demo-only payload, deterministic registry, worker solicitud composer fields, composite publish rule Q1=a, card via `[postExtra]` only, author-aware create + demo seeds, payload strictly demo-only; 13 scenarios). |
| `platform-feed` | **Updated** | MODIFIED requirement *"Company-gated composer"* **renamed/replaced** by *"Role-differentiated post composer"* (matched via the delta's `(Previously:)` marker): worker → solicitud form, company → textarea, admin → none; 2 → 4 scenarios (+*Worker sees solicitud form*, +*Worker cannot create via company composer*). ADDED requirement *"Job-request posts project structured card via `[postExtra]`"* appended (2 scenarios). 3 other requirements preserved untouched (*Feed gateway port*, *Feed renders via signals (zoneless)*, *Fixture media URLs are renderable*). |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding and no `# Delta for …` header remains in any canonical spec (grep-verified across `openspec/specs/`). Requirements not mentioned in the deltas were preserved. Delta-scenario coverage in canonical specs: `platform-job-request` 13 + `platform-feed` 6 = **19**.

## Final gate numbers (at HEAD `3464165`, re-verified post fix-up)

| Gate | Command | Result |
|---|---|---|
| Tests | `bunx ng test --watch=false` | ✅ **745/745 passed** across **77 files** |
| Lint | `bunx ng lint` | ✅ **All files pass linting** |
| Build | `bunx ng build` | ✅ clean — **25 static routes prerendered** |
| Spec scenarios | verifier matrix | ✅ **19/19 COMPLIANT** (0 UNTESTED, 0 FAILING) |
| Strict TDD | 6 checks | ✅ 6/6 passed |
| Contract safety | `git diff` + conformance grep | ✅ `openapi.yaml` and `contract-conformance.ts` zero diff vs `f8ce08a`; `Post`/`PostInput`/`PostTemplateComponent` untouched |
| Assertion quality | banned-pattern scan (8 test files) | ✅ 0 CRITICAL, 0 WARNING |
| Predicate invariant | p14 never-empty guard | ✅ `isRenderablePostView`/`hasVisibleText` byte-identical |

## Commits (branch `feature/p15-solicitud-empleo` only — NOT on `main`)

| Commit | Work unit |
|---|---|
| `d42b94a` | WU1 `feat(platform): job-request data foundation (kind, registry, seeds, mapper)` |
| `749a250` | WU2 `feat(platform): author-aware create path and job-request structured card` |
| `18af736` | WU3a `feat(platform): worker job-request composer component` |
| `094cfb3` | WU3b `feat(platform): role-differentiated feed composer wiring` |
| `3464165` | chore `chore(platform): add @vitest/coverage-v8 dev dependency` |
| *(this change)* | `docs(openspec): archive p15-solicitud-empleo with spec sync` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-20-p15-solicitud-empleo/` |

Conventional format, English, no AI attribution.

## Archive contents

- `explore.md` ✅
- `proposal.md` ✅
- `specs/` ✅ (2 deltas: `platform-job-request`, `platform-feed`)
- `design.md` ✅
- `tasks.md` ✅ (23/23 complete)
- `apply-progress.md` ✅ (3 WUs with TDD evidence tables)
- `verify-report.md` ✅ (PASS WITH WARNINGS + post-verify fix-up addendum)
- `archive-report.md` ✅ (this file)

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p15-solicitud-empleo/explore` (#1012) |
| Proposal | `proposal.md` | `sdd/p15-solicitud-empleo/proposal` (#1014) |
| Spec (deltas) | `specs/{platform-job-request,platform-feed}/spec.md` | `sdd/p15-solicitud-empleo/spec` (#1016) |
| Design | `design.md` | `sdd/p15-solicitud-empleo/design` (#1017) |
| Tasks | `tasks.md` | `sdd/p15-solicitud-empleo/tasks` (#1019) |
| Apply progress | `apply-progress.md` | `sdd/p15-solicitud-empleo/apply-progress` (#1020) |
| Verify report | `verify-report.md` | `sdd/p15-solicitud-empleo/verify-report` (#1029) |
| Archive report | `archive-report.md` | `sdd/p15-solicitud-empleo/archive-report` (this save) |

Supporting observations: #1015 (proposal capability mapping), #1018 (design discoveries), #1025 (WU3 gap discovery, superseded by the requirement refinement that followed), #1031 (retro-split + coverage pin), #1027 (superseded single-commit decision for WU3, resolved by the retro-split), #1028/#1032 (session summaries).

## Known debt carried forward (non-blocking, accepted at archive)

| ID | Item | Disposition |
|---|---|---|
| **Residual-1** | **WU3a commit `18af736` is 413 lines — 13 over the 400-line review budget.** Cannot go lower without splitting the 171-line component spec away from its component, which would violate `work-unit-commits` (tests ship with their code). WARNING 1 is otherwise RESOLVED (612 → 413); WU3b is 199 lines. | **Accepted at archive** — reviewer may treat `18af736` as a marginally over-budget slice. |
| **Debt-2** | **Coverage installed but not wired.** `@vitest/coverage-v8@4.1.11` is installed (verify SUGGESTION 1 resolved) but coverage is **not** enabled in `angular.json` or CI; `coverage_threshold: 0` in `openspec/config.yaml`. | Wiring it up is a follow-up chore for the next change that wants coverage gates. |
| **Debt-3** | **Admin composer is "none" by design decision, flagged.** Spec says admin MUST NOT see a composer "(flagged for design)". No admin composer branch exists; a11y + release-matrix gates stay green without edits. | If admin publishing is ever needed, a future change must design it explicitly. |

### SUGGESTIONs (all resolved — no action required)

- ~~Install `@vitest/coverage-v8`~~ → **RESOLVED** (`3464165`, pinned to vitest 4.1.11).
- ~~Align `tasks.md` spec-file shorthand naming~~ → **RESOLVED** (both shorthands corrected to `*.component.spec.ts`; full sweep found no others).

## Deferred scope (explicit — NOT implemented)

| Deferred item | Where it will live |
|---|---|
| Contract edits (`openapi.yaml`, `Post`, `FeedPostInput`, `contract-conformance.ts`) | Future contract-owning change |
| `JobsStore`/`ApplicationsStore` relation (a solicitud does NOT apply to a `Job`) | Plantilla 3 boundary — flagged in explore R4, not designed |
| Real backend/media upload; contact/apply flow | Future change |
| Structured cards on `/previa` | Optional future slice (p13 reduced previa is intentional) |
| Admin composer design | See Debt-3 |
| Plantilla 3 vocabulary/contact edge | Future change |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-job-request` created; `platform-feed` 1 MODIFIED merged (rename + Previously marker) + 1 ADDED appended
- [x] No leftover delta scaffolding in canonical specs (grep-verified)
- [x] Requirements not mentioned in the deltas preserved (`Feed gateway port`, `Feed renders via signals (zoneless)`, `Fixture media URLs are renderable`)
- [x] Change folder moved to `openspec/changes/archive/2026-10-20-p15-solicitud-empleo/` with all artifacts
- [x] Change dir was untracked → used a filesystem `mv` (not `git mv`); this docs commit stages it
- [x] Active `openspec/changes/` no longer contains `p15-solicitud-empleo/` (only `archive/`)
- [x] Verify verdict is non-CRITICAL (0 CRITICAL) → archive allowed; WARNING/suggestion follow-ups all resolved or recorded above
- [x] Engram archive report saved as `sdd/p15-solicitud-empleo/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] No source code changed in this phase; only `openspec/` paths staged
- [x] **NOT merged to `main`** — isolated branch `feature/p15-solicitud-empleo` (`3464165`); awaiting a push/merge decision

## Next steps

`p15-solicitud-empleo` closes the p14 handoff's first post type: workers can publish a structured solicitud through a role-differentiated composer, with the contract frozen and the full gate green (745/745). Outstanding items are the three debt notes above (Residual-1 size residual, Debt-2 coverage wiring, Debt-3 admin composer) — none blocks archive. **Merge/push decision pending:** the change is isolated on `feature/p15-solicitud-empleo` and is **NOT merged to `main`**; the orchestrator handles push, a human decides integration. Natural follow-ups: Plantilla 3 (company vacancy, `PostKind` extension point already in place), or wiring coverage gates (Debt-2).
