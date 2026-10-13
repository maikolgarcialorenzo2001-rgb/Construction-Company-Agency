# Proposal: p11-home-por-rol — Role-aware entry home + W1-p10 fix

## Intent

Today all roles funnel into `/plataforma` (the feed); there is no per-role entry screen. Build a dedicated role-aware home so each user lands on relevant work, and fix the W1-p10 defect (`JobsStore.loadApplication` shows *other workers'* statuses) because the worker home surfaces application status — the same bug would be visible there.

## Scope

### In Scope
- NEW `PlatformHomePage` at `/plataforma/inicio` (A2: feed keeps `/plataforma`).
- `login`/`registro` redirect to `/plataforma/inicio`; nav gains first "Inicio" item.
- Per-role content: worker "Mis postulaciones" (applications filtered by `applicantId`); company "Mis vacantes" (client-side `companyId` filter); admin minimal overview/placeholder.
- W1-p10 fix: `loadApplication(jobId, applicantId)` (S1, page supplies `session.currentUser()?.userId`; store stays session-free); gate job-detail status block to `effectiveRole() === 'worker'`.

### Out of Scope
- `roleGuard` / `data.roles` — DEFERRED to `p12-admin` (Paso 7). HANDOFF §1 is wrong; they do not exist.
- Full admin tooling, `JobsGateway.list` `companyId` filter, any `contracts/openapi.yaml` change.

## Capabilities

### New Capabilities
- `platform-home`: role-aware entry screen rendering per-role home content and actions at `/plataforma/inicio`.

### Modified Capabilities
- `platform-jobs`: `loadApplication` MUST filter by `applicantId`; status block worker-only (W1-p10).
- `platform-shell`: route table gains `/plataforma/inicio` child; login/registro auth entry unchanged.
- `site-shell-navigation`: platform nav gains first "Inicio" item; landing route + item set change.

## Approach

**A2.** Add `PlatformHomePage` as a new `/plataforma/inicio` child; `/plataforma` stays the feed (no route swap). Redirect `login.page.ts`/`registro.page.ts` to `/plataforma/inicio`. Nav renders "Inicio" first for all authenticated roles (company keeps relabeled Trabajos→Vacantes, perfil→Mi empresa). Home sections: worker lists own applications via `ApplicationsGateway.list({ applicantId })`; company filters `JobsStore.openings()` client-side by `companyId`; admin shows counts/placeholder. W1-p10: store calls `applications.list({ jobId, applicantId })`; page injects `SessionService` and passes `userId`; status block renders only for `worker`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/core/platform/store/jobs.store.ts` | Modified | `loadApplication(jobId, applicantId)` filter |
| `src/app/pages/plataforma/job-detail.page.ts` | Modified | Pass applicantId; worker-only status block |
| `src/app/pages/plataforma/platform-home.page.ts` (+spec) | New | Role-aware home |
| `src/app/core/platform/store/applications.store.ts` (+spec) | New | Worker applications surface |
| `src/app/core/platform/nav.ts` (+spec) | Modified | "Inicio" item |
| `src/app/app.routes.ts` (+`app.routes.spec.ts`) | Modified | New home child |
| `src/app/pages/plataforma/login.page.ts`, `registro.page.ts` | Modified | Redirect to `/plataforma/inicio` |
| `src/app/app.a11y.spec.ts`, `app.release-matrix.spec.ts` | Modified | Add home route row/target |
| `openspec/specs/**` | Deltas | `platform-home`, `platform-jobs`, `platform-shell`, `site-shell-navigation` |

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|------------|
| R1 | `roleGuard`/`data.roles` absent despite HANDOFF | High | Defer to `p12-admin`; correct HANDOFF |
| R2 | No `ApplicationsStore` | Med | Add small store or extend `JobsStore` |
| R3 | `JobsGateway.list` lacks `companyId` | Low | Client-side filter |
| R4 | `/plataforma` h1 `'Novedades'` a11y pin | Med | A2 keeps feed h1; add new target |
| R5 | New route order-sensitive in `PLATFORM_CHILD_PATHS` | Low | Insert in declared order |
| R6 | Workload exceeds 400-line budget | Med | Stacked WUs: WU1 fix, then WU2/WU3 |
| R7 | p7/p8 nav contract re-churned | Med | A2 additive (single new item) |
| R8 | Thin demo lists (worker-1 = 1 app) | Low | Acceptable for demo |
| R9 | a11y scan runs under company session | Med | Landmark/id/label hygiene; add route to TARGET_PATHS |

## Rollback Plan

Revert the p11 work-unit commits on `main` (no branches/PRs). Each WU is self-contained: WU1 (W1-p10) reverts independently of WU2/WU3. No contract or gateway changes to unwind.

## Dependencies

- Existing `ApplicationsGateway` `applicantId` filter (present).
- `SessionService`, `PLATFORM_CHILD_PATHS`, a11y/release-matrix specs.

## Success Criteria

- [ ] Login/registro land on `/plataforma/inicio`; `/plataforma` still renders the feed.
- [ ] Worker home lists only the current worker's applications with correct status labels.
- [ ] Job-detail shows a status only for the applying `worker`; company/anonymous see none.
- [ ] Company home lists only its own vacancies; admin home renders a placeholder overview.
- [ ] Platform nav shows "Inicio" first for authenticated roles.
- [ ] `bunx ng test --watch=false` green (incl. a11y + release-matrix with new route).

## Work-Unit Sketch

- **WU1** — W1-p10 fix (jobs.store + job-detail + specs): independent, reviewable first.
- **WU2** — `PlatformHomePage` + applications surface + per-role sections.
- **WU3** — route/nav/redirect wiring + a11y/release-matrix updates.

> Follow-up task (not this phase): correct `HANDOFF.md:15` false `roleGuard`/`data.roles` claim.
