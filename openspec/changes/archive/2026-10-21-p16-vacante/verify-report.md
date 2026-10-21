# Verification Report: p16-vacante — Plantilla 3 (company vacancy-promo posts)

**Artifact store**: hybrid (this file + Engram `sdd/p16-vacante/verify-report` #1053)

**Change**: p16-vacante — Plantilla 3 (company vacancy-promo posts)
**Branch / HEAD**: `feature/p16-vacante` @ `8f95d55` (worktree clean)
**Version**: spec #1038 · design #1039 · tasks #1041 · apply-progress #1042 (Engram)
**Mode**: Strict TDD (`openspec/config.yaml` → `testing.strict_tdd: true`)
**Persistence**: Engram (no `openspec/changes/p16-vacante/` dir; repo is read-only for the verifier)

---

## 1. Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 30 (WU1 8 · WU2 6 · WU3 4 · WU4a 4 · polish A1–A5 5 · WU4b 3) |
| Tasks complete | 30 |
| Tasks incomplete | 0 |
| Work units | 5 + 1 polish slice, all committed (`3fbe2b2`, `982eecf`, `4c9bd9c`, `e9af21e`, `c65dcbf`, `8f95d55`) |
| Changed files | 23 (+1876/−79) vs `main` — 12 source, 9 spec, 1 orchestrator-owned `HANDOFF.md`, 1 plan doc |

---

## 2. Build & Tests Execution

**Build**: ✅ Passed
```text
$ bunx ng build
Application bundle generation complete. [18.135 seconds]
Prerendered 25 static routes.
Output location: .../dist/Construction-Company-Agency
```

**Tests**: ✅ 795 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
$ bunx ng test --watch=false
 Test Files  82 passed (82)
      Tests  795 passed (795)
   Duration  32.01s
```

Baseline `main` = 745 tests / 77 files → HEAD = 795 / 82 (**+50 tests**, measured per file against `git show main:<file>`).

**Lint**: ✅ `All files pass linting.`
**Type check**: ✅ 0 errors (`ng build` runs `tsc` strict + `strictTemplates`)
**Contract**: ✅ `bun run contract:lint` → "No results with a severity of 'error' found!" · `bun run contract:check` → clean (schema.gen.ts byte-identical)

**Coverage**: ➖ Not available — `openspec/config.yaml` → `testing.coverage: false`. Coverage analysis skipped (not a failure).

---

## 3. Spec Compliance Matrix

The spec enumerates **24** scenarios (see Finding W5): 17 in `platform-vacancy` + 7 in the `platform-feed` delta (5 MODIFIED + 2 ADDED).

| # | Req | Scenario | Test (file:line → `it`) | Result |
|---|-----|----------|--------------------------|--------|
| 1 | R1 kind/payload | Kind widened and payload reference-only | `mocks/post-views.spec.ts:163` "derives kind vacancy and the payload on a registry hit" · `:172` "omits the vacancy key entirely on a registry miss" · `domain/models.ts` `VacancyPayload { jobIds: string[] }` (job fields unrepresentable at the type level) | ✅ COMPLIANT |
| 2 | R1 | Contract artifacts remain zero-diff | `git diff main -- contracts/ src/app/core/platform/domain/contract-conformance.ts` → empty · `models.ts` diff touches only `PostKind`, `VacancyPayload`, `PostView.vacancy?` (`Post`/`PostInput` untouched) · `contract:lint`/`contract:check` green | ✅ COMPLIANT |
| 3 | R2 registry | Registry records payload on create | `api/mock-gateways.spec.ts:101` "creates a vacancy draft as the session author and records its payload" · `mocks/vacancy.registry.spec.ts:23` | ✅ COMPLIANT |
| 4 | R2 | Registry reset for test isolation | `mocks/vacancy.registry.spec.ts:23` "records payloads for new posts and reset restores the seeded state" · `resetVacancyRegistry()` in `beforeEach`+`afterEach` of `mock-gateways`/`post-views`/`vacancy.registry`/`feed.page` specs | ✅ COMPLIANT |
| 5 | R3 seeds | Seeds renderable with registry entries | `mocks/fixtures.spec.ts:277` (renderable + resolvable company author) · `:286` (references only real jobs owned by the seed company) · `:301` (derives to `kind:'vacancy'` + payload) · `pages/plataforma/feed.page.spec.ts:815` (2 live cards) | ✅ COMPLIANT |
| 6 | R3 | Fixture invariants preserved | `mocks/fixtures.spec.ts:23` (count 13 — **only** churned assertion) · `:218` (job-request tail) · `:227`+`:270` (text-only → image budget 11) · `:256` (vacancy seeds before the tail) · `app.release-matrix.spec.ts:47` `images: 11` green (zero-diff) | ⚠️ PARTIAL — intent fully implemented and covered, but the scenario's literal clause "post-count assertion (11 → 12)" is contradicted by reality (11 → 13) and "(index 9)" is stale → **spec must be synced** (W2) |
| 7 | R4 author-aware | Company post authored by session user | `api/mock-gateways.spec.ts:101` · `feed.page.spec.ts:1045` (`:1081` `authorId === 'company-1'`) · `:1108` (`company-2` session → `authorId === 'company-2'`, registry `jobIds ['job-4']`) | ✅ COMPLIANT |
| 8 | R5 card | Multi-job card renders every entry | `components/post-vacancy/post-vacancy.component.spec.ts:36` (3 entries: title/location/budget/`Abierta` + `Postularse` href per job) | ✅ COMPLIANT |
| 9 | R5 | Closed job shows Cerrada with link still rendered | `post-vacancy.component.spec.ts:83` · `feed.page.spec.ts:972` (live resolve: `Estado: Cerrada` + `href="/plataforma/trabajos/job-1"`) | ✅ COMPLIANT |
| 10 | R5 | Unresolvable job id skipped | `components/post-vacancy/vacancy-openings.spec.ts:27` + `:33` · `feed.page.spec.ts:886` (2 ids → 1 entry, missing skipped) | ✅ COMPLIANT |
| 11 | R6 projection | Vacancy renders via postExtra only | `feed.page.spec.ts:815` (card inside `[data-testid="post-extra"]` · body free of vacancy fields · base template `post-header`/`post-actions` intact) · `components/post-template/` zero-diff | ✅ COMPLIANT |
| 12 | R6 | Single guarded hydration with live data | `feed.page.spec.ts:907` (2 vacancy posts → `load()` exactly 1) · `:925` (company session: 2 triggers → 1 load) · `:942` (picker-only trigger) · `:972` (live `Cerrada`) | ✅ COMPLIANT |
| 13 | R7 composer | Normal mode is default and byte-compatible | `components/company-composer/company-composer.component.spec.ts:106` (default mode, `feed-composer`/`feed-post-content`/`feed-publish`, toggle `type=button` + `aria-pressed`) · `feed.page.spec.ts:1141` (normal publish → `kind:'standard'`, no registry entry, no card) · **independent byte-diff**: the `feed-composer` form is 599/599 chars identical to `git show main:…/feed.page.ts` after normalizing only the submit-handler name | ✅ COMPLIANT (assertion is shallow → S1) |
| 14 | R7 | Picker scoped to own open vacancies | `company-composer.component.spec.ts:152` (`company-1` → job-1/2/6; own-closed + `company-2` excluded) · `feed.page.spec.ts:1085` (real feed, scoped to the picker group) · `:1108` (`company-2` → job-4/5) | ✅ COMPLIANT |
| 15 | R8 publish rule | Valid with text only | `company-composer.component.spec.ts:207` (emits `CompanyPostDraft` with ordered `jobIds`) · `feed.page.spec.ts:1045` (post created, registry `jobIds ['job-1']`, `authorId` = session) | ✅ COMPLIANT |
| 16 | R8 | Valid with photo only | `company-composer.component.spec.ts:328` (photos-only publish, capped at 10, `blob:company-composer/` urls) | ✅ COMPLIANT |
| 17 | R8 | Vacancy-only rejected | `company-composer.component.spec.ts:183` (no draft emitted, `role="alert"` announced, focus on the picker) · `:197` (no text + no photos → focus parked on the textarea) | ✅ COMPLIANT |
| 18 | feed-M | Company sees textarea composer in normal mode | `feed.page.spec.ts:644` (company textarea present, solicitud form absent) · `company-composer.component.spec.ts:106` | ✅ COMPLIANT |
| 19 | feed-M | Vacancy mode creates vacancy post | `feed.page.spec.ts:1045` (card projected, text in the body slot, registry `jobIds`, `authorId` = session) · `:1108` (non-default company) | ✅ COMPLIANT |
| 20 | feed-M | Worker sees solicitud form (job-request) | `feed.page.spec.ts:631` · `:1169` · `:680` (worker publishes a `job-request` end to end, authored by the session worker) | ✅ COMPLIANT |
| 21 | feed-M | Admin does not see composer | `feed.page.spec.ts:1181` (admin → no `app-company-composer`, no `feed-composer`, no `vacancy-composer`, no `job-request-composer`) | ✅ COMPLIANT |
| 22 | feed-M | Worker cannot create via company composer | `feed.page.spec.ts:1169` + `:631` (company composer absent for a worker → no company publish path exists) | ✅ COMPLIANT |
| 23 | feed-A | Vacancy projected into postExtra | `feed.page.spec.ts:815` | ✅ COMPLIANT |
| 24 | feed-A | Standard and job-request posts unaffected | `feed.page.spec.ts:815` (standard neighbour has no card; 2 job-request cards intact) · `:1141` (standard publish → no payload, no card) | ✅ COMPLIANT |

**Compliance summary**: **23/24 fully compliant** · 1 PARTIAL (scenario 6, stale spec wording) · **0 UNTESTED** · **0 FAILING**.

---

## 4. Correctness (Static Evidence)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Vacancy kind + reference-only payload | ✅ Implemented | `domain/models.ts` `PostKind` widened; `VacancyPayload { jobIds: string[] }` only — job fields are unrepresentable |
| Demo registry, deterministic + resettable | ✅ Implemented | `mocks/vacancy.registry.ts:16-38` — `Map<string, VacancyPayload>`, clone-on-write `jobIds`, `resetVacancyRegistry()` rebuilds from `VACANCY_SEEDS` |
| View derivation with job-request precedence | ✅ Implemented | `mocks/post-views.ts` — `const vacancy = jobRequest ? undefined : getVacancy(post.id)`; key omitted on miss (`...(vacancy ? { vacancy } : {})`) |
| Author-aware creation | ✅ Implemented | `api/ports.ts` `CreatePostDraft.vacancy?`; `api/mock-feed.gateway.ts:34-40` records on `kind==='vacancy'`; `feed.page.ts` `companyAuthorId = session.currentUser()?.userId ?? COMPANY_PROFILE.companyId` — no `'company-1'` literal |
| Card: entries, status label, always-on link | ✅ Implemented | `components/post-vacancy/post-vacancy.component.{ts,html}` — `role="group"` + `aria-label="Vacante"`, `jobStatusLabel` (`Abierta`/`Cerrada`), `formatMoneyRange`, `routerLink` always rendered |
| Projection into `[postExtra]` only | ✅ Implemented | `feed.page.ts` — `<app-post-vacancy postExtra [openings]>`; `[postBody]` untouched |
| One-shot guarded hydration | ✅ Implemented | `feed.page.ts:250-258` — `untracked(() => { if ((hasVacancy‖needsPicker) && jobs.listStatus()==='idle') void jobs.load() })`; `store/jobs.store.ts` flips to `loading` synchronously |
| D6 hide when 0 ids resolve | ✅ Implemented | `feed.page.ts:230` — entry stored only when `resolved.length > 0` (map absence, no empty-state flash) |
| Scoped picker + composite publish rule | ✅ Implemented | `components/company-composer/company-composer.component.ts` — `status==='open' && companyId===authorId`; ≥1 job AND (text OR photo); `role="alert"` + focus move |
| Frozen surfaces | ✅ Untouched | `contracts/`, `contract-conformance.ts`, `angular.json`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts`, `Post`, `PostInput`, `post-template/`, `hasVisibleText`, `isRenderablePostView` — all zero-diff vs `main` |

---

## 5. Coherence (Design — D1…D11)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 — `Map<postId, VacancyPayload>` + record/get/reset, author ≠ kind | ✅ Yes | `vacancy.registry.ts`; author never implies kind (post-4/9 stay `standard`) |
| D2 — `toPostView` reads job-request then vacancy; miss omits the key | ✅ Yes | `post-views.ts`; mutation M4/M5 below prove the precedence and the omission are test-covered |
| D3 — `CreatePostDraft.vacancy?`, gateway records on create | ✅ Yes | `ports.ts`, `mock-feed.gateway.ts`; no conformance entry added (contract stays frozen) |
| D4 — Extract `CompanyComposerComponent`, textarea verbatim | ✅ Yes | `components/company-composer/`; the `feed-composer` form is byte-identical (599/599 chars) — **but the spec assertion is shallow (S1/F10)** |
| D5 — Page one-shot `load()` idle-guarded; card takes resolved `JobOpening[]` | ✅ Yes | mutation M1/M2 prove both triggers collapse into one load; `untracked()` placement is load-bearing (tracking `listStatus()` → infinite effect loop) |
| D6 — Hide the card when 0 ids resolve | ✅ Yes | mutation M3 (removing the hide) fails exactly the D6 test |
| D7 — Pure `jobStatusLabel` + `formatMoneyRange`; link always rendered | ✅ Yes | `core/platform/store/job-status.ts` (pure) |
| D8 — Picker `status==='open' && companyId===author`; ≥1 AND (text OR photo); `role="alert"` + focus; photos cap 10 | ✅ Yes | mutation M6 (drop the `companyId` filter) and M7 (drop the composite rule) both fail loudly |
| D9 — Insert 2 text-only seeds before `post-10`; only `fixtures.spec:22` churns; matrix `images: 11` | ✅ Yes | verified: `fixtures.spec.ts:23` is the **only** count churn; matrix `images: 11` green (zero-diff). Mutation M8 (append instead) breaks 2 invariants — the design's claim holds |
| D10 — `app.a11y.spec` only for gates; component specs own the composer | ✅ Yes | gate is zero-diff green; the composer spec owns label/role/`aria-describedby`/`aria-invalid`; the projected card is scanned by axe under the admin-seeded `/plataforma` |
| D11 — `resetVacancyRegistry()` in `beforeEach` of every spec creating vacancy posts | ✅ Yes | present in all 4 relevant spec files (beforeEach + afterEach); `fixtures.spec.ts` only reads seeds → not required |

**Deviations from design** (all documented in apply-progress, all refinements — none break a spec):
A5 mode exclusivity (refines D4 → **D4a**, synced into the canonical spec at archive), A1 empty-picker copy, A2 `mediaTouched` rename, WU4b author fallback (`COMPANY_PROFILE.companyId`), WU4b `needsPicker` second hydration trigger (D5's idle guard untouched — mutation-verified).

---

## 6. Mutation Evidence (adversarial proof the tests have teeth)

Executed in a throwaway `git archive` copy of HEAD at `%TEMP%/opencode/p16-mutate` (repo untouched; `node_modules` junctioned). Each mutation applied in isolation.

| # | Mutation | Expected failure | Result |
|---|----------|------------------|--------|
| M1 | Remove the `listStatus()==='idle'` guard | D5 exactly-once | ✅ 2 tests fail ("expected load to be called 1 times, but got 2 times") |
| M2 | `needsPicker = false` | picker-only hydration | ✅ 1 test fails ("expected … 1 times, but got 0 times") |
| M3 | Remove the D6 `resolved.length > 0` hide | D6 hide | ✅ 1 test fails — **only** the D6 test; the load-count tests stay green |
| M4 | Drop the job-request precedence | D2 precedence | ✅ "keeps job-request precedence when both registries match the same post" fails |
| M5 | Always spread the `vacancy` key | D2 miss-omits-key | ✅ 3 tests fail (incl. "omits the vacancy key entirely on a registry miss") |
| M6 | Drop the `companyId` picker filter | D8 picker scope | ✅ 2 tests fail (scope + empty state) |
| M7 | Drop the composite publish rule | D8 composite rule | ✅ 6 tests fail |
| M8 | Append the vacancy seeds after `post-11` | D9 seed position | ✅ 2 tests fail (job-request tail + vacancy-before-tail invariants) |
| M9 | Make `resetVacancyRegistry()` a no-op | D11 reset | ✅ "records payloads for new posts and reset restores the seeded state" fails |

**9/9 mutations killed.** No tautological test hides a regression.

---

## 7. TDD Compliance (Strict TDD active)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ → ✅ | Table found in apply-progress; **WU1 rows were missing (W3) and have been added at archive** |
| All tasks have tests | ✅ | 19/19 RED-first tasks map to an existing, passing spec file |
| RED confirmed (tests exist) | ⚠️ → ✅ | 19/19 RED-first tasks now have a table row (W3 applied at archive; WU1 signals themselves were never captured and are marked *not recorded*) |
| GREEN confirmed (tests pass) | ✅ | every listed file exists and passes on execution (795/795) |
| Triangulation adequate | ✅ | Case counts reconcile with the code: job-status 2 = 2 `it`s · vacancy-openings 3 = 3 · post-vacancy 4 = 4 · WU3 +5 → 773 · WU4a +7 → 780 · A1–A5 +6 → 786 · WU4b +9 → 795 |
| Safety Net for modified files | ✅ | Safety-net counts recorded before each modification (745 baseline → 761→764→768→773→780→786→795) |

**TDD Compliance**: 4/6 checks green as measured; the 2 ⚠️ were documentation gaps, both closed at archive (W3).

---

## 8. Test Layer Distribution

| Layer | Tests (in the 9 changed spec files) | Files | Tools |
|-------|------------------------------------|-------|-------|
| Unit | 88 | 6 (`vacancy.registry`, `job-status`, `vacancy-openings`, `post-views`, `fixtures`, `mock-gateways`) | vitest 4.1.11 |
| Integration | 63 | 3 (`post-vacancy.component`, `company-composer.component`, `feed.page`) | vitest + Angular TestBed |
| E2E | 0 | 0 | not installed |
| **Total** | **151** | **9** | — |

Of these, **+50 are new** (Unit +14 from WU1, Integration +36). Zero `vi.mock()` calls in any changed spec file — all fakes are DI-level `TestBed.overrideProvider` (correct layer). Business logic is covered at both unit and integration level (pure helpers `jobStatusLabel` / `resolveVacancyOpenings` + their consumers).

---

## 9. Changed File Coverage

➖ **Coverage analysis skipped — no coverage tool detected** (`openspec/config.yaml` → `testing.coverage: false`). Not a failure.

---

## 10. Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `components/company-composer/company-composer.component.spec.ts` | 193 | `expect(alert?.textContent?.trim()).toBeTruthy()` | emptiness-only — the exact error copy is never asserted | WARNING |
| `…/company-composer.component.spec.ts` | 294 | `expect(errorText()).toBeTruthy()` | same | WARNING |
| `…/company-composer.component.spec.ts` | 307 | `expect(errorText()).toBeTruthy()` | same | WARNING |
| `…/company-composer.component.spec.ts` | 176 | `expect(label?.textContent?.trim()).toBeTruthy()` | non-empty only (the `for`/`id` binding is asserted exactly at :169-173) | SUGGESTION |
| `…/company-composer.component.spec.ts` | 106 | byte-compat block | does not assert `type="submit"` nor the `class` attributes (recorded debt F10) — the code IS byte-identical, so this is a **test gap, not an implementation gap** | SUGGESTION |
| `pages/plataforma/feed.page.spec.ts` | 969 | `expect(jobs.openings().length).toBeGreaterThan(0)` | loose bound where an exact length is available | SUGGESTION |
| `pages/plataforma/feed.page.spec.ts` | 1200 | duplicate-id set over the whole feed | asserted in the composer's default (normal) mode only | SUGGESTION |
| `core/platform/mocks/vacancy.registry.spec.ts` | 33 | `expect(getVacancy(seed.id)).toBeDefined()` | type-only, but combined with an exact `toEqual` on the same entry → OK | OK |

**Assertion quality**: **0 CRITICAL, 3 WARNING, 5 SUGGESTION**. No tautologies, no ghost loops, no snapshot-only assertions, no orphan empty checks without a non-empty companion (`vacancy-openings.spec.ts:33` ↔ `:21`; `company-composer.component.spec.ts:242` ↔ `:152`), no mock-heavy files.

---

## 11. Quality Metrics

**Linter**: ✅ `bunx ng lint` → "All files pass linting." (0 errors, 0 warnings)
**Type Checker**: ✅ 0 errors (`ng build` — `strict` + `strictTemplates`)

---

## 12. Issues Found

**CRITICAL**: None.

**WARNING**

- **W1 — Pre-existing flaky gate, NOT caused by p16.** `src/app/app.release-matrix.spec.ts` → "starts the shell with the skip link, the first thing a keyboard user meets" times out at 5685 ms (limit 5000 ms) in 1 of 4 full-suite runs at HEAD. Independently reproduced on a pristine `main` archive (745 tests, 4 runs → 1 failure at 5528 ms, identical test). Root cause: `ReferenceError: IntersectionObserver is not defined` from the untouched marketing photo gallery (the a11y spec and `photo-gallery.component.spec.ts` stub it; the release-matrix spec does not) plus jsdom "Not implemented: navigation" noise, so the 16-route loop exceeds the 5 s budget. The file is a **zero-diff gate** → out of p16's scope. Fix: stub `IntersectionObserver` in `app.release-matrix.spec.ts` (or raise that test's timeout). The spec passes 7/7 in isolation.
- **W2 — Spec scenario 6 is literally unsatisfiable as written.** It asserts "the post-count assertion (11 → 12)", but design D9 + task 1.6 lock **two** text-only vacancy seeds → the count churns 11 → **13**, and only `src/app/core/platform/mocks/fixtures.spec.ts:23` churns. Its "(index 9)" is stale too (post-12 at index 9, post-13 at index 10, job-request tail now at index 11). The implementation is correct; the wording must be synced at archive.
- **W3 — TDD Cycle Evidence omits WU1.** apply-progress #1042's table starts at `2.1→2.2`; the four WU1 RED tasks (1.1 / 1.3 / 1.5 / 1.7) have no row — they are covered only by the narrative task list. 15/19 RED-first tasks have a table row. Fix: add the 4 rows at archive.
- **W4 — apply-progress under-reports the test delta.** "Total tests written (this change): 36" and "baseline 759". Measured: **+50** new tests (745 → 795). The 14 WU1 tests are counted in the baseline but omitted from the 36. Correct summary: 50 = WU1 14 · WU2 9 · WU3 5 · WU4a 7 · polish 6 · WU4b 9, baseline 745.
- **W5 — The spec's own "Totals" line is wrong.** It states "platform-vacancy 8 requirements / 16 scenarios … = 23"; platform-vacancy actually enumerates **17** (2+2+2+1+3+2+2+3) → the change carries **24** scenarios. The spec's own WU coverage map sums to 24 (7+3+4+5+5), so only the Totals line is off by one. Fix at archive.
- **W6 — `HANDOFF.md` is in the delivery diff.** `git diff main...HEAD` includes `HANDOFF.md` (commit `f562270 docs(handoff): record p16-vacante in-progress state (WU1-WU3 done)`) although the file is orchestrator-owned and the change's artifacts live in Engram. Not touched by the verifier. Fix: the orchestrator owns its final state — decide before archive/merge.

**SUGGESTION**

- **S1 (recorded debt F10, confirmed)** — `company-composer.component.spec.ts:106` does not assert `type="submit"` nor the `class` attributes of the byte-compatible form. I verified independently that the markup IS byte-identical (599/599 chars, only the submit-handler name differs) → this is a test gap, not an implementation gap. Add `expect(button.getAttribute('type')).toBe('submit')` + the class string.
- **S2** — `company-composer.component.spec.ts:193/294/307`: assert the exact es-AR error copy instead of `toBeTruthy()`.
- **S3** — `feed.page.spec.ts:969`: use `expect(jobs.openings()).toHaveLength(JOBS.length)`.
- **S4** — `feed.page.spec.ts:1200`: the duplicate-id check runs in the composer's default mode only; toggle to vacancy mode and re-assert to lock `company-composer-job-*` / `company-composer-vacancy-text` / `company-composer-photos` uniqueness.
- **S5 (latent, currently unreachable)** — `companyAuthorId` is session-bound while `effectiveRole()` can be overridden by the `role` input: a worker session forced to `role="company"` would show an empty picker and author the vacancy post with the worker's id. No route binds `[role]` (`app.routes.ts` uses `loadComponent` with no template; the preview page uses its own `PreviewRoleSwitcher`), so it is unreachable today. Derive the picker scope from the same source as the role, or stop letting the input override a session role.
- **S6** — A vacancy closed *after* being selected stays in `selectedIds` and would still be published (the picker filter is reactive, the selection is not pruned). Spec-compliant as written; a publish-time re-filter would be more correct. Untested.
- **S7 (recorded debt F7, inherited)** — `URL.createObjectURL` blobs are never revoked in the composer (same pre-existing gap in p15's `job-request-composer`). Not a p16 regression.
- **S8** — Photos are reset between publishes in code (`photos.set([])` + `form.reset()`) but no test covers it.
- **S9 (cosmetic)** — apply-progress row `4.1–4.4` enumerates "5 cases" while the composer spec shipped 7 tests at that slice (GREEN 773 → 780 confirms 7). Triage-count mismatch only.

---

## 13. Spec Sync Items (for the archive phase — NOT applied by the verifier)

1. **Scenario "Fixture invariants preserved"** (platform-vacancy R3): replace "the post-count assertion (11 → 12)" → **"the post-count assertion (11 → 13)"**, and "the vacancy seed inserted before the job-request tail (index 9)" → **"the two vacancy seeds inserted before the job-request tail (`post-10` now at index 11)"**. (Already flagged by design "Open Questions" and by tasks #1041's archive-sync note — now independently confirmed against the code.)
2. **Scenario totals**: "platform-vacancy 8 requirements / 16 scenarios" → **17 scenarios**; grand total 23 → **24**.
3. **Mode-toggle requirement**: record the A5 exclusivity refinement (the normal `feed-composer` form renders only in normal mode; the vacancy form only in vacancy mode) explicitly in the "Company composer mode toggle" requirement so the spec matches the shipped behavior.
4. **Apply-progress corrections** (W3, W4): add WU1's four RED rows to the TDD Cycle Evidence table and correct the test summary to 50 new tests / baseline 745.

> **Applied at archive (2026-10-21)**: items 1–3 in `openspec/specs/platform-vacancy/spec.md` + the archived delta copies; items 3–4 also in `openspec/specs/platform-feed/spec.md` (MODIFIED composer requirement) and apply-progress (`W3` rows + `W4` totals). W1 and W6 were **not** applied — they belong to the orchestrator/next change (carried debt).

---

## 14. Verdict

### **PASS WITH WARNINGS**

All 30 tasks are complete, all gates are green at HEAD `8f95d55` (795/795 tests, build with 25 static routes prerendered, lint clean, contract frozen and zero-diff), 23 of 24 spec scenarios are fully compliant with the 24th implemented correctly but carrying stale spec wording, every design decision D1–D11 is honoured, and 9 of 9 adversarial mutations were killed — the tests have real teeth. No CRITICAL issue. The 6 warnings are documentation/spec-bookkeeping debt plus one pre-existing flaky gate that this change did not cause and must not fix.

**Ready for archive**: **Yes** — with the spec sync of items 1–4 (W2, W3, W4, W5) applied at archive time, and the orchestrator resolving the `HANDOFF.md` delivery diff (W6) and the release-matrix flake (W1, pre-existing debt).
