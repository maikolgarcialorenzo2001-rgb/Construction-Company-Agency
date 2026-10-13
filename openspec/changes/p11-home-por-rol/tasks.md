# Tasks: p11-home-por-rol — Role-aware entry home + W1-p10 fix

> Strict TDD (`bunx ng test --watch=false`) · BUN only · openapi READ-ONLY · UI es-AR · commits on `main` suffix `(p11-home-por-rol)`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | WU1 ~70–110 · WU2 ~180–280 · WU3 ~80–140 → ~330–530 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | WU1 → WU2 → WU3 (stacked) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Work Units (stacked; one commit each; verify `bunx ng test --watch=false`)

| Unit | Goal | Base |
|------|------|------|
| WU1 | W1-p10 fix; reverts alone | main |
| WU2 | `ApplicationsStore` + `PlatformHomePage` | WU1 |
| WU3 | routes/nav/redirect + a11y/release-matrix + HANDOFF | WU2 |

## WU1 — W1-p10 fix (independently revertible)

**Goal**: job-detail status shows only the viewer's own application.
**Files**: `core/platform/store/jobs.store.ts` (+spec); `pages/plataforma/job-detail.page.ts` (+spec).
**Rollback**: revert WU1 alone; independent of WU2/WU3.

- [x] 1.0 RED — `jobs.store.spec.ts:115-123` pass `'worker-1'`; `:125-132` pass the arg; job-2 w/o applicantId → `none` (no `items[0]` fallback).
- [x] 1.1 RED — `job-detail.page.spec.ts:88-100` → job-2 shows **no** `application-status`, apply form visible; `:74-86` seed worker-1 session.
- [x] 1.2 GREEN — `loadApplication(jobId, applicantId?)` calls `list({ jobId, applicantId })`; absent id ⇒ `none`.
- [x] 1.3 GREEN — page passes `session.currentUser()?.userId`; gate block on `effectiveRole()==='worker'` AND `application()`.
- [x] 1.4 REFACTOR; keep `job-detail.page.spec.ts:185-202` green.

## WU2 — ApplicationsStore + PlatformHomePage

**Goal**: role-aware home sections at `/plataforma/inicio`.
**Files**: NEW `core/platform/store/applications.store.ts` (+spec); NEW `pages/plataforma/platform-home.page.ts` (+spec).
**Rollback**: revert WU2; WU1 unaffected.

- [x] 2.0 RED — `applications.store.spec.ts`: own rows only (`applicantId`), empty state, `.set()` only, skip if same id ready.
- [x] 2.1 RED — `platform-home.page.spec.ts`: worker "Mis postulaciones" (own rows + status labels); company `openings().filter(companyId===userId)` + "Publicar novedad"; admin `home-admin-placeholder`, no controls; per-role empty states; one `<h1>Inicio</h1>`.
- [x] 2.2 GREEN — `ApplicationsStore` (signals, `load(applicantId)`, idle/loading/ready/empty) mirroring `feed.store`.
- [x] 2.3 GREEN — home effect tracks `session.currentUser()`, store calls in `untracked()` (p9 lesson); testids `home-application`/`home-vacancy`/`home-publish`/`home-admin-placeholder`.
- [x] 2.4 REFACTOR.

## WU3 — Wiring, a11y/release-matrix, docs

**Goal**: `/plataforma/inicio` reachable + guarded; nav leads with Inicio; login/registro land there.
**Files**: `app.routes.ts` (+spec); `core/platform/nav.ts` (+spec); `platform-header.component.spec.ts`; `pages/plataforma/login.page.ts` + `registro.page.ts` (+specs); `app.a11y.spec.ts`; `app.release-matrix.spec.ts`; `HANDOFF.md`.
**Rollback**: revert WU3; nav/feed degrade to pre-p11.

- [ ] 3.0 RED — `app.routes.spec.ts:28` insert `'inicio'` at index 1 (order-sensitive) + `it.each` row.
- [ ] 3.1 RED — `nav.spec.ts:21,25,34,40` + `platform-header.component.spec.ts` (68,76,81-85): Inicio first every role.
- [ ] 3.2 RED — `login.page.spec.ts:54` / `registro.page.spec.ts:137` expect `/plataforma/inicio`; `app.a11y.spec.ts:19-33` add `/plataforma/inicio` to TARGET_PATHS (`/plataforma` h1 stays `Novedades`); `app.release-matrix.spec.ts:44` add `{ path: '/plataforma/inicio', images: 0, priority: 0, cta: false }`.
- [ ] 3.3 GREEN — lazy `inicio` child (behind `authGuard`) before `trabajos`; prepend Inicio to `WORKER_NAV` + `COMPANY_NAV`; redirect login/registro.
- [ ] 3.4 GREEN — `HANDOFF.md:15`: remove false "Hay `roleGuard` con `data.roles`" claim (deferred to `p12-admin`).
- [ ] 3.5 REFACTOR + full suite green incl. a11y + release-matrix.
