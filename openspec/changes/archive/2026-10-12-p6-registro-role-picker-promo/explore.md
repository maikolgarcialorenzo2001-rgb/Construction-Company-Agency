# Exploration: p6-registro-role-picker-promo

Small frontend polish change to the existing `/plataforma` mock auth UX plus a marketing
promo strip. No contract change; no new domain behaviour. Three deliverables:
(1) described role picker on registration, (2) login unchanged, (3) promo strip in the
marketing header.

## Current State (verified)

**Registration role chooser**
- `src/app/pages/plataforma/registro.page.ts:12-15` — `SELF_SERVICE_ROLES` is a local
  `as const` array of `{ value, label }`, only `worker` (`'Trabajador/a'`) and `company`
  (`'Empresa'`). Module doc (lines 7-11) states `admin` is never offered (platform-identity rule).
- `registro.page.ts:62-75` — the role control is a plain `<select id="registro-role"
  data-testid="registro-role">` iterating `roles` into `<option>`s.
- `registro.page.ts:103-119` — `roles` is exposed to the template; `role` signal defaults to
  `'worker'`; `onRole()` casts the `<select>` value back to `Role`.
- `registro.page.ts:121-134` — `submit()` calls `session.register({ email, password, role })`
  then `router.navigateByUrl('/plataforma')`.
- `src/app/core/platform/domain/models.ts:13` — `Role = 'worker' | 'company' | 'admin'`.

**Registration tests (current TDD surface)**
- `src/app/pages/plataforma/registro.page.spec.ts:21-24` — `optionValues()` reads
  `[data-testid="registro-role"] option` values; asserts exactly `['worker','company']` and
  never `admin` (lines 45-52).
- `registro.page.spec.ts:54-73` — the register flow casts `[data-testid="registro-role"]` to
  `HTMLSelectElement`, sets `.value='company'`, dispatches `change`, submits, asserts
  `SessionService.role()` and navigation. **Both tests hard-depend on `<select>/<option>`.**

**Login**
- `src/app/pages/plataforma/login.page.ts` — credentials-only form, no role control. Already
  correct; no change required. `login.page.spec.ts` exists.

**Marketing header**
- `src/app/components/layout/header.component.ts:14-22` — thin component, `imports` include
  `RouterLink, RouterLinkActive, PhoneLinkComponent`, exposes `site = site`; template is
  `header.component.html`.
- `header.component.html:1-34` — single `<header class="header-shell">` containing one row:
  brand link, desktop `<nav aria-label="Navegación principal">` over `site.nav`, then a
  right cluster: `/plataforma` link (line 26), `/presupuesto` `btn-primary` (line 30),
  `app-phone-link` (line 31).
- `src/app/app.html:2-6` — marketing routes render `<app-header>`; platform routes render
  `<app-platform-header>`. So the marketing header — and any strip inside it — never shows on
  `/plataforma/**`.
- `src/app/app.spec.ts:68-81` — asserts exact shell order
  `['a','app-header','main','app-footer','app-sticky-cta']`. `header.component.spec.ts:85-91`
  asserts **exactly one** `a[href="/plataforma"]`.

**Content model**
- `src/content/site.ts:13-68` — the single eager content module (`site`), consumed by the
  shell/SEO/analytics. Holds `nap` (line 14, `isPlaceholder: true` line 24), hours,
  credentials, warranty, story, areasServed, GBP url, logo, ogImage, `nav` (lines 61-67).
- `src/content/content.types.ts:71-86` — `Site` interface; `NavItem` (62-69) and
  `Option<T>` (178-181) are the existing content shapes. `satisfies Site` on `site.ts:68`
  makes `tsc` the validator.
- `src/content/content.spec.ts:456-492` — placeholder release gate: **every** module in
  `CONTENT_GRAPH` must carry ≥1 `isPlaceholder: true` flag; `site` already satisfies this via
  `nap`. Adding a flagged promo field to `site` is safe; adding a NEW unflagged content module
  would create a "blind spot" the gate test both requires and audits.

