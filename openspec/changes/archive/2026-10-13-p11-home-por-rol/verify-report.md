# Verification Report — change `p11-home-por-rol`

- **Status:** PASS
- **Executive summary:** Implementation validates against specs, design, and tasks. All required tests pass (578/578), lint passes, build succeeds. The W1-p10 fix scopes `JobsStore.loadApplication` to an applicant (returns `none` when absent), job-detail shows status only for `worker` when application exists, `/plataforma/inicio` is role-aware (worker/company/admin), shell/nav/redirects wired correctly, a11y/release-matrix updated, and auth guard spec matches guarded-children.
- **Artifacts:**
  - `openspec/changes/p11-home-por-rol/verify-report.md` (this file) — written to disk: **EXISTS**
  - Engram observation (topic_key `sdd/p11-home-por-rol/verify-report`, type `architecture`, capture_prompt `false`, project `construction-company-agency`) — to be saved below
- **Next recommended:** `sdd-archive`
- **Risks:** SUGGESTION-level only (see below). No CRITICAL risks.
- **Skill resolution:** cognitive-doc-design applied (lead with answer, tables/checklists).

## Command evidence

| Command | Exact run | Result | Notes |
|---|---|---|---|
| `bunx ng test --watch=false` | `cd /c/Users/Maikol/Documents/CV-Projects/Construction-Company-Agency && bunx ng test --watch=false` | **PASS** — 62 test files, **578 passed** (0 failed) | Full suite green (includes a11y/release-matrix/guard/specs for p11). |
| `bunx ng lint` | `cd /c/Users/Maikol/Documents/CV-Projects/Construction-Company-Agency && bunx ng lint` | **PASS** | All files pass linting. |
| `bunx ng build` | `cd /c/Users/Maikol/Documents/CV-Projects/Construction-Company-Agency && bunx ng build` | **PASS** | Production build succeeds; prerendered 21 static routes. |

## Completeness (tasks.md)

| Work unit | Goal | Status | Evidence |
|---|---|---|---|
| WU1 | W1-p10 fix (jobs.store + job-detail) | **COMPLETE** | `loadApplication` filters by `jobId,applicantId`; returns `none` when applicantId absent (no `items[0]` fallback). Page gates status on `effectiveRole()==='worker' && application()`; passes `session.currentUser()?.userId`. Tests: `jobs.store.spec.ts` (8/8) incl. "settles on none when no application exists for the given applicant" green; `job-detail.page.spec.ts` (9/9) shows status only for own app and no status when unapplied. |
| WU2 | `ApplicationsStore` + `PlatformHomePage` | **COMPLETE** | New store with lifecycle idle/loading/ready/empty; `load(applicantId)` guards re-loads; mirrors feed.store. Home per-role: worker lists own apps only, company filters openings by `companyId===userId` client-side + "Publicar novedad", admin minimal placeholder. One `<h1>Inicio</h1>`. Tests: `applications.store.spec.ts` (7/7), `platform-home.page.spec.ts` (6/6) green. |
| WU3 | Wiring/nav/redirects + a11y/release-matrix + HANDOFF | **COMPLETE** | Routes: `inicio` added at platform children index 1 (after `''`), behind `authGuard`; `app.routes.spec.ts` (26/26). Nav: `inicio` first in WORKER_NAV/COMPANY_NAV; `platform-header.component.spec.ts` (13/13), `nav.spec.ts` (6/6). Login/registro navigate to `/plataforma/inicio`. `app.a11y.spec.ts` includes `/plataforma/inicio` (3/3). `app.release-matrix.spec.ts` includes row (5/5). `auth.guard.spec.ts` guards correct list (5/5). HANDOFF notes roleGuard deferred to p12-admin. |

## Spec compliance

| Spec area | Requirement | Status | Evidence |
|---|---|---|---|
| platform-shell | `/plataforma/inicio` in platform children index 1, `/plataforma` remains feed; marketing unchanged | **COMPLIANT** | Routes show `inicio` child at index 1 (after `''`, before `trabajos`) with `authGuard`. `app.routes.spec.ts` asserts order/includes. |
| platform-home | Role-aware home at `/plataforma/inicio`; login/registro land there; behind `authGuard`; roleGuard deferred. Worker own apps with status; empty states. Company own vacancies filtered by `companyId===userId` client-side + "Publicar novedad". Admin minimal placeholder. | **COMPLIANT** | Implementation + tests cover all branches; effect uses `untracked()`; one `<h1>Inicio</h1>`. |
| platform-jobs (W1-p10 fix) | `loadApplication(jobId, applicantId?)` calls list with both; returns `none` when applicantId absent (no `items[0]`). Job-detail status only when `effectiveRole()==='worker'` AND `application()` exists. Non-worker no status. | **COMPLIANT** | Page passes `session.currentUser()?.userId`; gate checks role+application existence. Store returns `none` when applicantId absent. |

## Design coherence

| Design point | Expected | Actual | Verdict |
|---|---|---|---|
| `ApplicationsStore` | idle/loading/ready/empty; guard same-applicant loads | `loadedApplicantId` guard; responses via `.set()` (FeedStore style) | **MATCH** |
| Home effect | Track `session.currentUser()`; calls in `untracked()` | Effect tracks user; `jobs.load()`/`applications.load()` inside `untracked()` | **MATCH** |
| Nav | Inicio first for worker/company; admin uses worker nav | WORKER_NAV/COMPANY_NAV start with Inicio; `admin = WORKER_NAV` | **MATCH** |
| Routes | `inicio` before `trabajos`, behind `authGuard`; auth open | Guarded list matches `['', 'inicio', 'trabajos', 'trabajos/:id', 'perfil']` | **MATCH** |
| Login/Registro redirect | land on `/plataforma/inicio` | navigateByUrl to `/plataforma/inicio` | **MATCH** |

## Findings

### CRITICAL
- None.

### WARNING
- None.

### SUGGESTION
- Build shows Angular extended-diagnostics warnings in `comments.store.spec.ts` (unrelated to p11). Not introduced by this change; tests/build all pass. Could be cleaned up in a future pass, but not blocking verification.
- The `platform-header.component.spec.ts` path required globbing in CLI (not a source issue). Test suite is green.

## Verification verdict
**PASS** — All acceptance criteria met with real command evidence. No production code was modified to make verification pass.