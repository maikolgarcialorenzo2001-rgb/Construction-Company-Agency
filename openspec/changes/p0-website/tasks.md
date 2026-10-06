# Tasks: P0 Website — Minimum Viable Construction Company Site

Strict TDD: every **[B]** task = RED spec first, then GREEN impl. Runner `bunx ng test --watch=false`. Code/comments English, UI copy es-AR, components `components/<name>/<name>.component.*` (class `<Name>Component`), pages `pages/<name>/<name>.page.*` (class `<Name>Page`), `app` prefix, no component styles.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4,300 total (~3,450 behavior+tests, ~850 data under exception) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 10 (one slice each), stacked to `main` |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

`size:exception` (maintainer-pre-approved, DATA-ONLY modules only): `src/content/site.ts`, `services.ts`, `projects.ts`, `testimonials.ts`, `process-steps.ts`, `home.ts`, `quote-options.ts`. Excluded from the exception: `content.types.ts`, `lookup.ts`, all `*.spec.ts`. Any **[B]** slice exceeding ~400 must split at apply time, not ask.

### Suggested Work Units

| Unit | Goal | PR | Notes |
|---|---|---|---|
| S1 | Routing + 404 + es-AR doc | 1 | base `main`; stubs only |
| S2 | Content schema + NAP | 2 | needs S1 |
| S3 | Tokens + shared UI + lead helpers | 3 | needs S2 |
| S4 | Shell (nav, footer, sticky CTA) | 4 | needs S3 |
| S5 | Services catalog | 5 | needs S3/S4; data = exception |
| S6 | Projects + gallery | 6 | needs S5; data = exception |
| S7 | Proceso + testimonios | 7 | needs S4; data = exception |
| S8 | Home + nosotros | 8 | needs S6 |
| S9 | Quote form (lead capture) | 9 | needs S3, S8 |
| S10 | SEO + analytics + budgets | 10 | needs S9; **split into 2 PRs at apply** |

## S1 — Routing foundation [B] (~280)

- [x] **T1.1** 10-route table, all lazy, no guards, `data.seo` each. *AC:* every top-level path navigates; no extra top-level route. *Files:* `app.routes.ts`, `app.config.ts`. *Deps:* —
- [x] **T1.2** 9 page stubs (inline `h1`, no styles) — replaced by S5–S9. *AC:* build green. *Files:* `pages/{home,services/services-list,services/service-detail,projects/projects-list,projects/project-detail,process,testimonials,about,quote}/*.ts`. *Deps:* T1.1
- [x] **T1.3** `NotFoundPage` + `**` route. *AC:* `/no-existe` renders `app-not-found` with one `h1`. *Files:* `pages/not-found/*`, `app.routes.ts`. *Deps:* T1.1
- [x] **T1.4** Document es-AR. *AC:* root `lang === 'es-AR'`; description/OG/theme-color present. *Files:* `index.html`. *Deps:* —

## S2 — Content schema + NAP [C]+[B] (~260)

- [x] **T2.1 [C]** `content.types.ts` all interfaces (design §Content model). *AC:* `bunx ng build` fails on an out-of-shape entry. *Files:* `content/content.types.ts`. *Deps:* —
- [x] **T2.2 [C]** `site.ts`: NAP, hours, credentials, warranty, story, areasServed, GBP, logo, ogImage, nav; `isPlaceholder: true`. *AC:* build green; one grep finds it. *Files:* `content/site.ts`. *Deps:* T2.1
- [x] **T2.3 [B]** `lookup.ts`: `findService/findProject/findTestimonial/resolve*Slugs/contentImages`. *AC:* spec — found entity, `[]`/`undefined` on miss, `contentImages` walks nested. *Files:* `content/lookup.ts|.spec.ts`. *Deps:* T2.1
- [x] **T2.4 [B]** `content.spec.ts` base suite: NAP completeness, slug uniqueness, every `ImageAsset` alt non-empty + w/h>0, no import-time `fetch` (stub + dynamic import), non-failing placeholder report. *AC:* suite green with placeholders. *Files:* `content/content.spec.ts`. *Deps:* T2.2, T2.3

## S3 — Tokens + shared UI + lead helpers [B]+[C] (~300)

