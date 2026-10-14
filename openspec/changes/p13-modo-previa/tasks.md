# Tasks: p13-modo-previa — Public static `/previa` preview + demo-role switcher

## metadata
- change_id: p13-modo-previa
- status: pending
- delivery_strategy: ask-on-risk
- chain_strategy: stacked-to-main
- approach: Camino A, 2 stacked work units (WU2 depends on WU1)
- branch: `feature/p13-modo-previa`, commit suffix `(p13-modo-previa)`; no `main` changes

## Pinned test expectations (must satisfy)
- `src/app/app.routes.spec.ts` — top-level table `[...marketing, 'plataforma', 'previa', '**']`; noindex partition exactly `['plataforma', 'previa', '**']`; marketing filter excludes `previa`.
- `src/app/app.routes.server.spec.ts` — `expectedCount += PREVIEW_ROLES.length`; `previa/:role` is Prerender + `PrerenderFallback.Client` + params === `PREVIEW_ROLES`.
- `src/app/app.release-matrix.spec.ts` — add `/previa` row (`images 0`, `priority 0`, `cta false`); chrome lock: `app-header` present, `app-platform-header` absent.
- `src/app/app.a11y.spec.ts` — add `/previa` (WU1) and `/previa/worker` (WU2) to `TARGET_PATHS`.
- `scripts/verify-prerender.ts` — **unchanged**, `STATIC_PATHS` keeps `previa` out (NOINDEX emits no JSON-LD).

## Work Units

### WU1 — static `/previa` + synchronous selector/VM + route/spec edits
**Goal:** A prerenderable, anonymous top-level `/previa` rendered synchronously from fixtures (all role branches in the VM; default page only). Invariant stays green; no shared-helper change.
**Base:** `main` | **Independently revertible:** Yes | **Lines forecast:** ~330–420 | **Status:** pending

Tasks (Strict TDD — RED first where a test is new/edited):
- [x] RED: create `src/app/core/platform/preview/preview-fixtures.spec.ts` — role order; resolver known/unknown/empty; `previewViewModelFor(null)` = feed + open jobs + first worker + first company; determinism (two calls deep-equal); directory rows carry no `password`.
- [x] GREEN: create `src/app/core/platform/preview/preview-fixtures.ts` (pure, no Angular imports): `PREVIEW_ROLES`, `PreviewRole`, `resolvePreviewRole`, `previewRoleParams`, `PreviewViewModel`, `previewViewModelFor`, `DirectoryRow` (maps `DEMO_ACCOUNTS` dropping `password`).
- [x] RED: create `src/app/pages/previa/previa.page.spec.ts` — one `<h1>`; default section non-empty **synchronously** (no `whenStable`); `role` input per value renders its section; `admin` never renders `demo1234`; unknown role → default, no throw; two renders identical.
- [x] GREEN: create `src/app/pages/previa/previa.page.ts` (`app-previa`, `.html`) — `input('role')` → `resolvePreviewRole` (computed) → `previewViewModelFor`; reuse `SectionHeadingComponent` + `CtaBlockComponent`; default + role sections; es-AR copy as data.
- [x] Modify `src/app/app.routes.ts` — add top-level `previa` grouping (`NOINDEX`) with `{ path: '' }` child, lazy `PreviaPage`; keeps table `[...marketing, 'plataforma', 'previa', '**']`.
- [x] Modify `src/app/app.routes.spec.ts` — `ROUTE_TABLE` gains `previa`; noindex partition `['plataforma', 'previa', '**']`; marketing filter excludes `previa`; `previa` + `''` child unguarded/lazy/noindex; nav `/previa` → `app-previa`.
- [x] Modify `src/app/app.release-matrix.spec.ts` — add `/previa` row (images 0, cta false) + chrome-lock assertion (`app-header`, not `app-platform-header`).
- [x] Modify `src/app/app.a11y.spec.ts` — add `/previa` to `TARGET_PATHS` (+ pin the showcase, not the 404).
- [x] Verify WU1 (runnable): focused specs → `bunx ng test --watch=false` (full), `bunx ng lint`, `bunx ng build`.

Files — **NEW**: `preview-fixtures.ts`, `preview-fixtures.spec.ts`, `previa.page.ts`, `previa.page.spec.ts`, `previa.page.html`. **MODIFIED**: `app.routes.ts`, `app.routes.spec.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts`.

