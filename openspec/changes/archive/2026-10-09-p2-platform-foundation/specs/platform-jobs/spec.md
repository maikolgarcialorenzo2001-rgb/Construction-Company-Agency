# Delta for platform-jobs

## ADDED Requirements

### Requirement: Jobs gateway port and board

Jobs MUST be listed and read through a `JobsGateway` port (DI token) with a `Mock*Gateway` adapter. `/plataforma/trabajos` MUST list openings and `/plataforma/trabajos/:id` MUST show one opening.

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

### Requirement: Jobs render via a signal store (zoneless)

The jobs board and detail MUST render from a `JobsStore` whose state is signals/computed, with gateway responses written into signals so the zoneless app paints.

#### Scenario: Async openings paint

- GIVEN the mock gateway resolves a listing
- WHEN the store settles
- THEN the openings render in the view

### Requirement: Applications flow

Applying MUST create an `Application` through an `ApplicationsGateway` port (DI token) and MUST surface the resulting status via signals.

#### Scenario: Apply creates an application

- GIVEN an authenticated worker on a job detail
- WHEN apply is submitted
- THEN an `Application` is created through the gateway
- AND its status is shown

#### Scenario: Application status is tracked

- GIVEN an existing application with a non-default status
- WHEN the application view renders
- THEN the status from the gateway is shown
