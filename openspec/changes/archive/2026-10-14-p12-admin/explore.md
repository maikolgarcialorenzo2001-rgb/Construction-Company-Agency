# Exploration: p12-admin — Admin area (HANDOFF §10 Paso 7)

> Mode: hybrid · Strict TDD (`bunx ng test --watch=false`) · BUN only · `contracts/openapi.yaml` **READ-ONLY** · Roles exactly `worker | company | admin` · UI es-AR · artifacts/commits English · delivery `stacked-to-main` on `main`, suffix `(p12-admin)`, no branches/PRs/push.

## TL;DR

- **Spec delta: YES.** NEW `platform-admin` + MODIFIED `platform-shell`, `site-shell-navigation`, `platform-home`, and a light MODIFIED `platform-identity`. **No contract change.**
- **`roleGuard` MUST be built here** — it does not exist (only `authGuard`; no `data.roles`). Cleanest: functional `CanActivateFn` reading `route.data['roles']`, composed as `canActivate: [authGuard, roleGuard]`.
- **There is NO admin demo account.** `DEMO_ACCOUNTS` seeds 5 (worker/company only). "Playable in demo" is impossible until an `admin-1` account is added to `fixtures.ts` — and `fixtures.spec.ts:159` pins the exact 5-account list.
- **What "admin area" means, grounded in fixtures:** a read-only **users/roles directory** (the 5+1 accounts + their profiles/roles, password-stripped) plus a **local configuration panel** (no config model exists today → new, localStorage-backed). No backend, no writes that survive a reload.
- **Size ~450–650 lines across ~14 files → HIGH 400-line budget risk.** Forecast: 3 stacked work units.

---

## 1. Current state (verified)

| Concern | Reality | Evidence |
|---|---|---|
| Gating | `authGuard` only; **no `roleGuard`, no `data.roles`** anywhere | `core/platform/auth/auth.guard.ts:11-16` |
| Admin demo login | **None.** 5 accounts: `lucia@`(worker-1), `norte@`(company-1), `martin@`(worker-2), `sofia@`(worker-3), `delta@`(company-2) | `mocks/fixtures.ts:499-544` |
| Admin registration | Blocked (`throw 'Rol no permitido para el registro'`) | `mock-auth.gateway.ts:28-30` |
| Admin nav | Reuses `WORKER_NAV` (same array ref) | `core/platform/nav.ts:30-34` |
| Admin home | Static placeholder `data-testid="home-admin-placeholder"` ("en preparación") | `platform-home.page.ts:98-103` |
| Admin perfil | No branch → falls through to `status = 'none'` | `perfil.page.ts:218-242` |
| Route children | Exactly 7, order-sensitive | `app.routes.ts:103-171`; `app.routes.spec.ts:28-36` |
| Config concept | **Does not exist** anywhere (SEO/data/config sources only) | repo grep |

### Pinned specs that will move (blast radius)

| File | Pin | Change |
|---|---|---|
| `core/platform/mocks/fixtures.spec.ts:159` | exact 5 userIds | add `admin-1` → 6 |
| `core/platform/nav.spec.ts:28,32,43` | admin **same array ref** as worker; slug/path invariant | admin gets its own table + `admin` item |
| `pages/plataforma/platform-header.component.spec.ts:71` | admin → worker labels | admin labels incl. Admin |
| `pages/plataforma/platform-home.page.spec.ts:143` | admin placeholder, no controls | admin section links into the area |
| `pages/plataforma/platform-home.page.ts:98` + `openspec/specs/platform-home` | "en preparación" placeholder | replace/link |
| `app.routes.spec.ts:28,133-153` | `PLATFORM_CHILD_PATHS` (7) + `it.each` | + `admin` child |
| `core/platform/auth/auth.guard.spec.ts:91` | guarded list `['','inicio','trabajos','trabajos/:id','perfil']` | + `admin` |
| `app.release-matrix.spec.ts:44-51` | one row per platform route | + `/plataforma/admin` (see R3) |
| `app.a11y.spec.ts:19-33` | `TARGET_PATHS` | + `/plataforma/admin` (see R3) |
| `pages/plataforma/login.page.ts:64-67` | demo credential copy | expose admin demo login |

`app.spec.ts` uses its **own** stub route table → unaffected.

---

## 2. Spec-delta decision

| Capability | NEW / MODIFIED | Why | Confidence |
|---|---|---|---|
| `platform-admin` | **NEW** | Admin-only area: role gating, directory, config; no capability covers this | High |
| `platform-shell` | **MODIFIED** | Route table gains an 8th child (`/plataforma/admin`) + guarded-children rule | High |
| `site-shell-navigation` | **MODIFIED** | Platform nav: `admin` gets its own items incl. Admin (currently shares worker) | High |
| `platform-home` | **MODIFIED** | "Admin home — minimal overview placeholder / no controls" requirement is superseded | High |
| `platform-identity` | **MODIFIED (light)** | Adds a seeded admin demo account + login copy; `register` still rejects admin | Medium |

