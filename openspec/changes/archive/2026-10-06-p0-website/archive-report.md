# Archive Report: p0-website

Change `p0-website` is complete and archived. Verify passed with **0 CRITICAL** findings (41/43 requirements COMPLIANT, 2 PARTIAL, 0 FAILING), every documentation gap the verify run deferred to archive has been closed, and the 7 capability specs are now the source of truth under `openspec/specs/`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p0-website` (greenfield P0 website, es-AR) |
| Verify verdict | PASS WITH WARNINGS (re-run after remediation `5e96067`, 0 CRITICAL) |
| Tasks | 48/48 complete |
| Specs | 7 capabilities, 43 requirements / 51 scenarios |
| Final gates | lint pass, 37 files / 336 tests pass, 381.64 kB initial (budget 450/500) |
| Archive location | `openspec/changes/archive/2026-10-06-p0-website/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | 24 commits ahead of `origin/main`, **not pushed**, no PR/issue created |

## Final gate (run by this archive phase)

| Gate | Result |
|---|---|
| `bunx ng lint` | `All files pass linting` |
| `bunx ng test --watch=false` | **37 files, 336 tests, 0 failed** (0 skipped) |
| `bunx ng build` | **381.64 kB initial / 103.54 kB transfer**, no budget warning (450 kB warn / 500 kB error) |
| `angular.json` drift | none; `git status` checked after every `bunx ng` run, file stayed clean |

Test delta vs the verify baseline: **338 → 336** (−2 scaffold smoke tests removed, N4). The two new slug-miss CTA assertions (S8) were added inside existing test cases, so the test count did not grow. **No assertion was weakened** to pass any gate.

## Artifacts read (audit trail)

| Artifact | File | Engram observation |
|---|---|---|
| Proposal | `openspec/changes/p0-website/proposal.md` | #788 `sdd/p0-website/proposal` |
| Specs (7 full capabilities) | `openspec/changes/p0-website/specs/*/spec.md` | #789 `sdd/p0-website/spec` |
| Design | `openspec/changes/p0-website/design.md` | #790 `sdd/p0-website/design` |
| Tasks | `openspec/changes/p0-website/tasks.md` | #791 `sdd/p0-website/tasks` |
| Apply progress (incl. TDD evidence) | Engram only | #792 `sdd/p0-website/apply-progress` |
| Verify report | `openspec/changes/p0-website/verify-report.md` | #802 `sdd/p0-website/verify-report` |
| SDD session choices | `openspec/config.yaml` | #782 |

## Specs synced to source of truth

`openspec/specs/` was empty (greenfield), so every delta is a FULL spec and was copied verbatim into `openspec/specs/{domain}/spec.md`. No merge was needed, no requirement was removed.

| Domain | Requirements | Sync action |
|---|---|---|
| site-shell-navigation | 6 | Created (carries the amended Req 6) |
| content-model | 5 | Created |
| services-catalog | 5 | Created |
| projects-showcase | 5 | Created (Req 5 precision edit) |
| process-trust | 7 | Created |
| quote-lead-capture | 8 | Created |
| seo-analytics-performance | 7 | Created (AC row 5 precision edit) |

Amendments carried forward as the canonical requirement:

1. **`site-shell-navigation` Req 6 (verify amendment, kept as-is):** "Every route EXCEPT `/presupuesto` MUST end its main content with a CTA block", plus the `No self-referential CTA on the quote route` scenario and AC row `2a` (`404 included`). The proposal success criterion was aligned to match (S7).
2. **`seo-analytics-performance` AC row 5 (precision, archive):** now reads `At most one priority image per route (exactly one where a hero exists); rest lazy`, which is what `app.release-matrix.spec.ts` actually asserts (list/static/404 routes have 0 priority images).
3. **`projects-showcase` Req 5 (precision, archive):** `exactly one priority image where the page has a hero (never more than one on a page)` instead of the unconditioned `per page` claim.

## Doc alignment closed at archive

Every item below was left open by the verify run with the instruction to fix it here.