**Header/related specs that constrain the promo strip**
- `header.component.spec.ts:77-83` — exactly one `a[href^="tel:"]`.
- `app.a11y.spec.ts:31-42` — axe rules include `region` (all content must sit in a landmark)
  and `landmark-one-main`, scanned on all 10 marketing/404 paths.
- `app.release-matrix.spec.ts:112-143` — image budget counts `<img>` **inside `<main>` only**;
  header content is outside `main` and is not counted.

**Specs / contract**
- `openspec/specs/platform-identity/spec.md:5-15` — Role model: registration MUST offer only
  `worker`/`company`; `admin` MUST NOT be self-assigned; `Role` enum and `contracts/openapi.yaml`
  MUST remain unchanged.
- `openspec/specs/site-shell-navigation/spec.md:54-72` — header MUST link every marketing route,
  one `tel:` action, and a single platform entry to `/plataforma`.
- `openspec/specs/content-model/spec.md:11-19,45-56` — all site content lives in typed
  `src/content/` modules; non-client data MUST be `isPlaceholder: true`.
- `openspec/specs/platform-shell/spec.md:44-68` — platform subtree is client-rendered, excluded
  from prerender, and uses its own chrome (marketing header is absent there).
- `contracts/openapi.yaml` — READ-ONLY. No change needed: we keep `worker`/`company` only.

## Gaps

| # | Gap | Evidence |
|---|---|---|
| G1 | Role control is a plain `<select>`; no title + description per role | `registro.page.ts:62-75`, `SELF_SERVICE_ROLES:12-15` |
| G2 | Role data has no description field | `registro.page.ts:13-14` |
| G3 | Registration tests assert `<option>` DOM; will break on any non-select control | `registro.page.spec.ts:21-24,63-65` |
| G4 | No promo strip exists anywhere in the marketing header | `header.component.html` (no banner); grep for `promo/banner/gratis/plan` → 0 hits |
| G5 | No home for promo/plan copy in the content model | `content.types.ts:71-86` has no promo field |
| G6 | No test asserts a promo strip or its CTA | `header.component.spec.ts` |

## Options & Trade-offs

### Role picker control

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **A. Native radio cards** (`<fieldset>`+`<legend>`, `<input type="radio">` wrapped in styled `<label>` cards) | Correct single-choice semantics; native keyboard/roving focus; zero custom JS; easiest axe pass; description can live in each card | Requires the existing select-based spec to be rewritten (strict TDD RED) | Low–Med |
| B. Checkbox cards | Visually identical | Wrong semantics (implies multi/optional); a11y mismatch | Low |
| C. Custom `role="radiogroup"` buttons | Full styling control | Reimplements native behaviour; keyboard/ARIA footguns; more test surface | Med–High |

**Recommendation: A.** Registration is exactly-one-of-N, and native radios are the accessible
default the rest of the codebase already leans on (`quote.page.html:143-150` uses a native
checkbox). Reuse `surface-card` (`styles.css:46-48`) for the card look; put a `data-testid`
on the group so the submit-path test and `data-testid="registro-role"` semantics survive.
Extend the local const to `{ value, title, description }` (a small local interface) rather
than polluting the marketing content graph — this is platform UI copy, not site content.

### Where promo/plan copy lives

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **1. Content model** (`site.promo` in `site.ts` + `content.types.ts`) | Matches content-model spec ("all site content in typed modules"); eager module the shell already imports; type-checked by `tsc`; `isPlaceholder` convention already established | Slightly heavier than a literal | Low |
| 2. Component constant in `header.component.ts` | Smallest diff | Contradicts content-model spec; copy can't be found/audited with the placeholder gate | Low |
| 3. Environment (`environment.ts`) | — | Environments are DI config (API URLs), not UI copy; wrong layer | Low |

**Recommendation: 1.** Add an optional `promo` field to `Site` (e.g.
`{ text, ctaLabel, ctaPath: '/plataforma/registro', plans?: readonly {name, price, note}[],
isPlaceholder: true }`). Render only the tagline + CTA now; keep `plans` for the placeholder
plan content the goal mentions. Falls under `content-model` and (for the CTA target) touches
`site-shell-navigation`.

## Risks & Constraints

