# Verification Report

**Change**: `p6-registro-role-picker-promo`
**Version**: N/A (spec deltas, no numeric version)
**Mode**: Strict TDD
**Verified by**: sdd-verify (independent execution, no reliance on apply claims)
**Date**: 2026-10-12
**Commits under test**: `dc15a7f` (WU1 picker), `41b5943` (WU2 content), `3a43a7c` (WU3 header strip)

## Verdict

**PASS WITH WARNINGS** — All 12 spec scenarios are covered by tests that pass at runtime; the full
gate (`bun run gate`) is green; `contracts/openapi.yaml` and the `Role` enum are untouched. One
WARNING (a11y scan does not include `/plataforma/registro`) and two SUGGESTIONs are non-blocking.

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 15 |
| Tasks complete | 15 |
| Tasks incomplete | 0 |
| Changed lines (add+del, 3 commits vs `0cfc1ee`) | 289 |
| 400-line budget | Under (Low risk confirmed) |

## Build & Tests Execution

**Build**: ✅ Passed — `bunx ng build` prerendered 21 static routes.
```text
Prerendered 21 static routes.
Application bundle generation complete. [4.943 seconds]
```

**Tests**: ✅ 501 passed / ❌ 0 failed / ⚠️ 0 skipped — `bunx ng test --watch=false`.
```text
Test Files  56 passed (56)
     Tests  501 passed (501)
```
(Matches apply claim of 501; baseline 493 → +8. jsdom prints "Not implemented: navigation to
another Document" four times from native form-submit attempts in flow tests — non-fatal, no test
impact.)

**Lint**: ✅ `bunx ng lint` → "All files pass linting."

**Full gate**: ✅ `bun run gate` (contract:lint → contract:check → ng lint → ng test → ng build → verify:prerender).
```text
PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 · CSR fallback ok ·
no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak
```

**Contract**: ✅ Untouched — `git status --porcelain contracts/` empty and `git diff contracts/ | wc -l` = 0.
`bun run contract:check` clean inside the gate (schema.gen.ts unchanged).

**Coverage**: ➖ Skipped — no coverage tool configured (no `--coverage` script/flag).

## Explicit Requirement Checks (from the verify brief)

| Check | Result | Evidence |
|-------|--------|----------|
| `data-testid="registro-role"` on the radio **GROUP**, not inputs | ✅ | `registro.page.ts:83-84` — `<fieldset data-testid="registro-role">`; inputs at `:91-99` carry no testid; test `registro.page.spec.ts:62` asserts the group is a `<fieldset>` and owns every radio |
| Exactly one `a[href="/plataforma"]` | ✅ | `header.component.html:26` is the only exact `/plataforma` link (promo CTA is `/plataforma/registro`, a distinct href); test `header.component.spec.ts:85-91` |
| Promo strip inside `<header>` landmark | ✅ | `header.component.html:1` opens `<header class="header-shell">`, `:58` closes; strip `<div data-testid="header-promo">` at `:35`; test `header.component.spec.ts:109-119` queries `header [data-testid="header-promo"]` |
| Non-dismissible | ✅ | No dismiss control; test `header.component.spec.ts:138-142` asserts zero `<button>` in the strip |
| No images | ✅ | Test `header.component.spec.ts:137` asserts zero `<img>` in the strip |
| `contracts/openapi.yaml` untouched | ✅ | `git diff contracts/` empty; `Role` enum in `models.ts:13` unchanged |

## Spec Compliance Matrix

All statuses are `COMPLIANT` — every row has a covering test that passed in this run.

### `platform-identity` — Requirement: Role model

| Scenario | Test | Result |
|----------|------|--------|
| Picker offers only self-service roles | `registro.page.spec.ts:53` > "offers only the self-service roles, never admin" | ✅ COMPLIANT |
| Each role shows a title and description | `registro.page.spec.ts:88` > "shows a title and an es-AR description for every offered role" | ✅ COMPLIANT |
| Picker group carries the role testid | `registro.page.spec.ts:62` > "carries the role testid on the fieldset group that owns every radio" | ✅ COMPLIANT |
| Selection is required and defaults to a valid role | `registro.page.spec.ts:78` > "defaults to a valid self-service role with exactly one radio selected" | ✅ COMPLIANT |
| Chosen role is what register sends | `registro.page.spec.ts:117` > "registers the chosen role and enters the platform" | ✅ COMPLIANT |
| Role is computed from the session | `session.service.spec.ts:47` > "computes the role from the session" | ✅ COMPLIANT |
| Programmatic register rejects admin | `mock-gateways.spec.ts:177` + `session.service.spec.ts:104` | ✅ COMPLIANT |
| Worker and company register normally | `mock-gateways.spec.ts:150` (worker) + `:187` (company) | ✅ COMPLIANT |

