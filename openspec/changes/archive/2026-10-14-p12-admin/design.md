# Design: p12-admin — Admin area (read-only directory + local config)

## Technical Approach

Approach A (idiomatic slice), 3 stacked work units. **WU1** adds `roleGuard` + the seeded admin account + login copy; **WU2** adds the admin data layer; **WU3** wires `AdminPage`, the 8th child, `ADMIN_NAV`, and the home link. Strict TDD: each WU lands its specs RED first. No `contracts/openapi.yaml` change.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Guard shape | Functional `CanActivateFn` reading `route.data['roles']` | Reusable; matches HANDOFF's `data.roles`; one `createUrlTree` handles both redirects |
| D2 | Composition | `canActivate: [authGuard, roleGuard]` | `authGuard` short-circuits anonymous; `roleGuard` defensive on `null` |
| D3 | Directory source | `AdminGateway` port + `ADMIN_GATEWAY` token → `MockAdminGateway` | Pages never import `Mock*`; swappable in one provider line |
| D4 | Directory model | `DirectoryUser { userId; email; role }` — no `password` | R5: a type cannot leak a field it lacks |
| D5 | Contract binding | **Keep `DirectoryUser` out of `contract-conformance.ts`** | No schema → the assert breaks `ng build` (R7) |
| D6 | Store shape | `AdminStore` mirrors `JobsStore`: `idle/loading/ready/empty`, guarded `load`, `roleFilter` signal | Matches the existing zoneless store convention |
| D7 | Counts | `counts` computed from the **filtered** list | Literal spec ("reflects the filtered totals"); facet alternative in Open Questions |
| D8 | Config | `AdminConfigStore` — 2 signal toggles in one `localStorage` key | Demo-only; mirrors `SessionService` |
| D9 | Nav | Own `ADMIN_NAV` = worker items + **leading** `Admin` → `/plataforma/admin` | Spec: "MUST NOT share the worker table" (R4) |
| D10 | R3 session | a11y + release-matrix seed an **admin** session | Admin renders every platform page (perfil → `none`, one h1) |

## Data Flow

```
AdminPage ─▶ AdminStore.load() ─▶ ADMIN_GATEWAY.listUsers() ─▶ MockAdminGateway
                                            │                        │
   roleFilter ─▶ filteredUsers ─▶ counts    │            DEMO_ACCOUNTS (password stripped)
   state signal(users) ◀──── DirectoryUser[] ┘
AdminPage ─▶ AdminConfigStore.set() ─▶ signal + localStorage
```

Route `/plataforma/admin`: admin → page; worker/company → `/plataforma/inicio`; anonymous → `/plataforma/login`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `core/platform/auth/role.guard.ts` (+`.spec.ts`) | Create | `roleGuard` `data.roles` gating |
| `core/platform/mocks/fixtures.ts` (+`.spec.ts`) | Modify | Seed `admin-1`; count 5→6 |
| `pages/plataforma/login.page.ts` (+`.spec.ts`) | Modify | Expose admin demo credential |
| `core/platform/domain/models.ts`, `domain/index.ts` | Modify | `DirectoryUser` via barrel |
| `core/platform/api/ports.ts` | Modify | `AdminGateway` + `ADMIN_GATEWAY` |
| `core/platform/api/mock-admin.gateway.ts` (+`.spec.ts`) | Create | Map accounts, strip `password` |
| `core/platform/store/admin.store.ts` (+`.spec.ts`) | Create | Directory store + filter + counts |
| `core/platform/store/admin-config.store.ts` (+`.spec.ts`) | Create | 2 toggles → `localStorage` |
| `pages/plataforma/admin.page.ts` (+`.spec.ts`) | Create | Directory table + config panel |
| `core/platform/nav.ts` (+`.spec.ts`) | Modify | `ADMIN_NAV` + role table |
| `platform-header/platform-header.component.spec.ts` | Modify | Admin labels incl. `Admin` |
| `pages/plataforma/platform-home.page.ts` (+`.spec.ts`) | Modify | Overview + link (retain testid) |
| `app.routes.ts` (+`.spec.ts`) | Modify | 8th child after `inicio` |
| `auth/auth.guard.spec.ts` | Modify | Guarded list gains `admin` |
| `app.a11y.spec.ts`, `app.release-matrix.spec.ts` | Modify | +`/plataforma/admin`; admin session |
| `HANDOFF.md` | Modify | Mark Paso 7 done |

## Interfaces / Contracts

```ts
export interface DirectoryUser { userId: string; email: string; role: Role; }
export interface AdminGateway { listUsers(): Promise<DirectoryUser[]>; }
export const ADMIN_GATEWAY = new InjectionToken<AdminGateway>('ADMIN_GATEWAY', {
  providedIn: 'root', factory: () => new MockAdminGateway()
});
export type RoleFilter = Role | 'all';

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const allowed = (route.data?.['roles'] ?? []) as readonly Role[];
  const role = session.role();
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree([role ? '/plataforma/inicio' : '/plataforma/login']);
};
```

`AdminPage` a11y: one `<h1>`; `<table>` with `<caption>` + `<th scope>`; labelled `<select>` filter; empty state when no rows; labelled checkboxes marked "demo".

## Testing Strategy

| WU | RED specs first | Pinned specs that move |
|----|-----------------|------------------------|
| WU1 | `role.guard.spec.ts` (4 redirect outcomes); `login.page.spec.ts` | `fixtures.spec.ts:159` (5→6, `admin-1`) |
| WU2 | `mock-admin.gateway.spec.ts` (maps 6, no password); `admin.store.spec.ts` (states/filter/counts); `admin-config.store.spec.ts` (persist + reload) | — |
| WU3 | `admin.page.spec.ts`; `nav.spec.ts`; `platform-header.component.spec.ts`; `platform-home.page.spec.ts`; `app.routes.spec.ts`; `auth.guard.spec.ts` | `app.a11y.spec.ts`, `app.release-matrix.spec.ts` (+ path, admin session) |

## Work Units

- **WU1** (`roleGuard` + account + login copy) — revertible; unlocks admin login before UI.
- **WU2** (data layer) — revertible; no consumers yet.
- **WU3** (page + wiring + specs) — revertible; restores 7 children + company sessions.

## Migration / Rollout

No migration required. Local commits on `main`, suffix `(p12-admin)`, no branches/PRs/push. Reverting any WU restores the baseline.

## Open Questions

- [ ] **Counts source (D7):** counts over the filtered list (unselected roles show 0); flip to full-list facets if intended.
- [ ] Exact es-AR toggle/link copy (`tasks` may pin strings).
