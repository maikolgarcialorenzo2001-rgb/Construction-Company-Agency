# Tasks: p12-admin — Admin area (read-only directory + local config)

## metadata
- change_id: p12-admin
- status: in_progress
- delivery_strategy: ask-on-risk
- chain_strategy: stacked-to-main (sequential local commits on `main`, suffix `(p12-admin)`; NO branches/PRs/push)
- approach: Approach A, 3 stacked work units

## Pinned test expectations (must satisfy)
- fixtures.spec.ts:159 — account count moves from 5 → 6 (includes `admin-1`)
- nav.spec.ts:28,32,43 — ADMIN_NAV split; admin nav not sharing WORKER_NAV (different array/table)
- platform-header.component.spec.ts:71 — admin labels (includes `Admin`)
- platform-home.page.spec.ts:143 — admin section links to `/plataforma/admin` (retain testid)
- app.routes.spec.ts:28,133-153 — 8th child (`/plataforma/admin`), child order: `inicio` before `admin`; index 2 for admin after `inicio`
- auth.guard.spec.ts:91 — guarded list gains `admin`
- app.a11y.spec.ts:19-33 — add `/plataforma/admin`; session → admin
- app.release-matrix.spec.ts:44-51 — add row; session → admin
- login.page.spec.ts — expose admin demo credential (`admin@demo.test` / `demo1234`)

## Work Units

### WU1 — `roleGuard` + admin demo account + login demo copy
**Goal:** Establish role gating foundation and seed admin demo account so admin login becomes playable before UI wiring.
**Base:** `main` | **Independently revertible:** Yes | **Lines forecast:** ~80–120
**Status:** ✅ Complete — focused specs 31/31 green; full suite 587/587 green.

Tasks:
- [x] Create `core/platform/auth/role.guard.ts` (`CanActivateFn`, `route.data['roles']`, defensive on missing/empty)
- [x] Create `core/platform/auth/role.guard.spec.ts` (admin allow, worker/company → inicio, anonymous → login, missing/empty defensive)
- [x] Seed `admin-1` in `core/platform/mocks/fixtures.ts` (`admin@demo.test` / `demo1234`; existing accounts untouched)
- [x] Update `core/platform/mocks/fixtures.spec.ts:159` → 6 accounts incl. `admin-1` (+ single-admin assertion)
- [x] Expose admin demo credential in `pages/plataforma/login.page.ts` (es-AR copy, `data-testid="demo-credentials"`) + spec
- [x] Focused verification: `role.guard.spec.ts`, `fixtures.spec.ts`, `login.page.spec.ts` → GREEN

Files:
- `core/platform/auth/role.guard.ts` (create)
- `core/platform/auth/role.guard.spec.ts` (create)
- `core/platform/mocks/fixtures.ts` (modify)
- `core/platform/mocks/fixtures.spec.ts` (modify)
- `pages/plataforma/login.page.ts` (modify)
- `pages/plataforma/login.page.spec.ts` (modify) — if tests expect demo list (verify existing; update if needed)

RED-first (TDD):
1. Write `role.guard.spec.ts` covering 4 outcomes:
   - Admin + allowed → returns true
   - Non-admin + allowed (worker/company) → redirects to `/plataforma/inicio`
   - Anonymous + allowed → redirects to `/plataforma/login`
   - Allowed list missing/empty → redirects based on session (defensive)
2. Seed `admin-1` in `fixtures.ts`: `userId: 'admin-1'`, `email: 'admin@demo.test'`, `role: 'admin'`, `password: 'demo1234'` (demo only). Keep existing accounts unchanged.
3. Update `fixtures.spec.ts:159` to assert 6 userIds (includes `admin-1`).
4. Expose admin demo credential in `login.page.ts` (es-AR copy). Update `login.page.spec.ts` to reflect admin demo copy present.

GREEN:
- Implement `roleGuard: CanActivateFn` (data.roles). Reads `route.data['roles']`, checks `session.role()`, returns `true` if match; else `router.createUrlTree([role ? '/plataforma/inicio' : '/plataforma/login'])`. Defensive on missing roles.

REFACTOR:
- Keep spec small; no network calls; mirror existing guard style.

Verification:
```bash
bunx ng test --watch=false --include="**/role.guard.spec.ts"
bunx ng test --watch=false --include="**/fixtures.spec.ts"
bunx ng test --watch=false --include="**/login.page.spec.ts"
```

Rollback boundary: removing `role.guard.*` and restoring fixtures to 5 accounts + login demo copy.

---

### WU2 — Admin data layer (`DirectoryUser`, `AdminGateway`, `MockAdminGateway`, stores)
**Goal:** Add read-only directory data model/port/gateway and the two stores (directory + demo config). No consumers yet (isolated).
**Base:** WU1 | **Independently revertible:** Yes | **Lines forecast:** ~180–260
**Status:** ✅ Complete — focused specs 19/19 green; full suite 606/606 green; `ng build` + `ng lint` clean.

