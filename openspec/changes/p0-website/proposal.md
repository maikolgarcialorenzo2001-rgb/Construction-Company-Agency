# Proposal: P0 Website — Minimum Viable Construction Company Site

## Intent

Argentinian construction firm needs an es-AR site converting homeowners and small commercial clients into quote requests. ~80% mobile; buyers fear contractor fraud — P0 is a fast, phone-reachable *proof* surface. `app.ts` is an empty shell (`routes = []`).

## Scope

### In Scope

| Area | Deliverable |
|---|---|
| Pages | `/`, `/servicios` + 5–7 trade pages, `/proyectos` + detail, `/proceso`, `/testimonios`, `/nosotros`, `/presupuesto` |
| Content | Typed `src/content/*.ts`; interfaces = schema, `tsc` validates |
| Proof | brief, m², duration, budget range, 8–15 photo URLs, before/after, testimonial |
| Trust | process steps; 3–5 named reviews + Google link; credentials (ART, seguros, matrícula, CUIT); warranty copy |
| Leads | `tel:`; phone-first form (type, location, m², optional budget range, stage, photo upload, honeypot, consent); `wa.me/54911…?text=`; sticky mobile CTA (hidden on `/presupuesto`) |
| SEO/analytics | JSON-LD `HomeAndConstructionBusiness` + `areaServed`, NAP, GBP link, meta; GA4 `generate_lead`/`call_click`/`whatsapp_click`, Consent Mode v2 |
| Perf/a11y | WebP/AVIF + `NgOptimizedImage` (LCP `priority`, lazy else); LCP<2s, INP<200ms, CLS<0.05; WCAG AA; end-of-page CTA |

### Out of Scope

Service-area pages, FAQ, certifications, review automation, blog (P1) · Decap CMS · `hreflang` · **any backend** (no API, DB, or server forms) · image binaries in git.

## Capabilities

### New Capabilities

`site-shell-navigation` · `content-model` · `services-catalog` · `projects-showcase` · `process-trust` · `quote-lead-capture` · `seo-analytics-performance`

### Modified Capabilities

None — `openspec/specs/` is empty; greenfield.

## Approach

Standalone ZONELESS components, lazy `loadComponent` routes, no `.component` suffix. Typed content is the single source for copy, images, NAP, and lead endpoints.

Slices (auto-chain, stacked-to-main, one work unit per PR): **1** shell+nav → **2** content+services → **3** projects → **4** process/testimonios/nosotros → **5** quote+leads → **6** SEO/analytics/perf.

## Open Decisions (spec/design)

1. **Placeholder content** — realistic Spanish copy, client replaces; needs a `PLACEHOLDER` marker convention.
2. **Form backend** — no server in v1: prefilled WhatsApp + `mailto:` fallback. Photo upload has no transport.
3. **Images** — URLs only, external host, `ImageAsset { src, alt, width, height }`. Host undecided.
4. **JSON-LD** — per-route `SeoService` script tag, not static `index.html`.
5. **Client data** — NAP, `wa.me` number, credentials pending.

## Affected Areas

| Area | Impact |
|---|---|
| `src/app/app.routes.ts` | Modified |
| `src/app/environments/*` | Modified — `gaMeasurementId`, `sitePhone` |
| `src/app/pages/*`, `src/app/ui/*`, `src/content/*.ts` | New |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Content volume breaks the 400-line budget (est. 5k–7k lines, ~1k/slice) | High | Component vs data-only commits; `size:exception` on data files |
| Placeholder NAP/phone ships live | Med | Single `site.config.ts`; grep guard |
| No backend → lost leads | Med | Visible `tel:` + `mailto:` fallback |

## Rollback Plan

Additive only; revert slices 6→1 via `git revert`. No data migration.

## Dependencies

External image host · client NAP/phone/credentials · `ENVIRONMENT` token for GA4 id.

## Success Criteria

- [ ] 8 routes reachable, es-AR, mobile-first
- [ ] `bunx ng test --watch=false`, `bunx ng lint`, `bunx ng build` green; initial < 500 kB
- [ ] LCP<2s, INP<200ms, CLS<0.05; WCAG AA basics
- [ ] CTA block ends every page; form reaches WhatsApp/email; valid JSON-LD; GA4 key events fire under consent
