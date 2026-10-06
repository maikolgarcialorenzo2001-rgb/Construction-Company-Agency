# Design: P0 Website — Minimum Viable Construction Company Site

## Technical Approach

Angular 22.2 standalone **zoneless** SPA. Typed content modules under `src/content/` are the only copy/NAP/image source; `satisfies` makes `tsc` the schema validator. Every page is a lazy `loadComponent`; the shell (header, footer, sticky CTA, skip link) is the only eager UI. Zero backend: the quote form composes a prefilled `wa.me` deep link. JSON-LD + GA4 are runtime services driven by the same NAP source and inert while data is placeholder.

## Architecture Decisions

| # | Decision | Options (tradeoff) | Choice | Why |
|---|---|---|---|---|
| D1 | Forms API | Reactive ✅ typed controls, `markAllAsTouched`, no `ngModel`; Template-driven (simpler markup, untyped controls) | **Reactive** (`NonNullableFormBuilder`) | `strictTemplates` + typed `FormGroup`; both work zoneless, reactive keeps the honeypot/consent state explicit. |
| D2 | JSON-LD emission | Static `index.html` (crawler-visible, zero JS) vs runtime `SeoService` | **Runtime injection** | Static block would need NAP literals in `index.html` → violates `content-model` Req 2 and cannot be placeholder-gated. One `<script type="application/ld+json">` in `<head>`, updated in place per navigation. |
| D3 | Unknown slug → 404 | Extra `/404` route + redirect (extra top-level route violates Req 1) vs reusing the `NotFoundPage` component | **Reuse `NotFoundPage` component** in detail pages | No extra route, no redirect flash; the `**` route and the slug-miss both render the same component and heading. |
| D4 | Consent Mode v2 | Advanced (gtag loaded pre-consent, cookieless pings) vs stub | **Stub: gtag not loaded until consent granted** | `seo-analytics-performance` Req 4 forbids loading the tag pre-consent. `ConsentService` defaults both signals to `denied` so a banner can later drive it. |
| D5 | Component styles | Per-component `styles[]` (eats `anyComponentStyle` 4kB/8kB) vs global utilities | **Zero component styles**; shared patterns as Tailwind `@utility` in `styles.css` | Budget is never consumed; Tailwind emits only used utilities. |
| D6 | Fonts | Webfont vs system stack | **System stack** (no webfont) | Saves ~40 kB + font-swap CLS; LCP becomes the hero image. |
| D7 | Below-fold galleries | Eager vs `@defer (on viewport)` | **`@defer (on viewport)` for the project photo grid only** | Keeps 8–15 photos out of the first paint; limited to one place to contain the vitest/jsdom deferral risk. |
| D8 | Money/m² formatting | Intl in templates vs pure helpers | **`src/app/core/format.ts` pure functions** | `Intl` in templates is untestable-ish and non-deterministic per locale; keeps `src/content/` pure data+types. |

## Data Flow

```
src/content/*.ts  ──import──▶  page components (lazy chunk)
      │  site.ts (NAP) is ALSO imported eagerly by shell + SeoService + Analytics
      ▼
components/layout/{footer,header,sticky-cta} · components/{phone-link,whatsapp-link}
      │                                                    │  (click) │ (click)
      └──────────────▶ SeoService (Title/Meta/canonical + JSON-LD whitelist projection)
                                                                      │
                                   ANALYTICS.call() / .whatsapp() / .lead()
                                                                      ▼
                                                       AnalyticsService → (id real && consent)
                                                                      ▼
                                                            gtag.js injected → dataLayer
```

Quote submit (no network at any point):

```
form submit ─▶ honeypot set? ──yes──▶ return (no window.open, no error, no success)
      │ no
      ▼
form.invalid? ──yes──▶ markAllAsTouched() + focus first invalid + aria-live errors; return
      │ no
      ▼
resolve Option labels from content ──▶ buildLeadMessage()  (label lines + PHOTO_INVITE last)
      ▼
Analytics.lead()  (once, no PII)  ──▶  window.open(wa.me/{digits}?text={encodeURIComponent(msg)})
      ▼
signal sent = true ──▶ success block: tel:+{digits}  +  mailto:{email}?body={same msg}
```

