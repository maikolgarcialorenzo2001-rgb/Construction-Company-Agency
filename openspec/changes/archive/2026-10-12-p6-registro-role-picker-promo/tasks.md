# Tasks: p6-registro-role-picker-promo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ≈180–220 (additions + deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | none — single change, 3 local work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (sequential local commits on `main`) |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
```

Per locked strategy: no branches, no PRs, no pushes. Each work unit = one local commit
ending in `(p6-registro-role-picker-promo)`. Strict TDD active.

### Suggested Work Units

| Unit | Goal | Commit msg suffix | Notes |
|------|------|-------------------|-------|
| WU1 | Registro role picker (platform-identity) | `…(p6-registro-role-picker-promo)` | Independent; tests ship with code |
| WU2 | Typed `site.promo` content (content-model) | `…(p6-registro-role-picker-promo)` | Base for WU3 |
| WU3 | Header promo strip (site-shell-navigation) | `…(p6-registro-role-picker-promo)` | Depends on WU2 |
| WU4 | Full gate | not committed | Run after WU3 |

## Phase 1 — WU1: Registro role picker

Spec: `platform-identity` — "Role model".

- [x] 1.1 RED `src/app/pages/plataforma/registro.page.spec.ts`: rewrite `optionValues()` to read `input[type=radio]` values under `[data-testid="registro-role"]`; assert `['worker','company']`, never `admin` (scenario "Picker offers only self-service roles").
- [x] 1.2 RED same file: replace the `HTMLSelectElement` cast flow test with `input[value="company"].click()`, submit, assert `SessionService.role()==='company'` and navigate `/plataforma` (scenario "Chosen role is what register sends").
- [x] 1.3 RED same file: assert picker group is a `<fieldset>` with `<legend>` carrying `data-testid="registro-role"`, every radio is a descendant, `worker` is checked by default, each role renders a title + es-AR description (scenarios "Picker group carries the role testid", "Each role shows a title and description", "Selection is required and defaults to a valid role").
- [x] 1.4 GREEN `src/app/pages/plataforma/registro.page.ts`: replace `<select>` with `<fieldset data-testid="registro-role">` + `<legend>Me registro como</legend>` and `@for` radio-card labels; type `SELF_SERVICE_ROLES` as `{ value, title, description }` with `SelfServiceRoleValue = Extract<Role,'worker'|'company'>`; `role = signal<SelfServiceRoleValue>('worker')`; `onRole(value)` sets the signal directly (drop the `HTMLSelectElement` cast); `submit()` unchanged.
- [x] 1.5 Verify WU1: `bunx ng test --watch=false` green; commit both files.

## Phase 2 — WU2: Typed `site.promo` content

Spec: `content-model` — "6. [C] Typed promo teaser".

- [x] 2.1 RED `src/content/site.spec.ts`: add promo shape test — `text`/`ctaLabel` non-empty, `ctaPath` matches `/^\//`, `plans.length` 2–3 each with `name`+`price`, `promo.isPlaceholder === true` and every plan `isPlaceholder === true` (scenarios "Promo shape is typed and placeholder-flagged", "Placeholder plans are flagged").
- [x] 2.2 RED `src/content/content.spec.ts`: extend the `site` release-gate test with `expect(flags).toContain('promo')` (scenario "Placeholder gate still passes").
- [x] 2.3 GREEN `src/content/content.types.ts`: add `PromoPlan { name; price; note?; isPlaceholder: true }` and `Promo { text; ctaLabel; ctaPath; plans; isPlaceholder: true }`; add `readonly promo: Promo` to `Site`.
- [x] 2.4 GREEN `src/content/site.ts`: add `promo` after `nav` — text `"7 días de uso gratis, después planes de pago"`, `ctaLabel: "Crear cuenta gratis"`, `ctaPath: "/plataforma/registro"`, 3 placeholder plans; `satisfies Site` validates via `tsc`.
- [x] 2.5 Verify WU2: `bunx ng test --watch=false` green and `bunx ng build` (strict type validator) clean; commit the four files.

## Phase 3 — WU3: Header promo strip

Spec: `site-shell-navigation` — "3. [B] Header navigation, phone reachability and promo strip".

- [x] 3.1 RED `src/app/components/layout/header.component.spec.ts`: assert a strip exists inside `<header>` with `data-testid="header-promo"` showing the tagline; renders `site.promo.plans.length` rows under `data-testid="header-promo-plans"`; CTA `a[href="/plataforma/registro"]` with `ctaLabel`; strip contains no `<img>` and no dismiss control (scenarios "Promo strip renders inside the header with a registration CTA", "Promo strip is static, non-dismissible and image-free").
- [x] 3.2 GREEN `src/app/components/layout/header.component.html`: add a second row inside `<header class="header-shell">` — `data-testid="header-promo"` with tagline `<p>`, compact `<ul data-testid="header-promo-plans">` (name + price/note), and `<a routerLink="/plataforma/registro" data-testid="header-promo-cta">{{ site.promo.ctaLabel }}</a>`. `header.component.ts` unchanged (`site` already exposed).
- [x] 3.3 Verify WU3: `bunx ng test --watch=false` green; regression — header still exposes exactly one `a[href="/plataforma"]` and `app.a11y.spec.ts` stays at zero violations on all 10 paths; commit both files.

## Phase 4 — WU4: Full gate (no commit)

- [x] 4.1 Run the full gate: `bunx ng test --watch=false`, `bunx ng lint`, `bunx ng build`, and `bun run gate` (present in `package.json`).
- [x] 4.2 Confirm `git diff contracts/` is empty — `contracts/openapi.yaml` and the `Role` enum untouched.
- [x] 4.3 Optional `src/styles.css`: add an `@utility` only if the strip/card Tailwind classes become long; otherwise leave untouched.
