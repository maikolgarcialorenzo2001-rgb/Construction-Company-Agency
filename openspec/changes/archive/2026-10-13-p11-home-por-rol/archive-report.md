# Archive Report: p11-home-por-rol

`p11-home-por-rol` is complete and archived. It adds a **role-aware entry home** at `/plataforma/inicio` (HANDOFF §10 Paso 5): each authenticated role lands on relevant work — worker "Mis postulaciones" (own applications), company "Mis vacantes" (own openings, client-side `companyId` filter) plus a "Publicar novedad" affordance, and an admin placeholder — while `/plataforma` keeps rendering the feed. It also fixes the W1-p10 defect: `JobsStore.loadApplication` is scoped to the caller's `applicantId` (no `items[0]` fallback) and the job-detail status block renders only for a `worker`. UI copy is es-AR; artifacts and commits are English. Verify passed **PASS** (0 CRITICAL, 0 WARNING; SUGGESTION-only advisories). Spec sync ran: **1 capability CREATED** (`platform-home`) and **3 MODIFIED** (`platform-jobs`, `platform-shell`, `site-shell-navigation`). `contracts/openapi.yaml` was **not touched**.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p11-home-por-rol` (role-aware home + W1-p10 applicant scoping fix) |
| Verify verdict | **PASS** (0 CRITICAL, 0 WARNING; SUGGESTION-only) |
| Work units | 3/3 complete — WU1 `163887d` + `9a0745a`, WU2 `40b909c` + `09286bf`, WU3 `8e55e7e` + `fb1bc76`, each on `main`, tagged `(p11-home-por-rol)` |
| Tasks | 15/15 complete (1.0–1.4, 2.0–2.4, 3.0–3.5) |
| Tests | 578/578 green (62 files); `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (21 prerendered static routes) |
| Capability changes | **1 CREATED** (`platform-home`), **3 MODIFIED** (`platform-jobs`, `platform-shell`, `site-shell-navigation`) |
| Contract | `contracts/openapi.yaml` untouched |
| Archive location | `openspec/changes/archive/2026-10-13-p11-home-por-rol/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p11-home-por-rol/archive-report` |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Change summary

| Piece | What it is | Evidence |
|---|---|---|
| **W1-p10 fix** | `JobsStore.loadApplication(jobId, applicantId?)` calls `applications.list({ jobId, applicantId })`; absent id settles on `none` (no `items[0]` fallback). Job-detail injects `SessionService`, passes `session.currentUser()?.userId`, and gates the status block on `effectiveRole() === 'worker' && application()`. | `163887d` — `jobs.store.ts`, `job-detail.page.ts` (+specs). |
| **`ApplicationsStore`** | New worker-applications surface: `signal<ApplicationsState>` with lifecycle `idle/loading/ready/empty`, `load(applicantId)` guarded re-loads, responses via `.set()` (mirrors `FeedStore`). | `40b909c` — `applications.store.ts` (+spec). |
| **`PlatformHomePage`** | Role-aware home at `/plataforma/inicio`; one `<h1>Inicio</h1>`; worker lists own applications with status labels, company filters `openings()` by `companyId === userId` + "Publicar novedad", admin static placeholder; effect tracks `session.currentUser()` with store calls in `untracked()`; testids `home-application`/`home-vacancy`/`home-publish`/`home-admin-placeholder`. | `40b909c` — `platform-home.page.ts` (+spec). |
| **Wiring** | Lazy `inicio` child at platform children index 1 (behind `authGuard`); "Inicio" prepended to `WORKER_NAV`/`COMPANY_NAV`; login/registro navigate to `/plataforma/inicio`; a11y `TARGET_PATHS` + release-matrix row added; `HANDOFF.md:15` false `roleGuard`/`data.roles` claim corrected (deferred to `p12-admin`). | `8e55e7e` — `app.routes.ts`, `nav.ts`, `login.page.ts`, `registro.page.ts`, `app.a11y.spec.ts`, `app.release-matrix.spec.ts`. |

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-home` | **Created** | NEW capability (no canonical dir existed). 4 ADDED requirements copied from the delta, scaffolding (`# Delta for platform-home`, `## ADDED Requirements`) stripped → `openspec/specs/platform-home/spec.md`. |
| `platform-jobs` | **Updated** | MODIFIED requirement *“Applications flow”* replaced in place: body extended with `loadApplication` applicant scoping (no `items[0]`) + worker-only status block; `(Previously:)` marker replaced; 3 new scenarios added (own status, unapplied worker → apply form, non-worker → no status). 2 other requirements preserved untouched (Jobs gateway port and board, Jobs signal store). |
| `platform-shell` | **Updated** | MODIFIED requirement *“Platform subtree route table”* replaced: `/plataforma/inicio` added to the child list; `(Previously:)` marker added; new scenario *“Home child is registered”*. 5 other requirements preserved untouched. |
| `site-shell-navigation` | **Updated** | MODIFIED requirement *“3. [B] Header navigation, phone reachability and promo strip”* replaced: leading "Inicio" item for worker/company + entry points land on `/plataforma/inicio`; new scenario *“Entry points land on the home”*. Stray `# Delta for site-shell-navigation` / `## MODIFIED Requirements` scaffolding left by a prior archive was removed; 5 other requirements preserved untouched. |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding remains in any canonical spec (grep-verified). Requirements not mentioned in the deltas were preserved. Requirement counts: `platform-jobs` 3, `platform-shell` 6, `site-shell-navigation` 6, `platform-home` 4.