| ID | Fix | File |
|---|---|---|
| W3 | T6.1 `3–4 projects` → `8 projects` (`content/projects.ts` ships 8) | `tasks.md` |
| W5 | New **Manual accessibility gate (not run yet)** section: honest about no aXe/Lighthouse/Playwright being installed, checklist for focus indicator / 4.5:1 contrast / focus order, result marked pending | `README.md` |
| S1 | Grep path unified to `grep -rn "isPlaceholder" src/` in all three texts (README now matches `design.md:297`, `tasks.md:114` and the six in-source comments). Verified by running it: 58 hits, finds every flagged entry | `README.md` |
| S2 | `isRealGa4Id` doc regex replaced with the implemented `/^G-[A-Z0-9]{10}$/` + `PLACEHOLDER_MARKERS` (`PLACE`, `XXXX`, `TEST`), matching `analytics.service.ts:51-64`; the old `{6,}` regex contradicted its own comment | `design.md` |
| S3 | `HomeContent` listing now declares `readonly isPlaceholder?: true`, matching `content.types.ts:163` | `design.md` |
| S4 | File map completed: `environment.token.ts`, `environment.spec.ts`, `app.routes.spec.ts`, `app.document.spec.ts`, `app.config.spec.ts`, `app.release-matrix.spec.ts`, `site.spec.ts`, `quote-options.spec.ts`, and `.spec.ts` entries for all 11 components | `design.md` |
| S5 | T10.6 `one priority image` → `at most one priority image (exactly one where a hero exists, zero where the page has no above-the-fold photo)` | `tasks.md` |
| S6 | Release-matrix doc comment now reads "the quote page … is the only route that ends without one. Every other route closes with it, the wildcard route included", so it no longer contradicts the `cta: true` row at `:32` | `src/app/app.release-matrix.spec.ts` |
| S7 | Success criterion now reads `CTA block ends every page except /presupuesto`, matching amended Req 6 | `proposal.md` |

**S8 decision: added, not skipped.** The matrix asserts the wildcard route rendering `NotFoundPage` directly; the slug-miss path renders `NotFoundPage` *inside* a detail page, which is a different render path. One cheap `expect(...querySelectorAll('app-cta-block')).toHaveLength(1)` was added to the unknown-slug test of `service-detail.page.spec.ts` and `project-detail.page.spec.ts`. It does not duplicate the matrix.

**N4:** `app.spec.ts` lost the two scaffold smoke tests (`expect(app).toBeTruthy()` and a bare `router-outlet` check). Both were superseded by the behavioural tests at `:28-79`; every assertion that still adds signal was kept.

## Engram sync (hybrid store)

| Observation | Topic key | Update |
|---|---|---|
| #788 | `sdd/p0-website/proposal` | Re-saved with the S7 wording; the stored copy still said "no `.component` suffix" and `src/app/ui/*` |
| #789 | `sdd/p0-website/spec` | Re-saved with amended Req 6 + scenario + AC `2a` + the two precision edits; the stored copy predated the verify amendment |
| #790 | `sdd/p0-website/design` | Re-saved to mirror the edited `design.md` |
| #791 | `sdd/p0-website/tasks` | Re-saved to mirror the edited `tasks.md` |
| #792 | `sdd/p0-website/apply-progress` | **TDD Cycle Evidence table corrected (N3)**, see below |
| new | `sdd/p0-website/archive-report` | This report (`capture_prompt: false`, type `architecture`) |

### N3: TDD Cycle Evidence correction (Engram #792)

