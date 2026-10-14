# Delta for platform-identity

## MODIFIED Requirements

### Requirement: Mock session, visibly demo

Authentication MUST be a local mock: `SessionService` MUST persist a mock session in `localStorage`, expose `currentUser` as a signal with a `computed` role, and clear on logout. Auth screens MUST be visibly marked as demo and MUST NOT issue network requests. The seeded demo account set MUST include exactly one `admin` account (`admin@demo.test` / `demo1234`, `userId` `admin-1`) alongside the existing worker/company accounts, and the login screen MUST list a demo credential for the `admin` account. The 6 seeded demo accounts MUST be reachable from the `/previa` role switcher through `SessionService.login(email, 'demo1234')`, without registration. The registration boundary MUST still reject the `admin` role (the `Role model` requirement is unchanged).

(Previously: the 6 demo accounts were seeded but reachable from no screen; only the login screen listed the admin credential.)

#### Scenario: Login writes a mock session

- GIVEN valid mock credentials
- WHEN login is submitted
- THEN `currentUser` updates and the session survives a reload

#### Scenario: Admin demo account logs in

- GIVEN the seeded admin credential `admin@demo.test` / `demo1234`
- WHEN login is submitted
- THEN `currentUser` resolves with role `admin` and `userId` `admin-1`
- AND the session survives a reload

#### Scenario: Login exposes the admin demo credential

- GIVEN the login screen renders
- WHEN the demo credentials are inspected
- THEN an `admin` demo credential is listed

#### Scenario: All demo accounts are reachable from the preview switcher

- GIVEN the 6 seeded demo accounts
- WHEN each is entered through the `/previa` switcher
- THEN a mock session is created for that account
- AND no `register` call is issued

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
