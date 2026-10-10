# API Conformance Specification

## Purpose

Drift guards that make contract–consumer divergence fail loudly: a contract validation gate, a frontend compile-time conformance guard, and a backend contract-test requirement. This spec defines WHAT fails and WHEN — tooling specifics are chosen at design.

## Requirements

### Requirement: Contract validation gate

A validation command MUST verify that `contracts/openapi.yaml` is valid OpenAPI 3.1 and lint-clean, runnable via `bunx`, and MUST run as a gate for any change that touches `contracts/`.

#### Scenario: Invalid contract fails the gate

- GIVEN a contract containing a schema error or lint violation
- WHEN the validation command runs
- THEN it exits non-zero and identifies the offending location

#### Scenario: Valid contract passes the gate

- GIVEN the current contract
- WHEN the validation command runs
- THEN it exits zero

### Requirement: Frontend compile-time conformance

The frontend MUST generate TypeScript types from the contract via an `openapi-typescript`-style codegen (runnable via `bunx`). Hand-written domain types MUST be declared against the generated `components['schemas'][...]` types and MUST be part of the `bunx ng build` compilation graph (not test-only), so a contract change that invalidates the domain model fails the build, not only the test run.

(Previously: the guard fired only under `bunx ng test` because only `conformance.spec.ts` consumed the generated types and `tsconfig.app.json` excluded specs — the unclosed W1 gap.)

#### Scenario: Divergence fails the build

- GIVEN the contract schema for a resource changes incompatibly (field removed, renamed, or type-narrowed)
- WHEN `bunx ng build` runs
- THEN compilation fails at the hand-written domain type that no longer conforms
- AND the failure is not limited to the test run

> **Archive annotation (verify W1 — CLOSED by this change):** The guard now fires under `bunx ng build`: `contract-conformance.ts` declares the domain types against `components['schemas'][...]` via a bidirectional `AssertExtends` and is included in the build program through `tsconfig.app.json` (`include: ["src/**/*.ts"]`, `exclude: ["src/**/*.spec.ts"]`). Adversarially re-proven during verify with two mutations (forward + reverse) → `bunx ng build` fails `TS2344`; both reverted. The former test-only placement gap recorded by `p2-api-contract` is resolved.

#### Scenario: Generation is reproducible

- GIVEN the current contract
- WHEN the generation script runs
- THEN types are regenerated deterministically with zero manual edits required

#### Scenario: Generated code is derived, not authored

- GIVEN the generated types file
- WHEN a developer edits it directly
- THEN the next regeneration overwrites the edit (the file is never a source of truth)

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

> **Archive annotation (verify PASS — adversarially proven):** The binding is enforced from the non-spec `domain/contract-conformance.ts` (zero runtime) so it gates `bunx ng build`. The forward and reverse directions are both required (schema field removal only fails the reverse side); the type-level probe in `conformance.spec.ts` (`// @ts-expect-error` on an invalid `AssertExtends`) fails the test if the assertion ever stops rejecting.

### Requirement: Backend contract tests

The Go backend MUST include automated contract tests that validate its HTTP responses against `contracts/openapi.yaml` for every implemented operation. The tests MUST load and validate the contract, drive the backend router in-process against the in-memory store, and validate each response (and request) with kin-openapi's `openapi3filter.ValidateResponse`. They MUST run under the default `go test ./...` from `backend/`, MUST NOT require an external service, and MUST NOT be gated by build tags, `testing.Short()`, or `-run` exclusions.

(Previously: recorded as an inherited requirement with no Go code in `p2-api-contract`; now realized by the backend foundation for the three auth operations.)

#### Scenario: Implemented operation conforms

- GIVEN the auth router wired to the in-memory store
- WHEN a contract test drives `register`, `login`, and `getMe` with `httptest`
- THEN each response validates against the contract schema and status
- AND the contract itself loads and validates

#### Scenario: Response violating the contract fails

- GIVEN the Go backend implements an endpoint
- WHEN its response no longer matches the contract schema
- THEN the backend test suite fails

> **Archive annotation (verify R3 — CLOSED by this change):** Realized by `p3-backend-foundation` — `backend/internal/contract/guard.go` (`LoadFromFile` + `doc.Validate` + `gorillamux` router + `ValidateResponse`) drives the three auth operations with `httptest` and the in-memory adapter, closing the R3 gap recorded by `p2-api-contract`. Independently reproduced at verify: neutering `openapi3filter.ValidateResponse` makes the suite fail.

### Requirement: Contract guard integrity self-test

The backend contract guard MUST include a self-test that pushes a deliberately contract-violating response through the same guard path and asserts a non-nil error. If the guard ever stops rejecting non-conforming responses, the self-test MUST fail under the default suite.

#### Scenario: Guard rejects a mutated response

- GIVEN the guard under test
- WHEN a response with a schema-violating body is validated
- THEN the guard returns a non-nil error

#### Scenario: Neutered guard fails the suite

- GIVEN someone disables the guard's response validation
- WHEN `go test ./...` runs from `backend/`
- THEN the guard self-test fails

### Requirement: Drift response procedure

When a conformance guard fires, the divergence MUST be resolved by either (a) updating the contract through an SDD change and then migrating the consumer, or (b) fixing the consumer to match the contract. Guards MUST NOT be relaxed, skipped, or disabled outside an SDD change; guard configuration is contract-adjacent and SDD-only.

#### Scenario: Guard cannot be silently weakened

- GIVEN a conformance guard fails
- WHEN someone modifies the guard configuration or skip list without an SDD change covering it
- THEN review rejects the change

#### Scenario: Contract-first resolution

- GIVEN the frontend build fails because the contract changed
- WHEN the divergence is resolved via an SDD change
- THEN the contract edit lands first, and the consumer migration follows inside the same change

> **Archive annotation (verify PARTIAL — governance/review-time, W4):** Both drift-response scenarios are review-time governance rules with no runtime test by nature. Accepted as PARTIAL — process rules, not defects.