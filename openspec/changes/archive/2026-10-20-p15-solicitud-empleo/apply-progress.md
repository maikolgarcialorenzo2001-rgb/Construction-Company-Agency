# Apply Progress: p15-solicitud-empleo

**Mode**: Strict TDD (`bunx ng test --watch=false`, RED→GREEN→REFACTOR per task)
**Artifact store**: hybrid (Engram `sdd/p15-solicitud-empleo/apply-progress` + this mirror)
**Status**: WU1 + WU2 + WU3 complete. Change ready for verify.

## Slice WU1 — Data foundation (DONE)

**Commit**: `d42b94a` — `feat(platform): job-request data foundation (kind, registry, seeds, mapper)`
**Branch**: `feature/p15-solicitud-empleo` (from up-to-date `main` `f8ce08a`; not pushed)
**Status**: WU1 complete (tasks 1.1–1.7).

### Tasks

- [x] 1.1 RED `mocks/job-request.registry.spec.ts`
- [x] 1.2 GREEN `mocks/job-request.registry.ts`
- [x] 1.3 RED `post-views.spec.ts` (kind/payload derivation)
- [x] 1.4 GREEN widen `PostKind` + `JobRequestPayload` + `PostView.jobRequest?`; derive in `toPostView`
- [x] 1.5 RED `fixtures.spec.ts` (`JOB_REQUEST_SEEDS`, ≥2 seeds renderable/author-resolvable)
- [x] 1.6 GREEN append 2 text-only seeds at `FEED_POSTS` tail (`post-10`, `post-11`)
- [x] 1.7 `resetJobRequestRegistry()` in `beforeEach`/`afterEach` of registry + post-views specs (R1)

### Files touched

| File | Action | What |
|------|--------|------|
| `core/platform/domain/models.ts` | Modified | `PostKind = 'standard' \| 'job-request'`; `JobRequestPayload`; `PostView.jobRequest?` |
| `core/platform/mocks/job-request.registry.ts` | Created | Seeded `Map<postId, JobRequestPayload>` + `getJobRequest`/`recordJobRequest`/`resetJobRequestRegistry` |
| `core/platform/mocks/job-request.registry.spec.ts` | Created | Seeded lookup, record+reset, miss |
| `core/platform/mocks/fixtures.ts` | Modified | Text-only job-request seeds at feed tail + `JOB_REQUEST_SEEDS` |
| `core/platform/mocks/post-views.ts` | Modified | Derive `kind`/`jobRequest` from registry (miss → key omitted) |
| `core/platform/mocks/fixtures.spec.ts` | Modified | Length 9→11 + job-request seed invariants |
| `core/platform/mocks/post-views.spec.ts` | Modified | Derivation hit/miss + predicate-unchanged |

### Test counts

- **Before**: 716 passing (`bunx ng test --watch=false`)
- **After**: 726 passing (+10 new `it()`: registry 3, post-views 3, fixtures 4)
- Final gate: `bunx ng build` OK · `bunx ng lint` OK · full suite 726/726.

### TDD Cycle Evidence (WU1)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1/1.2 | `job-request.registry.spec.ts` | Unit | N/A (new file) | ✅ Written (module missing) | ✅ 3/3 passed | ✅ 3 cases (seed lookup, record+reset, miss) | ✅ Clean (`snapshot()` helper) |
| 1.3/1.4 | `post-views.spec.ts` | Unit | ✅ repo suite green pre-change | ✅ Written (kind stayed 'standard') | ✅ 3/3 passed | ✅ 3 cases (hit, miss key omitted, predicate) | ➖ None needed |
| 1.5/1.6 | `fixtures.spec.ts` | Unit | ✅ repo suite green pre-change | ✅ Written (`JOB_REQUEST_SEEDS` missing) | ✅ 4/4 passed | ✅ 4 cases (tail, text-only/images, renderable/author, payload) | ➖ None needed |
| 1.7 | registry + post-views specs | Unit | N/A | ✅ Written | ✅ passed | ➖ | ➖ |

---

## Slice WU2 — Create path + structured card (DONE)

**Commit**: `749a250` — `feat(platform): author-aware create path and job-request structured card`
**Branch**: `feature/p15-solicitud-empleo` (on top of `d42b94a`; not pushed)
**Status**: WU2 complete (tasks 2.1–2.9). Diff: 10 files, +361/−30 = **391 lines (≤400 budget)**.
**Scope**: start = WU1 commit `d42b94a`; end = this commit. WU3 not started. Rollback: revert `749a250`.

### Tasks