**Decision:** `platform-admin` is the one NEW capability; the four MODIFIED deltas are wiring/continuity. `contracts/openapi.yaml` untouched.

---

## 3. `roleGuard` — design & blast radius

**Recommended (data-driven functional guard):**

```ts
export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const allowed = (route.data?.['roles'] ?? []) as readonly Role[];
  const role = session.role();
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree([role ? '/plataforma/inicio' : '/plataforma/login']);
};
```

| Design choice | Option A — `data.roles` (recommended) | Option B — hardcoded session check |
|---|---|---|
| Flexibility | Any future guarded route reuses it | Admin-only, single purpose |
| Idiomatic Angular | Matches HANDOFF's original "`roleGuard` con `data.roles`" claim | Diverges from the documented shape |
| Anonymous handling | Guard redirects `null` → login | Needs a separate anonymous branch |
| Cost | ~15 LOC + spec | ~12 LOC + spec |
| Verdict | **Choose A** | Fallback only |

**Blast radius (route table + specs):**
- `app.routes.ts` — admin child: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['admin'], seo: NOINDEX(...) }`, lazy `AdminPage`. Compose both so auth semantics stay explicit; `roleGuard` alone would also work.
- `core/platform/nav.ts` — split `admin` out of `WORKER_NAV` into its own `ADMIN_NAV`. **Decision point:** does the admin nav keep the worker work items (Inicio/Novedades/Trabajos/…)? Recommended: yes, plus a leading/adding `Admin` item. That breaks `nav.spec.ts:28` (same-ref) and the slug/path invariants.
- `auth.guard.spec.ts:86-95` — guarded-children pin gains `admin`.
- `app.routes.spec.ts` — `PLATFORM_CHILD_PATHS`, `it.each` selector row (`app-platform-admin`).
- `app.release-matrix.spec.ts` + `app.a11y.spec.ts` — add the route (see R3).

---

## 4. What "admin area" concretely means (grounded, no backend)

### Data that exists today

| Entity | Source | Admin use | Notes |
|---|---|---|---|
| Accounts (5) | `DEMO_ACCOUNTS` | **Directory rows** | includes `password` → MUST strip before render |
| Worker profiles (3) | `WORKER_PROFILES` | role/name enrichment | keyed by `userId` |
| Company profiles (2) | `COMPANY_PROFILES` | role/name enrichment | keyed by `companyId` |
| Jobs (7) / Apps (7) / Posts (9) / Comments (12) | fixtures | platform metrics (optional) | read via existing gateways |
| Config entity | — | **MISSING** | must be created (new, local) |

### Proposed surface (playable demo)

| Block | Content (es-AR) | Data path | New surface |
|---|---|---|---|
| **Usuarios y roles** | Table: email · role badge · userId; role filter; per-role counts | NEW `AdminGateway.listUsers()` → `DirectoryUser[]` (no password) | port + mock + store |
| **Configuración** | Local toggles (e.g. "Mostrar aviso de demo", "Permitir registro de empresas"), persisted to `localStorage` | NEW `AdminConfigStore` (signals) | store only |

**Read-only honesty:** the mock auth adapter copies `DEMO_ACCOUNTS` per instance, so in-memory role edits would not propagate to login/nav. v1 therefore ships **view + filter + local config**, labelled demo — not persistent role mutation. (If "gestión" must mutate, it becomes a separate, larger discussion — see Q1.)

### New data-layer shape (mirrors `ports.ts`)

```
domain/models.ts        + export interface DirectoryUser { userId; email; role }
api/ports.ts            + AdminGateway { listUsers(): Promise<DirectoryUser[]> }
                        + ADMIN_GATEWAY token → factory: MockAdminGateway
