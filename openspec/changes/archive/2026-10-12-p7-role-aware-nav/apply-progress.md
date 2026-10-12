# Apply Progress: p7-role-aware-nav

## Status

Complete — WU1 and WU2 implemented and committed; WU3 (full gate) PASSED with no commit.

- **Mode**: Strict TDD (config `strict_tdd: true`, runner `bunx ng test --watch=false`)
- **Delivery**: `ask-on-risk` resolved to single change (≈185 lines, under the 400 budget) → no chained split, no `size:exception`
- **Chain**: `stacked-to-main` — sequential local work-unit commits on `main`; no branches, no PRs, no pushes
- **Artifact store**: hybrid (this file + Engram `sdd/p7-role-aware-nav/apply-progress`)

## Completed Tasks

- [x] 1.1 RED `nav.spec.ts`: `platformNavFor(null)` ⇒ `[]`; `worker` labels `['Novedades','Trabajos','Mi perfil']`
- [x] 1.2 RED `nav.spec.ts`: `company` ⇒ `['Novedades','Vacantes','Mi empresa']`; `admin` `toBe` `worker` (same array ref)
- [x] 1.3 RED `nav.spec.ts`: slugs `['feed','trabajos','perfil']` and paths invariant across roles
- [x] 1.4 GREEN `nav.ts`: type-only `Role` + `NavItem`; `WORKER_NAV`/`COMPANY_NAV`; `PLATFORM_NAV_BY_ROLE` (admin → `WORKER_NAV`); `platformNavFor`; kept `platformNav` alias
- [x] 1.5 WU1 verified green + committed (`nav.ts` + `nav.spec.ts`)
- [x] 2.1 RED header spec: default ⇒ no `<nav>` + pill; worker/admin/company label sets
- [x] 2.2 RED header spec: stable hrefs; exactly one `a[href="/plataforma"]`; no marketing promo strip
- [x] 2.3 RED header spec: seeded company session; `session.logout()` ⇒ `<nav>` removed; post-render `setInput('role','worker')`
- [x] 2.4 GREEN `platform-header.component.ts`: `inject(SessionService)`, `role` input, `effectiveRole`/`nav` computed, gated `<nav>`, pill unconditional
- [x] 2.5 GREEN `nav.ts`: removed temporary `platformNav` alias
- [x] 2.6 WU2 verified green + committed (three files)
- [x] 3.1 Full gate: test + lint + build + `bun run gate`
- [x] 3.2 Regression: `app.a11y.spec.ts` green; `git diff contracts/` empty
- [x] 3.3 `git status` clean of stray files; `nav.ts` no longer exports `platformNav`

## Commits

