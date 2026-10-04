# services-catalog Specification

## Context

Buyers arrive asking "do you actually do my job, and what does it cost?". The catalog answers the second question with evidence (duration, budget range) instead of a sales pitch — that specificity is what separates a real contractor from a scam in the buyer's eyes.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [C] Service catalog completeness

The catalog MUST declare between 5 and 7 services. Each service MUST supply: `slug`, `name`, `summary`, `includes` (what is covered), `typicalDuration`, `budgetRange`, imagery, and related project slugs.

#### Scenario: Catalog size is in range

- GIVEN the services collection
- WHEN its length is asserted
- THEN it holds at least 5 and at most 7 entries

#### Scenario: Entry completeness

- GIVEN any service entry
- WHEN its fields are inspected
- THEN name, summary, includes, typicalDuration, and budgetRange are all present and non-empty

### Requirement: 2. [B] List renders the whole catalog

`/servicios` MUST render one entry per service, in content order, each linking to `/servicios/{slug}`. The page MUST NOT hardcode a service name.

#### Scenario: One card per service, in order

- GIVEN the services collection defines N services
- WHEN `/servicios` renders
- THEN exactly N links are present
- AND they point at `/servicios/{slug}` in content order

### Requirement: 3. [B] Detail resolves by slug

`/servicios/:slug` MUST render the matching service and MUST render the 404 route for a slug not in the catalog.

#### Scenario: Known slug

- GIVEN a slug present in the catalog
- WHEN its detail route renders
- THEN the service name, includes, duration, and budget range are shown

#### Scenario: Unknown slug

- GIVEN a slug absent from the catalog
- WHEN its detail route renders
- THEN the 404 route is rendered instead of the detail page

### Requirement: 4. [B] Detail page closes with a quote path

Every service detail page MUST end with a CTA block linking to `/presupuesto` (see `site-shell-navigation`), and MUST link to at least one related project resolved from the content.

#### Scenario: Service converts to a lead

- GIVEN a service detail page
- WHEN it finishes rendering
- THEN a `/presupuesto` link is present
- AND at least one related project link is present and resolves

### Requirement: 5. [B] Imagery follows the shared image rules

Service imagery MUST satisfy the `ImageAsset` contract and the rendering rules in `seo-analytics-performance`; the hero image above the fold MUST be the priority image.

## Out of Scope

- Filtering, search, sorting, or pagination of the catalog.
- Per-service pricing calculators, downloadable documents, per-service FAQ.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | `/servicios` renders N links matching the catalog, in order | `bunx ng test --watch=false` |
| 2 | Unknown slug renders 404, not a detail page | `bunx ng test --watch=false` |
| 3 | Catalog holds 5–7 complete entries | `bunx ng test --watch=false` |
| 4 | Detail page links to `/presupuesto` and to ≥1 existing project | `bunx ng test --watch=false` |
| 5 | Build + lint green | `bunx ng lint`, `bunx ng build` |