Tasks:
- [x] Add `DirectoryUser` to `core/platform/domain/models.ts` (no `password`); barrel re-exports via `export *`
- [x] Add `AdminGateway` interface + `ADMIN_GATEWAY` token to `core/platform/api/ports.ts` (NOT in `contract-conformance.ts`)
- [x] Create `core/platform/api/mock-admin.gateway.ts` (maps `DEMO_ACCOUNTS` → `DirectoryUser`, strips `password`)
- [x] Create `core/platform/store/admin.store.ts` (states idle/loading/ready/empty, `roleFilter`, `filteredUsers`, `counts` over filtered list per D7, guarded `load`)
- [x] Create `core/platform/store/admin-config.store.ts` (2 toggles, single `localStorage` key read on init / written on change)
- [x] Focused verification: `mock-admin.gateway.spec.ts`, `admin.store.spec.ts`, `admin-config.store.spec.ts` → GREEN

Files:
- `core/platform/domain/models.ts` (modify)
- `core/platform/domain/index.ts` (modify)
- `core/platform/api/ports.ts` (modify)
- `core/platform/api/mock-admin.gateway.ts` (create)
- `core/platform/api/mock-admin.gateway.spec.ts` (create)
- `core/platform/store/admin.store.ts` (create)
- `core/platform/store/admin.store.spec.ts` (create)
- `core/platform/store/admin-config.store.ts` (create)
- `core/platform/store/admin-config.store.spec.ts` (create)

RED-first:
1. `mock-admin.gateway.spec.ts` — maps 6 accounts from `DEMO_ACCOUNTS`, returns `DirectoryUser[]` with `userId,email,role`, **never** includes `password`; lists all 6.
2. `admin.store.spec.ts` — states `idle/loading/ready/empty`; `load()` populates users; role filter narrows list; `counts` computed from **filtered** list (D7); empty filter → `empty` state.
3. `admin-config.store.spec.ts` — 2 toggles, each persisted to `localStorage` (same key), survive reload; labelled demo semantics tested via API (signals).

GREEN:
- `DirectoryUser { userId: string; email: string; role: Role }` (no password). Export via `domain/index.ts`.
- `AdminGateway` interface `{ listUsers(): Promise<DirectoryUser[]> }`; `ADMIN_GATEWAY = new InjectionToken<AdminGateway>('ADMIN_GATEWAY', { providedIn: 'root', factory: () => new MockAdminGateway() })` in `ports.ts`. **Do not** add to `contract-conformance.ts`.
- `MockAdminGateway` implements `AdminGateway`; maps `DEMO_ACCOUNTS` → `DirectoryUser` (strip `password`). Uses `inject()` if needed; plain mapping is fine.
- `AdminStore` mirrors `JobsStore` convention: signals for `users`, `state` (`idle|loading|ready|empty`), `roleFilter` (type `RoleFilter = Role | 'all'`), `filteredUsers`, `counts` (count per role + total) — **counts over filtered list** per D7. Guarded `load()` (idempotent).
- `AdminConfigStore` — 2 signal toggles, persist both under a single `localStorage` key (e.g. `admin-config`), read on init, write on changes. Marked demo-only in UI later (WU3).

REFACTOR:
- No leaks of mock types into pages. Ports/adapters pattern respected.

Verification:
```bash
bunx ng test --watch=false --include="**/mock-admin.gateway.spec.ts"
bunx ng test --watch=false --include="**/admin.store.spec.ts"
bunx ng test --watch=false --include="**/admin-config.store.spec.ts"
```

Rollback boundary: revert data-layer files (no consumers yet).

---

### WU3 — `AdminPage` + route/roleGuard wiring + `ADMIN_NAV` + home link + cross-suite updates
**Goal:** Implement admin UI, wire route with `[authGuard, roleGuard]`, add `ADMIN_NAV`, update home/login/nav/header/specs and a11y/release-matrix for admin session.
**Base:** WU2 | **Independently revertible:** Yes | **Lines forecast:** ~200–300
**Status:** ✅ Complete — focused + full suite 620/620 green; `ng lint`, `ng build` clean.

Files:
- `pages/plataforma/admin.page.ts` (create)
- `pages/plataforma/admin.page.spec.ts` (create)
- `core/platform/nav.ts` (modify)
- `core/platform/nav.spec.ts` (modify)
- `pages/plataforma/platform-header.component.spec.ts` (modify)
- `pages/plataforma/platform-home.page.ts` (modify)
- `pages/plataforma/platform-home.page.spec.ts` (modify)
- `pages/plataforma/login.page.ts` (modify — verify demo copy; may already done)
- `pages/plataforma/login.page.spec.ts` (modify if needed)
- `app.routes.ts` (modify)
- `app.routes.spec.ts` (modify)
- `core/platform/auth/auth.guard.spec.ts` (modify)
- `app.a11y.spec.ts` (modify)
- `app.release-matrix.spec.ts` (modify)
- [x] `HANDOFF.md` (modify) — mark Paso 7 done.

