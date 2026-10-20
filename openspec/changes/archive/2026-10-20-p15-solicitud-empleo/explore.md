# Exploration: p15-solicitud-empleo — Post type "Solicitud de empleo" (Plantilla 2)

**Status**: success · **Artifact store**: hybrid (this file + Engram `sdd/p15-solicitud-empleo/explore`)
**Mode**: research-only, no code changes · **Verified against**: `main` @ `f8ce08a`

### Current State

The platform feed renders every post through the p14 **`PostTemplateComponent`** (`src/app/components/post-template/`): denormalized header with Follow, 1–10 lazy media grid, Like/Share/Save actions, and two projection slots — `[postBody]` (guarded by `hasBody`, which keys on `post().content` only — the documented S-6 caveat) and **`[postExtra]`** (unconditional, currently unused by any host; the design-sanctioned extension point for new `PostKind`s, D7).

- **Model**: `PostKind = 'standard'` only (`domain/models.ts:86`, doc comment explicitly anticipates "worker job-request, company vacancy"). `PostView` is flat + demo-only (no `contract-conformance.ts` entry — a pair there breaks `ng build`).
- **Never-empty invariant (WU5)**: `isRenderablePostView` (`mocks/post-views.ts:71`) = `hasVisibleText(content) || attachments.some(hasVisibleText)`; the feed filters non-renderable views (`feed.page.ts:174-178`), the template hides a blank body block, and the composer rejects blank text.
- **Composer** (`feed.page.ts:49-74`): inline form gated `effectiveRole() === 'company'`; one textarea + `draft` signal; `publish()` trims → early-return on blank → `FeedStore.create(content)`. No image input. `MockFeedGateway.create` **hardcodes `authorId: 'company-1'`** (sessionless mock).
- **Contract frozen** (p9/p14 precedent, re-verified): `FeedPostInput` = `{ content (minLength 1), attachments }`, `additionalProperties: false`. Structured job-request fields can NEVER enter the contract → demo-only view-model layer, like p14.
- **Routing/a11y**: `/plataforma` → `PlatformFeedPage` behind `authGuard` (CSR, not prerendered). The axe gate (`app.a11y.spec.ts:177`) runs `button-name/nested-interactive/list/label` and an accessible-name loop over the template's 4 controls. `app.release-matrix.spec.ts:47` hardcodes `{ path: '/plataforma', images: 11 }`.
- **Form precedent**: `quote.page.ts` is the app's only `ReactiveFormsModule` usage (`NonNullableFormBuilder` + `Validators`); both platform composers are template-driven signals + `form.reset()`.
- **Plantilla 3 boundary (flag only)**: `JobsStore`/`JobOpening` (company vacancies board at `/plataforma/trabajos`) and `ApplicationsStore` (worker→vacancy applications, scoped `applicantId`) already exist. Plantilla 2 is the *mirror* direction (worker publishes the request); no company→worker contact/apply flow exists today.
- Pre-existing worktree state: `angular.json` modified-but-unstaged (bun/analytics cosmetic) — must NEVER be committed (p14 lesson).

### Affected Areas

- `core/platform/domain/models.ts` — widen `PostKind` to `'standard' | 'job-request'`; extend `PostView` with an optional demo-only payload member (e.g. `jobRequest?: JobRequestPayload`)
- `core/platform/mocks/post-views.ts` — `toPostView` must derive `kind` (today hardcodes `'standard'`); `isRenderablePostView` may or may not change (see Q1)
- `core/platform/mocks/fixtures.ts` (+ likely a new demo side-channel module) — seed 2–3 job-request posts; provide kind/payload provenance that `Post` (contract-shaped) cannot carry
- `core/platform/api/mock-feed.gateway.ts` — `create` hardcodes `authorId: 'company-1'`; must become author-aware for worker posts
- `core/platform/store/feed.store.ts` — `create(content)` needs to carry attachments + demo payload through to the gateway
- `pages/plataforma/feed.page.ts` — worker-gated solicitud composer (6 fields), role-differentiated composer rendering, and `[postExtra]` projection of the structured card for `kind === 'job-request'`
- `components/post-template/*` — ideally **untouched** (Approach A); `hasBody`/S-6 caveat is respected because job-request projects only `[postExtra]`
- New component for the structured card (e.g. `components/post-job-request/`)
- Gates: `app.a11y.spec.ts` (new labeled inputs on `/plataforma`), `app.release-matrix.spec.ts` (image-count invariant if the composer previews photos), `feed.page.spec.ts`, `post-views.spec.ts`, `fixtures.spec.ts`
- Optional: `core/platform/preview/preview-fixtures.ts` — the per-role `/previa` showcases render the feed with an explicit `role` input; the composer gate change is visible there too

### Approaches

1. **Projected kind card (recommended)** — Widen `PostKind`, add demo-only `jobRequest` payload to `PostView`, project a dedicated `app-job-request-card` from the feed page into the untouched `[postExtra]` slot; role-differentiated composer (worker → solicitud form, company → existing textarea).
   - Pros: uses the exact extension point p14 reserved (D7); zero shell edits → 19 template tests + a11y loop stay green; S-6 respected (never project `[postBody]`); card is independently testable; future Plantilla 3 follows the same recipe.
   - Cons: `toPostView` needs a demo-side kind/payload source (side-channel registry, since contract `Post` has no kind); that registry is module-level mutable state → needs test-reset discipline; feed page grows two composers.
   - Effort: Medium (est. 500–800 changed lines incl. specs → chained-PR split likely per the 400-line budget).

