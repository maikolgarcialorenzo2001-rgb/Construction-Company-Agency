# Verification Report

**Change**: p7-role-aware-nav
**Version**: N/A (delta over extends-era `site-shell-navigation` requirement 3)
**Mode**: Strict TDD
**Verified at**: 2026-10-12 · commits `30c24e4`, `0cbb52e` on `main`

## Verdict

**PASS WITH WARNINGS** — every gate is green and 9/10 delta scenarios are COMPLIANT; one scenario
("Nav reacts to login") is covered only through the `role` input seam, not a real session
activation. No CRITICAL findings; archive is safe.

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 14 |
| Tasks complete | 14 |
| Tasks incomplete | 0 |

All `[x]`: Phase 1 (1.1–1.5), Phase 2 (2.1–2.6), Phase 3 (3.1–3.3).

## Build & Tests Execution (independent re-run)

**Build**: ✅ Passed
```text
bunx ng build → Prerendered 21 static routes. Application bundle generation complete.
```

**Tests**: ✅ 518 passed / 0 failed / 0 skipped (58 files)
```text
bunx ng test --watch=false
 Test Files  58 passed (58)
      Tests  518 passed (518)
```

**Lint**: ✅ `bunx ng lint` → `All files passing.` + `All files pass linting.`

**Full gate**: ✅ PASS (`bun run gate` = contract:lint → contract:check → lint → test → build → verify:prerender)
```text
PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 ·
CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak
```

**Coverage**: ➖ Not available — no coverage tool/script configured in `package.json`.

### Diff budget

| Field | Forecast | Actual |
|-------|----------|--------|
| Changed lines | ≈185 | 264 (+243 / −21) |
| 400-line budget | Low risk | ✅ Under budget |

---

## Spec Compliance Matrix

| # | Requirement / Scenario | Covering test | Result |
|---|------------------------|---------------|--------|
| 1 | Header exposes phone, marketing sections and one platform entry | `header.component.spec.ts` > "exposes exactly one phone action…" (`:77`), "links every top-level route…" (`:60`), "exposes a single platform entry point…" (`:85`) | ✅ COMPLIANT |
| 2 | Promo strip renders inside the header with a registration CTA | `header.component.spec.ts` > "renders the promo strip inside the header with a registration CTA" (`:109`) | ✅ COMPLIANT |
| 3 | Promo strip is static, non-dismissible and image-free | `header.component.spec.ts` > "keeps the promo strip static, non-dismissible and image-free" (`:132`) | ✅ COMPLIANT |
| 4 | Platform chrome owns the platform nav (marketing promo absent) | `app.spec.ts` > "renders only the skip link before platform chrome on any /plataforma route" (`:97`) + `platform-header.component.spec.ts` > "does not render the marketing promo strip…" (`:93`) | ✅ COMPLIANT |
| 5 | Worker and admin render the shared work nav | `platform-header.component.spec.ts` > worker (`:67`), admin (`:71`) + `nav.spec.ts` > admin `toBe` worker (`:28`) | ✅ COMPLIANT |
| 6 | Company renders the relabeled work nav (destinations unchanged) | `platform-header.component.spec.ts` > "renders the relabeled company work nav" (`:75`), seeded session (`:105`) + `nav.spec.ts` slugs/paths invariant (`:32`, `:38`) | ✅ COMPLIANT |
| 7 | Anonymous renders no work nav (no `<nav>` landmark, not empty) | `platform-header.component.spec.ts` > "renders no work nav but keeps the demo pill…" (`:59`) + `nav.spec.ts` > `platformNavFor(null)` ⇒ `[]` (`:16`) | ✅ COMPLIANT |
| 8 | Nav reacts to login | `platform-header.component.spec.ts` > "reacts to a role input set after the first render" (`:121`) | ⚠️ PARTIAL |
| 9 | Nav reacts to logout | `platform-header.component.spec.ts` > "removes the work nav when the session is cleared" (`:110`) | ✅ COMPLIANT |
| 10 | Modo demo pill survives every state | `platform-header.component.spec.ts` > "keeps the demo pill in every state" (`:99`), anonymous (`:59`) | ✅ COMPLIANT |

**Compliance summary**: 9/10 COMPLIANT, 1 PARTIAL (see WARNING W1).

### Explicit confirmations requested

| Check | Result | Evidence |
|-------|--------|----------|
| Worker & admin item sets identical (same array ref) | ✅ | `nav.ts:31` (`admin: WORKER_NAV`); `nav.spec.ts:28` asserts `toBe` |
| Company labels Vacantes/Mi empresa with UNCHANGED destinations | ✅ | `nav.ts:18-22`; `nav.spec.ts:32,38` + header spec `:79` prove slugs/paths invariant |
| Anonymous ⇒ `<nav>` element ABSENT (not empty) | ✅ | `platform-header.component.ts:26` `@if (nav().length)`; `platform-header.component.spec.ts:63` `querySelector('nav')` → `toBeNull()` |
| Nav reacts to login/logout | ⚠️ logout ✅ (`:110`, real `session.logout()`); login only via input seam (`:121`) | W1 |
| "Modo demo" pill survives all states | ✅ | unconditional at `platform-header.component.ts:45-48`; asserted across 4 states `:99` |
| `platformNav` alias fully removed, no dangling refs | ✅ | `grep platformNav\b` → 0 matches; `git diff 30c24e4 0cbb52e` shows only the 7-line alias deleted |
| Exactly one `a[href="/plataforma"]` | ✅ | platform chrome: `platform-header.component.spec.ts:89`; marketing header: `header.component.spec.ts:85` |
| `contracts/openapi.yaml` untouched | ✅ | `git diff contracts/` empty; `contract:check`/`contract:lint` green in gate |