- [x] **T3.1 [C]** `styles.css` `@theme` + `@utility` (`btn-primary`, `btn-secondary`, `skip-link`, `surface-card`, `header-shell`). *AC:* only used utilities emitted; build green. *Files:* `styles.css`. *Deps:* —
- [x] **T3.2 [B]** `core/lead/lead-links.ts`: `toWaDigits`, `buildLeadMessage`, `buildWhatsAppUrl`, `buildMailtoUrl`, `buildTelHref`, `LEAD_PHOTO_INVITE`. *AC:* spec — fixed line order, optionals omitted, exact tail, `& ? #`/space/newline/accents encoded, no `+` in digits. *Files:* `core/lead/lead-links.ts|.spec.ts`. *Deps:* T2.1
- [x] **T3.3 [C]** `quote-options.ts`: `Option<T>`, `JOB_TYPE_OPTIONS`, `BUDGET_OPTIONS`, `STAGE_OPTIONS`. *AC:* build green; options and message labels share one source. *Files:* `content/quote-options.ts`. *Deps:* T2.1
- [x] **T3.4 [B]** `components/section-heading`, `components/phone-link` (`tel:`), `components/cta-block` (`/presupuesto` + phone). *AC:* specs — `href === tel:+549…` from NAP, CTA has `/presupuesto` + `tel:`, no NAP literals. *Files:* `components/{section-heading/section-heading.component,phone-link/phone-link.component,cta-block/cta-block.component}.ts|.html|.spec.ts`. *Deps:* T3.1, T3.2, T2.2
- [x] **T3.5 [B]** `components/whatsapp-link` (`wa.me/{digits}?text=`). *AC:* spec — exact href, empty message when no invite. *Files:* `components/whatsapp-link/whatsapp-link.component.ts|.html|.spec.ts`. *Deps:* T3.2, T2.2

## S4 — Shell chrome [B] (~360)

- [x] **T4.1** `app.html`: skip link first, header, `<main id="main">`, `router-outlet`, footer, sticky CTA; drop `styleUrl`, delete `app.css`. *AC:* order asserted in `app.spec.ts`. *Files:* `app.ts`, `app.html`, delete `app.css`, `app.spec.ts`. *Deps:* S3
- [x] **T4.2** `components/layout/header`: nav from `site.nav` + phone. *AC:* one `routerLink` per nav item, one `tel:` action. *Files:* `components/layout/header.component.ts|.html|.spec.ts`. *Deps:* T4.1
- [x] **T4.3** `components/layout/footer`: NAP, hours, WhatsApp, external GBP (`target=_blank rel=noopener`). *AC:* every NAP value present, `wa.me` + GBP present, zero NAP literals. *Files:* `components/layout/footer.component.ts|.html|.spec.ts`. *Deps:* T4.1
- [x] **T4.4** `components/layout/sticky-cta`: `@if (!isQuoteRoute())`, `sm:hidden`, `pb-[env(safe-area-inset-bottom)]`. *AC:* absent on `/presupuesto`, else WhatsApp + `tel:`. *Files:* `components/layout/sticky-cta.component.ts|.html|.spec.ts`. *Deps:* T4.1

## S5 — Services catalog [B]+[C] (~340 + ~300 data)

- [x] **T5.1 [C]** `services.ts`: 5–7 complete entries, es-AR copy, `isPlaceholder`. *AC:* build green (`size:exception`). *Files:* `content/services.ts`. *Deps:* T2.1
- [x] **T5.2 [B]** `core/format.ts`: `formatMoneyRange`, `formatArea`, `formatDuration`. *AC:* spec — ARS/USD ranges, `m²`, duration strings. *Files:* `core/format.ts|.spec.ts`. *Deps:* —
- [x] **T5.3 [B]** `components/service-card`. *AC:* spec — href `/servicios/{slug}`, name + summary shown. *Files:* `components/service-card/service-card.component.ts|.html|.spec.ts`. *Deps:* T2.1
- [x] **T5.4 [B]** `/servicios` list: N links in content order, no hardcoded names, lazy images, ends with `cta-block`. *AC:* exactly N ordered links. *Files:* `pages/services/services-list.page.ts|.page.html|.page.spec.ts`. *Deps:* T5.1, T5.3
- [x] **T5.5 [B]** `/servicios/:slug` detail: slug input, `@if/@else app-not-found`, includes/duration/budget, ≥1 `/proyectos/{slug}` link, one priority hero, `cta-block`. *AC:* known slug shows all fields; unknown slug renders `app-not-found`. *Files:* `pages/services/service-detail.page.ts|.page.html|.page.spec.ts`. *Deps:* T5.2, T5.4
- [x] **T5.6 [B]** Extend `content.spec.ts`: 5–7 services, every field non-empty, slugs unique. *AC:* suite green. *Files:* `content/content.spec.ts`. *Deps:* T5.1

