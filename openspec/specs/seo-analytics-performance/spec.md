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
