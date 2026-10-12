# Exploration: p7-role-aware-nav

Paso 2 of the HANDOFF §10 plan. Make the platform header/nav role-aware: label changes for
`company`, identical destinations otherwise, and **no work nav when there is no session**
(login/registro). No contract change; the 4th/moderation role is explicitly OUT of scope.

## Current State (verified)

**The nav data**
- `src/app/core/platform/nav.ts:8-12` — `export const platformNav: readonly NavItem[]`, a flat
  `as const` array of 3 items: `feed`→`Novedades` `/plataforma`, `trabajos`→`Trabajos`
  `/plataforma/trabajos`, `perfil`→`Mi perfil` `/plataforma/perfil`. `NavItem`
  (`src/content/content.types.ts:62-69`) is `{ slug, label, path }`, type-only import so the
  module stays dependency-free (mirrors `platform-paths.ts`).
- A single literal shape for ALL roles today; no role input.

**The component**
- `src/app/pages/plataforma/platform-header/platform-header.component.ts:45-47` — OnPush, no
  `styleUrl`, inline template; **does NOT inject `SessionService`**; exposes
  `protected readonly nav = platformNav;`.
- Template `:20-35` — `<nav aria-label="Navegación de la plataforma">` with
  `@for (item of nav; track item.slug)`, each `<a [routerLink]="item.path">` +
  `routerLinkActive`, `[routerLinkActiveOptions]="{ exact: item.path === '/plataforma' }"`,
  `ariaCurrentWhenActive="page"`.
- `:37-40` — the "Modo demo" pill (`<span>Modo demo</span>`), unconditional.
- `imports: [RouterLink, RouterLinkActive]` only.

**The session source**
- `src/app/core/platform/auth/session.service.ts:63-74` — `SessionService` exposes
  `currentUser` (computed), `role` (computed, `Role | null`) and `isAuthenticated` (computed).
  `role()` is `null` for anonymous (`session()?.user.role ?? null`).
- `src/app/core/platform/domain/models.ts:13` — `Role = 'worker' | 'company' | 'admin'`
  (3 roles only — matches the goal; no 4th role).

**Where the header renders / route reality**
- `src/app/app.html:2-6` — `<app-platform-header />` renders whenever `isPlatform()` is true,
  which is purely URL-derived (`app.ts:39-45`, `isPlatformPath`). It is **session-agnostic**: it
  renders on `/plataforma/login` and `/plataforma/registro` too.
- `src/app/app.routes.ts:104-160` — `/plataforma` (feed), `/plataforma/trabajos`,
  `/plataforma/trabajos/:id`, `/plataforma/perfil` are `canActivate: [authGuard]`; **`login`
  (`:133-141`) and `registro` (`:142-150`) are unguarded**. So the only place a real session is
  absent is login/registro (and the pre-hydration/transient moment) — exactly the no-nav case.

**Role→X mapping precedent to mirror**
- `feed.page.ts:76-79` and `job-detail.page.ts:98-102` — the established pattern:
  `readonly role = input<Role | null>(null)` plus
  `effectiveRole = computed(() => this.role() ?? this.session.role())`. The explicit input is a
  test/preview seam and falls back to the live session. Also `registro.page.ts:12,25-36` uses
  `Extract<Role,'worker'|'company'>` + `as const satisfies readonly RoleOption[]` for a typed
  role table.

## Consumer Map for `platformNav`

`grep platformNav` across the repo → **exactly one consumer**:
- `platform-header.component.ts:4` (import) and `:46` (assignment).

No test imports or asserts `platformNav` (there is **no `platform-header.component.spec.ts`**).
`app.spec.ts` asserts only the *presence* of `app-platform-header` (`:97-107, 118-126`), never
its nav contents. `app.routes.spec.ts`, `app.config.spec.ts`, `app.release-matrix.spec.ts` and
`app.a11y.spec.ts` do not touch platform nav contents (a11y scans the 10 marketing/404 paths,
not platform — `app.a11y.spec.ts`). ⇒ A shape change to `platformNav` is **well-scoped to one
file**; nothing else breaks. Because there is no header spec, the RED test must be created new.

## Gaps vs the goal

| # | Gap | Evidence |
|---|---|---|
| G1 | Nav is one flat list for every role; no `company` label variant | `nav.ts:8-12` |
| G2 | Header never reads the session, so it cannot vary by role | `platform-header.component.ts:45-47` |
| G3 | On login/registro (no session) the full work nav still renders | `app.html:2-3` + `:20-35` (URL-only) |
| G4 | No test locks the role→nav contract | no `platform-header.component.spec.ts` |

## Options & Trade-offs

### (a) Where the role→items mapping lives

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **A1. Pure fn in `nav.ts`:** `platformNavFor(role: Role \| null): readonly NavItem[]` backed by an internal `Record<Role, readonly NavItem[]>` | Keeps `nav.ts` pure/dependency-free (like `platform-paths.ts`); unit-testable with **zero TestBed**; one fallback spot (`null → []`); type-checked exhaustiveness over the 3 roles | Slight indirection vs a literal | Low |
| A2. `Record<Role, readonly NavItem[]>` const only; component handles `null` | Data-only, obvious | Leaks the no-session branch into the component; two places own the rule | Low |
| A3. Keep `platformNav` and add a second `companyNav`; component branches | Smallest literal diff | Branches multiply per role; not exhaustive; drifts | Low |

