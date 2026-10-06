# process-trust Specification

## Context

The stated buyer fear is contractor fraud. Process steps, named reviews, verifiable credentials, and a written warranty are what neutralize it. Everything here is trust copy, which means it must come from content (so the owner can replace it) and must be attributed (unnamed praise reads as fabricated).

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [C] Process steps

The process MUST be defined in content as an ordered list of steps, each with a title, description, and expected duration.

#### Scenario: Steps are ordered and complete

- GIVEN the process collection
- WHEN each step is inspected
- THEN title, description, and expected duration are non-empty
- AND the collection declares a deterministic order

### Requirement: 2. [B] `/proceso` renders numbered steps

`/proceso` MUST render every step in content order, numbered from 1, with its description and duration visible. The page MUST NOT hardcode step copy.

#### Scenario: Numbered steps in order

- GIVEN the process collection defines N steps
- WHEN `/proceso` renders
- THEN exactly N steps are shown, numbered 1..N in content order
- AND each shows its duration

### Requirement: 3. [C] Named, attributed reviews

The testimonials collection MUST hold 3 to 5 reviews. Each MUST carry author name, context (city or project type), rating, and text. A review without a name is invalid content.

#### Scenario: Reviews are attributed

- GIVEN the testimonials collection
- WHEN each review is inspected
- THEN every review has a non-empty author name, context, rating, and text

#### Scenario: Review count is in range

- GIVEN the testimonials collection
- WHEN its length is asserted
- THEN it holds at least 3 and at most 5 reviews

### Requirement: 4. [B] `/testimonios` renders reviews plus the Google link

`/testimonios` MUST render every review with its name, context, rating, and text, and MUST link to the external Google Business Profile so the visitor can verify independently.

#### Scenario: Verifiable reviews

- GIVEN the testimonials collection
- WHEN `/testimonios` renders
- THEN every review appears with an author name
- AND exactly one external GBP link is present, opening outside the app

### Requirement: 5. [C] Credentials and warranty

Company data MUST include credentials (ART, insurance, professional registration, CUIT) and explicit warranty copy. These MUST live in content, never as literals in components.

#### Scenario: Credentials are declared

- GIVEN the company content
- WHEN credentials are inspected
- THEN ART, insurance, professional registration, and CUIT are all present
- AND warranty copy is non-empty

### Requirement: 6. [B] `/nosotros` renders story, credentials, warranty, NAP

`/nosotros` MUST render the company story, the full credential list, the warranty copy, and the NAP values from the single source.

#### Scenario: About page carries the trust payload

- GIVEN the company content
- WHEN `/nosotros` renders
- THEN story, every credential, and warranty copy are visible
- AND the NAP shown matches the NAP single source

### Requirement: 7. [B] Trust pages end with a quote path

`/proceso`, `/testimonios`, and `/nosotros` MUST each end with a CTA block linking to `/presupuesto`.

## Out of Scope

- Certifications page, review automation or syndication, review schema beyond what `seo-analytics-performance` requires.
- Review submission forms, team photo galleries.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | `/proceso` numbers every step 1..N in content order | `bunx ng test --watch=false` |
| 2 | `/testimonios` renders 3–5 named reviews + external GBP link | `bunx ng test --watch=false` |
| 3 | `/nosotros` renders story, 4 credentials, warranty, matching NAP | `bunx ng test --watch=false` |
| 4 | Credentials/warranty absent as component literals | grep guard + `bunx ng lint` |
| 5 | Build + lint green | `bunx ng build`, `bunx ng lint` |
