# Design: p6-registro-role-picker-promo

## Technical Approach

Three independent, low-risk frontend slices, all testable in jsdom:

1. **Registro role picker** — replace the `<select>` with native radio cards in a
   `<fieldset data-testid="registro-role">`. Selection stays a `Role` signal with a valid
   default; `onRole` reads the option value directly, killing the `HTMLSelectElement` cast.
2. **Content model** — add a typed `promo` field to `Site` (typed tagline + CTA + placeholder
   `plans`), so the header renders from the single content graph and the placeholder gate
   still walks it.
3. **Header promo strip** — render a static, non-dismissible strip **inside**
   `HeaderComponent`'s banner landmark; CTA to `/plataforma/registro`.

Zoneless/OnPush, standalone, signals only; no new deps, no `contracts/` change.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| D1 | Role control | Native `<fieldset>`+`<legend>` radio cards | `<select>` (current), custom `role="radiogroup"` | Exact-one-of-N semantics; native roving keyboard; zero JS; easiest axe pass |
| D2 | Role value type | `Extract<Role,'worker'\|'company'>` | `Role` | `admin` un-offerable is now a **compile-time** guarantee |
| D3 | Testid placement | On the `<fieldset>` group, not inputs | Per-`<input>` | Preserves `data-testid="registro-role"` semantics for functional tests |
| D4 | Role copy home | Local typed const on the page | `site` content graph | Platform UI copy, not marketing content (content-model spec) |
| D5 | Promo copy home | `site.promo` in `src/content/` | Component literal, environment | content-model spec: all site copy in typed modules; auditable by placeholder gate |
| D6 | `isPlaceholder` shape | Required literal `true` on `Promo` + each `PromoPlan` | Optional flag | Guarantees the release gate can never miss it |
| D7 | Strip placement | Inside `<header class="header-shell">`, second row | Sibling in `app.html` | Avoids axe `region` violation; preserves `app.spec.ts` shell order |
| D8 | Strip behavior | Static, non-dismissible, no images | Dismissible / image | Prerender-safe (no `localStorage` hydration mismatch); image budget only counts `<main>` |
| D9 | CTA target | `/plataforma/registro` | `/plataforma` | Keeps exactly one `a[href="/plataforma"]` (header spec) |

## Interfaces / Contracts

**Role picker (registro.page.ts, local):**

```ts
type SelfServiceRoleValue = Extract<Role, 'worker' | 'company'>;
interface RoleOption { readonly value: SelfServiceRoleValue; readonly title: string; readonly description: string; }
const SELF_SERVICE_ROLES = [
  { value: 'worker',  title: 'Trabajador/a', description: 'Acceso para ofrecer servicios y postularse a trabajos.' },
  { value: 'company', title: 'Empresa',      description: 'Acceso para publicar proyectos y contratar profesionales.' }
] as const satisfies readonly RoleOption[];
```

Signals unchanged in spirit: `role = signal<SelfServiceRoleValue>('worker')` (valid default).
`README`: template `@for (option of roles; track option.value)` renders
`<label><input type="radio" name="registro-role" [value]="option.value" [checked]="role()===option.value" (change)="onRole(option.value)" required /> <span>{{option.title}}</span><span>{{option.description}}</span></label>`.
`onRole(value: SelfServiceRoleValue)` → `this.role.set(value)`. No event cast; `submit()` unchanged.

**Content model (content.types.ts + site.ts):**

```ts
export interface PromoPlan {
  readonly name: string; readonly price: string; readonly note?: string; readonly isPlaceholder: true;
}
export interface Promo {
  readonly text: string;          // "7 días de uso gratis, después planes de pago"
  readonly ctaLabel: string;      // "Crear cuenta gratis"
  readonly ctaPath: string;       // "/plataforma/registro"
  readonly plans: readonly PromoPlan[];  // 3 placeholder entries
  readonly isPlaceholder: true;
}
// Site gains: readonly promo: Promo;
```

`site.ts` adds `promo` (after `nav`); `satisfies Site` makes `tsc` the validator.

**Header template (inside `header-shell`, new row):** `data-testid="header-promo"` wrapping
tagline `<p>`, a compact `<ul>` of `plans` (name + price/note, `data-testid="header-promo-plans"`),
and `<a routerLink="/plataforma/registro" data-testid="header-promo-cta">{{ site.promo.ctaLabel }}</a>`.
`header.component.ts` needs no change (`site` already exposed).

## Data Flow

    radio change → onRole(value) → role.set → submit() → session.register({role}) → navigate('/plataforma')
    site.promo (content) → HeaderComponent.site → strip template → CTA routerLink /plataforma/registro

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/pages/plataforma/registro.page.ts` | Modify | Radio cards + typed role const; drop select cast |
| `src/app/pages/plataforma/registro.page.spec.ts` | Modify | Rewrite select-based tests for radios; add picker tests |
| `src/app/components/layout/header.component.html` | Modify | Promo strip row inside `<header>` |
| `src/app/components/layout/header.component.spec.ts` | Modify | Promo text/plans/CTA tests |
| `src/content/content.types.ts` | Modify | `Promo`/`PromoPlan`; `Site.promo` |
| `src/content/site.ts` | Modify | `promo` payload (placeholder) |
| `src/content/site.spec.ts` | Modify | Promo shape/placeholder assertions |
| `src/content/content.spec.ts` | Modify | Gate test also expects `promo` flag |
| `src/styles.css` | Maybe | `@utility` only if strip/card classes get long |

## Testing Strategy (Strict TDD: RED first, then GREEN)

| Unit | RED (failing) test | Spec file |
|------|--------------------|-----------|
| Picker roles | rewrite `optionValues` → read `input[type=radio]` values; assert `['worker','company']`, never `admin` | `registro.page.spec.ts` |
| Picker flow | replace `HTMLSelectElement` cast: `input[value=company].click()`, submit, assert `SessionService.role()==='company'` + navigate | `registro.page.spec.ts` |
| Picker a11y/copy | group is `<fieldset>` w/ legend + `data-testid`; `worker` checked by default; each role renders title+description | `registro.page.spec.ts` |
| Content field | `site.promo` non-empty `text`/`ctaLabel`, `ctaPath` matches `/^\//`, `plans.length>=2` w/ `name`+`price`, both flagged placeholder | `site.spec.ts` |
| Content gate | extend gate test to `flags` `toContain('promo')` | `content.spec.ts` |
| Header strip | strip exists inside `<header>`, shows tagline; renders `plans.length` plan rows; CTA href `/plataforma/registro` | `header.component.spec.ts` |
| Regression | existing header test still asserts exactly one `a[href="/plataforma"]` (unmodified) | `header.component.spec.ts` |
| A11y regression | axe `region`/`list`/`label` on all 10 paths still zero violations | `app.a11y.spec.ts` |

Run: `bunx ng test --watch=false`. Rewrite the two select-bound registro tests in the same
work unit as the picker implementation.

## Change-Impact Summary

~9 files touched, **no new files**, ≈180–220 changed lines → single PR (under 400, no exception).
No `contracts/openapi.yaml`, `Role`, or login changes.

## Adherence Check

Proposal locked decisions D1–D9 map 1:1 (§Architecture Decisions): radio cards+fieldset testid,
local `{value,title,description}`, in-header static strip, CTA `/plataforma/registro`, typed
`site.promo` with placeholder `plans`, self-service-only, contract untouched. All honored.

## Migration / Rollout

None. Static content + UI; no data migration, no flags.

## Open Questions

None blocking. Exact es-AR strings for role titles/descriptions and promo copy may be refined in
spec/tasks; defaults above are final-ready.
