# Proposal: p8-warnings-closure

> Change: `p8-warnings-closure` · Repo: `construction-company-agency` · Phase: propose · Date: 2026-10-12
> Grounded in `openspec/changes/p8-warnings-closure/explore.md`. `contracts/openapi.yaml` is READ-ONLY.

## Intent (WHAT/WHY)

Close the warnings carried from `p6-registro-role-picker-promo` (S1, W1, S2) and `p7-role-aware-nav` (W1, S1) as a **quality-only** change: one template de-drift plus test-config/coverage strengthening. **No capability, route, or runtime-behavior change** — the rendered DOM is byte-identical.

## Grounded Evidence

| Ref | Fact |
|-----|------|
| `header.component.html` L50–51 | Marketing CTA hardcodes `routerLink="/plataforma/registro"`; the model `site.promo.ctaPath` (`content/site.ts:72`) is declared but unused → drift. |
| `app.a11y.spec.ts` L18–29 | `TARGET_PATHS` lists marketing routes only; all `/plataforma/**` are unscanned. |
| `app.routes.ts` | `/plataforma` is behind `authGuard`; `/plataforma/login` and `/plataforma/registro` are open. |
| `session.service.ts` L16, L66 | Reads `SESSION_STORAGE_KEY` at construction; seeding before component creation is equivalent to a live session. |
| `header.component.spec.ts` L125–130 | Iterates `site.promo.plans` after a length check, but with no explicit non-empty guard. |
| `platform-header.component.spec.ts` L105–119 | Session reactivity proven via seeded storage + `role` input seam; `logout()` is real, `login()` is not. |
| `ports.ts` L110–112 | `AUTH_GATEWAY` default factory → `MockAuthGateway` (in-memory) ⇒ `login()` needs no HttpClient providers. |

## Scope

### In Scope
1. **p6-S1** — bind the header CTA to `site.promo.ctaPath` (removes drift; spec assertion unchanged).
2. **p6-W1 + p7-S1** — add `/plataforma`, `/plataforma/login`, `/plataforma/registro` to `TARGET_PATHS`; seed a demo session in `beforeEach`, clear storage in `afterEach`.
3. **p6-S2** — add an explicit non-empty guard before iterating plans.
4. **p7-W1** — add a `platform-header` test driving a REAL `SessionService.login(...)`.

### Out of Scope
- p7-W2 / p7-S2 (doc-only historical nits; no code). Production logic beyond the CTA binding. New routes/guards/features. `contracts/openapi.yaml`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None.

## Spec Delta Decision

**No spec delta; 0 capabilities MODIFIED.** This is test config, one template binding, and coverage only — no specified behavior changes. Mirrors `p5-warnings-closure` (archived "with no spec sync"). Recommend skipping `sdd-spec` and `sdd-design`.

## Approach

| # | Fix | File |
|---|-----|------|
| 1 | `routerLink="/plataforma/registro"` → `[routerLink]="site.promo.ctaPath"` | `header.component.html` |
| 2 | Add 3 platform paths to `TARGET_PATHS`; `localStorage.setItem(SESSION_STORAGE_KEY, …)` in `beforeEach`, `removeItem` in `afterEach` | `app.a11y.spec.ts` |
| 3 | `expect(site.promo.plans.length).toBeGreaterThan(0)` before the loop | `header.component.spec.ts` |
| 4 | New test: `await session.login('norte@demo.test','demo1234')` → assert company nav; `AUTH_GATEWAY` mock, no HttpClient | `platform-header.component.spec.ts` |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/components/layout/header.component.html` | Modified | CTA bound to `ctaPath` |
| `src/app/app.a11y.spec.ts` | Modified | +3 paths + session seed/clear |
| `src/app/components/layout/header.component.spec.ts` | Modified | Non-empty plan guard |
| `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` | Modified | Real-`login()` test |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Seeded session leaks across `TARGET_PATHS` scans | Low | Open routes (`/login`, `/registro`) render identically with a session; only `/plataforma` depends on auth — intended. |
| Storage not cleared → cross-test bleed | Low | `localStorage.removeItem(SESSION_STORAGE_KEY)` in `afterEach`. |
| New platform scans reveal a real axe violation | Low | Explore rated all three pages LOW risk (h1 + labels present). Fix if surfaced. |

## Rollback Plan

`git revert` the work-unit commits. Additive test/config + a non-breaking template binding ⇒ zero blast radius; no migration.

## Artifact Locations

- Engram: `sdd/p8-warnings-closure/proposal` (`type: architecture`, `capture_prompt: false`, project `construction-company-agency`).
- OpenSpec: `openspec/changes/p8-warnings-closure/proposal.md`.

## Success Criteria

- [ ] `bunx ng test --watch=false` green; three platform routes axe-scanned; `/plataforma` scans the feed (not a login redirect).
- [ ] Header CTA renders the same href via `site.promo.ctaPath`; no drift.
- [ ] Real-`login()` test renders the role-aware nav.
- [ ] No spec delta; `contracts/openapi.yaml` untouched.

## Next Recommended

Skip `sdd-spec`/`sdd-design` (no behavior change) → `sdd-tasks`.