- **Contract READ-ONLY (hard):** role enum stays `worker|company|admin`; we only keep
  offering `worker`/`company`. No `contracts/` edit, no `Role` edit. Moderation role is out of
  scope (would need a contract change).
- **Strict TDD (hard):** the existing select-based tests MUST be rewritten first (RED), then
  implemented. Two tests depend on `<select>/<option>` (`registro.page.spec.ts:21-24,63-65`).
- **Placement / axe `region`:** a promo strip rendered as a sibling of `<header>` in `app.html`
  would sit outside any landmark and trip the axe `region` rule on all 10 scanned paths
  (`app.a11y.spec.ts:31-42,101-133`). Render the strip **inside** `HeaderComponent` (within the
  banner landmark) — lowest risk.
- **Shell-order test:** `app.spec.ts:74-80` asserts exact child order; adding a new top-level
  shell element breaks it. Inside-header placement avoids this.
- **Single platform-entry test:** `header.component.spec.ts:85-91` asserts exactly one
  `a[href="/plataforma"]`. The promo CTA must point to `/plataforma/registro` (a different
  href) — which is what the goal wants anyway.
- **Prerender/SSR:** the header ships on every prerendered marketing page (static `outputMode`).
  Keep the promo static (no signals, no async, no images). A **dismissible** strip would need
  `localStorage` → server/client hydration mismatch; avoid dismissal, or gate it behind
  `isPlatformBrowser` with hydration handling. `release-matrix.spec.ts` counts images only
  inside `<main>`, so header images would escape the budget — don't add images.
- **Content placeholder gate:** any new promo copy that is fictional MUST carry
  `isPlaceholder: true`; if promo becomes a NEW module it must be added to
  `CONTENT_MODULES`/`CONTENT_GRAPH` (`content.spec.ts:20-34`) or the audit test flags it as a
  blind spot.
- **Spec deltas likely needed:** `platform-identity` (each role shows a title+description),
  `content-model` (the `promo` field), and possibly `site-shell-navigation` (promo strip +
  registration CTA in the header). None relax an existing MUST.

## Open Questions (for the orchestrator)

1. **Promo scope now:** render just the tagline ("7 días de uso gratis, después planes de pago")
   + CTA, or also a placeholder plan list? Recommend tagline + CTA, with `plans` reserved.
2. **Dismissible?** Recommend **no** (SSR/hydration + extra test surface). Confirm.
3. **Role descriptions copy:** who authors the es-AR title/description for `Trabajador/a` and
   `Empresa`? Needed before spec/tasks can pin exact strings (or leave as placeholder copy).
4. **Spec deltas:** confirm we write deltas for `platform-identity`, `content-model`, and
   `site-shell-navigation` (vs only the first two).
5. **Folder convention:** existing archived changes use date-prefixed folders
   (`2026-10-11-p5-...`); this change uses `p6-registro-role-picker-promo` (no date). Assumed
   intentional per the orchestrator's path.

## Next Recommended Step

Proceed to **propose** (`sdd-propose`) with the locked decisions:
- Role picker = native radio cards in a `fieldset` + `legend`, `data-testid="registro-role"`
  preserved on the group, per-role `{ value, title, description }` local const.
- Promo copy = `site.promo` in the content model (typed, `isPlaceholder: true`, CTA to
  `/plataforma/registro`), rendered inside `HeaderComponent` (banner landmark, non-dismissible,
  no images).
- Login unchanged; contract untouched.

### Affected Areas
- `src/app/pages/plataforma/registro.page.ts` — replace `<select>` with described radio cards; extend role const.
- `src/app/pages/plataforma/registro.page.spec.ts` — rewrite role assertions + register flow for radios (RED first).
- `src/app/components/layout/header.component.ts` / `.html` / `.spec.ts` — add promo strip; add its test.
- `src/content/site.ts` + `src/content/content.types.ts` — add typed `promo` field.
- `src/content/site.spec.ts` / `content.spec.ts` — shape + placeholder assertions for promo.
- `src/styles.css` — optional new `@utility` for the strip/card if the inline Tailwind gets long.
- `openspec/specs/platform-identity|content-model|site-shell-navigation/spec.md` — deltas at spec phase.
