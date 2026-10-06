# content-model Specification

## Context

There is no CMS and no backend in v1. Typed TS modules under `src/content/` ARE the content database: the TypeScript interfaces are the schema and `tsc` is the validator. This capability exists so copy, images, NAP, and lead endpoints can never drift between pages, JSON-LD, and forms.

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [C] Typed content is the schema

All site content MUST be declared in typed modules under `src/content/`. The exported interfaces MUST define the shape of every collection. `tsc` (strict, via build) MUST reject any value that does not satisfy them — an out-of-shape object is a build failure, not a runtime surprise.

#### Scenario: Shape violation fails the build

- GIVEN a content entry missing a required field
- WHEN the project is built
- THEN the compiler reports a type error

### Requirement: 2. [B] NAP single source of truth

Name, address, phone, WhatsApp number, and email MUST exist in exactly ONE place. Every consumer — header, footer, sticky CTA, quote form, JSON-LD — MUST read them from that source. A NAP value MUST NOT be duplicated as a literal anywhere else in `src/`.

Consumers MUST NOT drift: the phone rendered in the footer and the phone in JSON-LD MUST be the same value.

#### Scenario: Consumers read one source

- GIVEN a NAP phone of `+54 9 11 0000-0000`
- WHEN the footer, the sticky CTA, and the JSON-LD are rendered
- THEN all three expose `+5491100000000` / the same E.164 digits

### Requirement: 3. [B] Image asset contract

Every content image MUST be an `ImageAsset { src, alt, width, height }` with `alt` non-empty and `width`/`height` greater than zero. An empty `alt` or a zero dimension MUST be treated as a defect — a test MUST fail if any `ImageAsset` in the content graph violates it.

Images are external URLs only; no image binaries live in the repository.

#### Scenario: Alt text is never empty

- GIVEN any `ImageAsset` in the content graph
- WHEN its `alt` is inspected
- THEN it is a non-empty string describing the image

### Requirement: 4. [C] Placeholder convention and release gate

Content that is not real client data MUST be flagged as placeholder (`isPlaceholder: true`) and MUST be discoverable by a single search. Placeholder NAP MUST be replaced before live release.

This is a **release gate, not a build gate**: placeholder content MUST NOT fail the build, lint, or tests.

#### Scenario: Placeholders are discoverable and non-blocking

- GIVEN placeholder NAP is flagged
- WHEN the suite, lint, and build run
- THEN all pass
- AND a single search locates every flagged entry

### Requirement: 5. [C] Stable identifiers and integrity

Every list entry MUST carry a `slug` unique within its collection. Collections MUST be exported as typed readonly data, MUST NOT perform network calls at import time, and MUST define a deterministic order.

#### Scenario: Slugs are unique

- GIVEN the services and projects collections
- WHEN slugs are collected per collection
- THEN each collection has no duplicates

## Out of Scope

- CMS (Decap), runtime content fetching, remote content API, image binaries in git.
- Multi-language content variants (`hreflang` is P1).

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Bad content shape fails `tsc` | `bunx ng build` |
| 2 | NAP appears once in `src/` | grep guard (see Release Gates) |
| 3 | Every `ImageAsset` has non-empty `alt`, positive w/h | `bunx ng test --watch=false` |
| 4 | Slugs unique per collection; no import-time network calls | `bunx ng test --watch=false` |
| 5 | Placeholder flag discoverable; suite stays green with placeholders | `bunx ng test --watch=false` |
