# Delta for api-conformance

## MODIFIED Requirements

### Requirement: Frontend compile-time conformance

The frontend MUST generate TypeScript types from the contract via an `openapi-typescript`-style codegen (runnable via `bunx`). Hand-written domain types MUST be declared against the generated `components['schemas'][...]` types and MUST be part of the `bunx ng build` compilation graph (not test-only), so a contract change that invalidates the domain model fails the build, not only the test run.

(Previously: the guard fired only under `bunx ng test` because only `conformance.spec.ts` consumed the generated types and `tsconfig.app.json` excluded specs — the unclosed W1 gap.)

#### Scenario: Divergence fails the build

- GIVEN the contract schema for a resource changes incompatibly (field removed, renamed, or type-narrowed)
- WHEN `bunx ng build` runs
- THEN compilation fails at the hand-written domain type that no longer conforms
- AND the failure is not limited to the test run

#### Scenario: Generation is reproducible

- GIVEN the current contract
- WHEN the generation script runs
- THEN types are regenerated deterministically with zero manual edits required

#### Scenario: Generated code is derived, not authored

- GIVEN the generated types file
- WHEN a developer edits it directly
- THEN the next regeneration overwrites the edit (the file is never a source of truth)

## ADDED Requirements

### Requirement: Platform domain type bindings

The platform domain models (`User`, `Profile`, `Post`, `JobOpening`, `Application`, plus their DTOs) MUST be declared against the generated schema types, so the gateway ports consume contract-shaped data. A drift in any bound schema MUST fail `bunx ng build`.

#### Scenario: Feed post binds to the schema

- GIVEN `FeedPost` is declared against `components['schemas']['FeedPost']`
- WHEN the contract changes that schema incompatibly
- THEN `bunx ng build` fails

#### Scenario: Every platform domain type is bound

- GIVEN the platform domain module
- WHEN its exported types are inspected
- THEN each conforms to a `components['schemas'][...]` type