## S6 — Projects showcase [B]+[C] (~380 + ~560 data)

- [x] **T6.1 [C]** `projects.ts`: 3–4 projects, each 8–15 photos incl. ≥1 `before` + ≥1 `after`, `testimonialSlug`, `relatedServiceSlugs`. *AC:* build green (`size:exception`). *Files:* `content/projects.ts`. *Deps:* T2.1
- [x] **T6.2 [B]** `components/project-card`: title, category, location, thumb = `photos[0]`. *AC:* spec — one link `/proyectos/{slug}` per project. *Files:* `components/project-card/project-card.component.ts|.html|.spec.ts`. *Deps:* T2.1
- [x] **T6.3 [B]** `components/photo-gallery`: `@defer (on viewport)` + `@placeholder` reserving `aspect-[4/3]`. *AC:* spec asserts placeholder/content blocks, no hydration wait. *Files:* `components/photo-gallery/photo-gallery.component.ts|.html|.spec.ts`. *Deps:* T6.2
- [x] **T6.4 [B]** `/proyectos` list: N cards, order, lazy thumbs, `cta-block`. *AC:* exactly N ordered links. *Files:* `pages/projects/projects-list.page.ts|.page.html|.page.spec.ts`. *Deps:* T6.1, T6.2
- [x] **T6.5 [B]** `/proyectos/:slug` detail: brief, m², duration, budget, before/after pair, related services, back-link, one priority hero, `cta-block`, unknown → `app-not-found`. *AC:* all evidence visible; unknown slug 404s. *Files:* `pages/projects/project-detail.page.ts|.page.html|.page.spec.ts`. *Deps:* T6.3
- [x] **T6.6 [B]** Cross-collection integrity: every `relatedServiceSlugs` and `relatedProjectSlugs` resolves; photos 8–15 with before/after. *AC:* suite green. *Files:* `content/content.spec.ts`, `pages/services/service-detail.page.spec.ts`. *Deps:* T6.1, T5.1

## S7 — Proceso + testimonios [B]+[C] (~380)

- [x] **T7.1 [C]** `process-steps.ts`: ordered steps with title/description/duration. *AC:* build green. *Files:* `content/process-steps.ts`. *Deps:* T2.1
- [x] **T7.2 [C]** `testimonials.ts`: 3–5 attributed reviews (author, context, rating 1–5, text). *AC:* build green. *Files:* `content/testimonials.ts`. *Deps:* T2.1
- [x] **T7.3 [B]** `components/testimonial-card`. *AC:* spec — author, context, rating, text rendered. *Files:* `components/testimonial-card/testimonial-card.component.ts|.html|.spec.ts`. *Deps:* T2.1
- [x] **T7.4 [B]** `/proceso`: N steps numbered 1..N in content order + duration, `cta-block`. *AC:* exactly N numbered steps. *Files:* `pages/process/process.page.ts|.page.html|.page.spec.ts`. *Deps:* T7.1
- [x] **T7.5 [B]** `/testimonios`: every review + exactly one external GBP link (`target=_blank`), `cta-block`. *AC:* all authors present, one external link. *Files:* `pages/testimonials/testimonials.page.ts|.page.html|.page.spec.ts`. *Deps:* T7.2, T7.3
- [x] **T7.6 [B]** Extend `content.spec.ts`: steps complete/ordered, 3–5 attributed reviews. *AC:* suite green. *Files:* `content/content.spec.ts`. *Deps:* T7.1, T7.2

## S8 — Home + nosotros [B]+[C] (~300)

- [x] **T8.1 [C]** `home.ts`: hero, highlights, `featuredServiceSlugs`, `featuredProjectSlugs`. *AC:* build green. *Files:* `content/home.ts`. *Deps:* T2.1
- [x] **T8.2 [B]** `/`: one `h1`, hero as the single `priority` image, highlights, resolved featured services/projects, `cta-block`. *AC:* one priority image, no hardcoded service/project names. *Files:* `pages/home/home.page.ts|.page.html|.page.spec.ts`. *Deps:* T8.1, T6.4, T5.4
- [x] **T8.3 [B]** `/nosotros`: story, 4 credentials, warranty, NAP matching `site.ts`, `cta-block`. *AC:* all trust payload + NAP values visible. *Files:* `pages/about/about.page.ts|.page.html|.page.spec.ts`. *Deps:* T2.2

## S9 — Quote lead capture [B] (~390)

