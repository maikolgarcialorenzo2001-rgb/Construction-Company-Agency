# backend-auth Specification

## Purpose

JWT bearer authentication for the contract's three auth operations — `POST /auth/register`, `POST /auth/login`, `GET /auth/me` — with bcrypt password hashing, server-side `admin` rejection, and HS256 token issuance and verification. Every request and response MUST conform to `contracts/openapi.yaml`.

## Requirements

### Requirement: Register

`POST /auth/register` MUST accept JSON `{email, password, role}`, MUST bcrypt-hash the password before storing, and MUST persist the user via the `UserStore` port. On success it MUST return HTTP 201 with exactly `{userId, token}` (no additional properties), where `token` is a fresh JWT.

It MUST reject `role = admin` with HTTP 400 `Error{code: "role_not_allowed"}` and create no user. It MUST reject a duplicate email with HTTP 400 `Error{code: "email_already_exists"}` and create no second user.

#### Scenario: Worker and company register successfully

- GIVEN no account exists for the email
- WHEN `POST /auth/register` is called with a valid email, password, and `role` of `worker` or `company`
- THEN the response is 201 with exactly `{userId, token}`
- AND the stored password is a bcrypt hash, never plaintext

#### Scenario: Admin self-assignment is rejected

- GIVEN the auth service
- WHEN `POST /auth/register` is called with `role = admin`
- THEN the response is 400 with `Error{code: "role_not_allowed"}`
- AND no user is created

#### Scenario: Duplicate email is rejected

- GIVEN an account already exists for an email
- WHEN `POST /auth/register` is called with that same email
- THEN the response is 400 with `Error{code: "email_already_exists"}`
- AND no second user is created

### Requirement: Login

`POST /auth/login` MUST accept JSON with exactly `email` and `password` (additional properties forbidden). On valid credentials it MUST return HTTP 200 with exactly `{token, role}` (no additional properties). On an unknown email or wrong password it MUST return HTTP 401 with `Error{code: "invalid_credentials"}`.

#### Scenario: Valid credentials return token and role

- GIVEN a registered worker with a known password
- WHEN `POST /auth/login` is called with those credentials
- THEN the response is 200 with exactly `{token, role}`
- AND `role` equals the user's stored role

#### Scenario: Wrong password is unauthorized

- GIVEN a registered account
- WHEN `POST /auth/login` is called with the correct email and a wrong password
- THEN the response is 401 with `Error{code: "invalid_credentials"}`

#### Scenario: Unknown email is unauthorized

- GIVEN no account for `nadie@demo.test`
- WHEN `POST /auth/login` is called with that email
- THEN the response is 401 with `Error{code: "invalid_credentials"}`

### Requirement: Current user

`GET /auth/me` MUST require a bearer JWT. With a valid token it MUST return HTTP 200 with exactly `{userId, email, role}` (no additional properties). With a missing, malformed, or expired token it MUST return HTTP 401 with `Error{code: "not_authenticated"}`.

#### Scenario: Valid token returns the profile

- GIVEN a token minted for a registered user
- WHEN `GET /auth/me` is called with `Authorization: Bearer <token>`
- THEN the response is 200 with exactly `{userId, email, role}`

#### Scenario: Missing or invalid token is unauthorized

- GIVEN no `Authorization` header, or a malformed/expired token
- WHEN `GET /auth/me` is called
- THEN the response is 401 with `Error{code: "not_authenticated"}`

### Requirement: JWT issuance and verification

The backend MUST issue HS256 JWTs signed with `JWT_SECRET`, carrying claims `sub` (userId), `role`, and `exp`. The auth middleware MUST verify signature and expiry and MUST expose `userId` and `role` to handlers; an invalid token MUST be rejected before any protected handler runs.

#### Scenario: Token carries the expected claims

- GIVEN a registered user
- WHEN a token is minted
- THEN it verifies under `JWT_SECRET` with `sub`, `role`, and `exp` present

#### Scenario: Expired token is rejected

- GIVEN a token whose `exp` is in the past
- WHEN the middleware validates it
- THEN validation fails and the request is unauthorized
