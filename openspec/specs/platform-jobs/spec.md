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

Applying MUST create an `Application` through an `ApplicationsGateway` port (DI token) and MUST surface the resulting status via signals. `MockApplicationsGateway.list` MUST also filter by `applicantId` when the filter provides one, and `ApplicationsFilter` MUST accept an optional `applicantId`. `JobsStore.loadApplication` MUST scope its result to one applicant: it MUST call `applications.list({ jobId, applicantId })` with the applicant id supplied by the caller and MUST NOT fall back to `items[0]`. The job-detail application-status block MUST render only when the effective role is `worker` AND an application exists. The `APPLICATIONS_GATEWAY` token MUST have a DI test proving an alternative implementation resolves and is used. No contract change is required.

(Previously: `loadApplication(jobId)` filtered by `jobId` only and took `items[0]`, so any viewer saw another worker's status, and the status block rendered for every role.)

#### Scenario: Apply creates an application

- GIVEN an authenticated worker on a job detail
- WHEN apply is submitted
- THEN an `Application` is created through the gateway
- AND its status is shown

#### Scenario: Application status is tracked

- GIVEN the worker who applied has an existing application with a non-default status
- WHEN that worker's job detail renders
- THEN the status from the gateway is shown

#### Scenario: Worker who applied sees their own status

- GIVEN a `worker` session whose `userId` is `worker-1` with an application on that job
- WHEN the job detail renders
- THEN the application-status block shows `worker-1`'s own status

#### Scenario: Worker who did not apply sees the apply form

- GIVEN a `worker` session with no application on that job
- WHEN the job detail renders
- THEN no application-status block is shown
- AND the apply form is visible

#### Scenario: Non-worker sees no status block

- GIVEN a `company` or `admin` session (or anonymous)
- WHEN the job detail renders
- THEN no application-status block is shown

#### Scenario: Filter by applicant

- GIVEN applications for multiple applicants
- WHEN `MockApplicationsGateway.list` is called with an `applicantId`
- THEN only that applicant's applications are returned

> **Archive annotation (verify W6 — CLOSED by this change):** `ApplicationsFilter` now accepts an optional `applicantId` (additive type; no contract change) and `MockApplicationsGateway.list` AND-combines it with `jobId`/`status` in the same predicate style — TRIANGULATED: `{jobId: JOBS[1], applicantId: 'worker-2'}` → `app-2`, `{jobId: JOBS[0], applicantId: 'worker-2'}` → empty, `applicantId: 'sin-postulaciones'` → `[]` / `total: 0`, with pre-existing `jobId`/`status` behavior unchanged (suite green). `APPLICATIONS_GATEWAY` swappability is exercised in the same `ports.spec.ts` suite. The demo-level applicantId gap recorded by `p2-platform-foundation` W6 is resolved.

#### Scenario: Applications port proves swappability

- GIVEN a TestBed overriding `APPLICATIONS_GATEWAY` with a custom adapter
- WHEN the token is injected
- THEN the custom implementation is resolved via DI