## Accepted advisories (carried from verify — SUGGESTION only)

| # | Advisory | Disposition |
|---|---|---|
| **S1** | Angular extended-diagnostics warnings in `comments.store.spec.ts` during build (unrelated to p11). | **Accepted, non-blocking.** Not introduced by this change; tests, lint and build all pass. |
| **S2** | `platform-header.component.spec.ts` path required CLI globbing (tooling, not source). | **Accepted, non-blocking.** Suite green. |

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `163887d` | WU1 `fix(jobs): scope loadApplication by applicant and gate job-detail status (p11-home-por-rol)` |
| `9a0745a` | WU1 `docs(tasks): mark WU1 complete for p11-home-por-rol` |
| `40b909c` | WU2 `feat(platform): add ApplicationsStore and role-aware platform home (p11-home-por-rol)` |
| `09286bf` | WU2 `docs(tasks): mark WU2 complete for p11-home-por-rol` |
| `8e55e7e` | WU3 `feat(platform): wire /plataforma/inicio route, nav and entry redirect (p11-home-por-rol)` |
| `fb1bc76` | WU3 `docs(tasks): mark WU3 complete for p11-home-por-rol` |
| this commit | `docs(openspec): archive p11-home-por-rol with spec sync (p11-home-por-rol)` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-13-p11-home-por-rol/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed. `angular.json` (incidental `M`) deliberately **not** committed.

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p11-home-por-rol/explore` (#944) |
| Proposal | `proposal.md` | `sdd/p11-home-por-rol/proposal` (#946) |
| Spec (delta) | `specs/platform-home/spec.md`, `specs/platform-jobs/spec.md`, `specs/platform-shell/spec.md`, `specs/site-shell-navigation/spec.md` | `sdd/p11-home-por-rol/spec` (#947) |
| Design | `design.md` | `sdd/p11-home-por-rol/design` (#948) |
| Tasks | `tasks.md` | `sdd/p11-home-por-rol/tasks` (#949) |
| Apply progress | *(engram only)* | `sdd/p11-home-por-rol/apply-progress` (#950) |
| Verify report | `verify-report.md` | `sdd/p11-home-por-rol/verify-report` (#952) |
| Archive report | `archive-report.md` | `sdd/p11-home-por-rol/archive-report` (this save) |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-home` created; `platform-jobs`, `platform-shell`, `site-shell-navigation` modified
- [x] No leftover `## ADDED/MODIFIED` scaffolding in canonical specs (grep-verified)
- [x] Change folder moved to `openspec/changes/archive/2026-10-13-p11-home-por-rol/` with all present artifacts
- [x] Active `openspec/changes/` no longer contains `p11-home-por-rol/`
- [x] Entire moved archive directory staged (`git add -A`) so artifacts are **tracked**, not left untracked
- [x] Commit stages `openspec/` only — no `angular.json`, no `contracts/`, no push, no PR
- [x] Engram archive report saved as `sdd/p11-home-por-rol/archive-report` (`capture_prompt: false`, type `architecture`)

## Next steps

`p11-home-por-rol` closes HANDOFF §10 Paso 5 (role-aware home) and the W1-p10 applicant-scoping defect. No blocking issues remain; the two carried SUGGESTION advisories are cosmetic/unrelated. `roleGuard` remains explicitly deferred to `p12-admin`. Ready for the next planned change.
