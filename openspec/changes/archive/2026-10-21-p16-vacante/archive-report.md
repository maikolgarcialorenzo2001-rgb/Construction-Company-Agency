# Archive Report: p16-vacante

`p16-vacante` is complete and archived. It gives the platform **Plantilla 3 — company vacancy-promo posts**: a demo-only `PostKind` widened to `'standard' | 'job-request' | 'vacancy'` with a reference-only `VacancyPayload { jobIds: string[] }`, a deterministic `postId → { jobIds }` registry, 2 text-only vacancy seeds inserted before the job-request tail (fixture count 11 → 13), a multi-vacancy card projected **only** through p14's reserved `[postExtra]` slot with a one-shot idle-guarded `JobsStore` hydration, and an extracted `CompanyComposerComponent` whose **exclusive** modes give the company a normal textarea (byte-compatible) or a "Buscar trabajadores" picker scoped to `status === 'open' && companyId === session authorId` — with `[postBody]`, `isRenderablePostView`, `PostTemplateComponent` and the contract (`openapi.yaml` + `contract-conformance.ts`) all frozen. Verify passed **PASS WITH WARNINGS** (0 CRITICAL, 6 WARNING, 9 SUGGESTION); every spec-bookkeeping finding (W2–W5) was applied **in this archive phase**. Spec sync ran: **1 capability CREATED** (`platform-vacancy`, 8 requirements / 17 scenarios) and **1 MODIFIED** (`platform-feed` — 1 requirement replaced, 1 requirement added, 4 untouched requirements preserved byte-identical).

