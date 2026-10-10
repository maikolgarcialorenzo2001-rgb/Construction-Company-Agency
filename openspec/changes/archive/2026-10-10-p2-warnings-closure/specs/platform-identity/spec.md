# Delta for platform-identity

## MODIFIED Requirements

### Requirement: Role model

The platform MUST model exactly `worker | company | admin`. Registration MUST offer only `worker` and `company`; `admin` MUST NOT be self-assigned. The registration boundary (`MockAuthGateway.register`) MUST reject an `admin` role with a clear Spanish error message consistent with existing auth errors, and MUST accept `worker` and `company`. The `Role` enum and `contracts/openapi.yaml` MUST remain unchanged.

(Previously: the self-service restriction was enforced only at the form; programmatic `register` accepted any `Role`.)

#### Scenario: Registration offers only self-service roles

- GIVEN the `/plataforma/registro` form
- WHEN the role options are inspected
- THEN only `worker` and `company` are offered

#### Scenario: Role is computed from the session

- GIVEN an authenticated user with role `company`
- WHEN the role signal is read
- THEN it resolves to `company`

#### Scenario: Programmatic register rejects admin

- GIVEN the mock auth gateway
- WHEN `register` is called with role `admin`
- THEN it rejects with a clear Spanish error message
- AND no session is created

#### Scenario: Worker and company register normally

- GIVEN the mock auth gateway
- WHEN `register` is called with role `worker` or `company`
- THEN the user is created with that role

### Requirement: Auth and profiles gateway ports

`AuthGateway` and `ProfilesGateway` MUST be defined as ports behind DI tokens with `Mock*Gateway` adapters backed by deterministic fixtures. Swapping to a real adapter MUST be a provider change only. Each token (`AUTH_GATEWAY`, `PROFILES_GATEWAY`) MUST have a DI test proving an alternative implementation resolves and is used.

(Previously: swappability was proven only for the `FEED_GATEWAY` token; the auth/profiles swaps were unexercised.)

#### Scenario: Mock adapter satisfies the port

- GIVEN the app configured with the mock gateways
- WHEN register, login, logout and profile reads run
- THEN they resolve deterministically from the mocks

#### Scenario: Adapter is swappable

- GIVEN a test providing an alternative gateway
- WHEN the flow runs
- THEN it renders from that adapter

#### Scenario: Each auth and profiles token proves swappability

- GIVEN a TestBed overriding `AUTH_GATEWAY` (and separately `PROFILES_GATEWAY`) with a custom adapter
- WHEN the token is injected
- THEN the custom implementation is resolved via DI

## Acceptance Criteria

| # | Criterion | Proven by |
|---|---|---|
| 1 | `register` with role `admin` rejects with a Spanish error; `worker`/`company` succeed | `bunx ng test --watch=false` |
| 2 | `Role` enum and `contracts/openapi.yaml` unchanged | `bun run contract:check`, `git diff contracts/` |
| 3 | `AUTH_GATEWAY` and `PROFILES_GATEWAY` each prove a DI swap | `bunx ng test --watch=false` |