## File Map (create/modify/delete)

`src/app/` — all standalone; components live in `src/app/components/<name>/<name>.component.*` with class `<Name>Component`, pages in `src/app/pages/<name>/<name>.page.*` with class `<Name>Page`; selectors `app-*`, **no `styleUrl`** (D5: zero component styles).

```
src/index.html                             M  lang="es-AR", description/OG fallback, theme-color
src/styles.css                             M  @theme tokens + @utility (see Styling)
src/app/app.ts · app.html                  M  skip link + header + <main id="main"> + router-outlet
                                                 + footer + sticky-cta
src/app/app.css                            D  zero component styles by design (D5)
src/app/app.routes.ts                      M  10-route table (below)
src/app/app.config.ts                      M  withComponentInputBinding, withInMemoryScrolling,
                                                 provideAppInitializer(() => { seo.start(); analytics.init(); })
src/app/environments/environment.model.ts  M  + gaMeasurementId: string
src/app/environments/environment{,.prod,.development}.ts   M  gaMeasurementId: '' (placeholder)
src/app/components/layout/header.component.ts|.html  C  nav from site.nav + <app-phone-link>
src/app/components/layout/footer.component.ts|.html  C  NAP + hours + <app-whatsapp-link> + GBP link
src/app/components/layout/sticky-cta.component.ts|.html  C  @if (!isQuoteRoute()) wa + tel, sm:hidden fixed
src/app/components/phone-link/phone-link.component.ts|.html  C  tel: anchor, (click)→call_click{placement}
src/app/components/whatsapp-link/whatsapp-link.component.ts|.html  C  wa.me anchor, (click)→whatsapp_click{placement}
src/app/components/service-card/service-card.component.ts|.html  C  input: Service
src/app/components/project-card/project-card.component.ts|.html  C  input: Project (thumb = photos[0])
src/app/components/testimonial-card/testimonial-card.component.ts|.html  C  input: Testimonial (rating + author + context)
src/app/components/cta-block/cta-block.component.ts|.html  C  input: {heading, body}; /presupuesto + <app-phone-link>
src/app/components/section-heading/section-heading.component.ts|.html  C  input: {eyebrow?, title, lead?}
src/app/components/photo-gallery/photo-gallery.component.ts|.html  C  @defer (on viewport) grid of ProjectPhoto
src/app/core/lead/lead-links.ts|.spec.ts   C  pure: toWaDigits, buildLeadMessage, buildWhatsAppUrl,
                                                 buildMailtoUrl, buildTelHref, LEAD_PHOTO_INVITE
src/app/core/format.ts|.spec.ts            C  formatMoneyRange, formatArea, formatDuration
src/app/core/seo/json-ld.ts|.spec.ts       C  pure: buildBusinessJsonLd(nap, extras) — key whitelist
src/app/core/seo/seo.service.ts|.spec.ts   C  Title/Meta/canonical/robots + script tag lifecycle
src/app/core/analytics/analytics.service.ts|.spec.ts   C  isRealGa4Id, init, track, page views
src/app/core/consent/consent.service.ts|.spec.ts        C  denied default, grant(), isGranted()
src/app/pages/home/home.page.ts|.page.html|.page.spec.ts  C
src/app/pages/services/services-list.page.ts|.page.html|.page.spec.ts  C
src/app/pages/services/service-detail.page.ts|.page.html|.page.spec.ts  C
src/app/pages/projects/projects-list.page.ts|.page.html|.page.spec.ts  C
src/app/pages/projects/project-detail.page.ts|.page.html|.page.spec.ts  C  includes photo-gallery
src/app/pages/process/process.page.ts|.page.html|.page.spec.ts  C
src/app/pages/testimonials/testimonials.page.ts|.page.html|.page.spec.ts  C
src/app/pages/about/about.page.ts|.page.html|.page.spec.ts  C
src/app/pages/quote/quote.page.ts|.page.html|.page.spec.ts  C  the form
src/app/pages/not-found/not-found.page.ts|.page.html|.page.spec.ts  C  wildcard route + slug-miss reuse
src/content/content.types.ts                C  every interface (schema)
src/content/site.ts                          C  NAP, hours, credentials, warranty, story, areasServed,
                                                  googleBusinessProfileUrl, logo, ogImage, nav   [EAGER]
src/content/home.ts · services.ts · projects.ts · process-steps.ts · testimonials.ts · quote-options.ts  C
src/content/lookup.ts|.spec.ts              C  findService/findProject/findTestimonial
src/content/content.spec.ts                 C  contract suite over the whole content graph
```