> **Delivery note (chained-pr):** this change lives **only on branch `feature/p16-vacante`** (HEAD `8f95d55`, base `main@a711e5f`). It is **NOT merged to `main`** and **not pushed** — an isolated feature branch awaiting a merge/push decision, built as 7 commits (5 work units + 1 polish slice + 1 orchestrator `HANDOFF.md` note) from base `a711e5f`. No PR, no issue, no push. The orchestrator handles the merge/push decision with the user.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p16-vacante` (Plantilla 3 — company vacancy-promo; consumes p14's `[postExtra]`, reuses p15's kind/payload pattern) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL, 6 WARNING, 9 SUGGESTION; **23/24 scenarios COMPLIANT**, 1 PARTIAL) |
| Work units | 5 + 1 polish slice, all committed (`3fbe2b2` → `982eecf` → `4c9bd9c` → `e9af21e` → `c65dcbf` → `8f95d55`) |
| Delivery | **feature-branch only** — branch `feature/p16-vacante`; **NOT merged to `main`**, not pushed |
| Branch / HEAD | `feature/p16-vacante` @ `8f95d55` (base `a711e5f`) |
| Tasks | 30/30 checkbox tasks complete |
| Tests | **795/795 green (82 files)**; baseline `main` = 745 (77 files) → **+50**; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (**25 static routes prerendered**) |
| Spec scenarios | **24 total** — `platform-vacancy` **17** + `platform-feed` delta **7** (5 MODIFIED + 2 ADDED); **23 COMPLIANT, 1 PARTIAL**, 0 UNTESTED, 0 FAILING |
| Capability changes | **1 CREATED** (`platform-vacancy`), **1 MODIFIED** (`platform-feed`) |
| Mutation evidence | **9/9 mutations killed** (M1–M9, isolated in a throwaway `git archive` copy) |
| Contract | `contracts/openapi.yaml` untouched; `contract-conformance.ts` blind to `PostKind`/`vacancy`; `Post`/`PostInput`/`PostTemplateComponent`/`isRenderablePostView` untouched |
| Archive location | `openspec/changes/archive/2026-10-21-p16-vacante/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p16-vacante/archive-report` |
| Remote state | branch-local commits only — **not merged, not pushed**, no PR/issue created |

## What shipped (work units)

| Work unit | Commit | What it is |
|---|---|---|
| **WU1 — data foundation** | `3fbe2b2` `feat(platform): add vacancy data foundation for company promo posts` (10 files, +324/−12) | `PostKind` widened to `'standard' \| 'job-request' \| 'vacancy'` on the demo view model only; `VacancyPayload { jobIds }` + `PostView.vacancy?`; deterministic `mocks/vacancy.registry.ts` (`record`/`get`/`resetVacancyRegistry`, seed snapshot); `CreatePostDraft.vacancy?`; gateway records on `kind==='vacancy'`; `toPostView` derives vacancy after job-request precedence (miss → key omitted); **2 text-only vacancy seeds inserted before `post-10`** (`post-12` idx 9, `post-13` idx 10) → `FEED_POSTS` 11 → **13** (D9; only `fixtures.spec.ts:23` churned). 745 → 759. |
| **WU2 — card + labels** | `982eecf` `feat(platform): add vacancy promo card with status labels and resolver` (7 files, +290/−0) | Pure `jobStatusLabel` (`Abierta`/`Cerrada`, `application-status` precedent) + `resolveVacancyOpenings(payload, openings)` (skips unresolvable ids, preserves order, `[]` when none); presentational `PostVacancyComponent` (`role="group"`, optional budget via `formatMoneyRange`, **"Postularse" `routerLink` always rendered**, distinct `aria-label` per link). 759 → 768. |
| **WU3 — projection + hydration** | `4c9bd9c` `feat(platform): project vacancy card in feed with guarded jobs hydration` (2 files, +248/−8 = 256) | `feed.page` injects `JobsStore`; `vacancyOpeningsById` computed (entries only when non-empty → D6 hide is map-absence, no flash); **one-shot idle-guarded hydration effect** (tracks vacancy views, reads `listStatus()` untracked); `<app-post-vacancy postExtra [openings]>` in a single-root `@if`. Release-matrix `images: 11` and a11y both **zero-diff green**. 768 → 773. |
| **WU4a — composer** | `e9af21e` `feat(platform): add company composer with vacancy mode and scoped picker` (3 files, **513 lines**) | `CompanyComposerComponent` under `src/app/components/company-composer/` (flat, repo convention): normal textarea verbatim, toggle "Buscar trabajadores", picker scoped `status==='open' && companyId===authorId`, composite rule **≥1 job AND (text OR photo)** with `role="alert"` + focus, `CompanyPostDraft { jobIds, content, attachments }`, photos cap 10. **513 lines = 113 over the 400-line budget → Residual-1, NOT amended.** 773 → 780. |
| **WU4a polish** | `c65dcbf` `fix(platform): harden company composer empty state, error wiring and mode exclusivity` (3 files, +202/−53 = 255) | A1 empty-picker state + focus fallback on `tabindex="-1"`; A2 `mediaTouched` replaces `textTouched` (`aria-invalid` on photos); A3 checkbox group wired to the error region; A4 `clearRejection()`; **A5 modes made EXCLUSIVE** (D4 → D4a); A6 duplicate-id guard confirmed in Slice B. 780 → 786. |
| **WU4b — feed wiring** | `8f95d55` `feat(platform): wire company composer vacancy mode into the feed` (2 files, +330/−55 = 385) | Inline company `<form>` **deleted** (no duplicate `id="feed-post-content"`), replaced by `<app-company-composer [openings] [authorId] (publish)>`; `publishCompany(draft)` maps `jobIds.length > 0` → `kind:'vacancy'` + `vacancy:{ jobIds }`, else `kind:'standard'` with no `vacancy`; `companyAuthorId` computed = session user → `COMPANY_PROFILE.companyId` fallback (no `'company-1'` literal); hydration effect gains `needsPicker` (still one load, mutation-checked both ways). 786 → **795**. |

**Orchestrator-owned note in the chain:** `f562270 docs(handoff): record p16-vacante in-progress state (WU1-WU3 done)` (1 file, +26/−8) — `HANDOFF.md` is orchestrator-owned; this phase did not touch it (verify **W6**).

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-vacancy` | **Created** | NEW capability (no canonical dir existed). Full authored spec → `openspec/specs/platform-vacancy/spec.md` (8 requirements / **17 scenarios**): kind + reference-only payload, deterministic demo registry, vacancy seeds & fixture invariants, author-aware creation, multi-vacancy card with status labels + Postularse link, `[postExtra]` projection + guarded hydration, company composer mode toggle with scoped picker, composite publish rule. |
| `platform-feed` | **Updated** | MODIFIED requirement *"Role-differentiated post composer"* **replaced** (matched via the delta's `(Previously:)` marker): company now sees a **mode-differentiated** composer — normal textarea mode (default, testids byte-compatible) and "Buscar trabajadores" vacancy mode (scoped picker + optional text/photos), modes **exclusive**; publishing from vacancy mode creates `kind: 'vacancy'` with the selected `jobIds` via the demo registry, authored by the session user; worker still sees the solicitud form, admin sees no composer. Scenarios 4 → 5 (+*Vacancy mode creates vacancy post*). ADDED requirement *"Vacancy posts project card via `[postExtra]`"* appended (2 scenarios). |

**Preserved untouched (verified byte-identical against `main`):** `Feed gateway port`, `Feed renders via signals (zoneless)`, `Fixture media URLs are renderable`, `Job-request posts project structured card via `[postExtra]`` (p15's addition).

**Coherence checks (grep across the whole `openspec/specs/` tree, 25 canonical specs):**
- `## ADDED/MODIFIED/REMOVED` scaffolding headings → **NONE** ✅
- `# Delta for …` headers → **NONE** ✅
- `(Previously: …)` markers are **allowed** — they are the established canonical-spec convention (19 pre-existing occurrences across 10 specs, kept by p15 as well).
- Delta-scenario coverage in canonical specs: `platform-vacancy` **17** + `platform-feed` delta **7** = **24**.

**W5 — scenario totals corrected.** The delta's own "WU coverage map" Totals line said "platform-vacancy 8 requirements / **16** scenarios … = **23**". The scenarios actually enumerate **17** (2+2+2+1+3+2+2+3), so the change carries **17 + 7 = 24**. Corrected in the archived delta copy (`specs/platform-vacancy/spec.md` coverage-map footer) and in this report. The map's per-WU sum already equalled 24 (7+3+4+5+5).

### Archive-phase spec-sync fixes (verify findings applied here, not noted)

| Finding | What was wrong | Fix applied |
|---|---|---|
| **W2** (count drift) | `platform-vacancy` scenario *"Fixture invariants preserved"* asserted "the post-count assertion **(11 → 12)**" and "the vacancy seed inserted before the job-request tail **(index 9)**". The locked decision (2 text-only seeds before `post-10`) makes it **11 → 13**, and `post-10` now sits at **index 11**. | Rewritten in **both** the canonical `openspec/specs/platform-vacancy/spec.md` and the archived delta copy: *"the two vacancy seeds inserted before the job-request tail (`post-12` at index 9, `post-13` at index 10, so `post-10` — the first job-request — now sits at index 11)"* + *"the post-count assertion (**11 → 13**) is the only count churn"*. Verified against `mocks/fixtures.spec.ts` (`expect(FEED_POSTS).toHaveLength(13)`). This resolves the PARTIAL compliance of scenario 6. |
| **W3** (TDD evidence gap) | apply-progress #1042's TDD Cycle Evidence table started at `2.1→2.2` — WU1's four RED tasks (1.1/1.3/1.5/1.7) had no row (15/19 RED-first tasks covered). | **4 rows added** (1.1/1.2, 1.3/1.4, 1.5/1.6, 1.7/1.8) built from the **recorded WU1 task status** + the WU1 suite count in tasks #1041. **No evidence invented**: no failing-test count or error message was ever captured for WU1, so those cells read **"signal not recorded"**; the RED column carries the *recorded* RED task + its assertions, GREEN carries the *recorded* GREEN implementation + `759/795` at WU1 end, safety net `745` (`main` baseline). Table now covers **19/19** RED-first tasks. |
| **W4** (wrong counts) | apply-progress said "**36 tests** / baseline **759**". | Corrected to **+50 new tests**, baseline `main` = **745**, HEAD = **795** (82 files). Chain restated 745 → 759 → 768 → 773 → 780 → 786 → 795; breakdown **WU1 14 · WU2 9 · WU3 5 · WU4a 7 · polish 6 · WU4b 9 = 50**. The "780 tests" pre-change-baseline figure in Issue 1 was also corrected against the verifier's `main` reproduction. Applied to Engram #1042 (`mem_update`, merged — all WU1→WU4b content preserved) **and** to the archived `apply-progress.md`. |
| **W5** (totals) | Totals line said 16 + 7 = 23. | Corrected to **17 + 7 = 24** in the archived delta coverage map and here. |
| **A5 / item 3** (design refinement) | Spec said "mode toggle" without stating whether both forms stay mounted. | Requirement *"Company composer mode toggle with scoped picker"* now states the modes MUST be **exclusive** (normal form only in normal mode, vacancy form only in vacancy mode, toggle keeps a stable position), and both of its scenarios carry the exclusivity clause. The `platform-feed` MODIFIED composer requirement carries the same clause. Canonical wording now matches shipped behavior (normal mode default). |

## Final gate numbers (at HEAD `8f95d55`)

| Gate | Command | Result |
|---|---|---|
| Tests | `bunx ng test --watch=false` | ✅ **795/795 passed** across **82 files** (two consecutive green runs) |
| Baseline delta | `git show main:<file>` per file | ✅ `main` **745** (77 files) → HEAD **795** (82 files) = **+50** |
| Lint | `bunx ng lint` | ✅ **All files pass linting** |
| Build | `bunx ng build` | ✅ clean — **25 static routes prerendered** |
| Type check | via `ng build` (`strict` + `strictTemplates`) | ✅ 0 errors |
| Contract | `bun run contract:lint` / `contract:check` | ✅ no `error`-severity results; `schema.gen.ts` byte-identical |
| Spec scenarios | verifier matrix | ✅ **23/24 COMPLIANT** · 1 PARTIAL (stale wording, now synced) · 0 UNTESTED · 0 FAILING |
| Mutation testing | isolated mutations M1–M9 | ✅ **9/9 mutations killed** |
| Assertion quality | banned-pattern scan | ✅ 0 CRITICAL · 3 WARNING · 5 SUGGESTION |
| Contract safety | `git diff main --` | ✅ `contracts/` + `contract-conformance.ts` **empty** |
| Frozen file safety | `git diff main --` | ✅ `angular.json` + `app.release-matrix.spec.ts` + `app.a11y.spec.ts` **empty** |
| Predicate invariant | p14 never-empty guard | ✅ `isRenderablePostView` / `hasVisibleText` byte-identical |

## Commits (branch `feature/p16-vacante` only — NOT on `main`)

| Commit | Changed lines | Work unit / status |
|---|---|---|
| `3fbe2b2` | 324 + / 12 − = **336** | WU1 `feat(platform): add vacancy data foundation for company promo posts` ✅ ≤400 |
| `982eecf` | 290 + / 0 − = **290** | WU2 `feat(platform): add vacancy promo card with status labels and resolver` ✅ ≤400 |
| `4c9bd9c` | 248 + / 8 − = **256** | WU3 `feat(platform): project vacancy card in feed with guarded jobs hydration` ✅ ≤400 |
| `f562270` | 26 + / 8 − = **34** | orchestrator `docs(handoff): record p16-vacante in-progress state (WU1-WU3 done)` (not owned by this change) |
| `e9af21e` | 513 + / 0 − = **513** | WU4a `feat(platform): add company composer with vacancy mode and scoped picker` ⚠️ **Residual-1: 113 over budget — accepted, NOT amended** |
| `c65dcbf` | 202 + / 53 − = **255** | WU4a polish `fix(platform): harden company composer empty state, error wiring and mode exclusivity` ✅ ≤400 |
| `8f95d55` | 330 + / 55 − = **385** | WU4b `feat(platform): wire company composer vacancy mode into the feed` ✅ ≤400 |
| *(this change)* | — | `docs(openspec): archive p16-vacante with spec sync` — canonical specs synced + `archive-report.md` written + artifacts materialized under `archive/2026-10-21-p16-vacante/` |

Conventional format, English, no AI attribution.

**Slice size residual:** `e9af21e` is **513 changed lines — 113 over the 400-line review budget**. Accepted exactly like p15's Residual-1: it cannot be lowered without splitting the composer's spec away from its component, which would violate `work-unit-commits` (tests ship with their code). **The commit MUST NOT be rewritten or amended.** `c65dcbf` (255) and `8f95d55` (385) are within budget.

## Archive contents

- `explore.md` ✅
- `proposal.md` ✅
- `specs/` ✅ (2 deltas: `platform-vacancy` (new capability, canonical-style + corrected WU coverage map), `platform-feed` (MODIFIED + ADDED delta))
- `design.md` ✅ (D1–D11 + the D4 → D4a refinement note)
- `tasks.md` ✅ (30/30 complete; archive-sync note marked RESOLVED)
- `apply-progress.md` ✅ (6 slices, TDD evidence table with **17 rows / 19-of-19 RED tasks** after the W3 fix)
- `verify-report.md` ✅ (PASS WITH WARNINGS + the archive-applied spec-sync addendum)
- `archive-report.md` ✅ (this file)

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p16-vacante/explore` (#1036) |
| Proposal | `proposal.md` | `sdd/p16-vacante/proposal` (#1037) |
| Spec (deltas) | `specs/{platform-vacancy,platform-feed}/spec.md` | `sdd/p16-vacante/spec` (#1038) |
| Design | `design.md` | `sdd/p16-vacante/design` (#1039) |
| Tasks | `tasks.md` | `sdd/p16-vacante/tasks` (#1041) |
| Apply progress | `apply-progress.md` | `sdd/p16-vacante/apply-progress` (#1042) — **updated in place with the W3/W4 corrections (merged, no content lost)** |
| Verify report | `verify-report.md` | `sdd/p16-vacante/verify-report` (#1053) |
| Archive report | `archive-report.md` | `sdd/p16-vacante/archive-report` (this save, `capture_prompt: false`) |

Supporting observations: #1040/#1043–#1052 (phase support notes recorded during apply), #1054 (session summary).

## Design refinement recorded: D4 → D4a (A5)

Slice A (WU4a polish, task A5) made the two company-composer modes **exclusive** — the normal `feed-composer`/`feed-publish` form renders **only** in normal mode, the vacancy form **only** in vacancy mode; the toggle switches the publish form instead of stacking both, and it sits above both forms so its position is stable across modes. This resolves an ambiguity in the spec/design: the design locked "extract `CompanyComposerComponent` — textarea verbatim → byte-compatible" (D4) while the spec's literal "mode toggle" + "the never-empty invariant is enforced per composer path" did not say whether both forms stay mounted. The normal form's content is still byte-compatible (**599/599 chars** vs `main`, only the submit-handler name normalized) and normal mode remains the default, so every existing feed spec stays valid. The canonical `platform-vacancy` composer requirement now states exclusivity explicitly (spec-sync item 3), and the design doc carries the D4a note.

## Known debt carried forward (non-blocking, accepted at archive)

| ID | Item | Disposition |
|---|---|---|
| **Residual-1** | **WU4a commit `e9af21e` is 513 lines — 113 over the 400-line review budget.** Cannot go lower without splitting the composer spec away from its component, which would violate `work-unit-commits`. **Do NOT amend or rewrite it.** | **Accepted at archive** — reviewer may treat `e9af21e` as an over-budget slice. |
| **Debt-1 (W1)** | **Pre-existing flaky gate, NOT caused by p16.** `app.release-matrix.spec.ts` → *"starts the shell with the skip link, the first thing a keyboard user meets"* times out (5000 ms limit; observed 5685 ms) in ~1 of 4 full-suite runs. Root cause: `ReferenceError: IntersectionObserver is not defined` from the untouched marketing photo gallery (the a11y spec and `photo-gallery.component.spec.ts` stub it; the release-matrix spec does not) + jsdom "Not implemented: navigation" noise, so the 16-route loop exceeds 5 s. **The verifier REPRODUCED it on a pristine `main` archive (745 tests, 4 runs → 1 failure at 5528 ms, identical test)** → pre-existing, unrelated to p16. File is a **zero-diff gate**, passes 7/7 in isolation. | **Carried debt.** Fix belongs to a future change: stub `IntersectionObserver` in `app.release-matrix.spec.ts` (or raise that test's timeout). Not fixed here — out of p16's scope. |
| **Debt-2 (F6)** | **No photo previews in the company composer** — p15's `job-request-composer` shows a thumbnail grid; p16's vacancy-mode photo input does not. | Carried. Follow-up: port the preview grid. |
| **Debt-3 (F7)** | **`URL.createObjectURL` blobs are never revoked** — **cross-cutting**: the same gap exists in p15's `job-request-composer`. Not a p16 regression. | Carried. Follow-up should fix both composers together (memory hygiene). |
| **Debt-4 (F10/S1)** | **The "byte-compatible" assertion in the composer spec is shallow** — it checks rows/placeholder/label/button text but not `class` or `type="submit"`. The code itself IS byte-identical (verifier's independent byte-diff: **599/599 chars**). **Test gap, not implementation gap.** | Carried. Add `expect(button.getAttribute('type')).toBe('submit')` + the class string. |
| **Debt-5 (S4)** | **Duplicate-id check only exercised in default (normal) mode** — vacancy-mode ids (`company-composer-job-*`, `company-composer-vacancy-text`, `company-composer-photos`) are not re-asserted. | Carried. |
| **Debt-6 (S5)** | **Latent session/role author mismatch** — `companyAuthorId` is session-bound while `effectiveRole()` can be overridden by the `role` input; a worker session forced to `role="company"` would show an empty picker and author with the worker's id. **Currently unreachable** (no route binds `[role]`). | Carried. Resolve by deriving picker scope from the same source as the role, or stop letting the input override a session role. |
| **Debt-7 (S6)** | **A job closed AFTER selection is still publishable** — the picker filter is reactive but the selection is not pruned; spec-compliant as written, untested. | Carried. Publish-time re-filter would be more correct. |
| **Debt-8 (S8)** | **Photo reset untested** — photos ARE reset in code (`photos.set([])` + `form.reset()`), but no test covers it. | Carried. |
| **Debt-9 (S2)** | **`toBeTruthy()` on error copy** (3 assertions in `company-composer.component.spec.ts:193/294/307`) — emptiness-only; the exact es-AR copy is never asserted. These are the verify's 3 WARNINGs (0 CRITICAL). | Carried. Assert the exact copy. |
| **Debt-10 (S3)** | **Loose `toBeGreaterThan(0)`** at `feed.page.spec.ts:969` where an exact length is available (`toHaveLength(JOBS.length)`). | Carried. |
| **Debt-11** | **p15 debt still open:** `@vitest/coverage-v8` installed but coverage **not wired** (p15 Debt-2, `coverage_threshold: 0`); **admin composer is "none" by design** (p15 Debt-3). | Carried forward unchanged. |

### SUGGESTIONs resolved at archive (no action required)

- ~~W2 count drift (11 → 12)~~ → **RESOLVED** — canonical + archived delta now read **11 → 13** with corrected index wording.
- ~~W3 missing WU1 TDD rows~~ → **RESOLVED** — 4 rows added from recorded evidence; unrecorded signals marked *not recorded*.
- ~~W4 wrong test totals (36 / baseline 759)~~ → **RESOLVED** — **+50 tests, baseline 745, HEAD 795** in Engram #1042 and the archived copy.
- ~~W5 scenario totals (23)~~ → **RESOLVED** — **17 + 7 = 24**.
- ~~S9 triage-count mismatch in the `4.1–4.4` row~~ → **RESOLVED** — row annotated (slice shipped 7 `it()`s; 773 → 780 confirms +7).

**Not resolved here (orchestrator's):** **W6** — `HANDOFF.md` is in the delivery diff (commit `f562270`); the file is orchestrator-owned and was **not touched by this phase**.

## Deferred scope (explicit — NOT implemented)

| Deferred item | Where it will live |
|---|---|
| Contract edits (`openapi.yaml`, `Post`, `PostInput`, `FeedPostInput`, `contract-conformance.ts`) | Future contract-owning change |
| Photo previews in the company composer (Debt-2) | Follow-up composer polish change |
| Revoking `URL.createObjectURL` blobs across both composers (Debt-3) | Cross-cutting p15+p16 follow-up |
| Publish-time re-selection filter for jobs closed after selection (Debt-7) | Future change |
| Strengthening the byte-compatible / error-copy / duplicate-id assertions (Debt-4, 5, 9, 10) | Next change touching the composer |
| Deriving picker scope + role from one source (Debt-6) | Future change (currently unreachable) |
| Coverage gating (`coverage_threshold: 0`) | p15 Debt-2, still open |
| Admin composer design | p15 Debt-3, still open |
| Gating the detail-page apply form by `job.status` | Pre-existing behavior, explicitly out of p16 scope |
| Real backend/media upload; vacancy creation from the feed; inline apply | Future change |
| Structured cards on `/previa` | Optional future slice (p13 reduced previa is intentional) |
| Release-matrix `IntersectionObserver` flake (Debt-1 / W1) | Pre-existing; fix in a future change |

## Checklist

- [x] Delta specs synced BEFORE the archive step — `platform-vacancy` **created**; `platform-feed` 1 MODIFIED merged (matched via the `(Previously:)` marker) + 1 ADDED appended
- [x] No leftover delta scaffolding in canonical specs (grep-verified: 0 `## ADDED/MODIFIED/REMOVED`, 0 `# Delta for …` across all 25 canonical specs)
- [x] Requirements not mentioned in the deltas preserved **byte-identical** (`Feed gateway port`, `Feed renders via signals (zoneless)`, `Fixture media URLs are renderable`, `Job-request posts project structured card via [postExtra]`)
- [x] **W2** applied — "11 → 12" → **"11 → 13"** + index wording fixed, in canonical spec AND archived delta
- [x] **W3** applied — 4 WU1 TDD evidence rows added from recorded task status, unrecorded signals marked *not recorded* (no fabricated evidence)
- [x] **W4** applied — apply-progress test totals corrected to **+50 / 745 / 795** in Engram #1042 (merged) and the archived copy
- [x] **W5** applied — scenario totals corrected to **17 + 7 = 24** in the archived delta and this report
- [x] **A5/D4a** recorded — composer exclusivity stated in the canonical `platform-vacancy` requirement (and the `platform-feed` MODIFIED requirement), plus the D4a note in `design.md`
- [x] Archive folder created at `openspec/changes/archive/2026-10-21-p16-vacante/` with all artifacts materialized from Engram (artifact store is **engram** — there was no `openspec/changes/p16-vacante/` directory to move)
- [x] Verify verdict is non-CRITICAL (0 CRITICAL) → archive allowed; W1 recorded as pre-existing carried debt, SUGGESTIONs recorded as carried debt
- [x] Engram archive report saved as `sdd/p16-vacante/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] No source code changed in this phase; only `openspec/` paths staged (`HANDOFF.md`, `src/app/`, `contracts/`, `angular.json` untouched)
- [x] **NOT merged to `main`** — isolated branch `feature/p16-vacante` (`8f95d55`, base `a711e5f`); awaiting a push/merge decision

## Next steps

`p16-vacante` closes the p15 handoff's second post type: a company can now promote 1..n of its own vacancies through an exclusive mode-toggle composer, with a live-resolving multi-vacancy card in `[postExtra]`, the contract frozen, and the full gate green (795/795, +50 tests, 9/9 mutations killed). Outstanding items are the 11 debt notes above — none blocks archive.

**Merge/push decision pending:** the change is isolated on `feature/p16-vacante` and is **NOT merged to `main`** and **not pushed**; the orchestrator handles push, a human decides integration. Natural follow-ups: the release-matrix `IntersectionObserver` flake (Debt-1, pre-existing and now reproducible on `main`), composer polish (photo previews + blob revocation), or wiring coverage gates (Debt-11).