| Work unit | Commit | Message |
|-----------|--------|---------|
| WU1 | `30c24e4` | `feat(platform): add pure role-aware platformNavFor mapping (p7-role-aware-nav)` |
| WU2 | `0cbb52e` | `feat(platform): make the platform header nav role-aware (p7-role-aware-nav)` |
| WU3 | — (no commit) | full gate only |

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/app/core/platform/nav.ts` | Modified | `WORKER_NAV`/`COMPANY_NAV` tables, exhaustive `PLATFORM_NAV_BY_ROLE` (`admin` → `WORKER_NAV` same ref), pure `platformNavFor(role: Role \| null)`; removed old flat `platformNav` in WU2 |
| `src/app/core/platform/nav.spec.ts` | Created | 6 pure (no TestBed) mapping tests |
| `src/app/pages/plataforma/platform-header/platform-header.component.ts` | Modified | Injected `SessionService`; added `role` input + `effectiveRole`/`nav` computed; gated `<nav>` on `nav().length`; pill unconditional |
| `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` | Created | 11 TestBed + `provideRouter([])` tests (roles, hrefs, session seed/logout, post-render input, pill) |

## RED → GREEN Evidence

| Step | Command | Result |
|------|---------|--------|
| Baseline (safety net) | `bunx ng test --watch=false` | 56 files / 501 tests passed |
| WU1 RED | `bunx ng test --watch=false --include src/app/core/platform/nav.spec.ts` | Build ERROR `TS2305: no exported member 'platformNavFor'` + `TS7006` — 0 passed |
| WU1 GREEN | same | 6 passed |
| WU1 verify | `bunx ng test --watch=false` | 57 files / 507 tests passed |
| WU2 RED | `bunx ng test --watch=false --include src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` | 11 failed / 0 passed (`setInput('role')` unknown + nav always rendered) |
| WU2 GREEN | same | 11 passed |
| WU2 verify | `bunx ng test --watch=false` | 58 files / 518 tests passed |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `nav.spec.ts` | Unit (pure) | ✅ 501/501 (full suite) | ✅ Written | ✅ Passed | ✅ null + worker | ➖ None needed |
| 1.2 | `nav.spec.ts` | Unit (pure) | ✅ 501/501 | ✅ Written | ✅ Passed | ✅ company + admin `toBe` worker | ➖ None needed |
| 1.3 | `nav.spec.ts` | Unit (pure) | ✅ 501/501 | ✅ Written | ✅ Passed | ✅ slugs + paths across 3 roles | ➖ None needed |
| 1.4 | `nav.ts` | Unit (pure) | ✅ 501/501 | ✅ Written | ✅ Passed | ➖ (table definition) | ✅ Extracted shared tables; deprecated alias |
| 2.1 | `platform-header.component.spec.ts` | Integration | N/A (new file) | ✅ Written | ✅ Passed | ✅ anonymous + worker + admin + company | ➖ None needed |
| 2.2 | `platform-header.component.spec.ts` | Integration | N/A (new file) | ✅ Written | ✅ Passed | ✅ 2 roles hrefs + single entry link + no promo | ➖ None needed |
| 2.3 | `platform-header.component.spec.ts` | Integration | N/A (new file) | ✅ Written | ✅ Passed | ✅ seeded session + logout + post-render setInput | ➖ None needed |
| 2.4 | `platform-header.component.ts` | Integration | N/A (new file) | ✅ Written | ✅ Passed | ✅ pill in 4 states | ✅ Computed seam mirrors `feed.page.ts` |
| 2.5 | `nav.ts` (alias removal) | Integration | ✅ 507/507 | ✅ Written (WU2 spec exercises new path) | ✅ Passed | ➖ (deletion) | ➖ None needed |

## Test Summary

- **Total tests written**: 17 (nav: 6; header: 11)
- **Total tests passing (full suite)**: 518 (baseline 501 → +17)
- **Test files**: 58 passed (baseline 56 → +2)
- **Layers used**: Unit (1 pure file) + Integration (1 TestBed file)
- **Approval tests** (refactoring): None — no refactoring-only tasks
- **Pure functions created**: 1 (`platformNavFor`)

## Full Gate Results

| Command | Result |
|---------|--------|
| `bunx ng test --watch=false` | PASS — 58 files / 518 tests |
| `bunx ng lint` | PASS — All files pass linting |
| `bunx ng build` | PASS — prerendered 21 static routes |
| `bun run gate` | PASS — contract:lint + contract:check + lint + test + build + verify:prerender |
| `git diff contracts/` | EMPTY (READ-ONLY respected) |

`bun run gate` final line: `PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak`

## Deviations from Design

- None material. `admin` reuses `WORKER_NAV` by exact reference (asserted with `toBe`), matching design §Interfaces.
- The temporary `platformNav` alias got a `@deprecated` doc tag in WU1 for reviewer clarity; removed in WU2 as planned (tasks 1.4/2.5).

## Issues Found

- None. `angular.json` carries a pre-existing unrelated working-tree modification; left uncommitted. `HANDOFF.md` and `fg.json` remain untracked and untouched. The `openspec/changes/p7-role-aware-nav/` dir stays untracked for archive.

## Workload / PR Boundary

- **Mode**: single change, `stacked-to-main` (sequential local commits on `main`)
- Estimated ≈185 lines; actual diff under the 400 budget → no chained split, no `size:exception`
- Current work unit: WU1 + WU2 committed; WU3 made no commit

## Remaining Tasks

- None — ready for verify. `tasks.md` carries `[x]` marks; change dir remains untracked for archive.
