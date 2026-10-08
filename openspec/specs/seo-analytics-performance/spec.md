# seo-analytics-performance Specification

## Context

Discovery comes from local search, conversion tracking from GA4 key events, and trust from machine-readable NAP. All three read the same NAP source, so this capability is mostly about not leaking placeholder data into the machine-readable layer. It also carries the global rendering, performance, and accessibility budgets.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [B] JSON-LD on every indexable route

Every indexable route MUST emit a valid `HomeAndConstructionBusiness` JSON-LD script with at minimum: `@context`, `@type`, `name`, `url`, `image`, `telephone`, `address` (as `PostalAddress`), `areaServed`, and `sameAs` (the Google Business Profile). Data MUST reflect the current route.

#### Scenario: Valid, complete JSON-LD

- GIVEN any indexable route
- WHEN the document is inspected
- THEN the script parses as valid JSON with `@type` `HomeAndConstructionBusiness`
- AND every listed property is present and non-empty

### Requirement: 2. [B] JSON-LD derives from NAP and MUST NOT leak internals

NAP values MUST come from the NAP single source. The payload MUST NOT contain internal markers such as `isPlaceholder`. While NAP is flagged placeholder, the site MUST NOT advertise it as live business facts.

#### Scenario: No placeholder leak

- GIVEN placeholder NAP is flagged
- WHEN JSON-LD renders
- THEN no `isPlaceholder` key and no placeholder token appear in the payload

#### Scenario: Consistency

- GIVEN a NAP phone of `+54 9 11 0000-0000`
- WHEN JSON-LD renders
- THEN its `telephone` equals the visible footer phone

### Requirement: 3. [B] Analytics is inert without a measurement ID

The GA4 measurement ID MUST come from the `ENVIRONMENT` injection token (same pattern as `apiUrl`). When empty, absent, or a placeholder token, analytics MUST be fully inert: no `gtag`, no injected script, no network request.

#### Scenario: No ID configured

- GIVEN `gaMeasurementId` is empty or a placeholder
- WHEN any page renders and any CTA is activated
- THEN no analytics script is injected and no analytics request is issued

### Requirement: 4. [B] Consent Mode v2 stub gates collection

Analytics MUST default to denied and MUST NOT fire events or load the tag until consent is granted. The consent stub MUST exist so a banner can later drive it.

#### Scenario: Pre-consent silence

- GIVEN no consent granted
- WHEN a `tel:` action is activated
- THEN no event is sent

### Requirement: 5. [B] Three key events, no PII

The app MUST emit exactly these key events, once per activation:

| Event | Trigger |
|---|---|
| `generate_lead` | valid quote-form submit |
| `call_click` | any `tel:` action |
| `whatsapp_click` | any `wa.me` action |

No payload MUST contain personal data: no field values, no phone digits, no URLs carrying message text, no free-text comments.

#### Scenario: Click tracking without PII

- GIVEN consent granted and a valid measurement ID
- WHEN a `tel:` action is activated
- THEN one `call_click` is sent with no phone digits in its payload

#### Scenario: Lead tracking once

- GIVEN a valid quote submit
- WHEN it succeeds
- THEN exactly one `generate_lead` is sent

### Requirement: 6. [B] Image rendering rules

Every content image MUST render through `NgOptimizedImage` with explicit `width` and `height` (CLS < 0.05). The single above-the-fold LCP image MUST be marked priority; all others MUST lazy-load.

#### Scenario: One priority image per page

- GIVEN a page with a hero image
- WHEN it renders
- THEN exactly one image is priority-loaded
- AND the rest declare loading="lazy"

### Requirement: 7. [B] WCAG AA basics

Every page MUST have exactly one `h1`, a skip link to main content, keyboard-reachable interactive elements with a visible focus indicator, accessible names on icon-only controls, image alt text, and body text contrast of at least 4.5:1. Focus order MUST follow reading order.

#### Scenario: Keyboard-only path

- GIVEN any page
- WHEN a keyboard user tabs from the top
- THEN the skip link is the first stop and reveals main content
- AND every interactive element is reachable with a visible focus indicator

### Requirement: 8. [B] Complete social head in prerendered HTML

Every prerendered file MUST contain `og:image` (from `site.ogImage`), `og:url`, `twitter:card` (`summary_large_image`) and `og:type` in its raw pre-JS head — one node per key — beside existing `og:title`/`og:description`.

#### Scenario: Raw-HTML unfurl head

- GIVEN any prerendered route output
- WHEN its head is parsed without executing JS
- THEN `og:image`, `og:url`, `twitter:card`, `og:title`, `og:description` each appear exactly once
- AND `og:image` equals `site.ogImage.src`

#### Scenario: No duplication after hydration

- GIVEN a prerendered head
- WHEN the app hydrates and navigates
- THEN each meta key still has exactly one node (in-place rewrite)

### Requirement: 9. [B] Absolute canonical origin from SITE_URL (R1)

