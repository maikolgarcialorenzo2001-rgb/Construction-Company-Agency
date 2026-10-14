# Proposal: p12-admin — Admin area (read-only directory + local config)

## Intent

No admin-only area or role gating exists: `authGuard` is the only guard (no `roleGuard`/`data.roles`), the `admin` nav reuses `WORKER_NAV`, and the admin home is a static "en preparación" placeholder. The `admin` role exists in the model but nothing enforces it. Ship a gated admin area so `admin` becomes real and demo-playable: a read-only users/roles directory plus local config, behind a data-driven `roleGuard`.

## Scope

### In Scope
- `roleGuard` functional `CanActivateFn` reading `route.data['roles']`, composed `[authGuard, roleGuard]`.
- Seeded admin demo account (`admin@demo.test` / `demo1234`, userId `admin-1`) + login copy.
- Read-only directory: `DirectoryUser` + `AdminGateway` port + `MockAdminGateway` (password stripped) + `AdminStore` (idle/loading/ready/empty + role filter).
- Demo `AdminConfigStore`: 2 local toggles persisted to `localStorage`.
- `AdminPage` at `/plataforma/admin`; own `ADMIN_NAV` (existing items + `Admin`); `platform-home` link.

### Out of Scope
- Real role mutation or persistence beyond `localStorage` (mock auth copies accounts per instance, so in-memory edits would not propagate).
- Any backend/HTTP/BFF work.
- `contracts/openapi.yaml` change; `AdminGateway`/`DirectoryUser` in `contract-conformance.ts` (no schema → breaks `ng build`).

## Capabilities

### New Capabilities
- `platform-admin`: admin-only gated area — role gating, users/roles directory, local config.

### Modified Capabilities
- `platform-shell`: route table gains an 8th child `/plataforma/admin` + guarded-children rule.
- `site-shell-navigation`: `admin` gets its own `ADMIN_NAV` (items + `Admin`), no longer sharing `WORKER_NAV`.
- `platform-home`: admin home requirement rewritten — short overview linking `/plataforma/admin` (was "no controls" placeholder).
- `platform-identity`: seeded admin account + login copy; `register` still rejects admin.

## Approach

Approach A (full idiomatic slice). `roleGuard` returns `true` on a `data['roles']` match, else `createUrlTree`: non-admin → `/plataforma/inicio`, anonymous → `/plataforma/login`. Admin child: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['admin'], seo: NOINDEX }`, lazy `AdminPage`. Directory maps `DEMO_ACCOUNTS` → `DirectoryUser` (never returns `password`). Config is demo-only, `localStorage`-backed. `platform-home` keeps `home-admin-placeholder` and adds the link. Child sits among the existing 7 platform children; `/plataforma` (feed) and the p11 role-home stay unchanged.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `core/platform/auth/role.guard.ts` (+spec) | New | `roleGuard` `data.roles` gating |
| `core/platform/mocks/fixtures.ts` (+spec) | Modified | Seed `admin-1`; count 5→6 |
| `core/platform/domain/models.ts`, `api/ports.ts` (token) | Modified | `DirectoryUser`, `AdminGateway`, token |
| `core/platform/api/mock-admin.gateway.ts` (+spec) | New | Map accounts, strip password |
| `core/platform/store/admin.store.ts`, `admin-config.store.ts` (+spec) | New | Directory + config stores |
| `pages/plataforma/admin.page.ts` (+spec) | New | Directory + config UI |
| `core/platform/nav.ts`, `pages/plataforma/platform-home.page.ts`, `login.page.ts` (+specs) | Modified | `ADMIN_NAV`, home link, login copy |
| `app.routes.ts` (+spec), `auth.guard.spec.ts`, `app.a11y.spec.ts`, `app.release-matrix.spec.ts` | Modified | +`admin` child, guarded/a11y/release rows |
| `openspec/specs/**`, `HANDOFF.md` | Deltas | `platform-admin` + 4 MODIFIED |

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|------------|
| R1 | No admin account → deliverable unplayable; `fixtures.spec.ts:159` pins 5 | High | WU1 seeds `admin-1` + updates count spec + login copy |
| R2 | `roleGuard` absent — gating has no foundation | High | WU1 builds it; keep admin-reject in `register` |
| R3 | a11y/release-matrix seed a `company` session → `/plataforma/admin` redirects; audit silently hits home | High | Switch those suites' session to `admin` (or per-row override) |
| R4 | `admin` shares `WORKER_NAV` same array ref (`nav.spec.ts:28`) | Med | Own `ADMIN_NAV`; update nav + header specs |
| R5 | Password leakage if directory reads `DemoAccount` raw | Med | `DirectoryUser` strips `password`; gateway never returns it |
| R6 | In-memory edit gives false "saved" impression | Med | View-only + local config; label demo |
| R7 | `DirectoryUser` in `contract-conformance.ts` breaks `ng build` | Med | Keep out of build-program binding (HANDOFF §6) |
| R8 | `platform-home` "no admin controls" scenario contradicts a link | Low | MODIFIED delta rewrites requirement; keep testid, add link |

## Rollback Plan

Revert the 3 `(p12-admin)` work-unit commits on `main` (no branches/PRs/push). Each WU reverts independently; WU1's revert restores fixtures to 5 accounts and removes `roleGuard`. No contract/backend changes to unwind.

## Dependencies

- `SessionService`, `authGuard`, `DEMO_ACCOUNTS`/profiles fixtures, `PLATFORM_CHILD_PATHS`, a11y/release-matrix specs.
- Locked: Approach A; read-only directory + local config; `ADMIN_NAV` = existing items + `Admin`; credential `admin@demo.test` / `demo1234` / `admin-1`.

## Success Criteria

- [ ] `admin@demo.test` / `demo1234` logs in and reaches the area.
- [ ] Anonymous → `/plataforma/login`; non-admin → `/plataforma/inicio` at `/plataforma/admin`.
- [ ] Directory lists 6 accounts with role + userId; password never rendered; filter/counts work.
- [ ] 2 toggles persist across reload via `localStorage`.
- [ ] Nav shows `Admin`; home overview links `/plataforma/admin`.
- [ ] `bunx ng test --watch=false` green (incl. a11y + release-matrix under admin session).

## Work-Unit Sketch

| Unit | Goal | Independently revertible |
|------|------|--------------------------|
| **WU1** | `roleGuard` + admin demo account + login copy | Yes — unlocks login before UI |
| **WU2** | Admin data layer (`DirectoryUser`, `AdminGateway`, `MockAdminGateway`, token, `AdminStore`, `AdminConfigStore`) | Yes |
| **WU3** | `AdminPage` + route/roleGuard wiring + `ADMIN_NAV` + home link + specs | Yes |

**Forecast:** ~14 files, ~460–680 lines → **400-line budget risk: High**; chain `stacked-to-main` (WU1→WU2→WU3); `Decision needed before apply: Yes`.