- [x] 2.1 RED `mock-gateways.spec.ts` (draft `create` referencing non-existent API → compile RED `TS2353`)
- [x] 2.2 GREEN `api/ports.ts` `CreatePostDraft` + `FeedGateway.create(draft)`; `mock-feed.gateway.ts` author-aware + `recordJobRequest`
- [x] 2.3 `mock-gateways.spec.ts` existing `create` call sites updated to draft arg
- [x] 2.4 RED `feed.store.spec.ts` (`store.create(draft)` not assignable to `string` → compile RED `TS2345`)
- [x] 2.5 GREEN `store/feed.store.ts` `create(draft: CreatePostDraft)` + spec call-site refits
- [x] 2.6 RED `post-job-request.component.spec.ts` (module missing → resolve RED)
- [x] 2.7 GREEN `components/post-job-request/*` structured card
- [x] 2.8 RED `feed.page.spec.ts` (card count 0 vs 2 → assertion RED)
- [x] 2.9 GREEN `feed.page.ts` projects card into `[postExtra]` when `kind==='job-request' && jobRequest`; company `publish` wired to author-aware draft

### Files touched

| File | Action | What |
|------|--------|------|
| `core/platform/api/ports.ts` | Modified | `CreatePostDraft {authorId, kind, content, attachments?, jobRequest?}`; `FeedGateway.create(draft)` (D3); `PostInput` import dropped |
| `core/platform/api/mock-feed.gateway.ts` | Modified | Author-aware `create(draft)`; `recordJobRequest` on `kind==='job-request'` |
| `core/platform/api/mock-gateways.spec.ts` | Modified | +2 tests (job-request author+registry, standard no-write); draft call site; R1 `resetJobRequestRegistry()` beforeEach/afterEach |
| `core/platform/store/feed.store.ts` | Modified | `create(draft: CreatePostDraft)` forwards verbatim |
| `core/platform/store/feed.store.spec.ts` | Modified | +1 test (draft forwarding incl. payload/attachments); 2 existing call sites → drafts |
| `components/post-job-request/*` | Created | Card: input.required payload; `<dl>` es-AR labels; `role="group"` + `aria-label="Solicitud de empleo"`; per-field testids |
| `components/post-job-request/post-job-request.component.spec.ts` | Created | +3 tests (es-AR labels+values, non-hardcoded payload, named group) |
| `pages/plataforma/feed.page.ts` | Modified | Project card into `[postExtra]` (single-root `@if`, `postExtra` attr on host); `publish` → author-aware draft (`session user ?? 'company-1'`, `kind:'standard'`) |
| `pages/plataforma/feed.page.spec.ts` | Modified | +2 tests (projection+body-clean, standard unchanged) |

### Test counts

- **Before (WU1 end)**: 726 passing
- **After**: 734 passing (+8 new `it()`: mock-gateways 2, feed.store 1, card 3, feed.page 2)
- Final gate: `bunx ng test --watch=false` 734/734 · `bunx ng build` OK · `bunx ng lint` OK.

### TDD Cycle Evidence (WU2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1/2.2/2.3 | `mock-gateways.spec.ts` | Unit | ✅ 726/726 | ✅ Written (TS2353 — draft API missing) | ✅ Suite green (729) | ✅ 2 cases (job-request draft author+payload; standard draft no registry write) + timeline-growth refit | ➖ None needed |
| 2.4/2.5 | `feed.store.spec.ts` | Unit | ✅ suite green pre-change | ✅ Written (TS2345 — draft vs `string`) | ✅ Suite green (729) | ✅ 2 cases (draft forwarding w/ payload+attachments; prepend + empty-promote refit to drafts) | ✅ Merged split ports import |
| 2.6/2.7 | `post-job-request.component.spec.ts` | Unit (component) | N/A (new files) | ✅ Written (module unresolved) | ✅ 3/3 passed | ✅ 3 cases (es-AR labels+values, different payload → not hardcoded, a11y group name) | ➖ None needed |
| 2.8/2.9 | `feed.page.spec.ts` | Integration (page) | ✅ suite green pre-change | ✅ Written (0 cards vs 2) | ✅ Suite green (734) | ✅ 2 cases (job-request projection + body clean; standard post no card) | ✅ JSDoc updated to describe projection |

### Deviations from design

- **None affecting behavior** — implementation matches design D3/D8/S-6 (card in `[postExtra]` only).
- Scope note: `feed.page.publish` was wired to the author-aware draft inside WU2 (not WU3) because widening `FeedStore.create` made it a hard compile ripple; role differentiation of the composer remains WU3 (3.4). Company path keeps the signal-based textarea.
- Spec file named `post-job-request.component.spec.ts` (project convention: `.component.ts` → `.component.spec.ts`), not the tasks.md shorthand `post-job-request.spec.ts`.

