# Exploration: p16-vacante — Plantilla 3 (company vacancy-promo posts)

**Status**: success · **Artifact store**: hybrid (this file + Engram `sdd/p16-vacante/explore` #1036)
**Mode**: research-only, no code changes · **Branch base**: `main` @ `a711e5f` (clean, p15 merged)

## Current State

The p15 reusable surface is intact and confirmed:

- `PostKind = 'standard' | 'job-request'` at `core/platform/domain/models.ts:86` — its own comment already anticipates "company vacancy". `PostView.jobRequest?` at line 112. Both `PostKind`/`PostView` are demo-only (deliberately NO `contract-conformance.ts` entry).
- `JobOpening` is bidirectionally conformance-locked to the OpenAPI `Job` schema (`contract-conformance.ts:80-81`, `JobOpeningCovered/Exact`) → the payload must NOT copy job data; `jobIds: string[]` reference-only is the only contract-safe shape.
- `CreatePostDraft {authorId, kind, content, attachments?, jobRequest?}` at `api/ports.ts:76-82`; `MockFeedGateway.create` records the payload into the module-singleton registry (`mock-feed.gateway.ts:32-35`); `toPostView` derives `kind` + payload via registry lookup and omits the key on miss (`mocks/post-views.ts:43-59`); registry has `reset*` + seed snapshot (`mocks/job-request.registry.ts`).
- `FeedStore.create(draft: CreatePostDraft)` is a pass-through (`store/feed.store.ts:35`).
- Feed page (`pages/plataforma/feed.page.ts`, 277 lines): role-differentiated composer — worker → `app-job-request-composer` (line 62-64), company → inline textarea form (66-91), admin → none; `effectiveRole = computed(role() ?? session.role())` at line 185; projection `@if (view.kind === 'job-request' && view.jobRequest; as jobRequest) <app-post-job-request postExtra …` at 105-107 (never `[postBody]`); `views` filters with untouched `isRenderablePostView` (195-199).
- Contract: `JobsGateway { list(page?, pageSize?), byId(id) }` only — NO create/status filter (`ports.ts:89-93`). Read-only, zero-diff confirmed.

## Key Question Answers

1. **Feed page → job data**: `JobsStore` is `providedIn: 'root'` (`store/jobs.store.ts:36`) → injectable from feed page OR the card. Feed page does NOT inject it today and never calls `load()`. `JobsStore.load()` is **unguarded** (always resets to `loading` and refetches, `jobs.store.ts:52-59`) → whoever triggers it must do it ONCE (page-side guarded hydration recommended; per-card load would double-fire and flicker).
2. **JOBS seeds**: 7 jobs (`mocks/fixtures.ts:301-391`) — **5 open** (job-1, job-2, job-4, job-5, job-6) + **2 closed** (job-3, job-7). company-1 owns 3 open (job-1, job-2, job-6), company-2 owns 2 open (job-4, job-5). ≥2 open + ≥1 closed for status-rendering tests: **satisfied**.
3. **JobStatus labels**: only the static `/previa` HTML renders `Abierta/Cerrada` (`pages/previa/previa.page.html:39`); NO shared helper exists and the jobs board renders no status (`jobs-list.page.ts`). The card needs its own es-AR label — precedent: `applicationStatusLabel` in `store/application-status.ts` (pure helper + spec).
4. **Gates**: release matrix pins `/plataforma` at exactly **11 images** (`app.release-matrix.spec.ts:47`) → the vacancy seed MUST be text-only (same D9 strategy as p15) or the matrix row changes. Matrix AND axe (`app.a11y.spec.ts:88-94`) both seed an **ADMIN** session → the new company composer is NEVER route-scanned (component specs own its a11y: labels, `role="alert"`); the new card IS scanned (rules: `link-name`, `list`, `nested-interactive`, `region`, h1-count, CTA — card adds none of those risks if markup stays `li → card → a`). `FEED_POSTS` growth churns: `fixtures.spec.ts:22` (`toHaveLength(11)` → 12) unconditionally; `fixtures.spec.ts:221` tail invariant ("the last posts are job-requests") and `feed.page.spec.ts:565` (`posts[posts.length-1] // post-11`) only if the seed is appended AFTER post-11. All other feed spec counts are dynamic (`FEED_POSTS.length`) or index <9 → unaffected.
5. **Role gating**: `effectiveRole()` (feed.page.ts:185) = explicit `role` input ?? `session.role()`; company block is `@if (effectiveRole() === 'company')` (line 66) — the mode toggle lives INSIDE it. Worker already excluded (its own branch renders the job-request composer); admin/anonymous render no composer.
6. **V1 "Postularse" link**: route `trabajos/:id` registered (`app.routes.ts:147`) with `withComponentInputBinding`; detail page binds `readonly id = input<string>('')` (`job-detail.page.ts:96`); routerLink precedent `['/plataforma/trabajos', job.id]` (`jobs-list.page.ts:32`). **Confirmed.** Note (existing behavior, out of scope): detail page does NOT gate the apply form by `job.status` — a closed job still accepts applications today.

## Affected Areas

- `core/platform/domain/models.ts` — widen `PostKind` (+`'vacancy'`), add demo `VacancyPayload {jobIds: string[]}`, `PostView.vacancy?`
- `core/platform/api/ports.ts` — `CreatePostDraft.vacancy?` (demo-only, no conformance entry)
- `core/platform/mocks/vacancy.registry.ts` (NEW, mirrors job-request.registry) + spec
- `core/platform/api/mock-feed.gateway.ts` — record vacancy payload
- `core/platform/mocks/post-views.ts` — derive `kind`/`vacancy` + spec churn
- `core/platform/mocks/fixtures.ts` — 1 text-only vacancy seed + specs (`fixtures.spec.ts:22`)
- `components/post-vacancy/*` (NEW) — multi-vacancy card, `postExtra` slot
- `components/company-composer/*` (NEW) — mode toggle: textarea vs vacancy picker
- `pages/plataforma/feed.page.ts` (+ `.spec.ts`) — projection, guarded jobs hydration, wiring
- Gates: `app.release-matrix.spec.ts` (expect NO change, text-only seed), `app.a11y.spec.ts` (auto-scan)

## Approaches

1. **Card data: page-resolves (p15-consistent)** — page injects `JobsStore`, guarded one-shot `load()` when any view has `kind==='vacancy'`, resolves `jobIds → JobOpening[]` and passes openings as card `@input`.
   - Pros: card stays pure/presentational like `PostJobRequestComponent` (trivial spec, no DI); single guarded load; no store coupling in component.
   - Cons: page does a little resolution work (computed).
   - Effort: Low.
2. **Card self-loads via injected `JobsStore`** — card reads `store.openings()` and hydrates itself.
   - Pros: page barely changes.
   - Cons: `load()` unguarded → N cards double-fire/flicker; needs a card-side guard or store change (store churn); heavier component spec.
   - Effort: Medium.
3. **Card queries `JOBS_GATEWAY.byId` per id** — bypasses store.
   - Pros: no shared-state concerns.
   - Cons: N calls, no caching, re-implements what the store does; against the store-first pattern of the codebase.
   - Effort: Medium. **Reject.**

Composer structure:

- **A. Extract `CompanyComposerComponent` with internal mode toggle (recommended)** — mirrors p15 `JobRequestComposerComponent`; keeps feed.page from ballooning (p15 WU3 lesson: 612-line overrun came from inline wiring); preserve `data-testid="feed-composer"`/`"feed-publish"` on the normal path so existing feed specs churn minimally. Effort: Medium.
- **B. Inline mode toggle in feed.page template** — feed.page already 277 lines, would grow ~120+ and recreate the p15 WU3 overage. Effort: High. **Reject.**

## Recommendation

Approach 1 (page-resolves) + Approach A (extracted company composer). Reuse the p15 pattern end-to-end: widen demo-only `PostKind`, new `vacancy.registry.ts` (jobIds only — job data resolved live so a closed vacancy renders `Cerrada` truthfully), `CreatePostDraft.vacancy?`, `toPostView` derivation, seed inserted **BEFORE post-10** (index 9, createdAt `2026-10-11T18:00`) so the job-request tail invariant (`fixtures.spec.ts:221`) and `feed.page.spec.ts:565` keep passing verbatim — only `fixtures.spec.ts:22` count churns (11 → 12). Text-only seed keeps the release matrix at 11 images. Card renders per job: title (link), location, budget (optional — job-3/job-7 have none), es-AR status label, "Postularse" → `/plataforma/trabajos/:id`. Zero diff to `contracts/openapi.yaml` + `contract-conformance.ts`; `JobsGateway` untouched.

## Suggested Work-Unit Slices (strict TDD, chained on `feature/p16-vacante`)

| WU | Scope | Est. lines |
|----|-------|-----------|
| WU1 | Data foundation: `PostKind`+`VacancyPayload`, `vacancy.registry`(+reset/seeds)+spec, `CreatePostDraft.vacancy?`, gateway recording, `toPostView` derivation, vacancy seed before post-10, fixtures churn | ~250–300 |
| WU2 | `post-vacancy` card component + `jobStatusLabel` helper + specs (multi-job render, open/closed, missing-id handling, Postularse link, `[postExtra]` containment) | ~330–390 |
| WU3 | Feed projection + guarded `JobsStore` hydration + seed-render test + release-matrix/a11y verification | ~220–280 |
| WU4a | `CompanyComposerComponent` — mode toggle (normal textarea path byte-compatible w/ testids) + vacancy picker (JobsStore open filter) + composite rule (≥1 job AND (text OR photos)) + spec | ~330–400 |
| WU4b | Feed wiring: role-gated branch, `publishVacancy` → `store.create({kind:'vacancy', vacancy:{jobIds}})`, role-gating + publish specs | ~200–260 |

Forecast: ~1330–1630 total changed lines → **400-line budget risk: High** → **Chained PRs recommended: Yes** → **Decision needed before apply: No** (pre-sliced ≤400, delivery strategy `ask-on-risk` already cached). WU4 pre-split is deliberate: p15's inline-wiring WU3 overran to 612 and needed retro-split (`3345d39` → `18af736` + `094cfb3`).

## Risks

1. **DECISION (modifies an accepted default)**: vacancy picker filter — accepted design says `status==='open'` only, which lets company-1 promote company-2's vacancies (post author ≠ vacancy owner; semantically odd for "buscar trabajadores para MIS vacantes"). Scoping by `companyId === session author` shows company-1 only its 3 open jobs. Seeds support both. Recommended: scope by companyId + status (cleaner semantics, still zero port change — client-side filter). Needs user OK because it deviates from the accepted default.
2. Minor (recommend, no ask): "Postularse" shown even for `Cerrada` vacancies (design literal: status + action always). The detail page accepts applications on closed jobs today — pre-existing, out of p16 scope. Recommend: always render the link, status label informs the user.
3. Seed-placement risk if WU1 appends after post-11 instead of inserting before post-10: breaks 3 pinned tests (`fixtures.spec:22/221`, `feed.page.spec:565`). Insert-before-tail avoids it — carry into design.
4. `JobsStore.load()` unguarded — page-side hydration MUST be one-shot (guarded by "any vacancy view exists" or status `idle`), else double-load flicker on every new vacancy post.
5. Photos use object-URL `<img>` previews (p15 pattern) — safe on the matrix (admin session → no composer) but component specs must stub `URL.createObjectURL` (p15 precedent).

## Ready for Proposal

Yes — surface Risk 1 to the user (only true decision), then proceed to sdd-propose.