---

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Pure role→nav mapping with `null → []` | ✅ Implemented | `nav.ts:39-40`; type-only imports (`nav.ts:1-2`) keep it dependency-free |
| Exhaustive `Record<Role, …>` | ✅ Implemented | `nav.ts:28-32` — a 4th role becomes a compile error |
| Header reads role from input, falls back to session | ✅ Implemented | `platform-header.component.ts:57-63` (`effectiveRole`/`nav` computed) |
| `<nav>` landmark gated on emptiness, pill unconditional | ✅ Implemented | `platform-header.component.ts:26`, `:45-48` |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| A1 — mapping lives in `nav.ts` pure fn | ✅ Yes | |
| B1 — no-session rule inside mapping (`null → []`) | ✅ Yes | `nav.ts:39-40` |
| C1 — `role` input + `effectiveRole` seam | ✅ Yes | matches `feed.page.ts` pattern |
| Gate `<nav>` on `nav().length` | ✅ Yes | avoids a dead a11y landmark |
| `admin` reuses `WORKER_NAV` by reference | ✅ Yes | asserted with `toBe` |

---

## TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | "TDD Cycle Evidence" table present in `apply-progress.md:58-71` |
| All tasks have tests | ✅ | 7/7 code tasks map to `nav.spec.ts` / `platform-header.component.spec.ts`; 2 are deletion/table rows |
| RED confirmed (tests exist) | ✅ | both spec files exist and are committed |
| GREEN confirmed (tests pass) | ✅ | 518/518 on independent re-run |
| Triangulation adequate | ✅ | null + worker + company + admin + invariant loops |
| Safety Net for modified files | ⚠️ | `apply-progress.md:69` labels the modified component "N/A (new file)" (see W2) |

**TDD Compliance**: 5/6 checks fully passed (1 documentation inaccuracy).

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (pure) | 6 | `nav.spec.ts` | vitest |
| Integration (TestBed + DOM) | 11 | `platform-header.component.spec.ts` | vitest + Angular TestBed |
| Prior-change regression (marketing header) | 5 | `header.component.spec.ts` | vitest + TestBed |
| Shell regression | 3 | `app.spec.ts` | vitest + TestBed |
| **Change total** | **17** | **2** | |

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected.

### Assertion Quality

**Assertion quality**: ✅ All assertions verify real behavior.

- No tautologies, no orphan-empty-only checks (`platformNavFor(null) ⇒ []` has non-empty companions),
  no type-only-only assertions, no ghost loops (loops iterate fixed non-empty `ROLES`/state arrays),
  no mocks. `expect(platformNavFor('admin')).toBe(platformNavFor('worker'))` is a strong reference assertion.

### Quality Metrics

**Linter**: ✅ No errors, no warnings
**Type Checker**: ✅ No errors (`ng build` clean)

---

## Issues Found

**CRITICAL**: None.

**WARNING**:
- **W1 — Scenario 8 login reactivity covered only via the input seam.** `platform-header.component.spec.ts:121-129`
  renders anonymous, then `setInput('role','worker')`, proving reactivity without a reload — but not through
  an actual `SessionService` activation. The session-signal→nav path is proven directly only for logout
  (`:110`). *Fix*: add a test that renders anonymous, then `await TestBed.inject(SessionService).login('demo@test','x')`
  (or `register`) and `fixture.detectChanges()`, asserting the role nav appears.
- **W2 — TDD evidence inaccuracy.** `apply-progress.md:69` lists safety net "N/A (new file)" for
  `platform-header.component.ts`, which was **modified** (26 changed lines), so a safety-net run applied.
  *Fix*: correct to `✅ 507/507`. Documentation only.

**SUGGESTION**:
- **S1 — a11y scan misses platform routes.** `app.a11y.spec.ts:18-29` scans 10 marketing paths only; the new
  gated `<nav>` landmark is never axe-scanned. *Fix*: add `/plataforma` and `/plataforma/login` to `TARGET_PATHS`.
- **S2 — Forecast understated.** Design budgeted ≈185 changed lines; actual is 264. Still under the 400 budget.
- **S3 — Unrelated working-tree change.** `angular.json` (`"analytics": false`) is modified but is not part of
  this change. Not a blocker; keep it out of any change commit. `HANDOFF.md`, `fg.json`, and the untracked
  change dir are expected/out of scope.

---

## Archive Readiness

- **Ready**: yes — no CRITICAL findings; all gates green; contracts untouched; alias fully removed.
- **Recommended before archive (non-blocking)**: address W1 to close the only PARTIAL scenario.
- **Artifacts**:
  - `openspec/changes/p7-role-aware-nav/verify-report.md` (this file)
  - Engram `sdd/p7-role-aware-nav/verify-report` (topic_key, hybrid store)

**Verdict**: PASS WITH WARNINGS — implementation matches spec and design, gates are green, one scenario gap.