### Discoveries

- **Content projection needs the slot attribute on the projected host**: `ng-content select="[postExtra]"` matches nodes carrying `postExtra`; the first GREEN attempt rendered 0 cards because the card element lacked the attribute. Fixed with `<app-post-job-request postExtra …>`. A single-root `@if` around it projects fine (multi-root control-flow blocks are the documented failure case).
- **The Angular unit-test builder type-checks spec files**: RED for type-level changes surfaces as a build-time `TS####` error (not a runtime assertion). Both forms count as RED (test references not-yet-existing code), and GREEN cannot run until all compile ripples are resolved — so 2.2/2.3 and 2.4/2.5 were validated as two batches of two tasks, each with its own observed RED.
- Prettier is NOT in the verify gate and 4 touched files were already prettier-dirty at HEAD (pre-existing violations only); no reformat churn was introduced to keep the work-unit diff focused.

### R1 / R3 discipline

- R1: `resetJobRequestRegistry()` added in `beforeEach`/`afterEach` of `mock-gateways.spec.ts` (the WU2 spec that creates job-request posts). `feed.page.spec.ts` renders seeds only — no create — no reset needed.
- R3: pre-existing unstaged `angular.json` modification NEVER staged/touched/reverted (path-scoped `git add` of the 10 WU2 files only). `openspec/` change dir left untracked (WU1 precedent: SDD docs are not committed in feature slices).

### Blockers

None.

### Next

WU3 — composer + a11y gates (tasks 3.1–3.7), base = `749a250`.

---

## Slice WU3 — Composer + a11y gates (DONE)

**Commits (retro-split)**:
- **A** `18af736` — `feat(platform): worker job-request composer component` — 3 files, **413 lines** (`job-request-composer.component.ts`/`.html`/`.component.spec.ts`)
- **B** `094cfb3` — `feat(platform): role-differentiated feed composer wiring` — 2 files, **199 lines** (`feed.page.ts`, `feed.page.spec.ts`)
- Plus post-verify chore `3464165` — `chore(platform): add @vitest/coverage-v8 dev dependency` (2 files, 44 lines; not part of WU3).

