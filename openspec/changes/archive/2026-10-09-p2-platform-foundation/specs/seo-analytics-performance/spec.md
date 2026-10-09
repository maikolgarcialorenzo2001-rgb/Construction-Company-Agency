# Delta for seo-analytics-performance

## ADDED Requirements

### Requirement: 14. [B] Platform subtree is noindex

Every `/plataforma/**` route MUST be non-indexable and MUST emit `<meta name="robots" content="noindex">`. The route-table noindex set MUST equal the platform routes plus the `**` wildcard; marketing routes MUST remain indexable.

#### Scenario: Platform routes declare noindex

- GIVEN the route table
- WHEN the routes with `data.seo.indexable === false` are collected
- THEN the set is exactly the `/plataforma/**` routes plus `**`

#### Scenario: Platform page emits robots noindex

- GIVEN a rendered `/plataforma/**` page
- WHEN the document head is inspected
- THEN the robots meta contains `noindex`

#### Scenario: No structured-data leak on platform

- GIVEN a `/plataforma/**` page
- WHEN the head is inspected
- THEN no `HomeAndConstructionBusiness` JSON-LD is emitted
