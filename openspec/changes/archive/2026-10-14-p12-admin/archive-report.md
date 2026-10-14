# Archive Report: p12-admin

`p12-admin` is complete and archived. It makes the `admin` role real and demo-playable: a **role-gated admin-only area** at `/plataforma/admin` behind a data-driven `roleGuard`, with a **read-only users/roles directory** (`DirectoryUser` + `AdminGateway`/`MockAdminGateway`, password never rendered, role filter + per-role counts over the filtered list) and a **demo-only local config** (two toggles persisted to `localStorage`). `admin` gains its own `ADMIN_NAV` (existing destinations + a leading `Admin` item) and the admin home grows a link into the area. No backend, no contract change. Verify passed **PASS** (0 CRITICAL, 0 WARNING; SUGGESTION + one process-note advisory). Spec sync ran: **1 capability CREATED** (`platform-admin`) and **4 MODIFIED** (`platform-home`, `platform-identity`, `platform-shell`, `site-shell-navigation`). `contracts/openapi.yaml` was **not touched**.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p12-admin` (admin area — role gating + read-only directory + local config; HANDOFF §10 Paso 7) |
| Verify verdict | **PASS** (0 CRITICAL, 0 WARNING; SUGGESTION-only + 1 non-blocking process note) |
| Work units | 3/3 complete + 1 remediation, each on `main`, tagged `(p12-admin)` |
| Delivery | **stacked-to-main** — WU1 → WU2 → WU3 sequential local commits, then remediation R1; **no branches, no PRs, not pushed** |
| Tasks | 13/13 checkbox tasks complete |
| Tests | **621/621 green (67 files)**; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (lazy `admin-page` 5.94 kB; 21 static routes prerendered) |
| Spec scenarios | **36/36 COMPLIANT** (0 UNTESTED, 0 FAILING) |
| Capability changes | **1 CREATED** (`platform-admin`), **4 MODIFIED** (`platform-home`, `platform-identity`, `platform-shell`, `site-shell-navigation`) |
| Contract | `contracts/openapi.yaml` untouched; `DirectoryUser`/`AdminGateway` absent from `contract-conformance.ts` |
| Archive location | `openspec/changes/archive/2026-10-14-p12-admin/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p12-admin/archive-report` |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Change summary

| Piece | What it is | Evidence |
|---|---|---|
| **WU1 — gating foundation** | `roleGuard` functional `CanActivateFn` reading `route.data['roles']` (defensive on missing/empty); seeded the single admin demo account (`admin@demo.test` / `demo1234`, `userId` `admin-1`); login screen lists the admin demo credential. Account count pinned 5 → 6. | `f4fe721` — `role.guard.ts` (+spec), `fixtures.ts` (+spec), `login.page.ts` (+spec) |
| **WU2 — admin data layer** | `DirectoryUser {userId,email,role}` (no `password`); `AdminGateway` port + `ADMIN_GATEWAY` token → `MockAdminGateway` (maps `DEMO_ACCOUNTS`, strips password); `AdminStore` (`idle/loading/ready/empty`, `roleFilter`, `filteredUsers`, `counts` over the filtered list) + `AdminConfigStore` (two toggles, single `localStorage` key `admin-config`). | `5b478e2` — `domain/models.ts`, `api/ports.ts`, `mock-admin.gateway.ts`, `store/admin.store.ts`, `store/admin-config.store.ts` (+specs) |
| **WU3 — UI + wiring** | `AdminPage` at `/plataforma/admin` (directory table + role filter + empty state + two demo-labelled toggles); 8th platform child with `canActivate: [authGuard, roleGuard]`, `data.roles: ['admin']`, index 2 after `inicio`; own `ADMIN_NAV` (leading `Admin` item); admin home link + updated a11y/release-matrix rows. | `0f8ff7d` — `admin.page.ts` (+spec), `nav.ts` (+spec), `app.routes.ts` (+spec), `platform-header.component.spec.ts`, `platform-home.page.ts` (+spec), `auth.guard.spec.ts`, `app.a11y.spec.ts`, `app.release-matrix.spec.ts` |
| **R1 — remediation** | Closed the verify FAIL: added the covering test for `platform-identity` scenario *"Admin demo account logs in"* (`session.service.spec.ts`), and corrected the stale `nav.ts` comment. Test-only + comment fix; no production code. | `c81acef` — `session.service.spec.ts` (+22), `nav.ts` (1 line) |

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-admin` | **Created** | NEW capability (no canonical dir existed). Full spec copied from the authored delta (3 requirements, 9 scenarios) → `openspec/specs/platform-admin/spec.md`. |
| `platform-home` | **Updated** | MODIFIED requirement *"Admin home — overview linking to the admin area"* replaced the old *"Admin home — minimal overview placeholder"*: keeps `home-admin-placeholder`, adds the `/plataforma/admin` link, `(Previously:)` marker added, 2 scenarios. 3 other requirements preserved untouched. |
| `platform-identity` | **Updated** | MODIFIED requirement *"Mock session, visibly demo"* replaced: seeds exactly one `admin` account + login copy; registration still rejects `admin`. 2 scenarios added (*"Admin demo account logs in"*, *"Login exposes the admin demo credential"*). 3 other requirements preserved untouched. |
| `platform-shell` | **Updated** | MODIFIED requirements *"Platform subtree route table"* (adds `/plataforma/admin` after `inicio`) and *"Guarded platform children"* (`[authGuard, roleGuard]`, `data.roles=['admin']`) replaced in place. 4 other requirements preserved untouched. |
| `site-shell-navigation` | **Updated** | MODIFIED requirement *"3. [B] Header navigation, phone reachability and promo strip"* replaced: `admin` gets its own navigation leading with `Admin` and no longer shares `WORKER_NAV`; the shared worker/admin scenario split into *"Worker renders the work nav"* + *"Admin renders the work nav plus an Admin entry"*. 5 other requirements preserved untouched. |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding and no `# Delta for …` header remains in any canonical spec (grep-verified). Requirements not mentioned in the deltas were preserved. Delta-scenario coverage in canonical specs: `platform-admin` 9 + `platform-shell` 7 + `platform-identity` 6 + `platform-home` 2 + `site-shell-navigation` 12 = **36**.