### `content-model` — Requirement: 6. [C] Typed promo teaser

| Scenario | Test | Result |
|----------|------|--------|
| Promo shape is typed and placeholder-flagged | `site.spec.ts:129` > "describes the trial-to-paid offer with copy, a CTA label and an absolute CTA path" | ✅ COMPLIANT |
| Placeholder plans are flagged | `site.spec.ts:138` > "holds 2 to 3 placeholder plans, each with a name and a price" | ✅ COMPLIANT |
| Placeholder gate still passes | `content.spec.ts:475` > "flags every non-client entry so a single search finds them" (`toContain('promo')`) | ✅ COMPLIANT |

### `site-shell-navigation` — Requirement: 3. [B] Header navigation, phone reachability and promo strip

| Scenario | Test | Result |
|----------|------|--------|
| Header exposes phone, marketing sections and one platform entry | `header.component.spec.ts:60`, `:77`, `:85` | ✅ COMPLIANT |
| Promo strip renders inside the header with a registration CTA | `header.component.spec.ts:109` | ✅ COMPLIANT |
| Promo strip is static, non-dismissible and image-free | `header.component.spec.ts:132` | ✅ COMPLIANT |
| Platform chrome owns the platform nav (marketing strip absent) | `app.spec.ts:97` (marketing `app-header` is null on `/plataforma`) + `app.spec.ts:109` | ✅ COMPLIANT |

**Compliance summary**: 12/12 scenarios COMPLIANT.

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Radio group is native `<fieldset>`+`<legend>` | ✅ | `registro.page.ts:83-107`; legend text `Me registro como` (`:87`) |
| `admin` un-offerable at compile time | ✅ | `SelfServiceRoleValue = Extract<Role,'worker'\|'company'>` (`:12`); `SELF_SERVICE_ROLES` has only worker/company (`:25-36`) |
| Valid default selection | ✅ | `role = signal<SelfServiceRoleValue>('worker')` (`:138`); radio `[checked]="role()===option.value"` (`:95`) |
| Submit sends the chosen role | ✅ | `submit()` passes `role: this.role()` to `session.register` (`:157-161`) |
| `admin` first-guarded in the gateway | ✅ | `mock-auth.gateway.ts:28-30` throws `Rol no permitido para el registro` before the duplicate-email check |
| `SessionService.register` bubbles rejection, persists nothing | ✅ | `session.service.ts:83-88`; test `session.service.spec.ts:104-113` asserts `currentUser()` null + storage null |
| Typed `Promo`/`PromoPlan` with required `isPlaceholder: true` | ✅ | `content.types.ts:94-113`; `Site.promo` at `:87` |
| `site.promo` payload shape | ✅ | `site.ts:69-84` — text, `ctaLabel`, `ctaPath: '/plataforma/registro'`, 3 flagged plans |
| Promo strip is data-driven from `site.promo` | ⚠️ | Text, plans, and CTA label come from `site.promo`; the CTA **path** is a literal (see SUGGESTION S1) |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 fieldset+legend radio cards | ✅ Yes | `registro.page.ts:83-107` |
| D2 `Extract<Role,'worker'\|'company'>` | ✅ Yes | `registro.page.ts:12` |
| D3 testid on the group, not inputs | ✅ Yes | `registro.page.ts:84` |
| D4 role copy local to the page | ✅ Yes | `SELF_SERVICE_ROLES` (`:25-36`) |
| D5 promo copy home = `site.promo` | ✅ Yes | `site.ts:69-84` |
| D6 required literal `true` flags | ✅ Yes | `content.types.ts:99,112` |
| D7 strip inside `header-shell`, second row | ✅ Yes | `header.component.html:35-57` |
| D8 static / non-dismissible / no images | ✅ Yes | template + `header.component.spec.ts:132` |
| D9 CTA target `/plataforma/registro`, one `a[href="/plataforma"]` | ✅ Yes | `header.component.html:51`; header test `:85` |

## TDD Compliance (Strict TDD module)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Table present in `apply-progress.md` (6 rows) |
| All tasks have tests | ✅ | 6/6 test-bearing tasks map to existing spec files |
| RED confirmed (tests exist) | ✅ | All referenced spec files exist (`registro.page.spec.ts`, `site.spec.ts`, `content.spec.ts`, `header.component.spec.ts`) |
| GREEN confirmed (tests pass) | ✅ | Full run 501/501 pass, including every change file |
| Triangulation adequate | ✅ | 5 tasks multi-case; `content.spec.ts` gate is a single strengthened assertion (explicitly justified) |
| Safety Net for modified files | ✅ | Baseline 493 tests cited and re-confirmed here; all modified files were pre-existing |