## Interfaces / Contracts

### Routing (`app.routes.ts`)

| Order | Path | `loadComponent` | `data.seo` |
|---|---|---|---|
| 1 | `''` (`pathMatch: 'full'`) | `pages/home/home.page` → `HomePage` | indexable |
| 2 | `servicios` | `pages/services/services-list.page` → `ServicesListPage` | indexable |
| 3 | `servicios/:slug` | `pages/services/service-detail.page` → `ServiceDetailPage` | indexable |
| 4 | `proyectos` | `pages/projects/projects-list.page` → `ProjectsListPage` | indexable |
| 5 | `proyectos/:slug` | `pages/projects/project-detail.page` → `ProjectDetailPage` | indexable |
| 6 | `proceso` | `pages/process/process.page` → `ProcessPage` | indexable |
| 7 | `testimonios` | `pages/testimonials/testimonials.page` → `TestimonialsPage` | indexable |
| 8 | `nosotros` | `pages/about/about.page` → `AboutPage` | indexable |
| 9 | `presupuesto` | `pages/quote/quote.page` → `QuotePage` | indexable |
| 10 | `**` | `pages/not-found/not-found.page` → `NotFoundPage` | `indexable: false` → `<meta name="robots" content="noindex">` |

**No guards.** `withComponentInputBinding()` binds `:slug` to an `input()` signal; `withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })`. Detail page: `@if (entity(); as e) { … } @else { <app-not-found /> }`.

> ⚠️ **Route-name conflict**: specs + proposal say `/testimonios`; the launch brief said `/opiniones`. Specs are binding and forbid extra top-level routes → **`/testimonios` shipped**; `/opiniones` needs a spec amendment (see Open Questions).

### Content model (`src/content/content.types.ts`)

