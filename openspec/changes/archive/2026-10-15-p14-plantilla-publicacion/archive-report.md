# Archive Report: p14-plantilla-publicacion

`p14-plantilla-publicacion` is complete and archived. It gives the platform a **reusable Instagram-like base post template** — denormalized author header with a Follow toggle, a 1–10 lazy media grid, and a Like/Share/Save actions bar — rendered by every `feed-post` list item instead of page-inline markup. Engagement (follow/like/save) flows through a new **`EngagementGateway` port → SSR-safe localStorage mock adapter → signal store**, while share is component-local clipboard only; the demo-only `PostView`/`PostKind` view-model keeps the contract-shaped `Post` and `contracts/openapi.yaml` **frozen** (p9 `Comment` precedent), and future post types (job-request, vacancy) extend via `[postBody]`/`[postExtra]` slots without shell edits. Verify passed **PASS WITH WARNINGS** (0 CRITICAL, 3 WARNING, 5 SUGGESTION). Spec sync ran: **2 capabilities CREATED** (`platform-post-template`, `platform-engagement`) and **1 MODIFIED** (`platform-feed` — 1 requirement replaced, 1 requirement added).

> **Delivery note (chained-pr):** this change lives **only on branch `feature/p14-plantilla-publicacion`** (HEAD `0ebe311`). It is **NOT merged to `main`** and **not pushed** — an isolated feature branch awaiting a merge decision, built as 4 stacked work-unit commits from base `origin/main` @ `6d7c349`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p14-plantilla-publicacion` (base post template + engagement; HANDOFF post-types base) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL, 3 WARNING, 5 SUGGESTION; 18/19 scenarios COMPLIANT + 1 PARTIAL) |
| Work units | 4/4 complete (WU1 → WU4 sequential stacked commits) |
| Delivery | **feature-branch only** — branch `feature/p14-plantilla-publicacion`; **NOT merged to `main`**, not pushed |
| Branch / HEAD | `feature/p14-plantilla-publicacion` @ `0ebe311` (base `6d7c349`) |
| Tasks | 20/20 checkbox tasks complete |
| Tests | **706/706 green (74 files)**; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (**25 static routes prerendered**) |
| Full gate | `bun run gate` **ALL PASS** (21 routes + 4 previa pages; no localhost, no plataforma leak, no demo credentials) |
| Spec scenarios | **18/19 COMPLIANT + 1 PARTIAL** (0 UNTESTED, 0 FAILING) |
| Capability changes | **2 CREATED** (`platform-post-template`, `platform-engagement`), **1 MODIFIED** (`platform-feed`) |
| Contract | `contracts/openapi.yaml` untouched; `contract-conformance.ts` unaware of `PostView`/`PostKind`/engagement types; `angular.json` modified-but-**unstaged** (pre-existing, deliberately not committed) |
| Archive location | `openspec/changes/archive/2026-10-15-p14-plantilla-publicacion/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p14-plantilla-publicacion/archive-report` |
| Remote state | branch-local commits only — **not merged, not pushed**, no PR/issue created |

## What shipped (4 work units)

| Work unit | Commit | What it is |
|---|---|---|
| **WU1 — view-model & fixtures** | `77e040e` `feat(platform): add PostView and toPostView mapper with denormalized author; update fixtures to absolute https attachment URLs spanning 1-10` | Demo-only `PostKind`/`PostView` in `models.ts` (no conformance entry) + `toPostView()` mapper in `mocks/post-views.ts`; `FEED_POSTS` attachments → absolute `https` URLs spanning 1–10 (187 changed lines). |
| **WU2 — engagement port, adapter & store** | `5e45929` `feat(platform): add EngagementGateway port, SSR-safe localStorage adapter, and engagement signal store` | `EngagementGateway` port + `ENGAGEMENT_GATEWAY` token in `api/ports.ts`; `MockEngagementGateway` (SSR-safe localStorage, `{v:1}` at `constructora.platform.engagement`, corrupt/absent → `{}` no-throw); `EngagementStore` signals with guarded ctor load and `await gateway → state.set()` (619 changed lines — see W-2). |
| **WU3 — PostTemplateComponent** | `c60f8e2` `feat(platform): add PostTemplateComponent with denormalized header, clamped media grid, and engagement action toggles` | Standalone OnPush zoneless template: author name+role header + `post-follow` toggle, lazy `<img>` grid clamped to 10 with `+N` overflow and labeled placeholder, `post-like`/`post-share`/`post-save` actions, `[postBody]`/`[postExtra]` slots; 19 co-located tests (618 changed lines — `size:exception` flagged in apply-progress). |
| **WU4 — feed integration & a11y** | `0ebe311` `feat(platform): render feed posts through PostTemplateComponent with session viewer engagement; rewrite feed page spec and extend a11y and release-matrix gates` | `views = computed(map(toPostView))` + `<app-post-template [post] [viewerId]>` inside each `feed-post` `li` (thread stays page-side); `feed.page.spec.ts` rewritten 374→500 lines with all 18 prior tests retained; axe gate extended to template controls; release-matrix image row 0 → 11 lazy (200 changed lines). |

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-post-template` | **Created** | NEW capability (no canonical dir existed). Full spec copied from the authored delta → `openspec/specs/platform-post-template/spec.md` (7 requirements: header+follow a11y, media grid 1–10 clamp, actions bar, projection slots, zoneless repaint, demo-only view-model out of contract, axe gate; 9 scenarios). |
| `platform-engagement` | **Created** | NEW capability (no canonical dir existed). Full spec copied from the authored delta → `openspec/specs/platform-engagement/spec.md` (4 requirements: swappable adapter, follow as stored edge only, like/save persist across reload (SSR-safe), signal-based store; 5 scenarios). |
| `platform-feed` | **Updated** | MODIFIED requirement *"Feed renders via signals (zoneless)"* replaced: each post now MUST render through the shared `PostTemplateComponent` fed by a demo-only `PostView` (denormalized `authorName`/`authorRole`), with `(Previously:)` marker; +1 scenario *"Posts render through the shared template"*. ADDED requirement *"Fixture media URLs are renderable"* appended (absolute `https` URLs spanning 1–10). 2 other requirements preserved untouched (`Feed gateway port`, `Company-gated composer`). |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding and no `# Delta for …` header remains in any canonical spec (grep-verified across `openspec/specs/`). Requirements not mentioned in the deltas were preserved. Delta-scenario coverage in canonical specs: `platform-post-template` 9 + `platform-engagement` 5 + `platform-feed` 5 = **19**.