## Final gate numbers (from the PASS verify)

| Gate | Command | Result |
|---|---|---|
| Tests | `bunx ng test --watch=false` | ✅ **621/621 passed** across **67 files** |
| Lint | `bunx ng lint` | ✅ **All files pass linting** |
| Build | `bunx ng build` | ✅ clean — lazy `admin-page` chunk emitted; 21 static routes prerendered |
| Spec scenarios | verifier matrix | ✅ **36/36 COMPLIANT** (0 UNTESTED, 0 FAILING) |
| Strict TDD | 6/6 checks | ✅ |
| Contract safety | `git diff contracts/openapi.yaml` / conformance grep | ✅ untouched / absent |

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `f4fe721` | WU1 `feat(platform): add roleGuard and seed admin demo account (p12-admin)` |
| `5b478e2` | WU2 `feat(platform): add admin directory data layer and stores (p12-admin)` |
| `0f8ff7d` | WU3 `feat(platform): add admin area with role-gated route and nav (p12-admin)` |
| `c81acef` | R1 `test(platform): cover admin demo login and fix nav comment (p12-admin)` |
| *(orchestrator)* | `docs(openspec): archive p12-admin with spec sync (p12-admin)` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-14-p12-admin/` |

**Delivery note (chained-pr):** `p12-admin` shipped as **3 stacked work units + 1 remediation** (`stacked-to-main`): WU1 → WU2 → WU3 as sequential local commits on `main`, then R1. No branches, no PRs, nothing pushed. The review-load advisory (below) records that the actual line count exceeded the `tasks`-phase forecast.

Conventional format, English, no AI attribution. `angular.json` (incidental `M`) deliberately **not** committed.

## Archive contents

- `explore.md` ✅
- `proposal.md` ✅
- `specs/` ✅ (5 deltas: `platform-admin`, `platform-home`, `platform-identity`, `platform-shell`, `site-shell-navigation`)
- `design.md` ✅
- `tasks.md` ✅ (13/13 complete)
- `verify-report.md` ✅ (PASS)
- `archive-report.md` ✅ (this file)

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p12-admin/explore` (#956) |
| Proposal | `proposal.md` | `sdd/p12-admin/proposal` (#958) |
| Spec (deltas) | `specs/platform-admin/spec.md`, `specs/platform-home/spec.md`, `specs/platform-identity/spec.md`, `specs/platform-shell/spec.md`, `specs/site-shell-navigation/spec.md` | `sdd/p12-admin/spec` (#959) |
| Design | `design.md` | `sdd/p12-admin/design` (#960) |
| Tasks | `tasks.md` | `sdd/p12-admin/tasks` (#961) |
| Apply progress | *(engram only)* | `sdd/p12-admin/apply-progress` (#963, cumulative WU1+WU2+WU3+R1) |
| Verify report | `verify-report.md` | `sdd/p12-admin/verify-report` (#969) |
| Archive report | `archive-report.md` | `sdd/p12-admin/archive-report` (this save) |

## Warnings / advisories (carried from verify — non-blocking)

| # | Advisory | Disposition |
|---|---|---|
| **A1** | Workload forecast exceeded on every work unit (actual ~1228 changed lines vs forecast 160–680; 400-line budget risk: High). ~Half is test code. | **Accepted, non-blocking.** No PR gate applies (stacked-to-main local commits); it is a `tasks`-phase estimation observation, not a code defect. |
| **A2** | Angular `NG8102`/`NG8107` extended-diagnostics warnings in `comments.store.spec.ts`. | **Accepted, non-blocking.** Pre-existing; unrelated to `p12-admin`. |
| **A3** | Apply-progress is split across Engram observations rather than one upserted artifact (migrated into #963). | **Accepted, non-blocking.** Compliance holds; single-artifact audit could be cleaner. |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-admin` created; the 4 MODIFIED merged
- [x] No leftover delta scaffolding in canonical specs (grep-verified)
- [x] Change folder moved to `openspec/changes/archive/2026-10-14-p12-admin/` with all artifacts
- [x] Change dir was untracked → used a filesystem `mv` (not `git mv`); orchestrator will stage it
- [x] Active `openspec/changes/` no longer contains `p12-admin/` (only `archive/`)
- [x] Engram archive report saved as `sdd/p12-admin/archive-report` (`capture_prompt: false`, type `architecture`)

## Next steps

`p12-admin` closes HANDOFF §10 Paso 7 (admin area) and makes `roleGuard` real. No blocking issues remain; the carried advisories are cosmetic/process-only. The only pending plan item is **Paso 8 — `p13-modo-previa`** (static preview mode: role switcher entering as any demo account without registration + optional prerendered `/plataforma` showcase; the extra p10 profiles become reachable there).