Canonical, `og:url` and JSON-LD `url` MUST use an explicit `SITE_URL` (existing `ENVIRONMENT` token/fileReplacements pattern) in prod builds, MUST NOT contain a `localhost`/preview origin. Dev MAY fall back to `document.location.origin`.

#### Scenario: Production build uses SITE_URL

- GIVEN `SITE_URL` set for prod
- WHEN prerender emits `/servicios/reformas-integrales`
- THEN canonical href is `SITE_URL` + path, absolute, no `localhost`

#### Scenario: Dev fallback

- GIVEN no `SITE_URL` under `ng serve`
- WHEN `SeoService` applies the head
- THEN canonical uses `document.location.origin` + path

### Requirement: 10. [B] Per-slug heads on detail pages (R2)

Each detail page (`/servicios/:slug`, `/proyectos/:slug`) MUST carry `<title>`, meta description, `og:title` and `og:description` from its own content entry via `SeoService.override()` or equivalent at prerender time. The generic route-data title MUST NOT freeze in; canonical/`og:url` follow the per-slug URL.

#### Scenario: Distinct frozen titles

- GIVEN two service detail HTML files
- WHEN their `<title>` values are read
- THEN each matches its own derived title and the two differ

#### Scenario: Head internally consistent

- GIVEN one detail HTML file
- WHEN its head is parsed
- THEN `<title>` equals `og:title`, description equals `og:description`, canonical equals its absolute URL

### Requirement: 11. [B] Static og:image fallback in index.html

`src/index.html` MUST include a static `og:image` (`site.ogImage` value) beside existing og tags so the CSR fallback unfurls without JS; the runtime write MUST supersede it without duplicates.

#### Scenario: CSR fallback unfurls

- GIVEN `index.csr.html` served for an unknown path
- WHEN its head is read without JS
- THEN `og:image` is present and non-empty

#### Scenario: No duplicate after boot

- GIVEN the static og nodes
- WHEN the app boots
- THEN exactly one `og:image` node remains

### Requirement: 12. [B] Full head and JSON-LD present before JS

Every prerendered file MUST carry pre-JS: per-route `<title>`, description, `robots`, canonical, and one valid JSON-LD script with an absolute `SITE_URL` `url` and no placeholder leak (Req 2).

#### Scenario: Non-JS crawler sees per-route head

- GIVEN any prerendered file
- WHEN it is parsed without executing scripts
- THEN title, description, robots, canonical and JSON-LD are present and route-appropriate, never home values

#### Scenario: Raw head matches client head

- GIVEN the same route pre-JS and post-hydration
- WHEN heads are compared
- THEN values are identical

### Requirement: 13. [B] Hydration preserves consent and analytics contracts

Hydration MUST NOT alter requirements 3–5: inert without a measurement ID, consent-gated, three PII-free key events; no analytics output during prerender.

#### Scenario: Existing suite stays green

- GIVEN hydration enabled
- WHEN `bunx ng test --watch=false` runs
- THEN the requirements 3–5 specs pass unchanged

## Out of Scope

- `hreflang`, service-area pages, certifications, review automation, blog.
- A/B testing, retargeting audiences, custom dashboards, server-side tagging.

## Release Gates

Placeholder NAP (phone, address, credentials) MUST be replaced before live release. This gate does NOT block build, lint, or tests.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Valid `HomeAndConstructionBusiness` JSON-LD on every indexable route | `bunx ng test --watch=false` |
| 2 | JSON-LD NAP matches visible NAP; no `isPlaceholder` leak | `bunx ng test --watch=false` |
| 3 | Empty/placeholder GA4 ID ⇒ zero requests, no script tag | `bunx ng test --watch=false` |
| 4 | 3 key events fire once each, no PII | `bunx ng test --watch=false` |
| 5 | At most one priority image per route (exactly one where a hero exists); rest lazy | `bunx ng test --watch=false` |
| 6 | Single `h1`, skip link, visible focus on every page | `bunx ng test --watch=false` |
| 7 | Initial bundle < 500 kB; build + lint green | `bunx ng build`, `bunx ng lint` |
| 8 | Raw `dist/browser/**/index.html` head parse + `SeoService` unit spec | `bun scripts/verify-prerender.ts`, `bunx ng test --watch=false` |
| 9 | Unit spec with `SITE_URL`; grep `dist/` for `localhost` (absent) | `bunx ng test --watch=false`, `bun scripts/verify-prerender.ts` |
| 10 | Per-slug `<title>` distinctness in dist + `override()` specs | `bun scripts/verify-prerender.ts`, `bunx ng test --watch=false` |
| 11 | `index.csr.html` og:image check + duplicate-node spec | `bun scripts/verify-prerender.ts`, `bunx ng test --watch=false` |
| 12 | Raw JSON-LD parse in dist (valid, absolute url) | `bun scripts/verify-prerender.ts` |
| 13 | Existing `bunx ng test --watch=false` (reqs 3–5 specs) | `bunx ng test --watch=false` |
