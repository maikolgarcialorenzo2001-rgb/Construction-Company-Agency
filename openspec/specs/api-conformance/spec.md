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

The frontend MUST generate TypeScript types from the contract via an `openapi-typescript`-style codegen (runnable via `bunx`), and hand-written domain types MUST be declared against the generated types, so a contract change that invalidates the domain model fails the build.

#### Scenario: Divergence fails the build

- GIVEN the contract schema for a resource changes incompatibly (field removed, renamed, or type-narrowed)
- WHEN `bunx ng build` runs
- THEN compilation fails at the domain type that no longer conforms

> **Archive annotation (verify PARTIAL — guard placement, W1):** As of this change the guard fires under `bunx ng test` (RED-proof G3: drift → `TS2344` at `conformance.spec.ts`), not `ng build`, because only the conformance spec consumes the generated types and `tsconfig.app.json` excludes `**/*.spec.ts`. This is design decision D5 (generated types + type-level vitest spec) vs. the scenario's literal `ng build` wording. To be closed when `p2-platform-foundation` declares hand-written domain types against `components[...]`, so `ng build` also fires.

#### Scenario: Generation is reproducible

- GIVEN the current contract
- WHEN the generation script runs
- THEN types are regenerated deterministically with zero manual edits required

#### Scenario: Generated code is derived, not authored

- GIVEN the generated types file
- WHEN a developer edits it directly
- THEN the next regeneration overwrites the edit (the file is never a source of truth)

### Requirement: Backend contract tests

The backend MUST include automated contract tests that validate its HTTP responses against `contracts/openapi.yaml` for every implemented operation. (Requirement recorded here for the backend session to inherit; no Go code in this change.)

#### Scenario: Response violating the contract fails

- GIVEN the Go backend implements an endpoint
- WHEN its response no longer matches the contract schema
- THEN the backend test suite fails

> **Archive annotation (verify UNTESTED — deferred by design):** This requirement is explicitly scoped to the backend session ("no Go code in this change"). The backend session inherits it: implement `backend/internal/contract/contract_test.go` with kin-openapi (`openapi3.Loader` + `openapi3filter.ValidateResponse`), gated by `go test ./...`. Deferred, not dropped.

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