**TDD Compliance**: 6/6 checks passed.

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | — | `site.spec.ts`, `content.spec.ts`, `session.service.spec.ts`, `mock-gateways.spec.ts` | vitest |
| Integration (Angular TestBed / DOM) | — | `registro.page.spec.ts` (6), `header.component.spec.ts` (10), `app.spec.ts`, `app.a11y.spec.ts` | vitest + jsdom + axe-core |
| E2E | 0 | — | not installed (no playwright/cypress) |
| **Total (full suite)** | **501** | **56** | |

Changed-file test counts: `registro.page.spec.ts` 6, `header.component.spec.ts` 10,
`site.spec.ts` 16, `content.spec.ts` 38.

## Changed File Coverage

Coverage analysis skipped — no coverage tool detected.

## Assertion Quality

**Assertion quality**: ✅ All assertions verify real behavior.

- No tautologies (`expect(true).toBe(true)`), no orphan empty-collection-only checks, no
  assertions without production-code calls.
- The three value-bearing loops (`registro.page.spec.ts:73-75` and `:101-114`,
  `header.component.spec.ts:126-129`) run over collections whose non-empty size is asserted earlier
  in the same test (`inputs` length asserted at `:99`; `rows` length vs `plans.length` at `:125`), so
  they are not ghost loops.
- `registro.page.spec.ts:111` uses a description-length heuristic; it is paired with an explicit
  title-containment assertion (`:109`), so it verifies copy presence, not a trivial constant.

## Quality Metrics

**Linter**: ✅ No errors, no warnings (`bunx ng lint`).
**Type Checker**: ✅ No errors (`bunx ng build`, strict TS).

## Issues Found

### CRITICAL
None.

### WARNING

**W1 — New interactivity on `/plataforma/registro` is outside the axe scan.**
`src/app/app.a11y.spec.ts:18-29` scans 10 paths, all marketing/404; `/plataforma/registro` is not
among them. The new radio group therefore has no axe `label` / `nested-interactive` / `region`
coverage — only the structural DOM assertions in `registro.page.spec.ts`. No spec scenario requires
this, and the markup uses native semantics (explicit `label` wrapper, `fieldset`/`legend`), so it is a
coverage risk, not a defect.
*Concrete fix*: add `'/plataforma/registro'` to `TARGET_PATHS` in `app.a11y.spec.ts:18` (the page
renders without a session, so no auth stubbing is needed).

### SUGGESTION

**S1 — `site.promo.ctaPath` is declared and tested but not consumed.**
`content.types.ts:110` + `site.ts:72` define `ctaPath: '/plataforma/registro'`, and
`site.spec.ts:134` asserts it — but `header.component.html:51` uses a literal
`routerLink="/plataforma/registro"`. Two sources of the same path can drift. (Note: the design's
Interfaces snippet and task 3.2 explicitly mandated the literal, so this is accepted-by-design.)
*Concrete fix*: bind `[routerLink]="site.promo.ctaPath"` in `header.component.html:51`.

**S2 — Promo-plans loop could be robustified.**
`header.component.spec.ts:126-129` iterates `site.promo.plans` inside the test; if the array were
ever emptied, the loop (and its assertions) would never run. The sibling assertion at `:125`
(`rows` length == `plans.length`) plus the `site.spec.ts:138` 2–3 rule already guard this, so impact
is low.
*Concrete fix*: add `expect(site.promo.plans.length).toBeGreaterThan(0)` before the loop.

## Out-of-Scope Working-Tree Notes (not blockers)

- `angular.json` (modified, uncommitted): the CLI wrote `"analytics": false` and reformatted the
  `schematicCollections` array. Unrelated to this change; do not commit as part of it.
- `HANDOFF.md`, `fg.json` (untracked): expected, out of scope.
- `openspec/changes/p6-registro-role-picker-promo/` (untracked): the change artifacts themselves.

## Verdict

**PASS WITH WARNINGS** — every one of the 12 spec scenarios is proven by a passing runtime test, the
full gate is green, and the contract is untouched. W1 is a non-blocking a11y coverage gap; S1/S2 are
optional improvements.

**Archive readiness**: ✅ Ready for `sdd-archive`. No CRITICAL exists, so nothing must be fixed
before archiving. W1 (a11y path coverage) and S1 (bind `ctaPath`) are recommended follow-ups but do
not gate the archive.