## Final gate numbers (from the PASS WITH WARNINGS verify)

| Gate | Command | Result |
|---|---|---|
| Tests | `bunx ng test --watch=false` | ✅ **706/706 passed** across **74 files** |
| Lint | `bunx ng lint` | ✅ **All files pass linting** |
| Build | `bunx ng build` | ✅ clean — **25 static routes prerendered** |
| Full release gate | `bun run gate` | ✅ **ALL PASS** — routes 21 verified, previa 4 pages, no localhost, no plataforma leak, no demo credential |
| Spec scenarios | verifier matrix | ⚠️ **18/19 COMPLIANT + 1 PARTIAL** (0 UNTESTED, 0 FAILING) |
| Strict TDD | 6 checks | ✅ 6/6 passed (one reproducibility caveat — S-3) |
| Contract safety | `git diff` + conformance grep | ✅ `openapi.yaml` and `contract-conformance.ts` zero diff vs `origin/main`; conformance blind to demo-only types |

## Commits (branch `feature/p14-plantilla-publicacion` only — NOT on `main`)

| Commit | Work unit |
|---|---|
| `77e040e` | WU1 `feat(platform): add PostView and toPostView mapper with denormalized author; update fixtures to absolute https attachment URLs spanning 1-10` |
| `5e45929` | WU2 `feat(platform): add EngagementGateway port, SSR-safe localStorage adapter, and engagement signal store` |
| `c60f8e2` | WU3 `feat(platform): add PostTemplateComponent with denormalized header, clamped media grid, and engagement action toggles` |
| `0ebe311` | WU4 `feat(platform): render feed posts through PostTemplateComponent with session viewer engagement; rewrite feed page spec and extend a11y and release-matrix gates` |
| *(this change)* | `docs(openspec): archive p14-plantilla-publicacion with spec sync` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-15-p14-plantilla-publicacion/` |

Conventional format, English, no AI attribution. `angular.json` (incidental `M`) deliberately **not** committed.

## Archive contents

- `exploration.md` ✅
- `proposal.md` ✅
- `specs/` ✅ (3 deltas: `platform-post-template`, `platform-engagement`, `platform-feed`)
- `design.md` ✅
- `tasks.md` ✅ (20/20 complete)
- `verify-report.md` ✅ (PASS WITH WARNINGS)
- `archive-report.md` ✅ (this file)

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `exploration.md` | `sdd/p14-plantilla-publicacion/explore` (#994) |
| Proposal | `proposal.md` | `sdd/p14-plantilla-publicacion/proposal` (#997) |
| Spec (deltas) | `specs/{platform-post-template,platform-engagement,platform-feed}/spec.md` | `sdd/p14-plantilla-publicacion/spec` (#998) |
| Design | `design.md` | `sdd/p14-plantilla-publicacion/design` (#1001) |
| Tasks | `tasks.md` | `sdd/p14-plantilla-publicacion/tasks` (#1002) |
| Apply progress | *(engram only — no filesystem copy; 4 batches with TDD evidence tables)* | `sdd/p14-plantilla-publicacion/apply-progress` (#1003) |
| Verify report | `verify-report.md` | `sdd/p14-plantilla-publicacion/verify-report` (#1005) |
| Archive report | `archive-report.md` | `sdd/p14-plantilla-publicacion/archive-report` (this save) |

## Known debt carried forward (verify WARNINGs — accepted, non-blocking)

| ID | Item | Disposition |
|---|---|---|
| **W-1** | **No test for the "no follower-count / notification UI" clause.** `platform-engagement` R2 scenario *"Edge persists, no counts"* is only half-covered: edge persistence is tested (`mock-engagement.gateway.spec.ts:88`, `post-template.component.spec.ts:196`), but the *absence* of follower-count/notification UI has no covering test (`git grep -i "follower|notification"` across `*.spec.ts` → no matches). Static inspection confirms no such UI exists, so risk is low, but the scenario is ⚠️ PARTIAL — the 18/19 compliance number above. | **Known debt — accepted at archive.** Minimal fix: add an absence assertion (e.g. assert no counter element renders in the post header). Worth closing before `/plataforma` is shown to a real user. |
| **W-2** | **WU2/WU3 exceed the 400-line review budget.** `apply-progress` self-flagged WU3 (618 lines) for `size:exception`, but claimed WU2 ≈330 lines; actual `git show --numstat 5e45929` = **619 changed lines** — WU2's breach went unflagged. Combined WU2+WU3 = 1237 lines against the `chained-pr` budget. | **Known debt — `size:exception` note covering WU2 alongside WU3.** Reviewer should treat both commits as accepted over-budget slices (spec files dominate). `apply-progress` WU2 line-budget claim is inaccurate (see also S-2 for the feed spec line-count inaccuracy). |
| **W-3** | **Demo fixture media point at `images.example.com`.** `fixtures.ts:81,106` use `https://images.example.com/plataforma/*.webp` (IANA-reserved; no binaries exist), so a real browser shows 11 broken images on `/plataforma`. The template placeholder only handles *empty* URLs, not load failures; jsdom fetches no images, so no test catches it. Demo-only data (`isPlaceholder: true`), documented design risk → WARNING not CRITICAL. The feed requirement text *"so the media grid never references missing binaries"* is therefore only partially true in practice. | **Known debt — accepted at archive.** Minimal fix: serve a few real placeholder assets, or add an `(error)` fallback to `post-media-placeholder`. Should close before a live demo. |

