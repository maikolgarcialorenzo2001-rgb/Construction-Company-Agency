# Proposal: p16-vacante — Plantilla 3 (company vacancy-promo posts)

**Artifact store**: hybrid (this file + Engram `sdd/p16-vacante/proposal` #1037)

## Intent

A company can only post plain text today. Plantilla 3 lets a company publish a feed post promoting **1..n of its own existing vacancies** (`JobOpening`) to attract workers, reusing the p14 `[postExtra]` slot and the p15 kind/payload pattern. No contract change, no vacancy creation from the feed.

## Scope

### In Scope

- Widen demo-only `PostKind` to `'standard' | 'job-request' | 'vacancy'`; add demo `VacancyPayload { jobIds: string[] }` + `PostView.vacancy?` (reference-only — never copy job fields).
- Company composer MODE toggle: normal textarea (unchanged) vs "Buscar trabajadores" picker of the company's own open vacancies (`status==='open' && companyId === session authorId`) + optional text/photos.
- Publish rule: ≥1 vacancy AND (text OR photo). `isRenderablePostView` untouched.
- Multi-vacancy card per job: title, location, budget (optional), es-AR open/closed label, "Postularse" routerLink → `/plataforma/trabajos/:id` (v1 = link, no inline apply).
- `jobStatusLabel` es-AR pure helper (precedent `applicationStatusLabel`); `JobsStore` resolution page-side (guarded one-shot load); demo registry + text-only seed.

### Out of Scope

- Creating vacancies from the composer; inline apply; admin composer (stays none); worker access to company mode.
- Editing `contracts/openapi.yaml`, `contract-conformance.ts`, `JobOpening`, or `JobsGateway` (READ-ONLY, zero diff).
- Gating the detail-page apply form by job status (pre-existing behavior).

## Capabilities

### New Capabilities

- `platform-vacancy`: company vacancy-promo kind + demo `jobIds` registry, company mode-toggle composer (own-open-vacancy picker, composite validation), and the multi-vacancy card rendered via `[postExtra]`.

### Modified Capabilities

- `platform-feed`: "Role-differentiated post composer" gains a company MODE toggle (textarea vs vacancy picker); add vacancy-card projection requirement into `[postExtra]`.

## Approach

Reuse the p15 pattern end-to-end: **Approach 1 (page-resolves)** + **Approach A (extracted `CompanyComposerComponent`)**. Widen the demo-only `PostKind`; add `vacancy.registry.ts` (mirrors `job-request.registry.ts`, records `jobIds` only); `CreatePostDraft.vacancy?`; `MockFeedGateway.create` records the payload; `toPostView` derives `kind`/`vacancy`. Payload is reference-only: the card resolves `jobIds → JobOpening[]` live via `JobsStore`, so a closed vacancy truthfully renders `Cerrada`. Feed page injects `JobsStore` (root-provided) and triggers a **guarded one-shot `load()`** when any vacancy view exists (unguarded `load()` would double-fire per card). Extracting the composer avoids re-creating p15's 612-line feed-page overrun. Preserve `data-testid="feed-composer"`/`"feed-publish"` on the normal path to minimize spec churn. Seed inserted **before post-10** (index 9) so the job-request tail invariant and `feed.page.spec:565` keep passing — only `fixtures.spec:22` count churns (11 → 12); text-only seed keeps the release matrix at 11 images.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `core/platform/domain/models.ts` | Modified | Widen `PostKind`; add `VacancyPayload`; `PostView.vacancy?` |
| `core/platform/api/ports.ts` | Modified | `CreatePostDraft.vacancy?` (demo-only, no conformance entry) |
| `core/platform/mocks/vacancy.registry.ts` | New | `postId → {jobIds}` registry + reset/seeds + spec |
| `core/platform/api/mock-feed.gateway.ts` | Modified | Record vacancy payload |
| `core/platform/mocks/post-views.ts` | Modified | Derive `kind`/`vacancy` (+ spec churn) |
| `core/platform/mocks/fixtures.ts` | Modified | 1 text-only vacancy seed before post-10 (+ spec churn) |
| `core/platform/store/job-status.ts` | New | `jobStatusLabel` es-AR helper + spec |
| `components/post-vacancy/` | New | Multi-vacancy card (`[postExtra]`) + spec |
| `components/company-composer/` | New | Mode-toggle composer + spec |
| `pages/plataforma/feed.page.ts` (+ `.spec.ts`) | Modified | Projection, guarded hydration, wiring |
| `app.release-matrix.spec.ts` / `app.a11y.spec.ts` | Verify | Expect NO change (text-only seed, card auto-scanned) |

## Risks

| Risk | L | Mitigation |
|---|---|---|
| Picker scope default (`status==='open'` only) lets company-1 promote company-2 jobs | Med | **Scope by `companyId === author` + status** (client-side, zero port change) — pending user OK |
| Seed appended after post-11 breaks 3 pinned tests | Med | Insert before post-10 (index 9) |
| `JobsStore.load()` unguarded → double-fire flicker | Med | Page-side one-shot guarded hydration |
| Budget >400 lines | High | 5 chained slices (≤400 each) |
| Photos `URL.createObjectURL` in specs | Low | Stub like p15 precedent |
| `angular.json` mod accidentally staged | Low | Never stage it |

## Rollback Plan

Additive; per-slice revert on `feature/p16-vacante` (WU5→WU1, newest first). Reverting WU4b removes toggling/wiring → composer falls back to plain textarea; card/registry become unreferenced. Registry is in-memory — no persisted state. Contract, `[postBody]`, `isRenderablePostView` never touched.

## Dependencies

None external — built on merged `main @ a711e5f`. Reuses `SessionService`, `JobsStore` (root), template `[postExtra]`, p15 composer/registry patterns. Contract frozen.

## Delivery Plan (chained on `feature/p16-vacante`, one commit per slice)

| WU | Scope | Est. lines |
|----|-------|-----------|
| WU1 | Data foundation: `PostKind`+`VacancyPayload`, `vacancy.registry`(+reset/seeds)+spec, `CreatePostDraft.vacancy?`, gateway recording, `toPostView`, seed before post-10, fixtures churn | ~250–300 |
| WU2 | `post-vacancy` card + `jobStatusLabel` helper + specs (multi-job, open/closed, missing-id, link, `[postExtra]`) | ~330–390 |
| WU3 | Feed projection + guarded `JobsStore` hydration + seed-render test + matrix/a11y verify | ~220–280 |
| WU4a | `CompanyComposerComponent` — mode toggle (byte-compatible textarea path) + picker + composite rule + spec | ~330–400 |
| WU4b | Feed wiring: role-gated branch, `publishVacancy` → `create({kind:'vacancy', vacancy:{jobIds}})`, role-gating + publish specs | ~200–260 |

Forecast ~1330–1630 lines → **400-line budget risk: High** | **Chained PRs recommended: Yes** | **Decision needed before apply: No** (pre-sliced ≤400). WU4 split deliberate (p15 WU3 overran to 612, needed retro-split).

## Success Criteria

- [ ] Company publishes a vacancy post (≥1 own open vacancy + text or ≥1 photo); vacancy-only rejected.
- [ ] Card lists each promoted job (title/location/budget/status label) with working "Postularse" → `/plataforma/trabajos/:id`; closed jobs show `Cerrada`.
- [ ] Normal company textarea path unchanged (testids preserved); worker/admin paths unchanged.
- [ ] `contracts/openapi.yaml` + `contract-conformance.ts` zero diff; `isRenderablePostView` untouched.
- [ ] `bunx ng test --watch=false`, build, lint, a11y, release-matrix (11 images) all pass.
- [ ] 5 slices each ≤400 lines, chained on `feature/p16-vacante`.
