# Tasks: p7-role-aware-nav

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ≈185 (additions + deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | none — 2 local work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (sequential local commits on `main`) |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
```

No branches/PRs/pushes; each work unit = one local commit ending `(p7-role-aware-nav)`. Strict TDD; test via `bunx ng test --watch=false`. New specs precede their production edits (`nav.spec.ts` first). `contracts/openapi.yaml` READ-ONLY.

### Suggested Work Units

| Unit | Goal | Commit suffix | Notes |
|------|------|---------------|-------|
| WU1 | Pure role→nav mapping (`nav.ts` + new `nav.spec.ts`) | `…(p7-role-aware-nav)` | Independent; nav.spec ships with nav.ts |
| WU2 | Role-aware header (component + new spec) | `…(p7-role-aware-nav)` | Needs WU1 `platformNavFor`; drops temp `platformNav` alias |
| WU3 | Full gate | not committed | Run after WU2 |

## Phase 1 — WU1: Pure role→nav mapping

Spec: `site-shell-navigation` — worker/admin shared nav, company relabeled, anonymous none.

- [x] 1.1 RED `src/app/core/platform/nav.spec.ts` (new, pure — no TestBed): `platformNavFor(null)` ⇒ `[]`; `worker` labels `['Novedades','Trabajos','Mi perfil']`.
- [x] 1.2 RED same file: `company` ⇒ `['Novedades','Vacantes','Mi empresa']`; `admin` deep-equals `worker` (same array ref).
- [x] 1.3 RED same file: slugs `['feed','trabajos','perfil']` and paths `/plataforma`, `/plataforma/trabajos`, `/plataforma/perfil` invariant across roles.
- [x] 1.4 GREEN `src/app/core/platform/nav.ts`: type-only `Role` (`./domain`) + `NavItem` imports; `WORKER_NAV`/`COMPANY_NAV`; `PLATFORM_NAV_BY_ROLE: Record<Role, readonly NavItem[]>` (admin → `WORKER_NAV` same ref); export `platformNavFor(role: Role | null)`. Keep `platformNav` temporarily (removed in 2.5).
- [x] 1.5 Verify WU1: `bunx ng test --watch=false` green; commit both files.

## Phase 2 — WU2: Role-aware platform header

Spec: `site-shell-navigation` — role-aware platform nav across worker/admin/company/anonymous, login/logout reactivity, demo pill.

- [x] 2.1 RED `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` (new; `imports:[PlatformHeaderComponent]`, `providers:[provideRouter([])]`): default (no role/session) ⇒ **no `<nav>`**, pill "Modo demo" present; `role='worker'` ⇒ Trabajos/Mi perfil; `role='admin'` ⇒ worker labels; `role='company'` ⇒ Vacantes/Mi empresa.
- [x] 2.2 RED same file: hrefs stay `/plataforma`, `/plataforma/trabajos`, `/plataforma/perfil`; exactly one `a[href="/plataforma"]`; no marketing promo strip.
- [x] 2.3 RED same file: seed `SESSION_STORAGE_KEY` company session (mirror `feed.page.spec.ts`) ⇒ company labels, no input; then `session.logout()` ⇒ `<nav>` removed; post-render `setInput('role','worker')` ⇒ items appear.
- [x] 2.4 GREEN `platform-header.component.ts`: import `platformNavFor`; `inject(SessionService)`; `readonly role = input<Role | null>(null)`; `effectiveRole = computed(() => this.role() ?? this.session.role())`; `nav = computed(() => platformNavFor(this.effectiveRole()))`; wrap the `<nav>` block in `@if (nav().length) { … }`; keep the pill unconditional.
- [x] 2.5 GREEN `src/app/core/platform/nav.ts`: remove the temporary `platformNav` const (single consumer migrated).
- [x] 2.6 Verify WU2: `bunx ng test --watch=false` green; commit the three files.

## Phase 3 — WU3: Full gate (no commit)

- [x] 3.1 Run the full gate: `bunx ng test --watch=false`, `bunx ng lint`, `bunx ng build`, `bun run gate` (present in `package.json`).
- [x] 3.2 Regression: `app.a11y.spec.ts` zero violations (10 paths); `git diff contracts/` empty.
- [x] 3.3 `git status` clean; no stray files; `nav.ts` no longer exports `platformNav`.
