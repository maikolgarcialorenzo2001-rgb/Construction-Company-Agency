# Design: p16-vacante — Plantilla 3 (company vacancy-promo posts)

**Artifact store**: hybrid (this file + Engram `sdd/p16-vacante/design` #1039)

## Technical Approach

Explore Approaches 1 + A, p15 reuse: widen demo-only `PostKind`, keep reference-only `jobIds` in `mocks/vacancy.registry`, derive `kind`/`vacancy` in `toPostView`. Feed page idle-guards one-shot `JobsStore.load()`, resolves `jobIds → JobOpening[]` → presentational card via `[postExtra]` only. Composer extracts to `CompanyComposerComponent` (textarea verbatim; picker + composite rule). Contract, `[postBody]`, `isRenderablePostView` byte-identical.

## Architecture Decisions

| # | Rejected | Decision (why) |
|---|---|---|
| D1 | Widen `Post`; author implies kind | `Map<postId, VacancyPayload>` + record/get/reset from `VACANCY_SEEDS`; author can't imply kind (post-4/9 *standard*). |
| D2 | Inference tricks | `toPostView` reads job-request then vacancy; miss omits key (p15 D2). |
| D3 | Fields on `PostInput` | `CreatePostDraft.vacancy?`, no conformance entry; gateway records on create. |
| D4 | Inline toggle in `feed.page` | Extract `CompanyComposerComponent` — inline wiring overran p15 (612 lines); textarea verbatim → byte-compatible. |
| D5 | Card self-loads; per-id `byId` | Page one-shot `load()` idle-guarded (vacancy views or picker; sync `loading` → race-safe); card takes resolved `JobOpening[]`. |
| D6 | Empty-state message | **Hide** when 0 ids resolve: gating free (page resolves anyway), no hydration flash; publish rule guarantees text/photos; no spec covers all-missing. |
| D7 | Template ternary | Pure `jobStatusLabel` (`Abierta`/`Cerrada`) + spec (`application-status` precedent); budget via `formatMoneyRange`; link always rendered. |
| D8 | Status-only picker | Picker `status==='open' && companyId===author`, page-side; submit ≥1 AND (text OR photo), reject → `role="alert"` + focus (photos cap 10). |
| D9 | Append (p15 churned 3) | **Insert 2 text-only seeds before `post-10`**: only `fixtures.spec:22` (11→13) churns; appending breaks `fixtures.spec:221` + `feed.page.spec:565`; matrix `images: 11`. |
| D10 | `app.a11y.spec` only | Gates seed admin → composer never scanned; component specs own its a11y; card scanned → `li > card > a` + `role="group"`. |
| D11 | File isolation | `resetVacancyRegistry()` in `beforeEach` — singletons leak *within* a file (p15 WU1). |

> **D4 → D4a (refined at apply, recorded at archive):** Slice A (WU4a polish, task A5) made the two composer modes **EXCLUSIVE** — the normal `feed-composer`/`feed-publish` form renders only in normal mode, the vacancy form only in vacancy mode — and moved the toggle above both forms so it keeps a stable position across modes. This resolves the design/spec ambiguity around "mode toggle": D4 locked "extract `CompanyComposerComponent`, textarea verbatim → byte-compatible", and the spec's literal said "the never-empty invariant is enforced per composer path" without stating whether both forms stay mounted. The normal form's content remains byte-compatible (599/599 chars vs `main`) and normal mode remains the default, so every existing feed spec stays valid.

## Data Flow

```
publish: CompanyComposer (vacancy, ≥1 own open ∧ (text ∨ photo)) ─▶ CompanyPostDraft
  ─▶ feed.page ─▶ FeedStore.create({authorId: session, kind:'vacancy', vacancy})
  ─▶ MockFeedGateway.create ──recordVacancy──▶ Registry

render: toPostView ──registries──▶ PostView {kind, vacancy?} ─▶ [postBody] = content
  effect: vacancy ∧ idle JobsStore ─▶ one-shot load() ─▶ resolveVacancyOpenings ≠ []
  ─▶ <app-post-vacancy postExtra [openings]> (title/link, location, budget, estado, "Postularse")
```

## File Changes

| File | Action | Description |
|---|---|---|
| `core/platform/domain/models.ts` | Modify | `PostKind` +`'vacancy'`, `VacancyPayload`, `PostView.vacancy?` |
| `core/platform/mocks/vacancy.registry.ts` | Create | Seeded map + reset |
| `core/platform/api/ports.ts` | Modify | `CreatePostDraft.vacancy?` |
| `core/platform/api/mock-feed.gateway.ts` | Modify | Registry write on create |
| `core/platform/mocks/post-views.ts` | Modify | Derive kind/vacancy |
| `core/platform/mocks/fixtures.ts` | Modify | 2 seeds before `post-10`, count 13 |
| `core/platform/store/job-status.ts` | Create | `jobStatusLabel` helper |
| `components/post-vacancy/*` | Create | Card, resolver, specs |
| `components/company-composer/*` | Create | Toggle, picker, rule, specs |
| `pages/plataforma/feed.page.ts` | Modify | Hydration, projection, swap |
| `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | Verify | Zero diff |

## Interfaces / Contracts

```ts
export type PostKind = 'standard' | 'job-request' | 'vacancy';
export interface VacancyPayload { jobIds: string[] }            // 1..n, reference-only
export interface PostView { kind: PostKind; /* p15 fields */ vacancy?: VacancyPayload }
export interface CreatePostDraft { authorId: string; kind: PostKind; content: string;
  attachments?: string[]; jobRequest?: JobRequestPayload; vacancy?: VacancyPayload }

export interface CompanyPostDraft { jobIds: string[]; content: string; attachments: string[] }
// [] → 'standard'; ≥1 → 'vacancy'
PostVacancyComponent     { openings = input.required<JobOpening[]>() }
CompanyComposerComponent { openings = input<JobOpening[]>(); publish = output<CompanyPostDraft>() }
```

## Testing Strategy

| WU | Spec (RED first) | Proves |
|---|---|---|
| WU1 | `vacancy.registry.spec`, `post-views.spec`, `fixtures.spec`, `mock-gateways.spec` | record/get/reset; kind + miss; seeds/count/tail; author-aware create |
| WU2 | `job-status.spec`, `vacancy-openings.spec`, `post-vacancy.spec` | `Abierta`/`Cerrada`; missing id skipped; multi-entry, budget optional, `Cerrada` + link |
| WU3 | `feed.page.spec`, matrix, a11y | `[postExtra]` only, body clean; `load()` **exactly once**; status flip → `Cerrada`; gates zero-diff |
| WU4a | `company-composer.spec` | normal default + testids byte-compat; own-open picker; composite 3; photos stub; a11y |
| WU4b | `feed.page.spec` | vacancy publish (`kind`/`jobIds`/session author); normal/worker/admin unchanged |

Per slice: `bunx ng test --watch=false`, `ng build`, `ng lint`.

## Migration / Rollout — 5 chained WU commits

Additive. Chain on `feature/p16-vacante`: **WU1 data** (~250–300) → **WU2 card** (~330–390) → **WU3 projection+hydration** (~220–280) → **WU4a composer** (~330–400) → **WU4b wiring** (~200–260). Forecast ~1330–1630 → `Decision needed before apply: No · Chained PRs recommended: Yes · 400-line budget risk: High`. Rollback = revert newest first: WU4b → textarea restored; WU3 → projection never fires; WU1 last (in-memory). WU4 pre-split guards p15's overrun.

## Open Questions

None blocking. Resolved: (a) seed placement → insert before `post-10` (D9); (b) all-missing → hide card (D6); (c) spec "11 → 12" vs locked ≥2 seeds → **11 → 13**, synced at archive (verify W2).
