# Verification Report: p15-solicitud-empleo — Plantilla 2 (worker job-request)

**Change**: p15-solicitud-empleo
**Branch**: `feature/p15-solicitud-empleo` @ `3345d39` (3 WU commits on `f8ce08a`, not pushed)
**Mode**: Strict TDD (`bunx ng test --watch=false`)
**Date**: 2026-10-20
**Verdict**: **PASS WITH WARNINGS**

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 23 (WU1 1.1–1.7 · WU2 2.1–2.9 · WU3 3.1–3.7) |
| Tasks complete | 23 |
| Tasks incomplete | 0 |

All 23 tasks checked in `tasks.md`; claims spot-checked against actual code and tests (registry, mapper, fixtures, gateway, store, card, projection, composer, role differentiation, a11y assertions — all present and exercised).

### Build & Tests Execution

**Build**: ✅ Passed
```text
bunx ng build → Application bundle generation complete. [6.085 seconds]
Prerendered 25 static routes.
```

**Tests**: ✅ 745 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
bunx ng test --watch=false
Test Files  77 passed (77)
     Tests  745 passed (745)
```
Expected count (745) matches apply-progress exactly (716 → 726 → 734 → 745).

**Lint**: ✅ `bunx ng lint` → "All files pass linting."

**Coverage**: ➖ Skipped — no coverage tool detected (`@vitest/coverage-v8` / `@vitest/coverage-istanbul` not installed; `ng test --coverage` fails cleanly requesting them). Informational, not blocking.

### Spec Compliance Matrix

#### `platform-job-request` (new capability, 13 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Kind widened and payload isolated | Kind widened / payload isolated from contract | `post-views.spec.ts > derives kind job-request and the payload on a registry hit` + `omits the jobRequest key entirely on a registry miss`; contract isolation proven by zero-diff on `contracts/openapi.yaml` + `contract-conformance.ts` | ✅ COMPLIANT |
| Demo registry deterministic | Registry records payload on create | `mock-gateways.spec.ts > creates a job-request draft as the session author and records its payload` (`getJobRequest(created.id)` equals payload) | ✅ COMPLIANT |
| Demo registry deterministic | Registry reset for test isolation | `job-request.registry.spec.ts > records payloads for new posts and reset restores the seeded state` | ✅ COMPLIANT |
| Worker solicitud composer | Worker sees solicitud form | `feed.page.spec.ts > shows the solicitud form to a worker and withholds the company composer` + `job-request-composer.component.spec.ts > requires the four Plantilla 2 fields…` | ✅ COMPLIANT |
| Worker solicitud composer | Company sees textarea composer | `feed.page.spec.ts > keeps the textarea composer for a company and withholds the solicitud form` | ✅ COMPLIANT |
| Worker solicitud composer | Admin sees no composer | `feed.page.spec.ts > renders no post composer for an admin or an anonymous visitor` | ✅ COMPLIANT |
| Composite publish rule (Q1=a) | Valid with free text only | `job-request-composer.component.spec.ts > publishes with free text only: payload, trimmed content, no attachments` + `feed.page.spec.ts > publishes a worker job-request end to end…` | ✅ COMPLIANT |
| Composite publish rule (Q1=a) | Valid with ≥1 photo only | `job-request-composer.component.spec.ts > publishes with photos only, capping the selection at ten previews` | ✅ COMPLIANT |
| Composite publish rule (Q1=a) | Structured-only rejected | `job-request-composer.component.spec.ts > rejects a structured-only submission: no draft emitted, composite alert announced` | ✅ COMPLIANT |
| Card via `[postExtra]` only | postExtra only; body clean; shell unmodified | `feed.page.spec.ts > projects the job-request card into [postExtra] and keeps [postBody] free of structured fields` (asserts card inside `[data-testid="post-extra"]`, body free of structured labels); `post-template/` zero diff | ✅ COMPLIANT |
| Author-aware create + seeds | Worker post authored by session user | `feed.page.spec.ts > publishes a worker job-request end to end, authored by the session worker` (denormalized "Lucía Fernández" ⇒ `worker-1`) + `mock-gateways.spec.ts` (`created.authorId === 'worker-1'`) | ✅ COMPLIANT |
| Author-aware create + seeds | Demo seeds include ≥2 job-request posts | `fixtures.spec.ts > seeds at least two job-request posts at the feed tail with a matching registry seed` + `exposes a structured payload for each seeded job-request post` + feed page renders exactly 2 cards | ✅ COMPLIANT |
| Payload strictly demo-only | Contract remains unchanged | Static evidence: `git diff f8ce08a..3345d39 -- contracts/ src/app/core/platform/api/contract-conformance.ts` is empty; `Post`/`PostInput` untouched in `models.ts` | ✅ COMPLIANT |

#### `platform-feed` delta (MODIFIED + ADDED, 6 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| MODIFIED Role-differentiated composer | Company sees textarea composer | `feed.page.spec.ts > keeps the textarea composer for a company…` | ✅ COMPLIANT |
| MODIFIED Role-differentiated composer | Worker sees solicitud form | `feed.page.spec.ts > shows the solicitud form to a worker…` + e2e publish test | ✅ COMPLIANT |
| MODIFIED Role-differentiated composer | Admin does not see composer | `feed.page.spec.ts > renders no post composer for an admin or an anonymous visitor` | ✅ COMPLIANT |
| MODIFIED Role-differentiated composer | Worker cannot create via company composer | Same worker test asserts `[data-testid="feed-composer"]`/`feed-publish` absent for worker — the company path is structurally unreachable (template `@if` gate); worker publishing only via solicitud form (e2e) | ✅ COMPLIANT |
| ADDED postExtra projection | Job-request projected into postExtra | `feed.page.spec.ts > projects the job-request card into [postExtra]…` | ✅ COMPLIANT |
| ADDED postExtra projection | Standard posts unchanged by projection | `feed.page.spec.ts > does not project a job-request card for standard posts` | ✅ COMPLIANT |

**Compliance summary**: 19/19 scenarios compliant (13/13 platform-job-request + 6/6 platform-feed).

### Correctness (Static Evidence — invariants)

| Invariant | Status | Notes |
|-----------|--------|-------|
| Card renders ONLY via `[postExtra]` | ✅ Implemented | `feed.page.ts` L105–107: single projection `<app-post-job-request postExtra [payload]>` inside `app-post-template`; shell (`post-template/`) has zero diff; body slot keeps only free text |
| Structured-only solicitud rejected | ✅ Implemented | `job-request-composer.component.ts` L124–128: `if (!content && attachments.length === 0)` → alert + focus, no emit; covered by test |
| Company composer unchanged (signal-based) | ✅ Implemented | Textarea + `draft` signal + `publish()` still signal-based; only the create call now passes the author-aware draft (design D3, in scope) |
| Admin/anonymous see no composer | ✅ Implemented | Template gates: worker `@if` → solicitud, company `@if` → textarea; no admin/anonymous branch |
| p14 never-empty predicate unchanged | ✅ Implemented | `isRenderablePostView`/`hasVisibleText` byte-identical in diff (only `toPostView` + import changed); `feed.page.views` still `.filter(isRenderablePostView)`; p14 WU5 spec still green in suite |
| Out of scope: contract | ✅ Clean | `contracts/openapi.yaml` + `contract-conformance.ts` zero diff; `Post`/`PostInput`/`PostTemplateComponent` untouched |
| Out of scope: backend | ✅ Clean | Diff confined to `src/app/**` demo layer (20 files); no server/backend paths exist or changed |
| Payload demo-only | ✅ Implemented | Lives in `mocks/job-request.registry.ts` (in-memory) + `PostView.jobRequest?` only; gateway returns contract-shaped `Post` without `kind` |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 Registry module | ✅ Yes | `mocks/job-request.registry.ts` — seeded `Map`, `record`/`get`/`reset`, snapshot re-seed from `JOB_REQUEST_SEEDS` |
| D2 Mapper parametrized | ✅ Yes | `toPostView` reads registry; miss → `'standard'` + key omitted; side-effect-free |
| D3 `CreatePostDraft` port | ✅ Yes | `ports.ts`; `FeedGateway.create(draft)`; author leaves hardcoded `company-1` |
| D4 Admin → none | ✅ Yes | No admin composer branch; release-matrix + a11y gates stay green without edits |
| D5 Extracted reactive composer | ✅ Yes | `JobRequestComposerComponent` with `NonNullableFormBuilder`; company textarea stays signal-based |
| D6 Q1=a at submit, predicate untouched | ✅ Yes | Composite enforced in `submit()`; `isRenderablePostView` unchanged |
| D7 Photos: object-URL previews, cap 10 | ✅ Yes | `URL.createObjectURL`, `MAX_PHOTOS = 10`, `.slice(0, MAX_PHOTOS)`; jsdom stub in spec |
| D8 Card via `[postExtra]` | ✅ Yes | Shell untouched; single-root `@if` projection with `postExtra` attr |
| D9 Seeds appended text-only at tail | ✅ Yes | `post-10`/`post-11` at `FEED_POSTS` tail, no attachments; `/plataforma` `images: 11` gate green |
| D10 `/previa` unchanged | ✅ Yes | No `/previa` file in the diff |
| D11 a11y assertions in page spec | ✅ Yes | Accessible-name + unique-id over 7 worker controls; describedby → `role=alert` region for all 6 inputs |
| D12 R1 isolation | ✅ Yes | `resetJobRequestRegistry()` in `beforeEach`/`afterEach` of every spec that creates job-request posts (`mock-gateways.spec.ts`, `feed.page.spec.ts`, registry + post-views specs) |

### TDD Compliance (Strict Mode)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Complete TDD Cycle Evidence tables for all 3 WUs in `apply-progress.md` |
| All tasks have tests | ✅ | 23/23 tasks map to existing test files |
| RED confirmed (tests exist) | ✅ | 8 new/modified test files verified on disk |
| GREEN confirmed (tests pass) | ✅ | 745/745 pass on this execution (all change-related files included) |
| Triangulation adequate | ✅ | Multi-case everywhere: registry 3, post-views 3, fixtures 4, gateways 2, store 1 (+2 refits), card 3, composer 5, page 8 new |
| Safety Net for modified files | ✅ | Reported ✅ in apply-progress for all modified files; N/A correctly reserved for new files |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution

| Layer | Files (change-related) | Tools |
|-------|------------------------|-------|
| Unit | 5 (`job-request.registry.spec`, `post-views.spec`, `fixtures.spec`, `mock-gateways.spec`, `feed.store.spec`) | vitest |
| Integration | 3 (`post-job-request.component.spec`, `job-request-composer.component.spec`, `feed.page.spec`) + 2 untouched gate specs (`app.a11y.spec`, `app.release-matrix.spec`, in-suite green) | vitest + Angular TestBed |
| E2E | 0 | not installed |
| **Total (suite)** | **77 files / 745 tests** | |

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected (`@vitest/coverage-v8` not installed). Informational only.

### Assertion Quality

Scanned all 8 new/modified test files (967 changed test lines) for banned patterns (tautologies, orphan empty checks, ghost loops, smoke-only, implementation coupling, mock-heavy):

**Assertion quality**: ✅ All assertions verify real behavior — 0 CRITICAL, 0 WARNING.
Notes: every empty-collection assertion (`toHaveLength(0)` on emitted drafts) has a companion non-empty publish test; every `for…of` loop over seeds/posts is preceded by a non-empty/length assertion; focus assertions check real `document.activeElement`; no CSS-class or mock-call-count assertions; form-state assertions (`touched`, `valid`) are the behavior under test, not implementation coupling.

### Correctness of apply-progress claims (spot-check)

| Claim | Verified |
|-------|---|
| 3 commits `d42b94a` → `749a250` → `3345d39`, parent chain on `f8ce08a` | ✅ `git rev-parse` |
| Test counts 716 → 726 → 734 → 745 | ✅ final 745 observed; deltas match listed new `it()` counts (10+8+11) |
| WU2 diff 391 lines, WU3 diff 612 lines | ✅ consistent with `git diff --stat` totals (1219+/39− across 20 files) |
| `angular.json` never staged | ✅ not in any commit diff |
| Spec file naming deviations (`*.component.spec.ts` vs tasks.md shorthand) | ✅ documented in apply-progress; consistent with repo convention |

### Issues Found

**CRITICAL**: None.

**WARNING**:
1. **WU3 exceeds the 400-line review budget** (612 lines vs 260–320 forecast). Known and orchestrator-accepted deviation (single-commit contract for the final slice); carried here for the record. Not a spec/design/test defect.

**SUGGESTION**:
1. Install `@vitest/coverage-v8` to enable changed-file coverage gates in future verify phases (the builder already supports `--coverage` once the package exists).
2. `tasks.md` shorthand spec names (`post-job-request.spec.ts`, `job-request-composer.spec.ts`) differ from the actual `*.component.spec.ts` files — consider aligning the task template wording in a future change to avoid false RED claims in audits.

### Verdict

**PASS WITH WARNINGS** — 19/19 spec scenarios compliant with passing runtime evidence, 23/23 tasks complete, all gates green (745/745 tests, build OK, lint OK), all invariants and out-of-scope guards hold. The single warning is the pre-accepted WU3 size deviation.

---

## Addendum (post-verify fix-up — 2026-10-20)

Fix-up applied at the original `3345d39` descendant chain; no implementation or test code was altered.

### 1. WU3 retro-split (WARNING 1 → RESOLVED with residual note)

Original WU3 commit `3345d39` (612 changed lines, over the 400-line review budget) was retro-split via `git reset --soft HEAD~1` + path-scoped staging into:

| Commit | Message | Files | Changed lines |
|--------|---------|-------|---------------|
| **A** `18af736` | `feat(platform): worker job-request composer component` | `job-request-composer.component.ts` / `.html` / `.component.spec.ts` | **413** (all insertions) |
| **B** `094cfb3` | `feat(platform): role-differentiated feed composer wiring` | `feed.page.ts`, `feed.page.spec.ts` | **199** (193+/6−) |

- **Tree unchanged (diff-identity proof)**: `git diff d42b94a..HEAD` is **byte-identical** (`cmp` clean, 50 503 bytes) to the pre-split `git diff d42b94a..3345d39`; `--stat` totals match: 13 files, 964 insertions, 33 deletions.
- **Gates re-run at the new HEAD**: `bunx ng test --watch=false` → **745/745** (77 files) ✅ · `bunx ng build` → bundle generation complete, 25 static routes ✅ · `bunx ng lint` → all files pass ✅.
- **WARNING 1**: **RESOLVED** — max WU3 commit dropped 612 → 413. Residual: commit A is 13 lines over the 400 budget; it cannot go lower without splitting the 171-line component spec away from its component, which would violate the `work-unit-commits` standard (tests ship with their code). Flagged for the orchestrator; commit B is comfortably under budget.
- `openspec/` remained untracked; nothing outside the listed paths was staged; old `3345d39` remains reachable via reflog.

### 2. `tasks.md` naming aligned (SUGGESTION — naming, numbered 2 in the prompt / SUGGESTION 2 in this report)

- `post-job-request.spec.ts` → `post-job-request.component.spec.ts` (task 2.6)
- `job-request-composer.spec.ts` → `job-request-composer.component.spec.ts` (task 3.1)
- Full sweep of `tasks.md`: no other spec-file shorthand mismatches found (all remaining references — `post-views.spec.ts`, `fixtures.spec.ts`, `mock-gateways.spec.ts`, `feed.store.spec.ts`, `feed.page.spec.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts`, `mocks/job-request.registry.spec.ts` — match actual files).

### 3. Coverage tooling installed (SUGGESTION — coverage, numbered 3 in the prompt / SUGGESTION 1 in this report)

- `bun add -D @vitest/coverage-v8@4.1.11` (pinned to match installed `vitest@4.1.11`; the unpinned install pulled `5.0.5` with a peer-dep warning and was corrected).
- Committed separately as `3464165` — `chore(platform): add @vitest/coverage-v8 dev dependency` (`package.json` + `bun.lock` only, 44 lines).
- Coverage **not** enabled in CI/`angular.json`; suite re-verified green after install: **745/745**.

**Post-fix-up chain**: `d42b94a` → `749a250` → `18af736` (A) → `094cfb3` (B) → `3464165` (chore).
