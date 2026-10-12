# Proposal: Role-aware platform navigation

## Intent

Paso 2 of the HANDOFF §10 plan. The platform header renders one flat nav for every role and renders it even without a session. `company` users see worker wording ("Trabajos", "Mi perfil"), and anonymous visitors on `/plataforma/login` / `/registro` see a work nav they cannot use. Make the header role-aware with identical destinations and correct `company` labels, and render no work nav when there is no session.

## Scope

### In Scope
- `company` labels: Trabajos→**Vacantes**, Mi perfil→**Mi empresa**; Novedades unchanged.
- `worker` and `admin` share one item set; slugs unchanged (`feed`/`trabajos`/`perfil`).
- No session (`login`/`registro`, anonymous) ⇒ **no work nav**.
- `role` input seam on the header to mirror `feed`/`job-detail`.

### Out of Scope
- New role-specific pages or route guards.
- `contracts/openapi.yaml` changes; moderation/4th role.
- `login`/`registro` page changes; "Modo demo" pill changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `site-shell-navigation`: the "Platform chrome owns the platform nav" scenario becomes role-aware (labels per role; absent when anonymous).

## Approach
- `nav.ts` becomes a pure `platformNavFor(role: Role | null): readonly NavItem[]` over an internal `Record<Role, readonly NavItem[]>`; `null → []`. Dependency-free (type-only `NavItem`), unit-testable without TestBed — **single source of truth for the no-session rule**. `admin` = `worker` set.
- `PlatformHeaderComponent` mirrors the existing seam (`feed.page.ts:76-79`): inject `SessionService`, add `role = input<Role | null>(null)` + `effectiveRole = computed(() => this.role() ?? this.session.role())`, expose `nav = computed(() => platformNavFor(this.effectiveRole()))`.
- Gate `<nav>` on `nav().length` to avoid an empty landmark; keep the "Modo demo" pill in all states.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/core/platform/nav.ts` | Modified | `platformNav` → `platformNavFor(role)` + role table |
| `src/app/pages/plataforma/platform-header/platform-header.component.ts` | Modified | session inject, `role` input, `effectiveRole`, computed nav, gated `<nav>` |
| `src/app/core/platform/nav.spec.ts` | New | pure mapping unit test (RED first) |
| `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` | New | header spec (RED first) |
| `openspec/specs/site-shell-navigation/spec.md` | Modified | delta at spec phase |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No header spec / no `nav.ts` test exists | High | Strict TDD: write both RED specs first |
| Empty `<nav>` landmark for anonymous | Med | Gate on `nav().length`; assert absence in spec |
| Reactivity on login/logout | Low | Signal `computed`; login navigates anyway, logout is the guarded case |
| Single consumer breakage | Low | Only importer is the header; update in same change |

## Rollback Plan

Revert the change folder's commits. `nav.ts` and the header are the only production files touched; restoring the flat `platformNav` array and the static template fully reverts behavior. No data, contract, or route impact.

## Dependencies

None. Roles (`worker`/`company`/`admin`) already exist in `domain/models.ts:13`.

## Resolved Open Decisions
- **Modo demo pill**: keep visible in all states (goal scopes only the work nav).
- **`Novedades` for `company`**: label unchanged; only `Trabajos`/`Mi perfil` change.
- **Test seam**: add `role` input (C1), mirroring `feed`/`job-detail`.
- **Spec delta target**: `site-shell-navigation` only.

## Success Criteria

- [ ] `company` renders Vacantes / Mi empresa; `worker`/`admin` render Trabajos / Mi perfil.
- [ ] No session ⇒ no work nav; "Modo demo" pill still present.
- [ ] Slugs and destinations unchanged; `bunx ng test --watch=false` green.

## Next Recommended

`sdd-spec` (delta on `site-shell-navigation`), then `sdd-design`/`sdd-tasks`.