```ts
export interface ImageAsset { readonly src: string; readonly alt: string; readonly width: number; readonly height: number; }
export interface Area { readonly slug: string; readonly name: string; }                       // areaServed only
export interface OpeningHours { readonly days: string; readonly opens: string; readonly closes: string; }
export interface Credentials { readonly art: string; readonly insurance: string;
  readonly professionalRegistration: string; readonly cuit: string; }
export interface Nap {
  readonly name: string; readonly streetAddress: string; readonly locality: string;
  readonly region: string; readonly postalCode: string; readonly country: 'AR';
  readonly phoneDisplay: string;   // "+54 9 11 0000-0000"  (display only)
  readonly phoneE164: string;      // "5491100000000"       (wa.me + JSON-LD + tel: source, no plus)
  readonly email: string; readonly isPlaceholder: boolean;
}
export interface Site { readonly nap: Nap; readonly hours: readonly OpeningHours[];
  readonly credentials: Credentials; readonly warranty: string; readonly story: string;
  readonly areasServed: readonly Area[]; readonly googleBusinessProfileUrl: string;
  readonly logo: ImageAsset; readonly ogImage: ImageAsset; readonly nav: readonly NavItem[]; }

export interface MoneyRange { readonly min: number; readonly max: number; readonly currency: 'ARS' | 'USD'; readonly note?: string; }
export interface Service { readonly slug: string; readonly name: string; readonly summary: string;
  readonly includes: readonly string[]; readonly typicalDuration: string; readonly budgetRange: MoneyRange;
  readonly image: ImageAsset; readonly relatedProjectSlugs: readonly string[]; readonly isPlaceholder?: true; }

type BasePhoto = { readonly image: ImageAsset; readonly caption?: string };
export type ProjectPhoto =
  | (BasePhoto & { readonly kind: 'before' })
  | (BasePhoto & { readonly kind: 'after' })
  | (BasePhoto & { readonly kind: 'gallery' });
export interface Project { readonly slug: string; readonly title: string; readonly brief: string;
  readonly surfaceAreaM2: number; readonly duration: string; readonly budgetRange: MoneyRange;
  readonly location: string; readonly category: string; readonly testimonialSlug: string;
  readonly relatedServiceSlugs: readonly string[]; readonly photos: readonly ProjectPhoto[];
  readonly isPlaceholder?: true; }
export interface Testimonial { readonly slug: string; readonly author: string; readonly context: string;
  readonly rating: 1|2|3|4|5; readonly text: string; readonly isPlaceholder?: true; }
export interface ProcessStep { readonly title: string; readonly description: string; readonly duration: string;
  readonly isPlaceholder?: true; }   // added at S7 apply: keeps the release-gate grep uniform across collections
export interface HomeContent { readonly hero: { readonly headline: string; readonly subhead: string; readonly image: ImageAsset };
  readonly highlights: readonly { readonly title: string; readonly body: string }[];
  readonly featuredServiceSlugs: readonly string[]; readonly featuredProjectSlugs: readonly string[]; }

/* shared by the form <select>s and the WhatsApp message labels (no drift possible) */
export type JobType = 'reforma'|'obra-nueva'|'ampliacion'|'reparacion'|'comercial'|'otro';
export type BudgetBracket = 'sin-definir'|'hasta-3m'|'3m-8m'|'8m-15m'|'mas-15m'|'a-definir';
export type ProjectStage = 'idea'|'planificacion'|'presupuestando'|'ejecucion'|'finalizacion';
export interface Option<T extends string> { readonly value: T; readonly label: string; }
```

Collections are declared `as const satisfies readonly Service[]` — `satisfies` **validates the literal against the interface and preserves literal types** (no separate `Schema<T>` layer). Array order *is* the deterministic order (no `order` field → no drift possible). Slugs are kebab-case and unique per collection. `Project.photos[0]` is the hero (derived, never duplicated). `isPlaceholder?: true` on every entry that is not real client data → **one grep finds them all** (`grep -rn "isPlaceholder" src/`), and `content.spec.ts` enumerates them in a non-failing release-gate report.

Lookups (`src/content/lookup.ts`, pure, returns `| undefined`): `findService`, `findProject`, `findTestimonial`, `resolveServiceSlugs`, `resolveProjectSlugs`, `contentImages()` (recursive walk used by the image contract test).

### Quote form (`pages/quote/quote.page.ts`)

| Control | Type | Validators | Message line (in order) |
|---|---|---|---|
| `workType` | `select` `JobType` | `required` | `Tipo de trabajo: {label}` |
| `location` | `text` | `required`, `minLength(4)` | `Ubicación: {value}` |
| `areaM2` | `number` | `required`, `m2Range` (finite, 1–10000) | `Superficie (m²): {n}` |
| `budget` | `select` `BudgetBracket` | — | `Presupuesto estimado: {label}` *(omitted if empty)* |
| `stage` | `select` `ProjectStage` | — | `Etapa: {label}` *(omitted if empty)* |
| `comment` | `textarea` | — | `Comentario: {value}` *(omitted if empty)* |
| `consent` | `checkbox` | `requiredTrue` | not in message |
| `website` | `text` honeypot | — | never in message |

