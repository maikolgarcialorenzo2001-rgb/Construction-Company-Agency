# Delta for seo-analytics-performance

## Context

Prerender serializes `SeoService`'s head into static HTML; requirements 1–7 stay unchanged. This delta only ADDS head-completeness behavior.

## ADDED Requirements

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

## Verification

| Requirement | How |
|---|---|
| 8 | Raw `dist/browser/**/index.html` head parse + `SeoService` unit spec |
| 9 | Unit spec with `SITE_URL`; grep `dist/` for `localhost` (absent) |
| 10 | Per-slug `<title>` distinctness in dist + `override()` specs |
| 11 | `index.csr.html` og:image check + duplicate-node spec |
| 12 | Raw JSON-LD parse in dist (valid, absolute url) |
| 13 | Existing `bunx ng test --watch=false` (reqs 3–5 specs) |
