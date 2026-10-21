# Apply Progress: p16-vacante — WU1 (data) + WU2 (card) + WU3 (feed projection) + WU4a (composer + polish) + WU4b (feed wiring)

**Mode**: Strict TDD (`bunx ng test --watch=false`, RED→GREEN per task)
**Artifact store**: hybrid (Engram `sdd/p16-vacante/apply-progress` #1042 + this mirror)
**Branch**: `feature/p16-vacante` (chained WU commits, feature-branch-chain), HEAD `8f95d55`

> **Archive-phase corrections applied (2026-10-21)** — verify findings **W3** (WU1 rows added to the TDD Cycle Evidence table, from the recorded WU1 task status; signals that were never captured are marked *not recorded*, never invented) and **W4** (test totals corrected: **+50 new tests**, baseline `main` = **745**, HEAD = **795**). No WU1→WU4b content was removed.

## Batch State

- **Completed WUs**: WU1 (tasks 1.1–1.8) — commit `3fbe2b2` (10 files, +324/−12). WU2 (tasks 2.1–2.6) — commit `982eecf` (7 files, +290/−0). WU3 (tasks 3.1–3.4) — commit `4c9bd9c` `feat(platform): project vacancy card in feed with guarded jobs hydration (p16 WU3)` (2 files, +248/−8 = 256 lines, within 220–280 estimate, ≤400 budget). WU4a (tasks 4.1–4.4) — commit `e9af21e` `feat(platform): add company composer with vacancy mode and scoped picker (p16 WU4a)` (513 lines — 113 OVER the 400 budget, accepted like p15's Residual-1, NOT amended/rewritten). WU4a polish (tasks A1–A5) — commit `c65dcbf` `fix(platform): harden company composer empty state, error wiring and mode exclusivity (p16 WU4a polish)` (3 files, +202/−53 = 255 lines, ≤400 budget). WU4b (tasks 4.1–4.3) — commit `8f95d55` `feat(platform): wire company composer vacancy mode into the feed (p16 WU4b)` (2 files, +330/−55 = 385 lines, ≤400 budget).
- **Next batch**: none — ALL 5 work units are DONE. The change is ready for the verify phase.
- **Rollback**: revert `8f95d55` (feed wiring) → `c65dcbf` (composer polish) → `e9af21e` (composer, still unreferenced) → `4c9bd9c` (projection + hydration never fires; card/data remain inert) → `982eecf` (card/helper only) → `3fbe2b2` (pure in-memory data).

## WU1 Task Status (unchanged)

- [x] 1.1 RED `mocks/vacancy.registry.spec.ts`: record/get; reset restores seed snapshot
- [x] 1.2 GREEN `mocks/vacancy.registry.ts`: Map + record/get/reset from VACANCY_SEEDS
- [x] 1.3 RED `post-views.spec.ts`: vacancy derivation + job-request precedence
- [x] 1.4 GREEN models.ts PostKind+'vacancy'/VacancyPayload/PostView.vacancy?; toPostView derives after job-request
- [x] 1.5 RED `fixtures.spec.ts`: count 11→13, ≥2 seeds before post-10, text-only, company-owned, owned jobs
- [x] 1.6 GREEN `fixtures.ts`: 2 text-only vacancy seeds inserted before post-10 (post-12 company-1→job-1/2, post-13 company-2→job-4/5)
- [x] 1.7 RED `mock-gateways.spec.ts`: vacancy create records payload; session author; standard writes nothing
- [x] 1.8 GREEN `ports.ts` CreatePostDraft.vacancy?; gateway records on kind==='vacancy'

## WU2 Task Status (unchanged)

- [x] 2.1 RED `store/job-status.spec.ts`: open→`Abierta`, closed→`Cerrada` (TS2307 module missing)
- [x] 2.2 GREEN `store/job-status.ts`: pure `jobStatusLabel` mirroring `applicationStatusLabel`
- [x] 2.3 RED `components/post-vacancy/vacancy-openings.spec.ts`: payload-order resolution, skip missing ids, `[]` when none resolve (TS2307)
- [x] 2.4 GREEN `vacancy-openings.ts`: pure `resolveVacancyOpenings(payload, openings)` via one Map lookup
- [x] 2.5 RED `post-vacancy.component.spec.ts`: multi-entry title/location/budget/`Abierta`+Postularse href; `Cerrada` keeps link; optional rows omitted; a11y group + distinct link names (TS2307)
- [x] 2.6 GREEN `post-vacancy.component.ts`/`.html`: `openings = input.required<JobOpening[]>`, `role="group"` `aria-label="Vacante"`, budget via `formatMoneyRange`, link ALWAYS rendered, `aria-label="Postularse a {title}"` per link

## WU3 Task Status (unchanged)

- [x] 3.1 RED `feed.page.spec.ts` (+5 tests): card in `[postExtra]` only + `[postBody]` clean + base template unmodified + standard/job-request neighbors unchanged + D11 group/label + distinct `Postularse a …` names; D6 hide when 0 ids resolve (post still renders, card absent); partial-resolve triangulation (missing id skipped, resolvable entry paints); `resetVacancyRegistry()` added to beforeEach/afterEach (D11/R1).
- [x] 3.2 RED same spec: `vi.spyOn(JobsStore,'load')` → exactly 1 call for 2 vacancy posts + extra render passes don't re-fire; JOBS_GATEWAY override flips job-1 to closed AFTER seeding → `Estado: Cerrada`/`Estado: Abierta` live, links stay (href `/plataforma/trabajos/job-1`).
- [x] 3.3 GREEN `pages/plataforma/feed.page.ts` (+56/−8): inject `JobsStore`; `vacancyOpeningsById` computed (maps view id → resolved openings, entries only when non-empty → D6 hide is map-absence, no flash); one-shot guarded hydration effect (tracks `views()` vacancy presence, reads `listStatus()` untracked, fires only when `idle` — `load()` flips to `loading` sync so re-runs never double-load, matches design D5 guard shape); template `<app-post-vacancy postExtra [openings]>` inside single-root `@if` (p15 lesson honored — host element carries the attribute).
- [x] 3.4 Verify: release-matrix `images: 11` green ZERO-DIFF; a11y green ZERO-DIFF (throwaway probe proved axe DOES scan the projected card under admin-seeded `/plataforma` — cards=2, links=4 paint at gate flush depth — and it passes, so D11 group/labels hold under axe; probe deleted before commit). Contract zero-diff confirmed (`git diff main -- contracts/ contract-conformance.ts` empty). Full gates; commit `4c9bd9c`.

## WU4a Task Status

- [x] 4.1 RED `company-composer.component.spec.ts`: normal mode default; `feed-composer`/`feed-publish` testids + textarea byte-compatible; toggle "Buscar trabajadores".
- [x] 4.2 RED same spec: picker lists ONLY own open jobs (`company-1`: job-1/2/6; excludes own-closed job-3 and `company-2` job-4/5).
- [x] 4.3 RED same spec: composite rule — text-only ✓, photo-only ✓ (cap 10), vacancy-only rejected (`role="alert"` + focus on the first checkbox / on the text); emits `CompanyPostDraft { jobIds, content, attachments }`; `jobIds: []` → standard.
- [x] 4.4 GREEN create `src/app/components/company-composer/*` (textarea verbatim; `openings` + `authorId` inputs, `publish` output; unique ids/labels a11y). Commit `e9af21e` — 513 lines (113 over the 400-line review budget; accepted like p15's Residual-1, NOT amended).
- Path note: the component lives FLAT under `src/app/components/company-composer/` (repo convention for sibling components), NOT under `src/app/core/platform/` as the task text implied.

## WU4a polish Task Status (Slice A)

- [x] A1 RED+GREEN empty-picker dead end. The picker renders an informative empty state ("No tenés vacantes abiertas para promocionar.") instead of the unsatisfiable composite error, and the focus fallback lands on that empty state (`tabindex="-1"`), never nowhere. RED: 6 new tests failed (empty state missing → `undefined`; focus never moved).
- [x] A2 RED+GREEN `aria-invalid` on the photos input, symmetric with the textarea and the checkboxes. The old `textTouched` flag became `mediaTouched` — the text-OR-photos side of the composite rule — and both controls bind it.
- [x] A3 RED+GREEN the checkbox group is wired to the error region: `data-testid="vacancy-picker-group"`, `role="group"`, `aria-label="Vacantes a promocionar"`, `aria-describedby="company-composer-composite-error"`.
- [x] A4 RED+GREEN the composite error clears as soon as the user edits the corresponding input (job picked / text typed / photo attached) via a private `clearRejection()` that resets `compositeRejected`, `pickerTouched` and `mediaTouched`.
- [x] A5 RED+GREEN the two modes are EXCLUSIVE — the toggle SWITCHES the publish form instead of stacking both. The normal `feed-composer`/`feed-publish` form renders only in normal mode, the vacancy form only in vacancy mode. Normal mode stays the default, so the byte-compatible contract and the existing feed specs are unaffected. Refinement of design D4 → **D4a** (see "Deviations from Design"); the canonical `platform-vacancy` spec wording was synced to this behavior at archive.
- [x] A6 F5 guard — VERIFIED in Slice B: the inline feed form (`id="feed-post-content"`) was DELETED from `feed.page.ts`; a new spec asserts the rendered feed carries NO duplicate element ids (F5 satisfied).

## WU4b Task Status (Slice B — this batch)

- [x] 4.1 RED `feed.page.spec.ts` (+9 tests: 7 scenario + 2 hydration-guard). 5 of the 7 scenario tests failed behaviorally at RED (composer absent → `app-company-composer` null; toggle absent → the mode could not be entered; normal publish unreachable). RED evidence: 39 passed / 5 failed of 44, then 45 passed / 1 failed of 46 after the assertion was scoped to the picker group (the first version asserted on the whole page text, which legitimately mentions "Plomero" in the TIMELINE — a test bug, not an implementation bug).
  Scenarios covered: (a) company vacancy publish → `kind:'vacancy'`, exact `jobIds`, `authorId` = session, registry entry via `getVacancy(post.id)`, vacancy card projected + free text in the body slot; (b) picker scoped to own OPEN jobs in the real feed (company-1 → job-1/2/6; own-closed "Director de obra" excluded, other-company "Plomero" excluded); (c) a `company-2` session → picker job-4/job-5 and the denormalized author "Grupo Delta Construcciones" (never a hardcoded id); (d) normal mode → `kind:'standard'`, NO vacancy payload (`getVacancy` undefined) and NO vacancy card; (e) worker → `job-request-composer` present, `app-company-composer` absent; (f) admin → no composer at all; (g) the feed renders NO duplicate element ids (F5/A6).
- [x] 4.2 GREEN `pages/plataforma/feed.page.ts` (+113/−55): the inline company `<form>` was REPLACED by `<app-company-composer [openings]="jobs.openings()" [authorId]="companyAuthorId()" (publish)="publishCompany($event)">`; the dead `draft` signal, `onDraftInput` and the old `publish(event)` were DELETED (no duplicate `id="feed-post-content"` survives). `publishCompany(draft)` maps `jobIds.length > 0` → `create({ authorId, kind:'vacancy', content, attachments, vacancy:{ jobIds } })` and `jobIds.length === 0` → `create({ authorId, kind:'standard', content, attachments })` with NO `vacancy` key. `companyAuthorId` computed = `session.currentUser()?.userId ?? COMPANY_PROFILE.companyId` — the SAME value feeds the picker scope and the create path, and no `'company-1'` literal survives (the old `publish()` hardcoded it).
- [x] 4.3 Hydration guard extended: the effect now also fires when `effectiveRole() === 'company'` (`needsPicker`), so the picker has openings even when the timeline carries NO vacancy post. The WU3 "exactly one `load()`" guarantee is preserved by the same idle guard (`listStatus() === 'idle'`; `load()` flips to `loading` synchronously), so the two triggers collapse into ONE load. BOTH new tests were MUTATION-CHECKED: with `needsPicker` forced to `false` the "hydrates the openings … even without vacancy posts" test fails ("expected load to be called 1 times, but got 0 times"); with the idle guard removed BOTH fail ("got 2 times"). The guards have teeth.
- [x] 4.4 Verify: `bunx ng test --watch=false` → **795/795** (82 files, two consecutive green runs; the known pre-existing release-matrix flake fired once in an earlier run of the same tree and the file is a zero-diff gate — see Issues 1). `bunx ng build` → 25 static routes prerendered. `bunx ng lint` → "All files pass linting" (one fix: the now-unused `signal` import). Contract zero-diff empty; `angular.json` / `app.release-matrix.spec.ts` / `app.a11y.spec.ts` zero-diff empty. Commit `8f95d55` (2 files, +330/−55 = 385 lines, ≤400 budget).

## TDD Cycle Evidence

> **W3 (added at archive)**: the WU1 rows below were added from the **recorded WU1 task status** (Section "WU1 Task Status") plus the WU1 suite count recorded in `tasks.md` (#1041). No failing-test count, error message or refactor note was ever captured for WU1, so those cells are marked **not recorded** rather than reconstructed — RED remains asserted by the recorded task checkboxes (1.1/1.3/1.5/1.7 are RED-first tasks whose specs ship in commit `3fbe2b2`).

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1/1.2 | `mocks/vacancy.registry.spec.ts` (new) | Unit | ✅ 745/745 (`main` baseline) | ✅ RED task recorded: "record/get; reset restores seed snapshot" — **signal not recorded** (no failing-test count or error message captured for WU1) | ✅ GREEN task recorded: `Map` + `recordVacancy`/`getVacancy`/`resetVacancyRegistry` from `VACANCY_SEEDS`; suite **759/759** at WU1 end (`3fbe2b2`) | ⚠️ **not recorded** (verify §7 reconciles the other 13 rows only) | ⚠️ **not recorded** |
| 1.3/1.4 | `mocks/post-views.spec.ts` (extended) | Unit | ✅ 745/745 (`main` baseline) | ✅ RED task recorded: "vacancy derivation + job-request precedence" — **signal not recorded** | ✅ GREEN task recorded: `PostKind` +`'vacancy'`, `VacancyPayload { jobIds }`, `PostView.vacancy?`; `toPostView` derives after job-request; suite **759/759** | ⚠️ **not recorded** | ⚠️ **not recorded** |
| 1.5/1.6 | `mocks/fixtures.spec.ts` (extended) | Unit | ✅ 745/745 (`main` baseline) | ✅ RED task recorded: "count 11→13, ≥2 seeds before post-10, text-only, company-owned, owned jobs" — **signal not recorded** | ✅ GREEN task recorded: 2 text-only vacancy seeds inserted before `post-10` (`post-12` company-1→job-1/2, `post-13` company-2→job-4/5); suite **759/759** | ⚠️ **not recorded** (D9 `11→13` asserted; verify later proved `fixtures.spec.ts:23` is the ONLY count churn) | ⚠️ **not recorded** |
| 1.7/1.8 | `api/mock-gateways.spec.ts` (extended) | Unit | ✅ 745/745 (`main` baseline) | ✅ RED task recorded: "vacancy create records payload; session author; standard writes nothing" — **signal not recorded** | ✅ GREEN task recorded: `CreatePostDraft.vacancy?` (no conformance entry); gateway records on `kind==='vacancy'`; suite **759/759** | ⚠️ **not recorded** (verify §3 scenario 7 cites `mock-gateways.spec.ts:101` for the author-aware case) | ⚠️ **not recorded** |
| 2.1→2.2 | `store/job-status.spec.ts` (new) | Unit | N/A (new) | ✅ TS2307 `./job-status` unresolved | ✅ 761/761 | ✅ 2 cases (open→Abierta / closed→Cerrada) | ✅ Clean (verbatim application-status mirror) |
| 2.3→2.4 | `post-vacancy/vacancy-openings.spec.ts` (new) | Unit | ✅ 761/761 | ✅ TS2307 `./vacancy-openings` unresolved | ✅ 764/764 | ✅ 3 cases (payload order / skip-missing keeps resolvable / none-resolve→[]) | ✅ Clean (single Map lookup) |
| 2.5→2.6 | `post-vacancy/post-vacancy.component.spec.ts` (new) | Integration (TestBed) | ✅ 764/764 | ✅ TS2307 `./post-vacancy.component` unresolved | ✅ 768/768 | ✅ 4 cases (multi-entry 3 jobs with hrefs / closed keeps link / absent location+budget omitted / a11y group+aria-labels) | ✅ Clean; one lint fix (eqeqeq) |
| 3.1→3.3 | `pages/plataforma/feed.page.spec.ts` (extended, +5) | Integration (TestBed, zoneless page) | ✅ 768/768 | ✅ 4 execution failures at 773 (projection, partial-resolve, load-once, live-Cerrada); D6-hide trivially green pre-impl by design — companion non-empty test makes the pair real | ✅ 773/773 (after provideRouter fix, see Issues) | ✅ 5 cases (projection+a11y+neighbors / D6 all-missing hide / partial-resolve skip / load exactly-once + extra passes / closed-after-seed Cerrada + href) | ✅ Clean — computed map + guard effect, no behavior change |
| 3.4 | matrix + a11y gates | E2E-ish (real shell + axe) | ✅ 773/773 | N/A (verify task) | ✅ both green zero-diff | ➖ Single (verify) | ➖ None needed |
| 4.1–4.4 | `components/company-composer/company-composer.component.spec.ts` (new, 7 tests) | Integration (TestBed) | ✅ 773/773 | ✅ TS2307 module missing (cancelled launch — see Issues) | ✅ 780/780 | ✅ 5 cases (normal default + byte-compat / own-open picker scope / vacancy-only rejected + focus / text-only publish / photo-only publish + cap 10) — S9: the slice shipped 7 `it()`s; 773 → 780 confirms +7 | ✅ Clean |
| A1 | `company-composer.component.spec.ts` (+1) | Integration (TestBed) | ✅ 780/780 | ✅ empty state missing → `expected undefined to be 'No tenés…'`; focus never moved | ✅ 781/781 | ✅ 1 case (company-3 owns no open vacancy) + companion: the composite error stays empty in that case | ✅ Clean — `@empty` branch + `compositeErrorText` computed |
| A2 | `company-composer.component.spec.ts` (+1) | Integration (TestBed) | ✅ 781/781 | ✅ `expected null to be 'true'` (photos had no aria-invalid) | ✅ 782/782 | ✅ 2 paths in one test (photos invalid + text invalid + picker NOT invalid) | ✅ `textTouched` → `mediaTouched` (text-or-photos side of the rule) |
| A3 | `company-composer.component.spec.ts` (+1) | Integration (TestBed) | ✅ 782/782 | ✅ `expected undefined to be 'group'` (no picker group existed) | ✅ 783/783 | ✅ 1 case + the alert role/id cross-check | ✅ Wrapped the `<ul>` in a labelled `role="group"` container |
| A4 | `company-composer.component.spec.ts` (+2) | Integration (TestBed) | ✅ 783/783 | ✅ `expected 'Elegí al menos una vacante…' to be ''` (both cases) | ✅ 785/785 | ✅ 2 paths (pick a vacancy / type the missing text) | ✅ Private `clearRejection()` resets all three flags |
| A5 | `company-composer.component.spec.ts` (+1) | Integration (TestBed) | ✅ 785/785 | ✅ `expected <form …feed-composer> to be null` (both forms rendered at once) | ✅ 786/786 | ✅ 2 directions (normal absent in vacancy mode / vacancy absent in normal mode) | ✅ Normal form wrapped in `@if (mode() === 'normal')`; toggle moved above both forms so it keeps its position across modes |
| 4.1→4.2 | `pages/plataforma/feed.page.spec.ts` (extended, +9) | Integration (TestBed, zoneless page) | ✅ 786/786 | ✅ 5 of 7 scenario tests failed behaviorally (composer absent / toggle absent / normal publish unreachable); the worker + admin "unchanged path" guards passed pre-swap by design — their companion (the company scenario) carried the RED | ✅ 795/795 (after scoping the picker assertion to the picker group — a test bug, not an implementation bug) | ✅ 9 cases (vacancy publish + registry + card / own-open picker scope / company-2 scope + author / standard without payload / worker path / admin path / no duplicate ids / exactly-one-load for a company session / picker hydrates without vacancy posts) | ✅ Inline form deleted, `publishCompany` extracted, `companyAuthorId` computed, hydration effect extended |
| 4.3 (mutation) | `feed.page.spec.ts` (guard tests) | Integration (TestBed) | ✅ 795/795 | ✅ `needsPicker=false` → "load called 1 times, got 0"; idle guard removed → both "got 2 times" | ✅ restored → 46/46 spec, 795/795 suite | ➖ 2 mutations, 2 targeted failures | ➖ None needed |

**Coverage of the table**: 17 rows — **19/19 RED-first tasks now have a row** (WU1's 4 were missing; added above per verify **W3**).

### Test Summary

> **W4 (corrected at archive)**: the original summary said "36 tests / baseline 759". The verifier measured **+50 new tests**, baseline `main` = **745**, HEAD = **795**. The 36 excluded WU1's 14 unit tests, and 759 was the post-WU1 figure, not the baseline.

- **Total tests written (this change)**: **50** — WU1 **14** · WU2 9 · WU3 5 · WU4a 7 · Slice A polish 6 · Slice B 9 (verify-measured)
- **Total tests passing**: **795/795 at HEAD `8f95d55`** (82 files). Chain: baseline `main` **745** → after WU1 **759** → after WU2 **768** → after WU3 **773** → after WU4a **780** → after WU4a polish **786** → after WU4b **795**; zero regressions. **Δ vs baseline = +50 tests.**
- **Layers used**: Unit (5) + Integration/TestBed (29) + Gate/shell (2) as recorded per slice for the 36 non-WU1 tests; WU1's 14 are all Unit. The verifier classifies the same +50 as Unit +14 / Integration +36 (different bucketing of the pure-helper tests, same total).
- **Approval tests**: None — no refactoring of existing code
- **Pure functions created**: 2 (`jobStatusLabel`, `resolveVacancyOpenings`)

## Gates (Slice B — commit 8f95d55)

- `bunx ng test --watch=false`: **795/795 passed** (82 files, two consecutive green runs)
- `bunx ng build`: ✅ (25 static routes prerendered)
- `bunx ng lint`: ✅ All files pass linting
- `app.release-matrix.spec.ts` / `app.a11y.spec.ts`: ✅ untouched (zero-diff) and green
- Contract READ-ONLY: `git diff main -- contracts/ src/app/core/platform/domain/contract-conformance.ts` = **empty** ✅
- `angular.json`: untouched ✅ · only the 2 feed-page files staged ✅
- Changed lines: +330/−55 = 385 (≤400 review budget) ✅

## Deviations from Design

1. **A5 — mode exclusivity (refinement of D4 → D4a, NOT a contradiction).** D4 locked "extract `CompanyComposerComponent` — textarea verbatim → byte-compatible" and the spec's "mode toggle" wording was ambiguous about whether the normal form stays mounted in vacancy mode. The implementation makes the modes EXCLUSIVE (the toggle switches the publish form instead of stacking both) and moves the toggle ABOVE both forms so it keeps a stable position across modes. The normal form's content is still byte-compatible (same testids, placeholder, rows, label, button text, blank-text rejection, element reset) and normal mode remains the default, so every existing feed spec stays valid. **Synced into the canonical `platform-vacancy` spec wording at archive.**
2. **A1 — empty picker copy.** The spec locks the composite rule but not the empty-picker copy. The picker shows "No tenés vacantes abiertas para promocionar." and the composite alert stays SILENT in that case (the rule is unsatisfiable, so showing "elegí al menos una vacante" would be an error the user cannot act on).
3. **A2 — `mediaTouched` replaces `textTouched`.** Internal signal rename only: the rejection cause covers "no text AND no photos", so both controls bind the same flag.
4. **WU4b — the author's fallback is `COMPANY_PROFILE.companyId`, not the literal `'company-1'`.** The pre-p16 `publish()` hardcoded `'company-1'`; the new `companyAuthorId` computed uses the session user and falls back to the demo profile constant, so the picker scope and the created post can never disagree.
5. **WU4b — the hydration effect gained a second trigger (`needsPicker`).** Design D5 locked the guard for "a vacancy view needs openings"; a company session needs the openings for the PICKER even when the timeline has no vacancy post. The idle guard is untouched, so the exactly-one-load guarantee still holds (mutation-checked both ways).
6. WU3 spec-infra addition (unchanged): `feed.page.spec.ts` TestBed includes `providers: [provideRouter([])]` — the projected card carries `RouterLink`.

## Issues Found

1. **Pre-existing flaky gate (NOT caused by this change).** `app.release-matrix.spec.ts` → "starts the shell with the skip link" times out at 5000ms in roughly 1 of 3–4 full-suite runs. Reproduced on the PRE-CHANGE baseline with the working tree stashed (3 runs → 1 failure), and independently by the verifier on a pristine `main` archive (**745 tests, 4 runs → 1 failure** at 5528 ms, identical test) — so it is unrelated to p16. Root cause: the marketing page's deferred photo gallery throws `ReferenceError: IntersectionObserver is not defined` inside an AfterRender hook (the a11y spec stubs it, the release-matrix spec does not) plus jsdom "Not implemented: navigation to another Document" noise, and the 16-route loop then exceeds the 5s timeout. The file is a ZERO-DIFF gate — NOT modified; recorded as pre-existing debt (verify **W1**). (Slice B hit it once in 3 full runs; the spec passes 7/7 in isolation.)
2. WU4a was implemented and committed (`e9af21e`) by a CANCELLED launch that never recorded its task checkboxes nor its apply-progress. Recovered in that batch (tasks 4.1–4.3 marked `[x]`, status recorded here).
3. WU4a's commit is 513 lines — 113 OVER the 400-line review budget. Accepted like p15's Residual-1 (the audit was worth more than the split); the commit is NOT amended or rewritten.
4. Zoneless two-hop flush (WU3, still valid): vacancy hydration is feed-load → effect fires `jobs.load()` → openings settle → cards/picker paint. Specs need TWO `whenStable` rounds (helper `settleVacancyFeed`).
5. The contract `Post` has NO `kind` field — the kind lives in the demo registries, and the `toPostView` mapper derives it. A spec that wants "a timeline without vacancy posts" must drop the SEEDED ids (`post-12`, `post-13` from `VACANCY_SEEDS`), not filter on `post.kind` (it does not exist and fails to compile).

## Recorded Debt (NOT implemented — out of scope)

- **F6**: no photo previews in the company composer (p15's `job-request-composer` shows a thumbnail grid).
- **F7**: `URL.createObjectURL` blobs are never revoked (same pre-existing gap in the p15 composer).
- **F10**: the "byte-compatible" assertion in the composer spec is shallow (checks rows/placeholder/label/button text but not `class` or `type="submit"`).
- WU4a's commit `e9af21e` is 513 lines (113 over the 400-line review budget) — accepted like p15's Residual-1; do NOT amend or rewrite it.
- Pre-existing flaky timeout in the zero-diff `app.release-matrix.spec.ts` gate (see Issues 1).

## Next

ALL 5 work units are DONE (WU1 → WU2 → WU3 → WU4a → WU4a polish → WU4b). Verify ran: **PASS WITH WARNINGS** (0 CRITICAL) at `feature/p16-vacante` HEAD `8f95d55`. Archive applied the spec sync (W2 "11 → 13", W5 totals 24) and the apply-progress corrections (W3 WU1 rows, W4 test totals). No push, no merge, no PR — delivery is by the orchestrator.
