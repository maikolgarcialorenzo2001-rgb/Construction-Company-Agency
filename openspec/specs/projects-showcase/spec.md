# projects-showcase Specification

## Context

This is the site's proof surface. Buyers fear being defrauded, so a project page must read like evidence — brief, size, duration, spend, and photographs — not like marketing. Weak proof here is why the phone never rings.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [C] Project evidence contract

Each project MUST supply: `slug`, `title`, `brief` (the problem and what was built), `surfaceAreaM2`, `duration`, `budgetRange`, `location`, `category`, a `testimonialSlug`, and `photos`.

`photos` MUST hold between 8 and 15 entries and MUST include at least one `before` and one `after` image.

#### Scenario: Project ships real evidence

- GIVEN any project entry
- WHEN its fields are inspected
- THEN brief, surfaceAreaM2, duration, and budgetRange are non-empty
- AND `photos.length` is between 8 and 15
- AND at least one photo is marked `before` and one `after`

### Requirement: 2. [B] List renders every project

`/proyectos` MUST render one card per project with title, category, location, and a thumbnail, each linking to `/proyectos/{slug}`.

#### Scenario: One card per project

- GIVEN the projects collection defines N projects
- WHEN `/proyectos` renders
- THEN exactly N links are present, each pointing at `/proyectos/{slug}`

### Requirement: 3. [B] Detail renders the full evidence set

`/proyectos/:slug` MUST render the brief, surface area, duration, budget range, the full photo set, and the before/after pair. An unknown slug MUST render the 404 route.

#### Scenario: Detail shows proof

- GIVEN a slug present in the projects collection
- WHEN its detail route renders
- THEN brief, m², duration, and budget range are visible
- AND all its photos are rendered
- AND a before and an after image are both identifiable

#### Scenario: Unknown slug

- GIVEN a slug absent from the projects collection
- WHEN its detail route renders
- THEN the 404 route is rendered instead of the detail page

### Requirement: 4. [B] Detail links out to services and to a quote

Each project detail MUST link back to `/proyectos`, to every related service, and MUST end with a CTA block linking to `/presupuesto`. Related services MUST resolve to existing service slugs.

#### Scenario: Project converts to a lead

- GIVEN a project detail page
- WHEN it finishes rendering
- THEN a `/presupuesto` link is present
- AND every related-service link resolves to an existing service

### Requirement: 5. [B] Imagery follows the shared image rules

Project photos MUST satisfy the `ImageAsset` contract in `content-model` and the rendering rules in `seo-analytics-performance`: explicit dimensions, lazy loading for everything below the fold, and exactly one priority image where the page has a hero (never more than one on a page).

## Out of Scope

- Project filtering by category/location, pagination, image lightboxes or galleries.
- Testimonial authoring (owned by `process-trust`).

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | List renders one card per project with thumbnail | `bunx ng test --watch=false` |
| 2 | Detail shows brief, m², duration, budget, full photo set, before/after | `bunx ng test --watch=false` |
| 3 | Unknown slug renders 404 | `bunx ng test --watch=false` |
| 4 | Every project has 8–15 photos with a before/after pair | `bunx ng test --watch=false` |
| 5 | Related service slugs all resolve | `bunx ng test --watch=false` |
