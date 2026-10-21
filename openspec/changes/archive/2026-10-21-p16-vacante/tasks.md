# Tasks: p16-vacante — Plantilla 3 (company vacancy-promo posts)

**Artifact store**: hybrid (this file + Engram `sdd/p16-vacante/tasks` #1041)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1330–1630 (WU1 250–300 · WU2 330–390 · WU3 220–280 · WU4a 330–400 · WU4b 200–260) |
| 400-line budget risk | High (change level); per-WU Low if each slice stays ≤400 |
| Chained PRs recommended | Yes |
| Suggested split | 5 chained WU commits on `feature/p16-vacante` |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Base boundary |
|------|------|---------------|
| WU1 | Data foundation (kind, payload, registry, seeds, derivation, draft field, gateway write) | `feature/p16-vacante` tracker |
| WU2 | Card + status labels + resolver helper | WU1 branch |
| WU3 | Feed projection + one-shot guarded hydration + gates | WU2 branch |
| WU4a | CompanyComposerComponent (toggle, picker, rule, a11y D11) | WU3 branch |
| WU4b | Feed wiring (publish path, role gating, gates re-check) | WU4a branch |

```
feature/p16-vacante ─▶ WU1 ─▶ WU2 ─▶ WU3 ─▶ WU4a ─▶ WU4b ▶ merge to main
```

Per slice: `bunx ng test --watch=false` + `bunx ng build` + `bunx ng lint`. Strict TDD RED→GREEN. R1: `resetVacancyRegistry()` in `beforeEach` of every spec creating vacancy posts (D11). Contract READ-ONLY: `contracts/openapi.yaml` + `contract-conformance.ts` zero diff. Never stage `angular.json`.

## Slice WU1 — Data foundation ✅ DONE (commit 3fbe2b2, 759/759, apply-progress #1042)

- [x] 1.1 RED `mocks/vacancy.registry.spec.ts`: record/get; reset restores seed snapshot.
- [x] 1.2 GREEN create `mocks/vacancy.registry.ts`: `Map<postId,VacancyPayload>`, `recordVacancy`/`getVacancy`/`resetVacancyRegistry` from `VACANCY_SEEDS`.
- [x] 1.3 RED `post-views.spec.ts`: registry hit → `kind:'vacancy'`+payload; miss omits key; job-request precedence intact; `isRenderablePostView` unchanged.
- [x] 1.4 GREEN `domain/models.ts`: `PostKind` +`'vacancy'`, `VacancyPayload { jobIds }`, `PostView.vacancy?`; `mocks/post-views.ts` derive after job-request.
- [x] 1.5 RED `fixtures.spec.ts`: ≥2 vacancy seeds renderable + author-resolvable, positioned before `post-10`, count 13.
- [x] 1.6 GREEN `mocks/fixtures.ts`: insert 2 TEXT-ONLY vacancy seeds before `post-10` (11→13, D9); export `VACANCY_SEEDS`.
- [x] 1.7 RED `mock-gateways.spec.ts`: `create(draft)` with `kind:'vacancy'` records `jobIds` in registry; `authorId` = session author (`company-1`), never hardcoded.
- [x] 1.8 GREEN `api/ports.ts`: `CreatePostDraft.vacancy?` (no conformance entry); `mock-feed.gateway.ts`: `recordVacancy` on create. Verify WU1; commit.

## Slice WU2 — Card, status labels, resolver ✅ DONE (commit 982eecf, 768/768, apply-progress #1042)

- [x] 2.1 RED `job-status.spec.ts`: `jobStatusLabel` open→`Abierta`, closed→`Cerrada` (application-status precedent).
- [x] 2.2 GREEN create `core/platform/store/job-status.ts` pure helper.
- [x] 2.3 RED `vacancy-openings.spec.ts`: `resolveVacancyOpenings(payload, openings)` skips missing ids, preserves order, returns `[]` when none resolve.
- [x] 2.4 GREEN create `components/post-vacancy/vacancy-openings.ts` pure helper.
- [x] 2.5 RED `post-vacancy.component.spec.ts`: multi-entry title/location/optional budget/`Abierta` + `Postularse` routerLink `/plataforma/trabajos/:id`; `Cerrada` keeps link; `openings = input.required`.
- [x] 2.6 GREEN create `components/post-vacancy/post-vacancy.component.ts` (es-AR labels, `role="group"`). Verify WU2; commit.

## Slice WU3 — Feed projection + guarded hydration + gates ✅ DONE (commit 4c9bd9c, 773/773, apply-progress #1042)

- [x] 3.1 RED `feed.page.spec.ts`: vacancy card projected `[postExtra]` only; `[postBody]` clean; standard/job-request unaffected; base template unmodified; D6 hide-on-empty + partial-resolve; D11 group/label + distinct link names on the projected card.
- [x] 3.2 RED `feed.page.spec.ts`: ≥2 vacancy views → `JobsStore.load()` executes exactly once (idle-guarded, sync `loading`); job closed after seed renders `Cerrada` (live resolve via JOBS_GATEWAY override).
- [x] 3.3 GREEN `pages/plataforma/feed.page.ts`: `vacancyOpeningsById` computed resolves `jobIds` via `resolveVacancyOpenings` against `JobsStore.openings()`; 0 resolved → card absent from map → hidden (D6); idle-guarded one-shot hydration effect (tracks vacancy views, reads `listStatus()` untracked); `<app-post-vacancy postExtra [openings]>` single-root `@if`; shell untouched.
- [x] 3.4 Verify `app.release-matrix.spec.ts` (`images: 11`, zero-diff green) + `app.a11y.spec.ts` (zero-diff green; probe confirmed axe DOES scan the projected card under admin-seeded `/plataforma` — passes). Full gates; commit.

## Slice WU4a — CompanyComposerComponent ✅ DONE (commit e9af21e + polish c65dcbf, 786/786)

Path note: the component lives FLAT under `src/app/components/company-composer/` (repo convention for sibling components), NOT under `src/app/core/platform/`.

- [x] 4.1 RED `company-composer.component.spec.ts`: normal mode default; `feed-composer`/`feed-publish` testids + textarea byte-compatible; toggle "Buscar trabajadores".
- [x] 4.2 RED same spec: picker lists ONLY own open jobs (`company-1`: job-1/2/6; excludes closed + `company-2` job-4/5).
- [x] 4.3 RED same spec: composite rule — text-only ✓, photo-only ✓, vacancy-only rejected (`role="alert"` + focus); emits `CompanyPostDraft { jobIds, content, attachments }`; `jobIds: []` → standard.
- [x] 4.4 GREEN create `components/company-composer/*` (textarea verbatim; `openings` input, `publish` output; unique ids/labels a11y). Verify WU4a; commit `e9af21e` (513 lines — 113 over the 400 budget, accepted like p15's Residual-1; NOT amended).

## Slice WU4a polish — Composer hardening ✅ DONE (commit c65dcbf, 786/786, RED→GREEN)

Post-verify audit fix-up slice (explicitly recorded, like p15's post-verify fix-up).

- [x] A1 RED+GREEN empty-picker dead end: picker renders an informative empty state ("No tenés vacantes abiertas para promocionar.") instead of the unsatisfiable composite error; focus fallback lands on the empty state (`tabindex="-1"`), never nowhere.
- [x] A2 RED+GREEN `aria-invalid` on the photos input, symmetric with the textarea and the checkboxes (`mediaTouched` replaces `textTouched`: the text-or-photos side of the rule).
- [x] A3 RED+GREEN the checkbox group is wired to the error region (`role="group"` + `aria-label="Vacantes a promocionar"` + `aria-describedby="company-composer-composite-error"`).
- [x] A4 RED+GREEN the composite error clears as soon as the user edits the corresponding input (job picked / text typed / photo attached) — `clearRejection()`.
- [x] A5 RED+GREEN the two modes are EXCLUSIVE: the normal `feed-composer`/`feed-publish` form renders only in normal mode, the vacancy form only in vacancy mode (refinement of design D4 → **D4a**, recorded in apply-progress "Deviations from Design" and in the archive report).
- [x] A6 F5 guard — VERIFIED in Slice B: the inline feed form (`id="feed-post-content"`) was DELETED from `feed.page.ts`; the feed keeps no duplicate element ids (new spec asserts unique ids across the rendered feed).

## Slice WU4b — Feed wiring ✅ DONE (commit 8f95d55, 795/795, RED→GREEN)

- [x] 4.1 RED `feed.page.spec.ts`: 7 new tests + 2 hydration-guard tests. Company vacancy publish → `create({ kind:'vacancy', jobIds, authorId: session })` recorded in the registry; normal mode → `kind:'standard'` with NO vacancy payload; picker scoped to the session company's own open jobs; worker keeps the solicitud form; admin sees no composer; no duplicate element ids (F5/A6).
- [x] 4.2 GREEN `feed.page.ts`: inline form swapped for `<app-company-composer [openings] [authorId] (publish)>`; `publishCompany(draft)` maps `jobIds.length > 0` → `kind:'vacancy'` + `vacancy:{ jobIds }`, else `kind:'standard'` with no `vacancy`; `companyAuthorId` computed = session user, `COMPANY_PROFILE.companyId` fallback (no `'company-1'` literal); dead `draft` signal + `onDraftInput` + old `publish()` deleted; hydration effect extended with `needsPicker` (company session) keeping the idle-guarded exactly-one-load guarantee.
- [x] 4.3 Verify full suite 795/795 (two consecutive green runs) + build (25 static routes prerendered) + lint ("All files pass linting") + contract/angular.json/matrix/a11y zero-diff empty. Commit `8f95d55` (2 files, +330/−55 = 385 lines, under the 400 budget). Rollback = revert newest first (WU4b → textarea restored; WU3 → projection never fires; WU1 last, in-memory).

## Archive-sync note ✅ RESOLVED (2026-10-21, archive phase)

The spec seed-count scenario said "11 → 12" but the locked ≥2 seeds before `post-10` means **11 → 13** (WU1 confirmed only `fixtures.spec:22` churned per D9). **Applied at archive**: both the canonical `openspec/specs/platform-vacancy/spec.md` and the archived delta copy now read "11 → 13" with the index wording corrected (`post-10` now at index 11; vacancy seeds at indices 9 and 10). Scenario totals corrected from 23 → **24** (17 + 7) in the archived delta and the archive report.
