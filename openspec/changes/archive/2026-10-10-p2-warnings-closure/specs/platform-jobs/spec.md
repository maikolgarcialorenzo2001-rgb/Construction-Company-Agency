# Delta for platform-jobs

## MODIFIED Requirements

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

#### Scenario: Applications port proves swappability

- GIVEN a TestBed overriding `APPLICATIONS_GATEWAY` with a custom adapter
- WHEN the token is injected
- THEN the custom implementation is resolved via DI

## Acceptance Criteria

| # | Criterion | Proven by |
|---|---|---|
| 1 | `list({ applicantId })` returns only that applicant's applications; existing `jobId`/`status` behavior unchanged | `bunx ng test --watch=false` |
| 2 | `JOBS_GATEWAY` and `APPLICATIONS_GATEWAY` each prove a DI swap | `bunx ng test --watch=false` |
| 3 | No contract change | `git diff contracts/` empty |
