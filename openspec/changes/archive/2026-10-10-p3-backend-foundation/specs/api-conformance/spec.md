# Delta for api-conformance

## MODIFIED Requirements

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

> **Archive annotation:** Realized by `p3-backend-foundation` — `backend/internal/contract/guard.go` (`LoadFromFile` + `doc.Validate` + `gorillamux` router + `ValidateResponse`) drives the three auth operations with `httptest` and the in-memory adapter, closing the R3 gap recorded by `p2-api-contract`.

## ADDED Requirements

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
