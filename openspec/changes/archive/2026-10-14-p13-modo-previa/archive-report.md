# Archive Report: p13-modo-previa

`p13-modo-previa` is complete and archived. It closes the deferred public-reachability gap from `p10-fixtures`/`p12-admin` by publishing a **truly static, hostable `/previa` showcase** rendered synchronously from fixtures (fictional data) plus a **client-only role switcher** that enters the live platform as any of the 6 demo accounts without registering. The preview is a **top-level** (sibling of `plataforma`) browser route, so it is auto-prerendered with **zero shared-helper change** and the "platform subtree stays client-only" invariant is untouched; `/previa/:role` renders per-role HTML (JS-off safe). No backend, no contract change. Verify passed **PASS WITH WARNINGS** (0 CRITICAL, 2 WARNING). Spec sync ran: **1 capability CREATED** (`platform-preview`) and **3 MODIFIED** (`platform-shell`, `server-rendering`, `platform-identity`). `contracts/openapi.yaml` was **not touched**.

> **Delivery note (chained-pr):** this change lives **only on branch `feature/p13-modo-previa`** (HEAD `5c639a3`). It is **NOT merged to `main`** and **not pushed** — an isolated feature branch awaiting a merge decision, unlike the prior `stacked-to-main` changes. `main` is untouched.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p13-modo-previa` (public static `/previa` preview + demo-role switcher; HANDOFF §10 Paso 8) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL, 2 WARNING, 4 SUGGESTION; 35/36 scenarios COMPLIANT + 1 PARTIAL) |
| Work units | 2/2 complete (WU1 → WU2 sequential commits) + 1 docs/planning commit |
| Delivery | **feature-branch only** — branch `feature/p13-modo-previa`; **NOT merged to `main`**, not pushed |
| Branch / HEAD | `feature/p13-modo-previa` @ `5c639a3` |
| Tasks | 18/18 checkbox tasks complete |
| Tests | **652/652 green (70 files)**; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (lazy `previa-page` 8.32 kB; **25 static routes prerendered**) |
| Prerender gate | `bun run verify:prerender` **PASS** (21 JSON-LD routes checked; `previa` deliberately absent) |
| Spec scenarios | **35/36 COMPLIANT + 1 PARTIAL** (0 UNTESTED, 0 FAILING) |
| Capability changes | **1 CREATED** (`platform-preview`), **3 MODIFIED** (`platform-shell`, `server-rendering`, `platform-identity`) |
| Contract | `contracts/openapi.yaml` untouched; protected files (`contract-conformance.ts`, `angular.json`, `scripts/verify-prerender.ts`) untouched |
| Archive location | `openspec/changes/archive/2026-10-14-p13-modo-previa/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p13-modo-previa/archive-report` |
| Remote state | branch-local commits only — **not merged, not pushed**, no PR/issue created |

## Change summary

| Piece | What it is | Evidence |
|---|---|---|
| **WU1 — static `/previa`** | Top-level `previa` grouping route (`NOINDEX`, lazy `PreviaPage`) rendered **synchronously** from fixtures via a pure view-model selector (`PREVIEW_ROLES`, `resolvePreviewRole`, `previewRoleParams`, `previewViewModelFor`, password-free directory rows). No store, no `await`, no `PendingTasks`. Route/prerender/matrix/a11y specs updated. Invariant green; no shared-helper change. | `75c0132` — `preview-fixtures.ts` (+spec), `previa.page.ts` (+spec/.html), `app.routes.ts` (+spec), `app.release-matrix.spec.ts`, `app.a11y.spec.ts` |
| **WU2 — role variant + switcher** | `{ path: ':role' }` child + explicit `previa/:role` server entry (`Prerender` + `PrerenderFallback.Client` + `getPrerenderParams` over `PREVIEW_ROLES`) → per-role static HTML; client-only `PreviewRoleSwitcherComponent` over the 6 `DEMO_ACCOUNTS` (`SessionService.login(email,'demo1234')` + navigate `/plataforma/inicio`), plain anchors to `/previa/:role`, inert during prerender. | `5c639a3` — `preview-role-switcher.component.ts` (+spec/.html), `app.routes.ts` (+spec), `app.routes.server.ts` (+spec), `previa.page.*`, `app.a11y.spec.ts` |
| **Planning docs** | SDD planning artifacts (explore → tasks) for the change. | `512d366` — `openspec/changes/p13-modo-previa/*` |

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-preview` | **Created** | NEW capability (no canonical dir existed). Full spec copied from the authored delta (5 requirements, 13 scenarios) → `openspec/specs/platform-preview/spec.md`. |
| `platform-shell` | **Updated** | MODIFIED requirement *"Platform subtree route table"* replaced: adds the top-level `previa` (+`:role`) grouping, `(Previously:)` marker updated, +2 scenarios (*"Top-level table gains the preview route"*, *"Preview and platform are structurally separate"*). MODIFIED requirement *"Guarded platform children"* replaced: preview routes stay unguarded, +scenario *"Marketing and preview routes stay unguarded"*. 4 other requirements preserved untouched (`Platform chrome and CTA suppression`, `Platform subtree excluded from prerender` + annotation, `Platform pages are noindex`, `Platform release-matrix rows`). |
| `server-rendering` | **Updated** | MODIFIED requirement *"1. [B] Prerender every public route at build"* replaced: set now includes `/previa` + one per preview role (25 today), invariant re-worded "platform subtree stays client-only", enumeration derives from the shared preview role list; +scenario *"Existing static routes are unregressed"*. MODIFIED requirement *"Platform subtree render mode"* replaced: exclusion must NOT drop `previa`, `previa/:role` uses `PrerenderFallback.Client`; +2 scenarios (*"Prefix exclusion is exact and keeps the preview"*, *"Preview param route is prerendered with client fallback"*). 6 other requirements preserved untouched. |
| `platform-identity` | **Updated** | MODIFIED requirement *"Mock session, visibly demo"* replaced: the 6 demo accounts are reachable from the `/previa` switcher without registration; +scenario *"All demo accounts are reachable from the preview switcher"*. 3 other requirements preserved untouched (`Role model`, `Auth and profiles gateway ports`, `Profiles`). |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding and no `# Delta for …` header remains in any canonical spec (grep-verified across `openspec/specs/`). Requirements not mentioned in the deltas were preserved. Delta-scenario coverage in canonical specs: `platform-preview` 13 + `platform-shell` 9 + `server-rendering` 7 + `platform-identity` 7 = **36**.

## Final gate numbers (from the PASS WITH WARNINGS verify)

| Gate | Command | Result |
|---|---|---|
| Tests | `bunx ng test --watch=false` | ✅ **652/652 passed** across **70 files** |
| Lint | `bunx ng lint` | ✅ **All files pass linting** |
| Build | `bunx ng build` | ✅ clean — lazy `previa-page` chunk emitted; **25 static routes prerendered** |
| Prerender | `bun run verify:prerender` | ✅ **PASS** — 21 routes verified, no localhost, no `plataforma` leak; `previa` absent from `STATIC_PATHS` by design |
| Spec scenarios | verifier matrix | ⚠️ **35/36 COMPLIANT + 1 PARTIAL** (0 UNTESTED, 0 FAILING) |
| Strict TDD | 6 checks | ⚠️ 4/6 fully green (2 documentation WARNINGs) |
| Contract safety | `git diff contracts/openapi.yaml` / conformance grep | ✅ untouched / absent |

**Build-artifact inspection** (`dist/Construction-Company-Agency/browser/`): `previa/index.html` 29,292 B (9 feed posts, 5 jobs, 1 worker, 1 company; `robots=noindex,nofollow`); `previa/worker/index.html` 27,397 B; `previa/company/index.html` 27,047 B; `previa/admin/index.html` 26,635 B (6 directory rows, **no `demo1234`**). `dist/browser/plataforma/` **absent** (platform never prerenders).

## Commits (branch `feature/p13-modo-previa` only — NOT on `main`)

| Commit | Work unit |
|---|---|
| `75c0132` | WU1 `feat(platform): add static prerenderable /previa preview (p13-modo-previa)` |
| `512d366` | docs `docs(openspec): add p13-modo-previa planning artifacts (explore..tasks)` |
| `5c639a3` | WU2 `feat(platform): add prerendered /previa/:role pages and client-only role switcher (p13-modo-previa)` |
| *(orchestrator)* | `docs(openspec): archive p13-modo-previa with spec sync (p13-modo-previa)` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-14-p13-modo-previa/` |

Conventional format, English, no AI attribution. `angular.json` (incidental `M`) deliberately **not** committed.

## Archive contents

- `explore.md` ✅
- `proposal.md` ✅
- `specs/` ✅ (4 deltas: `platform-preview`, `platform-shell`, `server-rendering`, `platform-identity`)
- `design.md` ✅
- `tasks.md` ✅ (18/18 complete)
- `verify-report.md` ✅ (PASS WITH WARNINGS)
- `archive-report.md` ✅ (this file)

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p13-modo-previa/explore` (#977) |
| Proposal | `proposal.md` | `sdd/p13-modo-previa/proposal` (#979) |
| Spec (deltas) | `specs/{platform-preview,platform-shell,server-rendering,platform-identity}/spec.md` | `sdd/p13-modo-previa/spec` (#980) |
| Design | `design.md` | `sdd/p13-modo-previa/design` (#981) |
| Tasks | `tasks.md` | `sdd/p13-modo-previa/tasks` (#982) |
| Apply progress | *(engram only — WU2 + W1 fix; no WU1 observation)* | `sdd/p13-modo-previa/apply-progress` (#983) |
| Verify report | `verify-report.md` | `sdd/p13-modo-previa/verify-report` (#986) |
| Archive report | `archive-report.md` | `sdd/p13-modo-previa/archive-report` (this save) |

## Open follow-ups (carried from verify — non-blocking)

| ID | Item | Disposition |
|---|---|---|
| **W1** | **No automated assertion that the built `/previa*.html` is non-empty.** The `platform-preview` scenario *"Prerendered HTML is non-empty"* is covered only at component level (`previa.page.spec.ts:55-75`); no spec reads `dist/.../browser/previa/*.html`, and `scripts/verify-prerender.ts` `STATIC_PATHS` is **pinned unchanged by design** (NOINDEX emits no JSON-LD). Non-emptiness was confirmed **manually** during verify. | **Open follow-up.** Minimal fix: a `node:fs` spec that post-build `readFileSync`s `dist/.../previa/index.html`, asserting a known fixture string + a `noindex` robots meta — **without** joining `STATIC_PATHS`. Also closes the design's last Open Question (`design.md:135-136`). |
| **W2** | **TDD evidence not consolidated.** `apply-progress` (#983) covers WU2 (+ the W1 fix) but carries no RED/GREEN/TRIANGULATE/SAFETY-NET/REFACTOR table; no separate WU1 apply-progress exists. RED traces live distributed in `tasks.md` (WU1/WU2 RED-first lists, all `[x]`) and in-file RED headers. | **Open follow-up.** Minimal fix: upsert `sdd/p13-modo-previa/apply-progress` with one consolidated TDD table spanning WU1+WU2. |
| **S1** | `roleLabel` duplicated verbatim in `previa.page.ts:44-45` and `preview-role-switcher.component.ts:46-47`. | SUGGESTION — extract into the pure `preview-fixtures.ts` module. |
| **S2** | `tasks.md` status lines stale (`:22` WU1 `pending`, `:45` WU2 `implemented (awaiting verify)`) though all checkboxes are `[x]`. | SUGGESTION — process/cosmetic; no functional impact. |
| **S3** | Actual `src`/`scripts` change is 830 lines (WU1 +548, WU2 +278) against a `High` workload forecast. | SUGGESTION — consistent with the declared risk; no PR gate applies (branch-local commits). |
| **S4** | Optional post-build assertion (same as W1). | SUGGESTION — see W1. |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-preview` created; the 3 MODIFIED merged
- [x] No leftover delta scaffolding in canonical specs (grep-verified)
- [x] Change folder moved to `openspec/changes/archive/2026-10-14-p13-modo-previa/` with all artifacts
- [x] Change dir was partially untracked → used a filesystem `mv` (not `git mv`); orchestrator will stage it
- [x] Active `openspec/changes/` no longer contains `p13-modo-previa/` (only `archive/`)
- [x] Engram archive report saved as `sdd/p13-modo-previa/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] **NOT merged to `main`** — isolated branch `feature/p13-modo-previa` (`5c639a3`); awaiting a merge decision

## Next steps

`p13-modo-previa` closes HANDOFF §10 Paso 8 (modo previa estática) and makes the p10/p12 extra demo accounts publicly reachable. The only outstanding items are the two WARNING-level follow-ups above (post-build `/previa` non-empty assertion; consolidated TDD evidence) and the cosmetic SUGGESTIONs — none block archive. **Merge decision pending:** the change is isolated on `feature/p13-modo-previa` and is **NOT merged to `main`**; a human must decide when/how to integrate it.
