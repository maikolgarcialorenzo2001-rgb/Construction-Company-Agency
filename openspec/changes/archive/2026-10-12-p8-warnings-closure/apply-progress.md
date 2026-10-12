# Apply Progress: p8-warnings-closure

> Mode: hybrid · Strict TDD ACTIVE (`bunx ng test --watch=false`) · Delivery: ask-on-risk (Low risk, no decision needed) · Chain: stacked-to-main (sequential commits directly on `main`).
> All 16 tasks complete · 3 work-unit commits · Baseline 518 tests → 521 tests, all green.

## Work-Unit Commits

| WU | Commit | Message | Files | Tests |
|----|--------|---------|-------|-------|
| WU1 | `8a575d3` | `fix(header): bind promo CTA to ctaPath (p8-warnings-closure)` | `src/app/components/layout/header.component.html` (+1), `src/app/components/layout/header.component.spec.ts` (+1) | 518 → 518 green (assertion added inside existing test) |
| WU2 | `86f535c` | `test(a11y): scan platform routes with seeded session (p8-warnings-closure)` | `src/app/app.a11y.spec.ts` (+27) | 518 → 519 green (1 new test) |
| WU3 | `a38697c` | `test(platform): cover real SessionService.login (p8-warnings-closure)` | `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` (+12) | 519 → 521 green (2 new tests) |

All three commits stacked on `main` (no branches/PRs/pushes). `angular.json` left uncommitted (incidental CLI `analytics: false` + array reformat; per constraints). `HANDOFF.md`/`fg.json` left untracked per constraints.

## Task Status

- [x] 1.1 CTA `routerLink` literal → `[routerLink]="site.promo.ctaPath"` (header.component.html:51). Rendered href byte-identical (`ctaPath === '/plataforma/registro'`).
- [x] 1.2 Mutation guard: temporarily set `site.ts` `ctaPath` to `/otra-ruta-mutation-guard` → spec L117 FAILED (`expected '/otra-ruta-mutation-guard' to be '/plataforma/registro'`) → reverted. Proves the spec guards the binding.
- [x] 1.3 Non-empty plans guard: `expect(site.promo.plans.length).toBeGreaterThan(0);` before the `forEach` in `lists every promo plan in the strip` (kills the ghost-loop risk).
- [x] 1.4 Header suite green (full suite gate).
- [x] 2.1 `SESSION_STORAGE_KEY` imported from `./core/platform/auth/session.service`.
- [x] 2.2 `/plataforma`, `/plataforma/login`, `/plataforma/registro` appended to `TARGET_PATHS` (13 routes total).
- [x] 2.3 Demo company session seeded in `beforeEach` BEFORE `TestBed.createComponent(App)` (SessionService reads storage at construction).
- [x] 2.4 `localStorage.removeItem(SESSION_STORAGE_KEY)` in `afterEach`.
- [x] 2.5 "Every enabled rule ran" assertion intact; all 10 `AXE_RULES` entries kept.
- [x] 2.6 a11y suite green; verified `/plataforma` scans the authenticated feed (see deviation note: dedicated assertion test proving not-a-redirect).
- [x] 3.1 Added `renders the company nav after a real SessionService.login`.
- [x] 3.2 `await TestBed.inject(SessionService).login('norte@demo.test', 'demo1234')` → `create()` (no role input) → `['Novedades', 'Vacantes', 'Mi empresa']`.
- [x] 3.3 Default `AUTH_GATEWAY` factory → `MockAuthGateway` (in-memory); NO HttpClient providers added (tests pass without them).
- [x] 3.4 platform-header suite green.
- [x] 4.1 Full suite green (521); `contracts/openapi.yaml` untouched (git diff clean).
- [x] 4.2 `bunx ng lint` clean; `bunx ng build` (strict TS + strictTemplates + AOT) clean.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 (template binding) | `header.component.spec.ts` | Unit (approval) | ✅ 518/518 | ✅ Mutation guard: flipped `ctaPath` → L117 failed | ✅ Binding in place → spec passes (`/plataforma/registro`) | ➖ Behavior-pinned by existing approval test (single output) | ✅ Template simplified to single source of truth |
| 1.3 (plans guard) | `header.component.spec.ts` | Unit | ✅ 518/518 | ➖ Test-strengthening (guard added to existing test; no new behavior to fail) | ✅ 518/518 green | ➖ Single assertion, purely defensive | ➖ None needed |
| 2.1–2.6 (a11y routes + seed) | `app.a11y.spec.ts` | Integration | ✅ 518/518 | ✅ New assertion test: without seed, `/plataforma` redirected → `expected 'Ingresar' to be 'Novedades'` FAILED | ✅ Seed added → 519/519 green; all 13 routes axe-clean | ✅ 3 platform routes + 10 marketing routes scanned (13 cases) | ✅ Seed/cleanup scoped to `beforeEach`/`afterEach` |
| 3.1–3.3 (real login) | `platform-header.component.spec.ts` | Integration | ✅ 519/519 | ➖ Coverage of existing behavior (no prod code change); test written first, real `login()` path previously untested | ✅ 521/521 green | ✅ Company + worker credentials → different navs (mutation: worker expected-as-company FAILED) | ➖ None needed (seed helpers untouched) |

Mutation proofs executed (both reverted): `site.ts` `ctaPath` flip (WU1) and worker-nav-as-company flip (WU3).

### Test Summary
- **Total tests written**: 3 new (`app.a11y.spec.ts` +1, `platform-header.component.spec.ts` +2) + 1 assertion added to an existing header test
- **Total tests passing**: 521/521 (baseline 518)
- **Layers used**: Integration (2), Unit (1 assertion; approval)
- **Approval tests** (refactoring): 1 (existing L117 href assertion, preserved green before/after template refactor)
- **Pure functions created**: 0 (no production logic change)

## Deviations from Tasks

1. **WU2 — extra assertion test** (`scans the authenticated feed on /plataforma, not a login redirect` in `app.a11y.spec.ts`): tasks 2.1–2.5 enumerate the config edits only. A dedicated assertion was added to implement task 2.6's verification ("`/plataforma` scans the authenticated feed (not a login redirect)") and to give the seed a Strict-TDD RED phase. Without it, the scan would silently audit the login page twice (both pass axe), a false GREEN.
2. **WU3 — triangulation case** (`renders the worker nav after a real SessionService.login`): tasks specify the company case (3.2). A worker-credential case was added because Strict TDD mandates triangulation for multi-output behavior (role→nav mapping); it forces real role resolution and is the same task, same file.
3. No other deviations. No production-logic changes beyond the behavior-preserving template binding.

## Issues / Risks

- No real axe violations surfaced on any platform route (explore's LOW-risk rating held). Reports in this artifact only.
- `console.info` a11y summary not visible in vitest output (reporter suppresses pass-mode console); the `expect(issues).toEqual([])` + rule-evaluated assertions are the executable gate.
- Seeded session is intentionally global for the suite: `/plataforma/login` and `/plataforma/registro` are open routes and render identically with a session (documented in proposal). Cleaned in `afterEach`.

## Rollback

`git revert <sha>` per work unit (additive test/config + behavior-preserving binding; zero blast radius). Order-independent — each commit is self-contained.

## Artifact Locations

- OpenSpec: `openspec/changes/p8-warnings-closure/apply-progress.md`
- Engram: `sdd/p8-warnings-closure/apply-progress` (`type: architecture`, `capture_prompt: false`, project `construction-company-agency`)
- Tasks marked complete: `openspec/changes/p8-warnings-closure/tasks.md` (16/16 `[x]`)