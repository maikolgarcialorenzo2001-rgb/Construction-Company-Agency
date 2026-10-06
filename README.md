# Constructora Ejemplo — sitio de obra y reformas

Marketing site for a construction and renovation company (CABA and Greater Buenos Aires).
Angular standalone app, Tailwind CSS, no component styles, all copy in Argentine Spanish.

## Stack

- **Angular** 22, standalone components, zoneless change detection, lazy routes.
- **Tailwind CSS** via PostCSS; all styling lives in `src/styles.css` utilities and
  `@utility` helpers. Components ship **zero** `styles` on purpose (see `openspec`).
- **Vitest** + Angular TestBed for unit tests, `jsdom` environment.
- **Bun** as package manager and script runner.

## Commands

```bash
bun install                 # install dependencies
bunx ng serve               # dev server on http://localhost:4200
bunx ng build               # production build into dist/
bunx ng test --watch=false  # run the whole test suite once
bunx ng lint                # ESLint + Angular template rules
```

Run a single spec with `--include=`:

```bash
bunx ng test --watch=false --include="src/app/pages/quote/quote.page.spec.ts"
```

## Project layout

```
src/
  app/
    components/    presentational + layout pieces (header, footer, cta-block, ...)
    core/          cross-cutting services (seo, analytics, consent)
    pages/         one folder per route, lazily loaded
    environments/  Environment model + per-build values (token: ENVIRONMENT)
    app.config.ts  providers and app initializers (SEO, then analytics)
    app.routes.ts  route table
  content/         single source of truth for copy, NAP and images
  styles.css       Tailwind layers, design tokens and @utility helpers
```

## Content and environment

- All copy, NAP data, services, projects and testimonials live in `src/content/`.
  Edit there; pages only read from the collections through `src/content/lookup.ts`.
- `gaMeasurementId` is set per environment under `src/app/environments/`. The analytics
  layer installs a GA4 tag **only** when the id is a real `G-XXXXXXXXXX` and the visitor
  has granted consent. Empty ids and placeholders are ignored.

## Release gate

Before shipping, the build must stay under the initial-bundle budget (450 kB warning,
500 kB error) and **no placeholder may reach the machine-readable layer**:

```bash
bunx ng lint                # green
bunx ng test --watch=false  # green
bunx ng build               # initial bundle under 450 kB
grep -rn "isPlaceholder" src/   # lists every flag; the src/content/ hits are the data to replace
```

Every content entry that is not real client data carries `isPlaceholder: true`, so the
last command lists whatever still has to be replaced before launch.

## Accessibility gate

Two layers guard the WCAG AA basics (seo-analytics-performance Req 7):

1. **Automated, every commit** — `bunx ng test --watch=false` runs the release matrix
   plus an axe-core scan over every route. No browser and no human needed.
2. **Manual, every release** — the checks that need a real layout, paint or keyboard
   session. Recorded below, still pending.

### Automated (jsdom + axe-core)

| Check | Where |
|---|---|
| Exactly one `h1`, skip link first, one priority image, image budget | `app.release-matrix.spec.ts` |
| `image-alt`, `button-name`, `link-name`, `label`, `nested-interactive` | `app.a11y.spec.ts` |
| `landmark-one-main`, `page-has-heading-one`, `region`, `list`, `duplicate-id` | `app.a11y.spec.ts` |
| No positive `tabindex` (focus order stays in reading order) | `app.a11y.spec.ts` |
| Every content image has non-empty alt | `content.spec.ts` |

The scan found and fixed one real violation: the mobile contact bar (`sticky-cta`) sat
outside any landmark. It is now `role="complementary"` "Contacto rápido".

### Still manual (not automatable under jsdom)

- **Focus visibility, WCAG 2.4.7**: a paint-time property. There is no DOM-only axe
  rule; tab through every route with a keyboard and eyeball the focus ring.
- **Body text contrast at least 4.5:1, WCAG 1.4.3**: axe needs real layout and canvas,
  which jsdom never computes. Run Lighthouse or the axe DevTools on the served site.
- **Reading-order tab flow, WCAG 2.4.3**: automated proof covers the structure (no
  positive `tabindex` reorders the stops); a real browser confirms the flow reads
  naturally.

### Manual checklist (not run yet)

- [ ] First Tab lands on the skip link, and it reveals `<main id="main">` (every route)
- [ ] Every interactive element shows a visible focus indicator while tabbing
- [ ] Tab order follows reading order on every route
- [ ] Run `bunx lighthouse` (accessibility + best-practices audits) or the axe DevTools
      extension on `/`, `/servicios`, `/proyectos`, `/proceso`, `/nosotros`,
      `/presupuesto`, and one detail page: zero critical/serious violations
- [ ] Body text contrast is at least 4.5:1 on every route (Lighthouse contrast audit)

Result: _pending — record the first run here_