**Branch**: `feature/p15-solicitud-empleo` (on top of `749a250`; not pushed)
**Status**: WU3 complete (tasks 3.1–3.7). Original WU3 commit `3345d39` (5 files, +606/−6 = 612 lines) was retro-split after verify into commits A + B; `git diff d42b94a..HEAD` is byte-identical to the original `git diff d42b94a..3345d39` (tree unchanged).
**Scope**: start = WU2 commit `749a250`; end = commit B `094cfb3`. Rollback: revert A + B.
**Budget note**: the retro-split resolved the verify WARNING WU3-over-400 — largest WU3 commit went from 612 → 413 lines (A; 13 over the 400 budget because the component's 171-line spec must stay with its component per work-unit-commits) and 199 lines (B, under budget).

### Tasks

- [x] 3.1 RED `job-request-composer.component.spec.ts` (module missing → compile RED `TS2307` + `TS7006` ripple)
- [x] 3.2 GREEN `components/job-request-composer/*`: `NonNullableFormBuilder` + `Validators`; 4 requireds; Q1=a composite at submit (text OR ≥1 photo); structured-only rejected with es-AR `role=alert` + focus free text; invalid submit → `markAllAsTouched` + per-field alerts + focus first invalid (quote.page precedent); photos = object-URL previews capped at 10; no *zona* control/label
- [x] 3.3 RED `feed.page.spec.ts` (worker test + e2e fail: composer not mounted; company/admin/anonymous pass as triangulation)
- [x] 3.4 GREEN `feed.page.ts`: worker → `app-job-request-composer (publish)="publishJobRequest($event)"`, company → existing signal textarea unchanged, admin/anonymous → none; `publishJobRequest` builds author-aware draft (`session user ?? 'worker-1'`, `kind:'job-request'`, attachments omitted when empty)
- [x] 3.5 RED `feed.page.spec.ts` (`expected null to be 'group'` — describedby + group naming absent); GREEN: form gets `role="group"` + `aria-label="Solicitud de empleo"`, every control gets `aria-describedby` → always-rendered `role=alert` region, `aria-invalid` on the 4 requireds; page spec asserts accessible name + unique ids for all 7 worker controls
- [x] 3.6 `app.release-matrix.spec.ts` (`/plataforma` `images: 11`) + `app.a11y.spec.ts` green inside the suite — both seed admin, composer never mounts, zero expectation changes
- [x] 3.7 Full gate: `bunx ng test --watch=false` 745/745 · `bunx ng build` OK · `bunx ng lint` OK; committed as ONE WU3 commit `3345d39`, retro-split post-verify into `18af736` + `094cfb3` (gates re-run green at the new HEAD)

### Files touched

| File | Action | What |
|------|--------|------|
| `components/job-request-composer/job-request-composer.component.ts` | Created | Reactive form, `JobRequestDraft` output, Q1=a composite rule, photo cap, focus handling |
| `components/job-request-composer/job-request-composer.component.html` | Created | es-AR labels, descriptor-loop fields, alerts, previews, group naming |
| `components/job-request-composer/job-request-composer.component.spec.ts` | Created | +5 tests (fields+no-zona, structured-only rejected, text-only publish, photo-only+cap, invalid-submit touched/focus) |
| `pages/plataforma/feed.page.ts` | Modified | Role-differentiated composer branch; `publishJobRequest(draft)` author-aware job-request create |
| `pages/plataforma/feed.page.spec.ts` | Modified | +4 tests (worker role, company role, admin/anonymous none, worker e2e publish) +2 a11y tests; R1 `resetJobRequestRegistry()` beforeEach/afterEach |

### Test counts

- **Before (WU2 end)**: 734 passing
- **After**: 745 passing (+11 new `it()`: composer 5, feed.page 6)
- Final gate: `bunx ng test --watch=false` 745/745 · `bunx ng build` OK · `bunx ng lint` OK.

### TDD Cycle Evidence (WU3)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1/3.2 | `job-request-composer.component.spec.ts` | Unit (component) | ✅ 734/734 | ✅ Written (TS2307 — module missing) | ✅ 745 suite green (5/5 new) | ✅ 5 cases (fields+no-zona; structured-only; text-only; photo-only + cap 12→10; invalid-empty touched+focus) | ➖ None needed (descriptor loop already extracted) |
| 3.3/3.4 | `feed.page.spec.ts` | Integration (page) | ✅ suite green pre-change | ✅ Written (worker test + e2e fail, 2 failed) | ✅ Suite green (743) | ✅ 4 cases (worker→form; company→textarea; admin+anonymous→none loop; session-worker e2e → card+registry+denormalized author) | ✅ Stale "WU3" JSDoc updated |
| 3.5 | `feed.page.spec.ts` (+component template) | Integration (page a11y) | ✅ suite green | ✅ Written (`expected null to be 'group'` + missing describedby) | ✅ Suite green (745) | ✅ 2 cases (accessible-name+unique-id over all 7 controls + page-wide id uniqueness; describedby→alert region for all 6 inputs) | ➖ None needed |
| 3.6 | `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | Integration (gates) | ✅ in-suite green | N/A (verification task) | ✅ 745/745 includes both | ➖ | ➖ |

### Deviations from design

- **None in behavior** — implementation matches D4 (admin→none), D5 (extracted reactive composer), D6 (Q1=a submit-time composite, predicate untouched), D7 (object-URL previews, cap 10), D11 (explicit worker-control a11y assertions in `feed.page.spec.ts`).
- **Size deviation**: 612 changed lines vs the 260–320 forecast (>400 review budget). Originally kept as a single commit per the orchestrator's "exactly ONE work-unit commit" contract for the final slice; **retro-split post-verify** into `18af736` (component, 413) + `094cfb3` (page wiring, 199), byte-identical tree, resolving the verify warning.
- Spec file named `job-request-composer.component.spec.ts` (project convention), not the tasks.md shorthand `job-request-composer.spec.ts`.

### Discoveries

- **Zoneless harness needs an explicit `detectChanges()` after custom DOM events**: dispatching a `change` event on the file input updated the signal, but the preview grid only painted after `fixture.detectChanges()` — same rule as the store harness, extended to non-`input` events.
- **Post-publish preview assertions must read the reset, not the pre-reset state**: a successful publish clears `photos()` (like `form.reset()`), so cap assertions belong BEFORE submit; after submit the grid is empty by design.
- **Admin-seeded gates are composer-immune by construction**: D4's "admin → none" choice keeps both the release matrix (`images: 11`) and the axe surface unchanged without touching either spec.
- The pre-existing unstaged `angular.json` modification referenced by R3 was **not present** in the worktree at WU3 start (clean `git status` except untracked `openspec/`); path-scoped adds kept the discipline regardless.

### R1 / R3 discipline

- R1: `resetJobRequestRegistry()` added in `beforeEach`/`afterEach` of `feed.page.spec.ts` (the WU3 spec that creates a job-request post via the e2e test).
- R3: only the 5 WU3 files staged; `openspec/` change dir left untracked; `angular.json` untouched (absent from worktree).

### Blockers

None.

### Next

WU3 was the final slice → **ready for sdd-verify**.
