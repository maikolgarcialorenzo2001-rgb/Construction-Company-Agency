# platform-jobs Specification

## Requirements

### Requirement: Jobs gateway port and board

Jobs MUST be listed and read through a `JobsGateway` port (DI token) with a `Mock*Gateway` adapter. `/plataforma/trabajos` MUST list openings and `/plataforma/trabajos/:id` MUST show one opening. The `JOBS_GATEWAY` token MUST have a DI test proving an alternative implementation resolves and is used.

(Previously: the port was defined but its swap was not individually exercised.)

#### Scenario: Board lists openings

- GIVEN the mock `JobsGateway`
- WHEN `/plataforma/trabajos` renders
- THEN the openings from the gateway are listed

#### Scenario: Detail resolves one opening

- GIVEN a known job id
- WHEN `/plataforma/trabajos/:id` renders
- THEN that opening's detail is shown

#### Scenario: Unknown id is handled

- GIVEN an unknown job id
- WHEN `/plataforma/trabajos/:id` renders
- THEN a not-found state is shown, without error

#### Scenario: Jobs port proves swappability

- GIVEN a TestBed overriding `JOBS_GATEWAY` with a custom adapter
- WHEN the token is injected
- THEN the custom implementation is resolved via DI

### Requirement: Jobs render via a signal store (zoneless)

The jobs board and detail MUST render from a `JobsStore` whose state is signals/computed, with gateway responses written into signals so the zoneless app paints.

#### Scenario: Async openings paint

- GIVEN the mock gateway resolves a listing
- WHEN the store settles
- THEN the openings render in the view

### Requirement: Applications flow

Applying MUST create an `Application` through an `ApplicationsGateway` port (DI token) and MUST surface the resulting status via signals. `MockApplicationsGateway.list` MUST also filter by `applicantId` when the filter provides one, and `ApplicationsFilter` MUST accept an optional `applicantId`. The `APPLICATIONS_GATEWAY` token MUST have a DI test proving an alternative implementation resolves and is used. No contract change is required.

(Previously: `list` filtered by `jobId`/`status` only, with no applicant filter; the applications swap was not exercised.)

#### Scenario: Apply creates an application

- GIVEN an authenticated worker on a job detail
- WHEN apply is submitted
- THEN an `Application` is created through the gateway
- AND its status is shown

#### Scenario: Application status is tracked

- GIVEN an existing application with a non-default status
- WHEN the application view renders
- THEN the status from the gateway is shown

#### Scenario: Filter by applicant

- GIVEN applications for multiple applicants
- WHEN `MockApplicationsGateway.list` is called with an `applicantId`
- THEN only that applicant's applications are returned

> **Archive annotation (verify W6 — CLOSED by this change):** `ApplicationsFilter` now accepts an optional `applicantId` (additive type; no contract change) and `MockApplicationsGateway.list` AND-combines it with `jobId`/`status` in the same predicate style — TRIANGULATED: `{jobId: JOBS[1], applicantId: 'worker-2'}` → `app-2`, `{jobId: JOBS[0], applicantId: 'worker-2'}` → empty, `applicantId: 'sin-postulaciones'` → `[]` / `total: 0`, with pre-existing `jobId`/`status` behavior unchanged (suite green). `APPLICATIONS_GATEWAY` swappability is exercised in the same `ports.spec.ts` suite. The demo-level applicantId gap recorded by `p2-platform-foundation` W6 is resolved.

#### Scenario: Applications port proves swappability

- GIVEN a TestBed overriding `APPLICATIONS_GATEWAY` with a custom adapter
- WHEN the token is injected
- THEN the custom implementation is resolved via DI
