# Design: Role-aware platform navigation

## Technical Approach

Split the concern in two: `nav.ts` becomes a **pure** `platformNavFor(role)` function that
owns the role→items mapping *and* the no-session rule (`null → []`); `PlatformHeaderComponent`
becomes a thin renderer that reads its effective role from a `role` input falling back to
`SessionService`, computes the items, and gates the `<nav>` landmark on `nav().length`. This
mirrors the established `effectiveRole` seam in `feed.page.ts:76-79` / `job-detail.page.ts:98-102`
and keeps all role logic testable without TestBed in `nav.spec.ts`. Maps to proposal §Approach and
the `site-shell-navigation` delta (role-aware platform nav).

## Architecture Decisions

| Decision | Options | Tradeoff (+/-) | Chosen |
|---|---|---|---|
| Mapping home | A1 pure fn in `nav.ts` / A2 data const + component branch / A3 second array | A1: one fallback spot, exhaustiveness, zero-TestBed test · +indirection | **A1** |
| No-session rule | B1 in mapping (`null → []`) / B2 component `@if(isAuthenticated())` | B1: single source of truth · component still gates empty landmark | **B1** |
| Test seam | C1 `role` input + `effectiveRole` / C2 seed storage only | C1 matches 2 existing pages, no storage setup for role cases | **C1** |
| Empty landmark | gate `<nav>` on `nav().length` / always render | gating avoids a dead a11y landmark for anonymous | **gate** |

`nav.ts` stays dependency-free: only a **type-only** `Role` import (`./domain`, itself type-only)
alongside `NavItem`. `admin` reuses the `worker` table (same array reference) — exhaustive
`Record<Role, …>` makes a future 4th role a compile error.

## Data Flow

```
role input ─┐
            ├─► effectiveRole() ─► platformNavFor(role) ─► nav() ─► @if(nav().length) ─► <nav>
session.role ┘        (computed)                        (computed)                    + pill (always)
```

## Interfaces / Contracts

```ts
// nav.ts
import type { Role } from './domain';
import type { NavItem } from '../../../content/content.types';

const WORKER_NAV: readonly NavItem[] = [
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Trabajos', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi perfil', path: '/plataforma/perfil' }
];
const COMPANY_NAV: readonly NavItem[] = [
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Vacantes', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi empresa', path: '/plataforma/perfil' }
];
const PLATFORM_NAV_BY_ROLE: Record<Role, readonly NavItem[]> = {
  worker: WORKER_NAV,
  company: COMPANY_NAV,
  admin: WORKER_NAV
};
export const platformNavFor = (role: Role | null): readonly NavItem[] =>
  role === null ? [] : PLATFORM_NAV_BY_ROLE[role];

// platform-header.component.ts (additions)
private readonly session = inject(SessionService);
readonly role = input<Role | null>(null);
protected readonly effectiveRole = computed(() => this.role() ?? this.session.role());
protected readonly nav = computed(() => platformNavFor(this.effectiveRole()));
```

Template: wrap the existing `<nav>` block in `@if (nav().length) { … }`; keep the "Modo demo"
pill unconditional. Slugs/paths unchanged → `track item.slug` and `routerLinkActiveOptions` are
unaffected.

## Testing Strategy (Strict TDD — RED first)

| Spec (NEW) | RED→GREEN cases |
|---|---|
| `src/app/core/platform/nav.spec.ts` (pure, no TestBed) | `null ⇒ []`; worker labels Novedades/Trabajos/Mi perfil; company labels Novedades/**Vacantes**/**Mi empresa**; `admin` deep-equals worker (same ref); slugs `['feed','trabajos','perfil']` invariant across roles; paths stable |
| `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` (TestBed + `provideRouter([])`) | default (no role/session) ⇒ **no `<nav>`**, pill present; `role='worker'` ⇒ Trabajos/Mi perfil; `role='company'` ⇒ Vacantes/Mi empresa; `role='admin'` ⇒ worker labels; **seeded company session** (no input) ⇒ company labels; seeded session then `session.logout()` ⇒ nav removed (guarded reactivity); pill "Modo demo" present in every state; hrefs stay `/plataforma`, `/plataforma/trabajos`, `/plataforma/perfil` |

Session seeding mirrors `feed.page.spec.ts` (`localStorage.setItem(SESSION_STORAGE_KEY, …)`).
Because there is no existing header spec, it is created new; run `bunx ng test --watch=false`.

## Migration / Rollout

No migration required. Single consumer of `platformNav` (the header) is updated in the same
change; no route, contract, or data impact. Rollback = revert the change commits.

## Change Impact

| File | Action | ~Δ lines |
|---|---|---|
| `src/app/core/platform/nav.ts` | Modify | +22 / −5 |
| `src/app/pages/plataforma/platform-header/platform-header.component.ts` | Modify | +10 / −3 |
| `src/app/core/platform/nav.spec.ts` | Create | ~55 |
| `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` | Create | ~90 |
| `openspec/specs/site-shell-navigation/spec.md` | Modify (spec phase) | delta |

Total ≈ **185** changed lines → under the 400 budget → **single PR**.

## Adherence Check (vs proposal)

| Proposal item | Design |
|---|---|
| `platformNavFor(role): readonly NavItem[]`, internal `Record`, `null → []` | ✅ Interfaces |
| `company` Vacantes/Mi empresa; admin = worker; slugs stable | ✅ role table |
| Header: inject session, `role` input, `effectiveRole`, computed nav, gated `<nav>`, keep pill | ✅ Approach/Data Flow |
| `nav.spec.ts` + header spec new, RED first | ✅ Testing Strategy |
| `openapi.yaml` untouched; no new pages/guards | ✅ out of scope |

## Open Questions

None — proposal §Resolved Open Decisions covers pill, `Novedades` label, seam, and delta target.
