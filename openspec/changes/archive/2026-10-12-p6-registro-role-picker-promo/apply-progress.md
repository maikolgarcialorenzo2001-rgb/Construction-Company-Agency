# Apply Progress: p6-registro-role-picker-promo

## Status

Complete — all work units (WU1–WU3) implemented and committed; full gate (WU4) PASSED.

- **Mode**: Strict TDD (config `strict_tdd: true`, runner `bunx ng test --watch=false`)
- **Delivery**: single change, sequential local work-unit commits on `main` (locked `stacked-to-main`); no branches, no PRs, no pushes
- **Artifact store**: hybrid (this file + Engram `sdd/p6-registro-role-picker-promo/apply-progress`)

## Completed Tasks

- [x] 1.1 RED picker `optionValues()` reads `input[type=radio]` under `[data-testid="registro-role"]`
- [x] 1.2 RED flow test uses `input[value="company"].click()` (no `HTMLSelectElement` cast)
- [x] 1.3 RED picker structure/copy tests (fieldset group + legend testid, worker default, title + description)
- [x] 1.4 GREEN radio-card picker in `registro.page.ts`
- [x] 1.5 Verify WU1 + commit
- [x] 2.1 RED `site.promo` shape/placeholder tests
- [x] 2.2 RED release-gate test expects `promo`
- [x] 2.3 GREEN `Promo` / `PromoPlan` types + `Site.promo`
- [x] 2.4 GREEN `site.promo` payload
- [x] 2.5 Verify WU2 + commit
- [x] 3.1 RED header promo strip tests
- [x] 3.2 GREEN promo strip template
- [x] 3.3 Verify WU3 + commit
- [x] 4.1 Full gate
- [x] 4.2 `git diff contracts/` empty
- [x] 4.3 `src/styles.css` left untouched (strip/card classes stayed compact)

## Commits

| Work unit | Commit | Message |
|-----------|--------|---------|
| WU1 | `dc15a7f` | `feat(platform): offer self-service roles as radio cards on registro (p6-registro-role-picker-promo)` |
| WU2 | `41b5943` | `feat(content): add a typed placeholder promo teaser to site (p6-registro-role-picker-promo)` |
| WU3 | `3a43a7c` | `feat(shell): render a static promo strip inside the header (p6-registro-role-picker-promo)` |

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/app/pages/plataforma/registro.page.ts` | Modified | `<select>` → `<fieldset data-testid="registro-role">` + `<legend>` + `@for` radio cards; `SelfServiceRoleValue = Extract<Role,'worker'\|'company'>`; `role = signal<SelfServiceRoleValue>('worker')`; `onRole(value)` sets signal directly |
| `src/app/pages/plataforma/registro.page.spec.ts` | Modified | Rewrote `optionValues` + flow test for radios; added group/legend/default/copy tests |
| `src/content/content.types.ts` | Modified | Added `PromoPlan` (`isPlaceholder: true`), `Promo`, and `Site.promo` |
| `src/content/site.ts` | Modified | Added `promo` payload (3 placeholder plans); `satisfies Site` |
| `src/content/site.spec.ts` | Modified | Added promo shape/placeholder tests |
| `src/content/content.spec.ts` | Modified | Release-gate test now expects `promo` |
| `src/app/components/layout/header.component.html` | Modified | Second row inside `<header>`: `data-testid="header-promo"` + tagline + `header-promo-plans` list + `header-promo-cta` |
| `src/app/components/layout/header.component.spec.ts` | Modified | Added 3 promo strip tests |

## RED → GREEN Evidence

| Step | Command | Result |
|------|---------|--------|
| Baseline (safety net) | `bunx ng test --watch=false` | 56 files / 493 tests passed |
| WU1 RED | `bunx ng test --watch=false --include src/app/pages/plataforma/registro.page.spec.ts` | 4 failed / 2 passed |
| WU1 GREEN | same | 6 passed |
| WU2 RED | `bunx ng test --watch=false --include src/content/site.spec.ts --include src/content/content.spec.ts` | Build ERROR `TS2339: Property 'promo' does not exist on ...` |
| WU2 GREEN | same | 2 files / 54 passed |
| WU3 RED | `bunx ng test --watch=false --include src/app/components/layout/header.component.spec.ts` | 3 failed / 7 passed |
| WU3 GREEN | same | 10 passed |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `registro.page.spec.ts` | Unit | ✅ 3/3 | ✅ Written | ✅ Passed | ✅ worker+company+never-admin | ➖ None needed |
| 1.2 | `registro.page.spec.ts` | Unit | ✅ 3/3 | ✅ Written | ✅ Passed | ✅ company path + register/navigate | ➖ None needed |
| 1.3 | `registro.page.spec.ts` | Unit | ✅ 3/3 | ✅ Written | ✅ Passed | ✅ group + default + per-role copy | ➖ None needed |
| 2.1 | `site.spec.ts` | Unit | ✅ 14/14 | ✅ Written | ✅ Passed | ✅ copy/CTA + 2–3 plans | ➖ None needed |
| 2.2 | `content.spec.ts` | Unit | ✅ 37/37 | ✅ Written | ✅ Passed | ➖ Single (extends existing gate) | ➖ None needed |
| 3.1 | `header.component.spec.ts` | Integration | ✅ 7/7 | ✅ Written | ✅ Passed | ✅ strip + plans rows + static/image-free | ➖ None needed |

## Test Summary

- **Total tests written/rewritten**: 8 new/rewritten tests (registro: 3 rewritten + 3 new; site: 2 new; header: 3 new) + 1 strengthened assertion in `content.spec.ts`
- **Total tests passing (full suite)**: 501 (baseline 493 → +8)
- **Test files**: 56 passed
- **Layers used**: Unit (2 files) + Integration (1 file), plus axe a11y scan unchanged
- **Approval tests**: N/A — no refactoring-only tasks
- **Pure functions created**: 0 (signal setter + content data)

## Full Gate Results

| Command | Result |
|---------|--------|
| `bunx ng test --watch=false` | PASS — 56 files / 501 tests |
| `bunx ng lint` | PASS — All files pass linting |
| `bunx ng build` | PASS — prerendered 21 static routes |
| `bun run gate` | PASS — contract:lint + contract:check + lint + test + build + verify:prerender |
| `git diff contracts/` | EMPTY (no changes; `Role` enum untouched) |

`bun run gate` final line: `PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak`

## Deviations from Design

- None material. The header CTA uses the literal `routerLink="/plataforma/registro"` per task 3.2, so `site.promo.ctaPath` is defined and asserted in `site.spec.ts` but not yet consumed by the template. This matches the assigned task (`header.component.ts` unchanged) and the design's template snippet.
- `src/styles.css` left untouched per tasks 4.3 (classes stayed compact; no new `@utility` needed).

## Issues Found

- None. `angular.json` carried a pre-existing working-tree modification (analytics/formatting) unrelated to this change; left uncommitted. `HANDOFF.md` and `fg.json` remain untracked and untouched.

## Workload / PR Boundary

- **Mode**: single change, `stacked-to-main` (sequential local commits on `main`)
- Estimated 180–220 lines; actual diff was well under the 400 budget → no chained split, no `size:exception`
- Current work unit: all three WU1–WU3 committed; WU4 made no commit

## Remaining Tasks

- None — ready for verify. `tasks.md` carries `[x]` marks; change dir remains untracked for archive.
