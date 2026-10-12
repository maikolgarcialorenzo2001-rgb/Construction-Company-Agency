# Archive Report: p7-role-aware-nav

## Summary
Change archived as PASS WITH WARNINGS. Role-aware platform header navigation (worker/admin share labels/slugs; company relabeled), with nav reacting to session changes and a gated `<nav>` landmark; marketing header unchanged for promo/phone/entry points. Tests: 518 passing (+17 vs baseline). Lint/type clean, contracts untouched. Diff size 264 lines vs ~185 forecast (still under 400 budget).

## Verdict
**PASS WITH WARNINGS** — 9/10 delta scenarios compliant; "Nav reacts to login" covered only via the `role` input seam (not a real SessionService activation). No CRITICAL findings; archive safe.

## Commits (as recorded)
- `30c24e4` — `feat(platform): add pure role-aware platformNavFor mapping (p7-role-aware-nav)` (WU1)
- `0cbb52e` — `feat(platform): make the platform header nav role-aware (p7-role-aware-nav)` (WU2)
- WU3: full gate only (no commit)

## Spec Sync Summary
- `openspec/specs/site-shell-navigation/spec.md` — MODIFIED Requirement 3: replaced the prior platform nav text with role-aware platform header behavior (worker/admin same item set: Novedades/Trabajos/Mi perfil to `/plataforma`, `/plataforma/trabajos`, `/plataforma/perfil`; company relabeled Vacantes/Mi empresa with identical slugs; no nav when no session; `<nav>` absent when empty; "Modo demo" pill unconditional; reacts to session changes). Scenarios updated accordingly. No other requirements touched; numbering/format preserved.

## Carried Warnings/Follow-ups
- **W1 — login reactivity proven only via the `role` input seam, not a real `SessionService.login()` (logout is real).** Location: `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts:121–129`. Reactivity path via session activation not directly tested. Recommendation (non-blocking): add a test that exercises `SessionService.login(...)` and asserts role nav appears.
- **W2 — apply-progress "safety net N/A" doc nit (modified file).** `openspec/changes/p7-role-aware-nav/apply-progress.md:69` incorrectly marked safety net as N/A for `platform-header.component.ts` (modified, 26 lines). Documentation only; test history shows safety net was run (`✅ 507/507`).
- **S1 — `/plataforma` (and `/plataforma/login`) absent from `app.a11y.spec.ts` TARGET_PATHS (same accumulating a11y gap carried from p6-W1).** Gated `<nav>` landmark not axe-scanned on platform routes. Recommendation (non-blocking): extend TARGET_PATHS to include `/plataforma` and `/plataforma/login`.
- **S2 — diff 264 lines vs ~185 forecast (under budget).** Design budgeted ≈185 changed lines; actual 264. Still under 400; no size:exception needed.

## Files Moved
- `openspec/changes/p7-role-aware-nav/` → `openspec/changes/archive/2026-10-12-p7-role-aware-nav/` (all artifacts moved).

## Change Status
Fully closed for this cycle. No open CRITICAL items. Warnings/Suggestions are carried forward (non-blocking).