RED-first:
1. `admin.page.spec.ts` — admin reaches area; anonymous redirects (via route); non-admin redirects; directory lists 6 accounts (password never rendered); role filter narrows + counts reflect filtered totals (D7); empty filter shows empty state; 2 demo toggles present and labelled "demo"; toggles persist across reload.
2. Update specs per pinned list: `nav.spec.ts:28,32,43` for admin nav (own table, not sharing WORKER_NAV); `platform-header.component.spec.ts:71` admin labels; `platform-home.page.spec.ts:143` admin link; `app.routes.spec.ts:28,133-153` (8th child, order `admin` after `inicio`, index 2); `auth.guard.spec.ts:91` add `admin` to guarded list; `app.a11y.spec.ts:19-33` add `/plataforma/admin`, use admin session for relevant rows; `app.release-matrix.spec.ts:44-51` add row, session → admin.

GREEN:
- `AdminPage` (standalone component, signals): injects `AdminStore`, `AdminConfigStore`, `SessionService`, `ADMIN_GATEWAY` (via token) or rely on store load. Renders directory table with `<caption>`, `<th scope="col">` for headers; role filter `<select>` labelled; empty state when filtered empty; config panel with 2 checkboxes labelled "demo" (e.g. es-AR: "Marcado como demo"). No password rendering. `load()` called on init. One `<h1>` (a11y). Follows zoneless signals.
- `ADMIN_NAV`: own array (not reference to `WORKER_NAV`). Shape: leading `Admin` item → `/plataforma/admin`, plus worker destinations as in spec (Inicio/Novedades/Trabajos/Mi perfil). Admin nav is separate table (R4). `nav.ts` updated to export/return `ADMIN_NAV` for admin role; update navigation logic to select `ADMIN_NAV` when `role==='admin'`.
- `platform-home.page.ts`: for admin, show short overview (keep `data-testid="home-admin-placeholder"` present per modified delta) and add link to `/plataforma/admin`. Non-admin never sees link (verified by spec).
- `app.routes.ts`: add 8th child `/plataforma/admin` after `inicio`. `canActivate: [authGuard, roleGuard]`, `data: { roles: ['admin'], seo: NOINDEX }`, lazy load `AdminPage`. Child order: `inicio` index 1, `admin` index 2 (after `inicio`).
- `a11y.spec.ts`: add target `/plataforma/admin`; ensure admin session seeded where appropriate (R3). Admin renders every platform page (perfil → `none`, one h1).
- `release-matrix.spec.ts`: add row for `/plataforma/admin`; admin session.
- `auth.guard.spec.ts`: guarded children list includes `admin`.
- `HANDOFF.md`: mark Paso 7 done.

REFACTOR:
- Keep UI copy es-AR; code/comments/identifiers English. No images, semantic HTML.

Verification:
```bash
bunx ng test --watch=false --include="**/admin.page.spec.ts"
bunx ng test --watch=false --include="**/nav.spec.ts"
bunx ng test --watch=false --include="**/platform-header.component.spec.ts"
bunx ng test --watch=false --include="**/platform-home.page.spec.ts"
bunx ng test --watch=false --include="**/app.routes.spec.ts"
bunx ng test --watch=false --include="**/auth.guard.spec.ts"
bunx ng test --watch=false --include="**/app.a11y.spec.ts"
bunx ng test --watch=false --include="**/app.release-matrix.spec.ts"
```

Rollback boundary: revert UI/wiring/specs. Each WU remains independently revertible.

## Full suite check (optional but recommended)
```bash
bunx ng test --watch=false
```

## Review Workload Forecast

- **Total changed lines (estimated):** ~460–680
  - WU1: ~80–120
  - WU2: ~180–260
  - WU3: ~200–300
- **Decision needed before apply:** Yes (stacked WUs; forecast >400)
- **Chained PRs recommended:** Yes (stacked-to-main, 3 work units)
- **400-line budget risk:** High
- **Recommended delivery:** stacked-to-main — commit WU1 `(p12-admin)`, then WU2 `(p12-admin)`, then WU3 `(p12-admin)` (sequential on main; no branches/PRs/push)
- **Risks noted:** R1 (admin account + count pin), R3 (a11y/release-matrix session → admin), R4 (ADMIN_NAV separate from WORKER_NAV), R7 (keep DirectoryUser/AdminGateway out of contract-conformance)
- **D7 resolution:** counts computed over filtered list (documented/tested)

## artifacts
- file: openspec/changes/p12-admin/tasks.md (disk)
- engram_topic_key: sdd/p12-admin/tasks
- engram_type: architecture
- engram_project: construction-company-agency
- engram_capture_prompt: false

## next_recommended
- sdd-apply, starting WU3 (`AdminPage` + route/roleGuard wiring + `ADMIN_NAV` + home link + cross-suite updates)