api/mock-admin.gateway.ts  NEW — maps DEMO_ACCOUNTS, strips `password`
store/admin.store.ts       NEW — signals (idle/loading/ready/empty) + role filter
store/admin-config.store.ts NEW — signals + localStorage key
```

⚠️ **Do NOT add `AdminGateway`/`DirectoryUser` to `contract-conformance.ts`** — no OpenAPI schema behind it (same guard as `Comment`; a pairing there breaks `ng build`, HANDOFF §6).

---

## 5. Where it lives

- **New lazy child `/plataforma/admin`** behind `[authGuard, roleGuard]`, `data.roles = ['admin']`, noindex. Sits after `inicio` among the platform children.
- **Relationship to the p11 admin home:** the p11 placeholder *stays the admin landing* at `/plataforma/inicio`, but its copy changes from "en preparación" to a short overview **linking to `/plataforma/admin`** (the full tooling). The `platform-home` MODIFIED delta rewrites the "Admin home" requirement; the `home-admin-placeholder` testid is retained to minimize churn (link added alongside).
- Non-admin hitting `/plataforma/admin` → redirected to `/plataforma/inicio`; anonymous → `/plataforma/login`.

---

## 6. Approaches

| # | Approach | Pros | Cons | Effort |
|---|---|---|---|---|
| **A** | **Full idiomatic slice** — `roleGuard` + `AdminGateway` port/mock + `AdminStore` + `AdminConfigStore` + `AdminPage` + route + nav + demo admin account | Matches ports/adapters + zoneless-signals conventions; swappable; honest demo; testable seams | ~14 files; over budget → stacked WUs; touches many pinned specs | **High** |
| **B** | **Lighter** — `roleGuard` + `AdminPage` mapping fixtures via one thin store (still a gateway internally) | Fewer files | Still a port; little saved vs A | Med |
| **C** | **Static** — `AdminPage` renders a hardcoded table + static toggles, no gateway/store | Fastest; smallest diff | Violates "pages never import Mock*/fixtures"; not reactive; weak demo | Low |

### Recommendation: **Approach A**, split into 3 stacked work units

| Unit | Goal | Base | Independently revertible |
|---|---|---|---|
| **WU1** | `roleGuard` + admin demo account (`fixtures.ts` + `fixtures.spec.ts` + login copy) | main | Yes — unlocks login before any admin UI |
| **WU2** | Admin data layer: `DirectoryUser` + `AdminGateway`/`MockAdminGateway`/token + `AdminStore` + `AdminConfigStore` (+specs) | WU1 | Yes |
| **WU3** | `AdminPage` + route/roleGuard wiring + admin nav + home link + `app.routes.spec`/`auth.guard.spec`/`a11y`/`release-matrix` specs | WU2 | Yes |

---

## 7. Risks / gotchas

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **No admin demo account** — the whole deliverable is unplayable until one exists; `fixtures.spec.ts:159` pins the exact list | **HIGH** | WU1 adds `admin-1` + updates the count spec (+ login copy) |
| R2 | `roleGuard` absent — gating has no foundation | **HIGH** | WU1 builds it; keep `register` admin-reject unchanged |
| R3 | **Release-matrix / a11y seed a `company` session** — navigating `/plataforma/admin` under roleGuard redirects to `/plataforma/inicio`; the row then audits the home, not admin (silent blind spot) | **HIGH** | Switch those suites' seeded session to `admin` (admin renders every platform page except its own is fine: perfil → `none`, still 1 h1), or add a per-row session override |
| R4 | `admin` nav currently shares `WORKER_NAV` (same array ref, asserted by `nav.spec.ts:28`) | MED | Give admin its own table; update `nav.spec.ts` + header spec |
| R5 | Password leakage if the directory reads `DemoAccount` raw | MED | `DirectoryUser` strips `password`; gateway maps, never returns it |
| R6 | In-memory role edit gives a false "it saved" impression | MED | Ship view-only + local config; label demo copy |
| R7 | Adding `DirectoryUser` to `contract-conformance.ts` breaks `ng build` | MED | Keep out of the build-program binding (HANDOFF §6) |
| R8 | `platform-home` "no admin controls" scenario contradicts a link/overview | LOW | MODIFIED delta rewrites the requirement; keep testid, add link |

---

## 8. Open questions (for proposal)

1. **"Gestión" depth:** read-only directory + local config (recommended, fits static demo), or attempt in-memory role mutation (larger, non-persistent)? — *default: read-only + config.*
2. **Admin nav shape:** add an `Admin` item to the admin's existing work nav, or replace with an admin-only nav? — *default: existing items + `Admin`.*
3. **Config scope:** which 2–3 toggles ship, and do they bind to any real behavior or are they demo-only? — *default: 2 demo-only toggles, localStorage.*
4. **Demo admin credential:** confirm `admin@demo.test` / `demo1234` / `userId admin-1`. — *default: as stated.*

---

## 9. Size / review forecast

| Item | Estimate |
|---|---|
| Files touched/created | ~14 (WU1: 4 · WU2: 7 · WU3: 6) |
| Changed lines | WU1 ~80–120 · WU2 ~180–260 · WU3 ~200–300 → **~460–680** |
| 400-line budget risk | **High** → stack WU1→WU2→WU3 |
| Decision needed before apply: **Yes** | Chained PRs recommended: **Yes** · Chain: **stacked-to-main** |

**Affected files (draft):** `core/platform/auth/role.guard.ts`(+spec) · `core/platform/domain/models.ts`, `domain/index.ts` · `core/platform/api/ports.ts`, `mock-admin.gateway.ts`(+spec) · `core/platform/store/admin.store.ts`(+spec), `admin-config.store.ts`(+spec) · `core/platform/mocks/fixtures.ts`(+spec) · `core/platform/nav.ts`(+spec) · `pages/plataforma/admin.page.ts`(+spec) · `pages/plataforma/platform-home.page.ts`(+spec) · `pages/plataforma/login.page.ts`(+spec) · `app.routes.ts`(+spec) · `app.a11y.spec.ts` · `app.release-matrix.spec.ts` · `HANDOFF.md`.

---

## 10. Ready for Proposal

**Yes** — the fork is small and defaults are stated (§8). Proposal should lock: `platform-admin` (NEW) + 4 MODIFIED deltas, the `roleGuard` `data.roles` design, the read-only-directory + local-config scope, and the 3-WU stacked split.