### SUGGESTIONs (recorded, no action required)

- **S-1** — Spec wording vs design on "computed selectors": `platform-engagement` R4 says "signals with computed selectors"; implementation uses plain signal-reading methods (`isFollowing/isLiked/isSaved`) per design D3/D4. Scenario passes; consider aligning spec wording to "signal-reading selectors".
- **S-2** — `apply-progress` twice states the feed spec rewrite as "374→578 lines"; actual is **374→500**. All other line-budget numbers audited exact.
- **S-3** — RED-first is trusted, not independently reproducible: each work unit is a single squashed commit (spec + implementation together); reported RED evidence (missing-module build errors) is plausible but no failing-run log is persisted. *Consider committing RED separately next time.*
- **S-4** — No single test asserts liked **and** saved after a fresh store load; coverage is proven across two tests (`engagement.store.spec.ts:70`, `ports.spec.ts:194`). A combined reload assertion would tighten it.
- **S-5** — `/plataforma` is a CSR route (not prerendered), so SSR-safety rests entirely on the `localStorage === undefined` unit test (`gateway.spec.ts:104`). Acceptable by design (route is auth-gated).

## Deferred scope (explicit — NOT implemented, verified absent)

| Deferred item | Where it will live |
|---|---|
| **Feed prioritization by follows** | Future change; `feed.store.ts`/`feed.page.ts` have no `following`/sort logic (verify invariant green) |
| **Saved/bookmarks collection view** | Future change; the `post-save` toggle persists state only — no `/plataforma/guardados` route exists (`app.routes.ts` unchanged) |
| **Post types 2 & 3** (worker job-request, company vacancy) | Future changes; `PostKind = 'standard'` only; `[postBody]`/`[postExtra]` slots are the extension points and stay free |
| Real backend engagement endpoints / any `openapi.yaml` edit | Future contract-owning change |
| `/previa` adoption of the full template | Optional; previa feed stays reduced by design (p13 invariant untouched) |
| Media upload / real image binaries | See W-3 |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-post-template` + `platform-engagement` created; `platform-feed` 1 MODIFIED merged + 1 ADDED appended
- [x] No leftover delta scaffolding in canonical specs (grep-verified)
- [x] Requirements not mentioned in the deltas preserved (`Feed gateway port`, `Company-gated composer`)
- [x] Change folder moved to `openspec/changes/archive/2026-10-15-p14-plantilla-publicacion/` with all artifacts
- [x] Change dir was untracked → used a filesystem `mv` (not `git mv`); this docs commit stages it
- [x] Active `openspec/changes/` no longer contains `p14-plantilla-publicacion/` (only `archive/`)
- [x] Verify verdict is non-CRITICAL (0 CRITICAL) → archive allowed; 3 WARNINGs recorded above as known debt
- [x] Engram archive report saved as `sdd/p14-plantilla-publicacion/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] `angular.json` (pre-existing `M`) left unstaged and untouched; `contracts/openapi.yaml` / `contract-conformance.ts` untouched; no source code changed in this phase
- [x] **NOT merged to `main`** — isolated branch `feature/p14-plantilla-publicacion` (`0ebe311`); awaiting a merge decision

## Next steps

`p14-plantilla-publicacion` delivers the base template every future post type extends, with the contract frozen and the full gate green (706/706). Outstanding items are the three WARNING-level debts above (W-1 absence assertion, W-2 size-exception note, W-3 placeholder media) plus cosmetic SUGGESTIONs — none blocks archive. **Merge decision pending:** the change is isolated on `feature/p14-plantilla-publicacion` and is **NOT merged to `main`**; a human must decide when/how to integrate it. Natural follow-ups: the deferred saved-view / feed-prioritization / post-types-2-3 changes, optionally after closing W-1 and W-3.
