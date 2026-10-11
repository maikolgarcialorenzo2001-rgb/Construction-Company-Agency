# backend-runtime Specification

## Purpose

The Go backend runtime foundation: a self-contained `backend/` Go module with a Gin HTTP server composition root, environment-driven configuration, contract-path resolution, an operational health endpoint, and a swappable user store behind a port interface — the in-memory store (default) plus a pure-Go pgx v5 (`pgxpool`) PostgreSQL adapter selected by `DATABASE_URL`. It establishes the cross-cutting runtime concerns the auth foundation and later resource domains inherit, with no external service required to build or test the default suite.

## Requirements

### Requirement: Self-contained backend module

The backend MUST live in its own Go module rooted at `backend/` (module path `cca/backend`) and MUST build and test independently via `go build ./...` and `go test ./...` run from `backend/`. It MUST NOT require an external service (no Postgres, no Docker) to build or to run the default suite; database-backed tests MUST be gated so the default run never needs a service.

#### Scenario: Backend builds standalone

- GIVEN a checkout with the Go toolchain installed
- WHEN `go build ./...` runs from `backend/`
- THEN it exits zero with no external service running

#### Scenario: Default suite passes without a service

- GIVEN no Postgres or Docker available
- WHEN `go test ./...` runs from `backend/`
- THEN it passes, with DB-dependent tests skipped, not failed

### Requirement: Server composition root

The backend MUST provide a composition root at `backend/cmd/server` that loads configuration, selects the user store (pgx adapter when `DATABASE_URL` is set, else in-memory), runs embedded migrations idempotently when a database is configured, wires the store into the auth service and Gin router, and serves HTTP on the configured port. Handlers MUST be thin (HTTP ↔ service translation); services MUST depend on port interfaces only.

#### Scenario: Server starts and serves

- GIVEN a valid configuration
- WHEN the server starts
- THEN it listens on the configured `PORT` and serves the registered routes

#### Scenario: Memory store when no database is configured

- GIVEN `DATABASE_URL` is unset
- WHEN the server starts
- THEN it uses the in-memory store and serves with no database connection

#### Scenario: Postgres store and auto-migration when configured

- GIVEN `DATABASE_URL` points to a reachable Postgres
- WHEN the server starts
- THEN it runs embedded migrations and serves against the pgx adapter

### Requirement: Environment configuration

The backend MUST read configuration from environment variables `PORT`, `JWT_SECRET`, `CONTRACT_PATH` (optional override), `TOKEN_TTL`, and `DATABASE_URL` (optional; empty means the in-memory store). It MUST validate required values at startup and fail fast with a clear error when a required value is missing or invalid. The DSN and all secrets MUST NOT be hardcoded.

#### Scenario: Missing required secret fails startup

- GIVEN `JWT_SECRET` is unset
- WHEN the server starts
- THEN startup fails with a clear error and no listener is opened

#### Scenario: PORT is honored

- GIVEN `PORT` set to a free port
- WHEN the server starts
- THEN it listens on that port

#### Scenario: Optional DATABASE_URL is accepted

- GIVEN `DATABASE_URL` unset or empty
- WHEN configuration loads
- THEN it succeeds with an empty database URL (in-memory store)

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

### Requirement: Uniform JSON error envelope

All backend error responses MUST render the contract `Error` shape `{code, message, details?}` with no additional top-level properties. Error `message` values MUST be es-AR user copy; `code` values MUST be stable English snake_case identifiers.

#### Scenario: Error body matches the envelope

- GIVEN any failing request
- WHEN the response body is inspected
- THEN it has a string `code` and string `message`, and no extra top-level fields

### Requirement: Swappable user store behind a port

The backend MUST keep the `store.UserStore` port unchanged and MUST provide two interchangeable adapters — the in-memory store (default) and a pure-Go pgx v5 (`pgxpool`) PostgreSQL adapter — exercised by one shared conformance suite.

**Test seam**: default suite (memory conformance) · gated integration (pgx conformance).

#### Scenario: Both adapters satisfy the port

- GIVEN the shared `storetest.RunUserStore` suite
- WHEN it runs over the memory adapter and (gated) the pgx adapter
- THEN both pass the same `Create`/`ByEmail`/`ByID` contract

### Requirement: Postgres adapter semantics and lifecycle

The pgx adapter MUST map `pgx.ErrNoRows` to `store.ErrUserNotFound` and `pgconn.PgError` SQLSTATE `23505` to `store.ErrEmailExists`, keeping duplicate email at HTTP 400 `email_already_exists` (no 409). `users.id` MUST be `uuid`. The pool MUST close on shutdown, and only this package MAY import `pgx`.

**Test seam**: gated integration (HTTP + contract over real Postgres).

#### Scenario: Duplicate email stays a 400

- GIVEN the server serving against Postgres via `DATABASE_URL`
- WHEN `POST /auth/register` runs twice with the same email
- THEN the second response is 400 `Error{code: "email_already_exists"}`

#### Scenario: Unknown lookup is not found

- GIVEN an email or id with no stored row
- WHEN `ByEmail` or `ByID` runs
- THEN the sentinel is `store.ErrUserNotFound`

### Requirement: Embedded database migrations

Migrations MUST be embedded (`//go:embed` of goose v3 SQL) and MUST run idempotently at startup when a database is configured, creating `users` (UUID primary key, unique email), independent of the working directory.

**Test seam**: gated integration (run `Up` twice).

#### Scenario: Up is idempotent

- GIVEN an already-migrated database
- WHEN migrations run again
- THEN they complete without error and change no data

### Requirement: Database-gated integration tests

Integration tests MUST run only when `CCA_TEST_DATABASE_URL` is set AND `testing.Short()` is false; otherwise they MUST `t.Skip`. The DSN MUST NOT be hardcoded. The shared suite MUST NOT use `t.Parallel()`.

**Test seam**: default suite asserts the skip; `make test-integration` opens the gate.

#### Scenario: Default run skips green

- GIVEN no `CCA_TEST_DATABASE_URL`, or `go test -short ./...`
- WHEN the default suite runs
- THEN database tests are skipped and the suite passes

#### Scenario: Gate opens against the DSN

- GIVEN `CCA_TEST_DATABASE_URL` set and `-short` absent
- WHEN `make test-integration` runs
- THEN the conformance and HTTP + contract tests run against that database