2. **Template owns the kind card** — `PostTemplateComponent` switches on `post().kind` internally and renders the structured fields itself.
   - Pros: every host gets it for free; no projection wiring at page level.
   - Cons: edits the frozen shell (regression risk on all template tests + the a11y accessible-name loop); couples the base template to per-kind fields — every future kind re-opens the shell, exactly the churn p14's design avoided; D7 reservation of `[postExtra]` would be contradicted.
   - Effort: Medium-High (shell regression surface).

3. **Serialize structured fields into `content` text** — encode "puesto · jornada · modalidad · experiencia" into the plain `content` string; no model change.
   - Pros: zero model/mapper change; invariant satisfied trivially.
   - Cons: unparseable free text; no structured rendering anywhere; brittle for any future consumer. Rejected — concepts over hacks.
   - Effort: Low (but wrong direction).

### Recommendation

**Approach 1**, consistent with the agreed intent (fields in `[postExtra]`, never `[postBody]`). Details worth fronting in proposal/design:

- **Composer validation**: use `ReactiveFormsModule` (quote.page precedent) — 4 required controls + conditional rule (Q1) fit reactive forms cleanly; the existing signal composer stays as-is for `company`.
- **Kind provenance**: a tiny demo-only registry in `mocks/` (e.g. `postId → JobRequestPayload`), written by `MockFeedGateway.create` for worker posts and read by `toPostView`; must stay out of `contract-conformance.ts`. Test-isolation resets required.
- **Gateway**: `create` becomes author-aware (session user id passed from the store/page) instead of the hardcoded `company-1`.

### Risks / Open Questions

- **Q1 (product decision, CRITICAL — confirm with user)**: agreed fields make "texto libre" OPTIONAL, but the p14 never-empty invariant only counts `content`/`attachments` — a form filled with just the 4 structured fields (no text, no photo) would produce a post the feed **silently filters out**. Options:
  - **(a) Recommended**: composer-level composite rule — require free text OR ≥1 photo on top of the 4 structured requireds (mirrors the existing invariant UX; zero predicate/mapper changes). "Texto libre" stays optional *as a field*, not as the only content.
  - (b) Extend `isRenderablePostView` for `kind === 'job-request'` (structured payload counts as content) — changes the invariant's meaning per kind.
  - (c) Auto-compose `content` from the structured fields (e.g. "Busco trabajo como albañil — Jornada completa — Presencial — 5 años") — invariant holds, but the card shows derived text duplicating the `[postExtra]` detail.
- **Q2**: Composer shape — role-differentiated (worker sees the solicitud form, company the textarea) vs a single composer with a kind selector. Recommend role-differentiated; what does `admin` see (nothing, or company-style)?
- **Q3**: Photos input in a demo-only layer — file picker → object URLs (CSR route, session-scoped; gateway state is in-memory so URLs die with reload) vs plain URL text fields. Note p14 W-3 (fixture `example.com` URLs render broken today) — placeholder assets or an `(error)` fallback may piggyback here.
- **Q4**: New worker-authored posts authored as `worker-1` (or the session user) — the denormalized mapper resolves author from `WORKER_PROFILES`/`COMPANY_PROFILES`; any new author id must exist in fixtures or falls back to "Perfil no disponible".
- **Q5 (a11y/release gates)**: every new input/select needs a `<label>` (axe `label` rule on `/plataforma`); if the composer previews selected photos as `<img>`, `app.release-matrix.spec.ts`'s `images: 11` invariant for `/plataforma` breaks and must be updated deliberately.
- **Q6**: `/previa` per-role showcases embed `PlatformFeedPage` with an explicit `role` input — the composer gate change changes what the "worker" preview shows; preview fixtures/tests may need sync.
- **R1**: **Kind-registry test isolation** — module-level mutable demo state leaks across vitest files/runs; needs a reset pattern (fixtures already seed deterministically; the registry must too).
- **R2**: **Review budget** — estimated 500–800 changed lines with specs → exceeds the 400-line chained-PR threshold; plan 2–3 slices (model+mapper+fixtures / composer / card+projection+gates) per the delivery strategy.
- **R3**: `angular.json` worktree modification must never be committed (p14 subagent incident).
- **R4 (Plantilla 3 overlap, flag only)**: vocabulary ("puesto/rubro" vs vacancy `title`; "disponibilidad" vs `JobStatus`), and a future company→solicitud contact flow would need a NEW edge type — `ApplicationsStore` is bound to `jobId + applicantId` and does not fit. `modalidad`/`experiencia` may eventually want to live on `WorkerProfile`. Do not design here; keep p15 payload demo-only and self-contained.

### Ready for Proposal

**Yes** — with one user confirmation required first (**Q1**: does the never-empty invariant stay "text OR photo required" at the composer, making structured-fields-only submissions invalid, or should structured fields count for `job-request`?). Q2 (composer shape/admin visibility) is a secondary confirmation; Q3–Q6 and R1–R4 are design-phase decisions.
