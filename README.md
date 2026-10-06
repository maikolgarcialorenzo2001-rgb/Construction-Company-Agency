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
grep -rn "isPlaceholder" src/content/   # no `true` left: real client data shipped
```

Every content entry that is not real client data carries `isPlaceholder: true`, so the
last command lists whatever still has to be replaced before launch.