No `input[type=file]`, no upload affordance. Honeypot: `class="absolute h-0 w-0 opacity-0" tabindex="-1" autocomplete="off" aria-hidden="true"`. Options come from `quote-options.ts` (`readonly JOB_TYPE_OPTIONS: readonly Option<JobType>[]`), so `<option [value]="o.value">{{ o.label }}</option>` and the message label come from the same object. Errors: `<p [id]="id+'-error'" role="alert">{{ msg }}</p>` + `aria-invalid` + `aria-describedby`. Submit state is a `signal<'idle'|'sent'>('idle')`; success block carries `tel:` and `mailto:` from the built message.

```ts
export const toWaDigits = (phoneE164: string): string => phoneE164.replace(/\D/g, '');
export const buildLeadMessage = (f: LeadFields): string =>   // skips empty optionals, fixed order
  [LEAD_GREETING, ...lines.filter(Boolean), LEAD_PHOTO_INVITE].join('\n');
export const buildWhatsAppUrl = (digits: string, msg: string): string =>
  `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
export const buildMailtoUrl = (email: string, subject: string, body: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
export const buildTelHref = (digits: string): string => `tel:+${digits}`;
export const LEAD_PHOTO_INVITE = 'Te adjunto algunas fotos del proyecto por acá para que puedas verlo.';
```

`encodeURIComponent` alone is correct: it encodes `& ? # space newline accents`; `!'()*` are legal query characters and WhatsApp accepts them, so over-encoding is avoided (test asserts no raw `& ? #` / space / non-ASCII survive). Digits are stripped of `+`/separators, so `wa.me` never receives a plus and `tel:` gets exactly one.

### SEO / analytics

`json-ld.ts` projects a **whitelist** (never spreads `Nap`), which is what structurally prevents the `isPlaceholder` leak:

```ts
{ '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness',
  name, url, image, telephone: nap.phoneE164, email: nap.email,
  address: { '@type': 'PostalAddress', streetAddress, addressLocality, addressRegion, postalCode, addressCountry: 'AR' },
  areaServed: areas.map(a => ({ '@type': 'City', name: a.name })), sameAs: [gbUrl] }
```

`SeoService.start()` subscribes to the router: per navigation applies `data.seo` (title, description, canonical, robots), resets any detail-page override, and rewrites the single JSON-LD script through `DOCUMENT` (jsdom-testable). Detail pages call `seo.override({ title, description })` from an `effect` on the resolved entity.

```ts
export const isRealGa4Id = (v: string): boolean => /^G-[A-Z0-9]{6,}$/.test(v.trim());   // '' , 'G-XXXXXXX', 'YOUR_GA_ID' → false
```

`AnalyticsService.init()` (from `provideAppInitializer`) does nothing unless `isRealGa4Id(env.gaMeasurementId) && consent.isGranted()`. Only then does it create `window.dataLayer`, define `window.gtag`, and inject `googletagmanager.com/gtag/js?id=…`. `track(name: 'generate_lead'|'call_click'|'whatsapp_click', payload?)` sends only enumerated, PII-free params (`{ placement }`) — never digits, never `text=`, never free text. `NavigationEnd` → `gtag('config', id, { page_path, page_title, send_page_view: true })`. Events are buffered pre-consent and flushed on `grant()`.

## Styling System

`src/styles.css` (global, JIT — only used utilities are emitted):

```css
@import 'tailwindcss';
@theme {
  --color-brand-50:#f2f7fa; --color-brand-300:#93bfd3; --color-brand-600:#2b6580;
  --color-brand-800:#214353; --color-brand-900:#1f3945; --color-brand-950:#102430;
  --color-accent-400:#f5b13d; --color-accent-600:#c67a06;
  --color-ink-400:#a8a29e; --color-ink-600:#57534e; --color-ink-900:#1c1917;
  --font-sans: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
  --text-display: clamp(2rem, 1.2rem + 2.5vw, 3.5rem); --text-display--line-height: 1.05;
  --text-section: clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem);
}
@utility btn-primary { @apply bg-brand-800 text-white px-5 py-3 rounded-md font-semibold
  hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2; }
@utility btn-secondary { @apply border-2 border-brand-800 text-brand-800 px-5 py-3 rounded-md font-semibold; }
@utility skip-link { @apply sr-only focus:not-sr-only focus:absolute focus:z-50 …; }
@utility surface-card { @apply rounded-xl border border-ink-900/10 bg-white p-6; }
```

Contrast: CTA text is white on `brand-800` (≈9:1). `accent-600` on white is ≈3.3:1 → **decorative only** (rules, icons, ≥24px headings), never body text. Mobile-first Tailwind prefixes (`px-4 sm:px-6 lg:px-8`), `container mx-auto` rhythm, breakpoints `sm 640 / md 768 / lg 1024`.

**Budget safety**: components ship **no** `styleUrl`/`styles`, so `anyComponentStyle` (4 kB warn / 8 kB error) is structurally unused. Risky spots to watch in review: (a) header scroll/shadow behaviour → `@utility header-shell`, not a component style; (b) 15-photo grid → plain `grid grid-cols-2 md:grid-cols-3 gap-2`; (c) sticky CTA safe area → `pb-[env(safe-area-inset-bottom)]` inline; (d) `@defer` placeholder must reserve height (`aspect-[4/3]`) or CLS regresses; (e) global `@utility` growth inflates **initial CSS** — keep them few and shallow.

## Testing Strategy (strict TDD — `bunx ng test --watch=false`, vitest 4 / jsdom)

| Spec file | Covers |
|---|---|
| `core/lead/lead-links.spec.ts` | `buildLeadMessage` line order, omitted optionals, exact `LEAD_PHOTO_INVITE` tail, multi-line comment; `buildWhatsAppUrl` encodes `& ? #` space newline accents, no plus in digits, valid URL; `buildMailtoUrl` body === message; `buildTelHref` |
| `content/content.spec.ts` | 5–7 complete services; every project 8–15 photos with ≥1 `before` + ≥1 `after`; 3–5 attributed testimonials; slugs unique per collection; all `related*Slugs` resolve; every `ImageAsset` in the graph has non-empty `alt` and `w/h > 0`; process steps/credentials/warranty complete; placeholder report (non-failing); **no network on import** (`vi.stubGlobal('fetch', …)` then dynamic `await import()`) |
| `core/seo/json-ld.spec.ts` | valid JSON, `@type`, all required keys non-empty, `telephone === nap.phoneE164`, no `isPlaceholder`/placeholder token |
| `core/seo/seo.service.spec.ts` | title/meta/canonical/robots per route, script rewritten on navigation, noindex on 404 |
| `core/analytics/analytics.service.spec.ts` | `isRealGa4Id` truth table; placeholder/empty ID ⇒ **no script tag, no gtag, zero requests**; pre-consent silence; exactly one `generate_lead`, one `call_click`, one `whatsapp_click`; payload PII-free (no digit run ≥6, no `text=`); `page_view` on `NavigationEnd` |
| `core/consent/consent.service.spec.ts` | denied by default, `grant()` flips + flushes queue |
| `core/format.spec.ts` | money range / m² / duration formatting |
| `pages/**/*.spec.ts` (`RouterTestingHarness` + `provideRouter(routes)`) | per route: renders one `h1`, skip link first, ends with `cta-block`; services/projects render exactly N links in order; unknown slug renders `app-not-found`; single `priority` image; `lazy` on the rest; `noinput[type=file]` + exact 8 controls on `/presupuesto`; invalid submit opens nothing; honeypot silent; `wa.me` href exact; success state `tel:` + `mailto:`; zero HTTP (spy `HttpClient` + `fetch`) |
| `components/layout/sticky-cta.component.spec.ts` | absent on `/presupuesto`, present elsewhere |
| `app.spec.ts` (extend) | shell renders header/footer/sticky CTA around `router-outlet` |

Zoneless tests: assert after `await fixture.whenStable()` (no `zone.js` flush). `@defer` grids are asserted via the placeholder/`content` blocks, not by waiting for hydration.

**Not unit-tested** (by design): the real WhatsApp app opening (`window.open` is stubbed), wa.me/mailto server behaviour, real gtag.js and its network calls (`window.gtag` is a mock), actual WebP/AVIF negotiation and image bytes, LCP/INP/CLS field numbers (Lighthouse, manual), screen-reader announcement (attributes only), GBP link reachability, CSS visual regressions.

## Performance Budget

| Budget | Current | New | Note |
|---|---|---|---|
| `initial` warn | 500 kB | **450 kB** | baseline today 210 kB JS + ~5 kB CSS; shell + router + `site.ts` must stay lazy-clean |
| `initial` error | 1 MB | **500 kB** | spec's hard ceiling |
| `anyComponentStyle` | 4 kB / 8 kB | unchanged | intentionally unused (D5) |

Images: absolute external URLs only (no binaries in git), `NgOptimizedImage` with `ngSrc` + explicit `width`/`height` (CLS 0), `sizes="(min-width: 768px) 33vw, 100vw"`, WebP/AVIF via the host's transform params encoded in `ImageAsset.src`. `priority` **only** on the single above-the-fold hero (home, service detail, project detail); every other image lazy. Below-fold relief: lazy `loading`, responsive `sizes`, and `@defer (on viewport)` for the project gallery. `content.ts` is imported only by lazy routes; `site.ts` is the only eager content module.

## Work-Unit Slices (stacked PRs to `main`)

| # | Work unit (component ↔ behavior ↔ tests) | Size |
|---|---|---|
| 1 | `index.html` lang/es-AR · `@theme`+`@utility` · shell (`app.html`, header, footer, sticky-cta) · routes · `app.spec.ts` | ~380 |
| 2 | `content.types.ts` + `site.ts`/`services.ts`/`quote-options.ts` + `lookup.ts` + `service-card` + `/servicios`(+detail) + `content.spec.ts` — data files carry `size:exception` | ~600 (2 PRs) |
| 3 | `projects.ts` + `project-card` + `photo-gallery` (`@defer`) + `/proyectos`(+detail) | ~600 (2 PRs) |
| 4 | `process-steps.ts` + `testimonials.ts` + `section-heading` + `testimonial-card` + `/proceso`,`/testimonios`,`/nosotros` | ~450 |
| 5 | `lead-links.ts` + `phone-link`/`whatsapp-link`/`cta-block` + `/presupuesto` + `not-found` | ~500 (2 PRs) |
| 6 | `json-ld.ts` + `seo.service.ts` + `analytics.service.ts` + `consent.service.ts` + `gaMeasurementId` + budget tightening + README release gate | ~400 |

## Migration / Rollout

No data migration. Additive only; rollback = `git revert` slices 6→1. `fileReplacements` gains `gaMeasurementId: ''` in all three environment files. Release gate (does **not** block CI): replace NAP/credentials/GBP and set `gaMeasurementId`; verify with `grep -rn "isPlaceholder" src/`.

## Open Questions

- [ ] **BLOCKING-ish:** route is `/testimonios` (spec + proposal) but the launch brief said `/opiniones`. Ship `/testimonios`; if the owner requires `/opiniones` the spec must be amended first (extra top-level route is currently forbidden).
- [ ] Image host + AVIF/WebP transform syntax undecided → placeholder URLs only until chosen.
- [ ] Real NAP, credentials (ART, póliza, matrícula, CUIT), warranty copy and GBP URL pending from the client.
- [ ] Confirm no webfont is acceptable for the brand (P0 decision D6).
