# platform-identity Specification

## Requirements

### Requirement: Role model

The platform MUST model exactly `worker | company | admin`. Registration MUST present role selection as a **described single-choice control** — a native radio group inside a `<fieldset>` — offering ONLY `worker` and `company`; `admin` MUST NOT be self-assigned and MUST NOT be offered. Each offered role MUST show a **title** and a short **es-AR description**. Exactly one role MUST be selected before registration can succeed, and the control MUST default to a valid self-service role on first render. The `data-testid="registro-role"` attribute MUST be present on the picker **GROUP** (the element that contains all radio inputs) and MUST NOT be required on any individual input. The chosen role MUST be the value sent to `register`. The registration boundary (`MockAuthGateway.register`) MUST reject an `admin` role with a clear Spanish error message consistent with existing auth errors, and MUST accept `worker` and `company`. The `Role` enum and `contracts/openapi.yaml` MUST remain unchanged.

(Previously: registration used a plain `<select>`; each role had a label only, no per-role description, and the `data-testid="registro-role"` attribute sat on the `<select>` element.)

#### Scenario: Picker offers only self-service roles

- GIVEN the `/plataforma/registro` form
- WHEN the role options are inspected
- THEN only `worker` and `company` are offered
- AND `admin` is never offered

#### Scenario: Each role shows a title and description

- GIVEN the `/plataforma/registro` form
- WHEN an offered role is inspected
- THEN it exposes a title and a short es-AR description

#### Scenario: Picker group carries the role testid

- GIVEN the `/plataforma/registro` form
- WHEN the element with `data-testid="registro-role"` is inspected
- THEN it is the group containing every role radio input
- AND each radio input is a descendant of that group

#### Scenario: Selection is required and defaults to a valid role

- GIVEN the form has just rendered with no interaction
- WHEN the selected role is read
- THEN exactly one offered role is selected
- AND it is `worker` or `company`

#### Scenario: Chosen role is what register sends

- GIVEN the form with the `company` role selected
- WHEN the form is submitted
- THEN `register` is called with role `company`

#### Scenario: Role is computed from the session

- GIVEN an authenticated user with role `company`
- WHEN the role signal is read
- THEN it resolves to `company`

#### Scenario: Programmatic register rejects admin

- GIVEN the mock auth gateway
- WHEN `register` is called with role `admin`
- THEN it rejects with a clear Spanish error message
- AND no session is created

> **Archive annotation (verify W5 — CLOSED by this change):** `MockAuthGateway.register` guards `admin` FIRST (before the duplicate-email check), throwing exactly `Rol no permitido para el registro`; `SessionService.register` bubbles the rejection with `currentUser()` staying null and nothing persisted in storage, while `worker`/`company` still register normally through `me()`. The `Role` enum and `contracts/openapi.yaml` are unchanged (`bun run contract:check` clean, `git diff contracts/` empty). The UI-only-enforcement gap recorded by `p2-platform-foundation` W5 is resolved.

#### Scenario: Worker and company register normally

- GIVEN the mock auth gateway
- WHEN `register` is called with role `worker` or `company`
- THEN the user is created with that role

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

> **Archive annotation (verify W4 — CLOSED by this change):** `ports.spec.ts` now has one explicit `it` per port (auth, jobs, applications, profiles): typed custom stub → `TestBed.overrideProvider(TOKEN, { useValue: custom })` → identity `expect(...).toBe(custom)` plus a sentinel method call proving use (`me()` → `swap-user`, `byId('x')` → null, `list()` → empty `Page`, `worker('any')` → `fullName: 'Swap'`). RED was proven by removing the overrides (4 failures → suite 487 passed / 4 failed before adding them). The swap-coverage gap recorded by `p2-platform-foundation` W4 is resolved.

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