Rollback boundary: remove `preview/*` + `pages/previa/*`, restore `app.routes.ts` and the 3 specs.

> **WU1 deviation (applied):** the pinned release-matrix row and design.md both fix `/previa` as `cta false`, so the page does NOT render `app-cta-block` — the "reuse `CtaBlockComponent`" wording above is stale. `SectionHeadingComponent` is reused. No other deviation.

---

### WU2 — `/previa/:role` child + server param + client-only role switcher
**Goal:** Per-role prerendered HTML (JS-off safe) via a `:role` child + explicit `previa/:role` server entry, plus a client-only switcher over the 6 demo accounts. Reverts to WU1's static no-switcher preview.
**Base:** WU1 | **Independently revertible:** Yes | **Lines forecast:** ~300–400 | **Status:** pending

Tasks:
- [ ] RED: create `src/app/pages/previa/preview-role-switcher.component.spec.ts` — 6 accounts, no password rendered; click → `SessionService.login(email, 'demo1234')` + navigate `/plataforma/inicio`; no `register`; anchors to `/previa/{worker,company,admin}`; render performs no write.
- [ ] GREEN: create `src/app/pages/previa/preview-role-switcher.component.ts` (`app-preview-role-switcher`, `.html`) — client-only demo-login controls over `DEMO_ACCOUNTS` + plain anchors; `login` + `Router.navigate`; inert during prerender.
- [ ] Modify `src/app/app.routes.ts` — add `{ path: ':role' }` child (`NOINDEX`, lazy `PreviaPage`) to the `previa` grouping.
- [ ] Modify `src/app/app.routes.spec.ts` — nav `/previa/worker` → `app-previa`; `:role` child lazy/noindex/unguarded.
- [ ] RED: modify `src/app/app.routes.server.spec.ts` — `expectedCount = STATIC_BROWSER_PATHS.length + PREVIEW_ROLES.length + services.length + projects.length`; focused `previa/:role` test (Prerender + Client fallback + params === `PREVIEW_ROLES`).
- [ ] GREEN: modify `src/app/app.routes.server.ts` — explicit `{ path: 'previa/:role', renderMode: Prerender, fallback: PrerenderFallback.Client, getPrerenderParams: () => Promise.resolve(previewRoleParams()) }`.
- [ ] Modify `src/app/pages/previa/previa.page.spec.ts` — switcher present + labelled controls; `:role` variant renders its section.
- [ ] Modify `src/app/app.a11y.spec.ts` — add `/previa/worker` to `TARGET_PATHS`.
- [ ] Verify WU2 (runnable): focused specs → `bunx ng test --watch=false` (full), `bunx ng lint`, `bunx ng build` + `bun run verify:prerender`.

Files — **NEW**: `preview-role-switcher.component.ts`, `preview-role-switcher.component.spec.ts`, `preview-role-switcher.component.html`. **MODIFIED**: `app.routes.ts`, `app.routes.spec.ts`, `app.routes.server.ts`, `app.routes.server.spec.ts`, `previa.page.*`, `app.a11y.spec.ts`. **UNCHANGED**: `scripts/verify-prerender.ts`.

Rollback boundary: revert switcher + `:role` child + server entry; leaves WU1 static `/previa`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | WU1 ~330–420 · WU2 ~300–400 · total ~630–820 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | WU1 (PR 1) → WU2 (PR 2, stacked on WU1) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units
| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Static `/previa` + sync VM + route/spec edits | PR 1 | Base `main`; tests included; revertible, invariant green |
| 2 | `/previa/:role` + server param + switcher | PR 2 | Base = WU1; needs WU1 parent/page/selector/roles |

User pre-authorized the split (no `size:exception`). Each WU ≤ 400 targeted; keep the page template compact (reuse `SectionHeadingComponent`) to hold WU1 under the ceiling.

## artifacts
- file: openspec/changes/p13-modo-previa/tasks.md (disk)
- engram_topic_key: sdd/p13-modo-previa/tasks
- engram_type: architecture
- engram_project: construction-company-agency
- engram_capture_prompt: false

## next_recommended
- sdd-apply, starting WU1 (static `/previa` + sync VM + route/spec edits)