- **Attribution fixed:** the S10a row no longer claims `app.config.spec.ts` with GREEN `ddb94df`. `git log --diff-filter=A -- src/app/app.config.spec.ts` → `69666d5` (S10b), and `git show --stat ddb94df` does not contain it. The file moved to the S10b row, where it belongs (it tests the `provideAppInitializer` wiring S10b added).
- **SAFETY NET column added:** `N/A (new)` for S1, S2, S8, S9, S10a, S10b (every listed RED spec was added by that slice's GREEN commit). S3-S7 flag their pre-existing extensions with `⚠️ … no pre-modification run recorded`: `app.spec.ts` (scaffold `b38c427`, extended at `57d8338`) and `content.spec.ts` (added `f816d5b`, extended at `f74c7af`, `e82dc91`+`72fdab8`, `377f462`+`b484e16`, `3907c00`). That matches what verify found.
- **TRIANGULATE column added:** marked `not recorded` for every row. Apply never captured per-row triangulate counts, and verify found narrative evidence only in session summaries #793 (S1-S4), #799 (S8) and #800 (S9). Values for the other slices cannot be reconstructed from `git log`/`git show`, so they were **not** invented.
- **Path caveat documented:** `f7ed64b` renamed most specs (`src/app/ui/*` → `src/app/components/*`, pages to `*.page.*`), so `git log --diff-filter=A` reports `f7ed64b` for files created earlier at their old paths. New-vs-modified was resolved against the pre-rename history (verified with `git show --stat` on `f74c7af`, `57d8338`, `f88592a`, `3907c00`).

## Commits

| Commit | Work unit |
|---|---|
| `90bf11b` … `5e96067` | apply + verify remediation (20 commits, prior phases) |
| `8cf7fec` | `test: drop scaffold smoke tests, fix the matrix comment, assert the slug-miss cta` (N4, S6, S8) |
| `7c898bf` | `docs(openspec): align proposal, design, tasks, specs and readme with the implementation` (W3, W5, S1-S5, S7) |
| this report | `docs(openspec): promote the p0-website specs and write the archive report` (also adds `verify-report.md`) |
| final | `chore(openspec): move p0-website into the archive folder` |

One deliverable per commit, conventional format, no AI attribution. Nothing pushed.

## Open follow-ups (closed by the post-archive hardening)

Closed after archive (commits `2d316b7`, `4fcefbe`, `1ab7bb5`):

- **W4 resolved**: the release-matrix lazy-image loop now declares an `images` budget per
  route and asserts total, lazy (`images - priority`) and priority counts on all 10
  routes; the 5 image-less routes assert zero images instead of silently skipping the
  loop body.
- **W6 resolved**: the placeholder walker now covers the full content graph (`site`,
  `home`, `services`, `projects`, `processSteps`, `testimonials`), and a top-level
  `home.isPlaceholder` is reported as `home` by the release gate.
- **content-model Req 1 now COMPLIANT**: the persistent negative test lives at
  `src/type-tests/content-shape.typetest.ts`. It is type-checked by the app program
  (tsconfig.app.json) but unreachable from `main.ts`, so never bundled; removing the
  `@ts-expect-error` makes `ng build` fail with TS1360, and a looser schema would trip
  TS2578. Previously proven only with a throwaway probe.
- **seo-analytics-performance Req 7 stays PARTIAL, by design**: the automated layer now
  scans every route with axe-core (`app.a11y.spec.ts`, 10 jsdom-capable rules) plus the
  release matrix, and the one real violation found (sticky-cta outside any landmark) was
  fixed with `role="complementary"`. WCAG 2.4.7 focus visibility and 1.4.3 body-text
  contrast are not automatable under jsdom and remain on the README manual gate; 2.4.3
  reading-order tab flow is proven structurally (no positive `tabindex`) but a real
  keyboard pass is still required.

Still open (owned by the release itself, not by the SDD cycle):

- **Release blockers**: real NAP/credentials/GBP URL, real `gaMeasurementId`, image host
  decision, and the first manual a11y-gate run.
- **Not pushed**: 24 local commits on `main`; remote untouched by design.

## Checklist

- [x] All 7 delta specs promoted to `openspec/specs/{domain}/spec.md`
- [x] Amended Req 6 (plus scenario and AC `2a`) carried forward as canonical
- [x] Verify-deferred doc gaps closed (W3, W5, S1-S7)
- [x] N3 TDD table corrected and N4 smoke tests removed (S8 assertion added)
- [x] Gate green: lint / 336 tests / 381.64 kB build, `angular.json` clean
- [x] Engram artifacts updated (#788, #789, #790, #791, #792) and this report saved as `sdd/p0-website/archive-report`
- [x] Change folder moved to `openspec/changes/archive/2026-10-06-p0-website/`

SDD cycle complete: proposal → specs → design → tasks → apply → verify → archive. Ready for the next change.
