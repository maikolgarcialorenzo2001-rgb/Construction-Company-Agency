# platform-identity Specification

## Requirements

### Requirement: Role model

The platform MUST model exactly `worker | company | admin`. Registration MUST offer only `worker` and `company`; `admin` MUST NOT be self-assigned.

#### Scenario: Registration offers only self-service roles

- GIVEN the `/plataforma/registro` form
- WHEN the role options are inspected
- THEN only `worker` and `company` are offered

> **Archive annotation (verify W5 — UI-only enforcement):** Enforced and tested at the form (`registro.page.spec.ts`, `SELF_SERVICE_ROLES = [worker, company]`), but `SessionService.register` / `MockAuthGateway.register` accept any `Role` if invoked programmatically. The spec wording ("offered") is satisfied; acceptable for a mock demo, flagged for awareness. The contract-level role exclusion is also carried by `p2-api-contract` follow-up S3.

#### Scenario: Role is computed from the session

- GIVEN an authenticated user with role `company`
- WHEN the role signal is read
- THEN it resolves to `company`

### Requirement: Mock session, visibly demo

Authentication MUST be a local mock: `SessionService` MUST persist a mock session in `localStorage`, expose `currentUser` as a signal with a `computed` role, and clear on logout. Auth screens MUST be visibly marked as demo and MUST NOT issue network requests.

#### Scenario: Login writes a mock session

- GIVEN valid mock credentials
- WHEN login is submitted
- THEN `currentUser` updates and the session survives a reload

#### Scenario: Demo is visible

- GIVEN the login or registro screen
- WHEN it renders
- THEN a visible "demo" indication is present

#### Scenario: Auth makes no network call

- GIVEN any auth action
- WHEN it runs in the browser
- THEN no HTTP request is issued

#### Scenario: Logout clears the session

- GIVEN an active session
- WHEN logout runs
- THEN `currentUser` is null and protected routes redirect to login

### Requirement: Auth and profiles gateway ports

`AuthGateway` and `ProfilesGateway` MUST be defined as ports behind DI tokens with `Mock*Gateway` adapters backed by deterministic fixtures. Swapping to a real adapter MUST be a provider change only.

#### Scenario: Mock adapter satisfies the port

- GIVEN the app configured with the mock gateways
- WHEN register, login, logout and profile reads run
- THEN they resolve deterministically from the mocks

#### Scenario: Adapter is swappable

- GIVEN a test providing an alternative gateway
- WHEN the flow runs
- THEN it renders from that adapter

> **Archive annotation (verify PARTIAL — swap coverage, W4):** Swappability is proven only for the `FEED_GATEWAY` token (`ports.spec.ts`); the auth/profiles token swap is not individually exercised. The DI pattern is identical, so risk is low; tracked as follow-up W4.

### Requirement: Profiles

The platform MUST read and update a profile through `ProfilesGateway`: a worker profile (trade, experience) and a company profile (name, logo, posts).

#### Scenario: Worker profile round-trips

- GIVEN a worker session
- WHEN the profile is updated
- THEN the mock gateway persists the change and the view reflects it

#### Scenario: Company profile round-trips

- GIVEN a company session
- WHEN the company profile is updated
- THEN the change is reflected in the view
