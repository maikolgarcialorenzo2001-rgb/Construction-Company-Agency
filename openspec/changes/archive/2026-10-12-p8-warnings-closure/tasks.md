# Tasks: p8-warnings-closure

> Mode: hybrid · Quality-only closure of p6/p7 warnings. No capability change → no spec/design.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~30–40 (2 prod template + ~28 test/config) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | 3 sequential local work-unit commits on `main` (no branches) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Files | Commit |
|------|------|-------|--------|
| WU1 | Header CTA de-drift + plan guard | `header.component.html`, `header.component.spec.ts` | `fix(header): bind promo CTA to ctaPath (p8-warnings-closure)` |
| WU2 | Platform routes axe-scanned w/ session | `app.a11y.spec.ts` | `test(a11y): scan platform routes with seeded session (p8-warnings-closure)` |
| WU3 | Real `login()` coverage | `platform-header.component.spec.ts` | `test(platform): cover real SessionService.login (p8-warnings-closure)` |

## Phase 1 — Header CTA de-drift (WU1)

- [x] 1.1 `src/app/components/layout/header.component.html` L51: `routerLink="/plataforma/registro"` → `[routerLink]="site.promo.ctaPath"`. DOM href is byte-identical (`ctaPath === '/plataforma/registro'`).
- [x] 1.2 (TDD/mutation guard) Confirm binding is real: temporarily point `content/site.ts` `ctaPath` at another path → existing spec L117 (`toBe('/plataforma/registro')`) fails; revert. Proves the test guards the binding.
- [x] 1.3 (T3/S2) `header.component.spec.ts`: in `lists every promo plan in the strip` (L121–130) add `expect(site.promo.plans.length).toBeGreaterThan(0);` before the `forEach` loop.
- [x] 1.4 Verify: `bunx ng test --watch=false` → header suite green.

## Phase 2 — A11y platform coverage (WU2)

- [x] 2.1 `src/app/app.a11y.spec.ts`: import `SESSION_STORAGE_KEY` from `./core/platform/auth/session.service`.
- [x] 2.2 Append `/plataforma`, `/plataforma/login`, `/plataforma/registro` to `TARGET_PATHS` (L18–29).
- [x] 2.3 In `beforeEach` (L72), BEFORE `TestBed.createComponent(App)` (L79): `localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'mock-token', user: { userId: 'company-1', email: 'norte@demo.test', role: 'company' } }))`. Seed is read at `SessionService` construction (L66).
- [x] 2.4 In `afterEach` (L88): `localStorage.removeItem(SESSION_STORAGE_KEY)` to stop cross-test bleed.
- [x] 2.5 Keep the "every enabled rule ran" assertion (L126–128) intact; do NOT drop any `AXE_RULES` entry.
- [x] 2.6 Verify: `bunx ng test --watch=false` → a11y suite green; `/plataforma` scans the authenticated feed (not a login redirect). A new real violation → fix page (out of current scope → stop and report).

## Phase 3 — Real login coverage (WU3)

- [x] 3.1 `platform-header.component.spec.ts`: add test `renders the company nav after a real SessionService.login`.
- [x] 3.2 Body: `await TestBed.inject(SessionService).login('norte@demo.test', 'demo1234');` then `create()` (no role input) → `expect(navLabels(fixture)).toEqual(['Novedades', 'Vacantes', 'Mi empresa'])`.
- [x] 3.3 Default `AUTH_GATEWAY` → `MockAuthGateway` (in-memory); NO HttpClient providers. `beforeEach`/`afterEach` already clear `SESSION_STORAGE_KEY`.
- [x] 3.4 Verify: `bunx ng test --watch=false` → platform-header suite green.

## Phase 4 — Final gate

- [x] 4.1 `bunx ng test --watch=false` → all green; `contracts/openapi.yaml` untouched.
- [x] 4.2 `bunx ng lint` / `tsc` strict → clean.

## Rollback

`git revert <sha>` per work unit (or `git reset` before push). Additive test/config + a behavior-preserving template binding ⇒ zero blast radius, no migration, rendered DOM unchanged.

## Artifact Locations

- Engram: `sdd/p8-warnings-closure/tasks` (`type: architecture`, `capture_prompt: false`, project `construction-company-agency`).
- OpenSpec: `openspec/changes/p8-warnings-closure/tasks.md`.
