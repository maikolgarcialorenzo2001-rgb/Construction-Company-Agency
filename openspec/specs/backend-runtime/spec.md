# backend-runtime Specification

## Purpose

The Go backend runtime foundation: a self-contained `backend/` Go module with a Gin HTTP server composition root, environment-driven configuration, contract-path resolution, an operational health endpoint, and an in-memory user store behind a port interface. It establishes the cross-cutting runtime concerns the auth foundation and later resource domains inherit, with no external service required to build or test.

## Requirements

### Requirement: Self-contained backend module

The backend MUST live in its own Go module rooted at `backend/` (module path `cca/backend`) and MUST build and test independently via `go build ./...` and `go test ./...` run from `backend/`. It MUST NOT require an external service (no Postgres, no Docker) to build or to run the default suite.

#### Scenario: Backend builds standalone

- GIVEN a checkout with the Go toolchain installed
- WHEN `go build ./...` runs from `backend/`
- THEN it exits zero with no external service running

#### Scenario: Default suite is dependency-free

- GIVEN no Postgres or Docker available
- WHEN `go test ./...` runs from `backend/`
- THEN the suite runs and passes with no service-dependent skips

### Requirement: Server composition root

The backend MUST provide a composition root at `backend/cmd/server` that loads configuration, wires the in-memory store into the auth service and Gin router, and serves HTTP on the configured port. Handlers MUST be thin (HTTP ↔ service translation); services MUST depend on port interfaces only.

#### Scenario: Server starts and serves

- GIVEN a valid configuration
- WHEN the server starts
- THEN it listens on the configured `PORT` and serves the registered routes

### Requirement: Environment configuration

The backend MUST read configuration from environment variables `PORT`, `JWT_SECRET`, and `CONTRACT_PATH` (optional override). It MUST validate required values at startup and fail fast with a clear error when a required value is missing or invalid. Secrets MUST NOT be hardcoded.

#### Scenario: Missing required secret fails startup

- GIVEN `JWT_SECRET` is unset
- WHEN the server starts
- THEN startup fails with a clear error and no listener is opened

#### Scenario: PORT is honored

- GIVEN `PORT` set to a free port
- WHEN the server starts
- THEN it listens on that port

### Requirement: Contract path resolution

The backend MUST resolve `contracts/openapi.yaml` at the repository root by a documented module-relative default, overridable by the `CONTRACT_PATH` environment variable. It MUST NOT copy, embed, or modify the contract.

#### Scenario: Default path resolves the repo contract

- GIVEN no `CONTRACT_PATH` override
- WHEN the contract guard loads the contract
- THEN it loads the repository-root `contracts/openapi.yaml`

#### Scenario: Override wins

- GIVEN `CONTRACT_PATH` points to a contract file
- WHEN the guard loads the contract
- THEN it loads the file at the override path

### Requirement: Operational health endpoint

The backend MUST expose `GET /health` returning HTTP 200. This endpoint is operational and MUST NOT be added to `contracts/openapi.yaml`.

#### Scenario: Health responds

- GIVEN a running server
- WHEN `GET /health` is requested
- THEN the response status is 200

### Requirement: In-memory user store behind a port

The backend MUST define a `UserStore` port interface and provide an in-memory implementation used by unit and contract tests. Swapping in another adapter MUST be a composition-root change only.

#### Scenario: Memory adapter satisfies the port

- GIVEN the in-memory user store
- WHEN a user is created and then looked up by email
- THEN the same contract-shaped user is returned

### Requirement: Uniform JSON error envelope

All backend error responses MUST render the contract `Error` shape `{code, message, details?}` with no additional top-level properties. Error `message` values MUST be es-AR user copy; `code` values MUST be stable English snake_case identifiers.

#### Scenario: Error body matches the envelope

- GIVEN any failing request
- WHEN the response body is inspected
- THEN it has a string `code` and string `message`, and no extra top-level fields