- [x] **T9.1** RED field set: exactly 8 controls, labels + `aria-describedby`, no `input[type=file]`. *AC:* spec fails first. *Files:* `pages/quote/quote.page.spec.ts`. *Deps:* T3.3
- [x] **T9.2** Reactive form (`NonNullableFormBuilder`): `workType` required, `location` required+min(4), `areaM2` required+m2Range(1–10000), `consent` requiredTrue, honeypot `website`; `role="alert"` errors, `aria-invalid`. *AC:* invalid submit opens nothing, `markAllAsTouched`, first invalid focused. *Files:* `pages/quote/quote.page.ts|.page.html`. *Deps:* T9.1
- [x] **T9.3** Submit: honeypot → silent return; else resolve option labels → `buildLeadMessage` → `window.open(buildWhatsAppUrl(toWaDigits(nap.phoneE164), msg))` → `sent` signal. *AC:* exact href, one open, no success on honeypot. *Files:* `pages/quote/quote.page.ts`. *Deps:* T9.2
- [x] **T9.4** Success state: `tel:` fallback + `mailto:` with the same body; zero HTTP (`HttpClient` + `fetch` spies). *AC:* both hrefs correct, 0 requests. *Files:* `pages/quote/quote.page.ts|.page.html|.page.spec.ts`. *Deps:* T9.3

## S10 — SEO + analytics + budgets [B] (~470, split at apply)

- [x] **T10.1** `core/seo/json-ld.ts` whitelist projection (`HomeAndConstructionBusiness`, `PostalAddress`, `areaServed`, `sameAs`). *AC:* spec — valid JSON, no `isPlaceholder` leak, `telephone === nap.phoneE164`. *Files:* `core/seo/json-ld.ts|.spec.ts`. *Deps:* T2.2
- [x] **T10.2** `core/seo/seo.service.ts`: `start()` on router, `data.seo` title/meta/canonical/robots, single rewritten JSON-LD script via `DOCUMENT`, `override()`, noindex on 404. *AC:* spec — per-route values, script rewritten, 404 noindex. *Files:* `core/seo/seo.service.ts|.spec.ts`, `app.config.ts`. *Deps:* T10.1
- [x] **T10.3** `core/consent/consent.service.ts`. *AC:* spec — denied by default, `grant()` flips + flushes queue. *Files:* `core/consent/consent.service.ts|.spec.ts`. *Deps:* —
- [x] **T10.4** `core/analytics/analytics.service.ts`: `isRealGa4Id`, init gate, gtag injection, enumerated PII-free `track`, `page_view` on `NavigationEnd`. *AC:* spec — empty/placeholder ID ⇒ no script, no gtag, 0 requests; pre-consent silence. *Files:* `core/analytics/analytics.service.ts|.spec.ts`, `environments/*`. *Deps:* T10.3
- [x] **T10.5** Event wiring: `phone-link`→`call_click{placement}`, `whatsapp-link`→`whatsapp_click{placement}`, quote→`generate_lead` once; `gaMeasurementId: ''`; `provideAppInitializer(seo.start, analytics.init)`. *AC:* spec — one event each, payload has no digit run ≥6 nor `text=`. *Files:* `components/{phone-link/phone-link.component,whatsapp-link/whatsapp-link.component}.ts`, `pages/quote/quote.page.ts`, `app.config.ts`, `environments/*`. *Deps:* T10.4, T9.4
- [x] **T10.6** Perf/a11y matrix + budgets + release gate: every route one `h1`, one `priority` image, rest `loading="lazy"`, skip link first, `cta-block` last (except `/presupuesto`); budgets 450 kB warn / 500 kB error; README gate `grep -rn "isPlaceholder" src/`. *AC:* matrix spec green; `bunx ng build` under 450 kB. *Files:* `src/app/**/*.spec.ts`, `angular.json`, `README.md`. *Deps:* S1–S9

## Verification Independence

Independently verifiable per task: every `*.spec.ts` runs in isolation (`bunx ng test --watch=false`). Only after a **slice** completes: route matrix (T1.1, T10.6), `content.spec.ts` (T2.4 + T5.6/T6.6/T7.6 accumulate), gates `bunx ng lint && bunx ng test --watch=false && bunx ng build`.

## Out of Scope (all slices)

Backend/API · file upload · consent banner UI (stub only) · service-area pages, FAQ, blog, `hreflang` · `/opiniones` alias (needs spec amendment) · real NAP/credentials/GA4/image host.