### (b) Where "no session → no work nav" lives

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **B1. In the mapping (`null → []`)** | Single source of truth; the rule is a pure function, trivially tested; component just renders `nav()` | Component must still hide the empty `<nav>` to avoid an empty landmark | Low |
| B2. In the component (`@if (isAuthenticated())` around nav) | Explicit at the render site | Duplicates intent with the mapping; two owners of one rule | Low |

### (c) Test seam

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **C1. Mirror the `effectiveRole` input seam** (`role = input<Role \| null>(null)` + `effectiveRole = computed(...)`) | Matches `feed.page`/`job-detail.page` exactly; header spec can set `role` without seeding `localStorage` | One extra input on a previously input-less component | Low |
| C2. Inject `SessionService` only; tests seed storage | No new surface | Heavier test setup; no preview seam | Low |

## Recommendation

- **(a) A1 + (b) B1 + (c) C1.**
- `nav.ts` exports a pure `platformNavFor(role: Role | null): readonly NavItem[]` over an
  internal `PLATFORM_NAV_BY_ROLE: Record<Role, readonly NavItem[]>`, returning `[]` for `null`.
  **Keep slugs identical across roles** (`feed`/`trabajos`/`perfil`) so `track item.slug` stays
  stable and semantics don't drift — only `label` changes for `company` (`Vacantes`,
  `Mi empresa`). `admin` reuses the `worker` table (same labels).
- The component injects `SessionService`, adds `role = input<Role | null>(null)` +
  `effectiveRole = computed(() => this.role() ?? this.session.role())` (the `feed.page` seam),
  and `protected readonly nav = computed(() => platformNavFor(this.effectiveRole()))`.
- Render the `<nav>` **only when `nav().length`** (`@if (nav().length) { <nav …> }`) so an
  anonymous visitor has no empty landmark. Keep the "Modo demo" pill (the goal scopes only the
  work nav; pill removal is an open question).
- Keep the name `platformNav` gone / renamed; the single consumer is updated in the same change.

## Risks

- **Consumer/test breakage:** none beyond the one importer; no existing header spec. But Strict
  TDD requires writing `platform-header.component.spec.ts` **first (RED)** — it does not exist.
- **Empty landmark / axe:** an always-present `<nav>` with zero `<li>` is a dead landmark; gate
  the `<nav>` on `nav().length`. `app.a11y.spec.ts` only scans marketing/404 paths, so this is
  correctness hygiene, not a currently-failing gate.
- **Label-only vs route change:** destinations are unchanged; only `company` labels differ.
  `routerLinkActiveOptions` (`item.path === '/plataforma'`) is path-based → unaffected.
- **SSR/prerender:** platform is client-only (excluded from prerender, `platform-shell` spec);
  `SessionService` reads `localStorage` defensively (`session.service.ts:54-61`). No new risk.
- **Reactivity:** `role` is a signal; the computed `nav` inside an OnPush template reacts on
  login/logout without navigation. Login navigates to `/plataforma` anyway (`login.page.ts:98`),
  so the header re-renders regardless; logout is the case the computed guards.
- **Spec ownership:** `site-shell-navigation` scenario "Platform chrome owns the platform nav"
  (`spec.md:83-88`) is the natural home for a role-aware delta; `platform-identity` "Role model"
  (`platform-identity/spec.md:5-9`) covers roles but not nav. Likely one delta on
  `site-shell-navigation`.

## Open Questions (for the orchestrator)

1. **"Modo demo" pill on login/registro:** keep it visible with no nav (as today), or also
   suppress it when anonymous? Goal only mentions the work nav → recommend **keep the pill**.
2. **`Novedades` for `company`:** confirm the label stays `Novedades` (only `Trabajos`→`Vacantes`
   and `Mi perfil`→`Mi empresa` change). The FILLED table implies yes.
3. **Test seam:** add the `role` input (C1) or rely on `SessionService` seeding (C2)? Recommend
   C1 (mirrors two existing pages).
4. **Spec delta target:** confirm a single delta on `site-shell-navigation` (platform-nav
   scenario) vs also touching `platform-identity`. Recommend `site-shell-navigation` only.

## Next Recommended Step

Proceed to **propose** (`sdd-propose`) with: pure `platformNavFor(role)` in `nav.ts`
(`null → []`, slugs stable, `admin` = `worker`, `company` labels = `Vacantes`/`Mi empresa`),
component reads `effectiveRole` via the `role` input seam + `SessionService`, `<nav>` gated on
`nav().length`, pill unchanged, contract untouched. First implementation step (apply) is the
**RED** `platform-header.component.spec.ts` + a `nav.ts` unit test.

## Affected Areas

- `src/app/core/platform/nav.ts` — replace flat `platformNav` with `platformNavFor(role)` + role table.
- `src/app/pages/plataforma/platform-header/platform-header.component.ts` — inject session, add role input/effectiveRole, computed nav, gated `<nav>`.
- `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` — **NEW** (RED first).
- `src/app/core/platform/nav.spec.ts` — **NEW** pure mapping unit test (RED first).
- `openspec/specs/site-shell-navigation/spec.md` — delta at spec phase (platform nav per role / no nav anonymous).
- `openspec/changes/p7-role-aware-nav/` — this change's artifacts.
