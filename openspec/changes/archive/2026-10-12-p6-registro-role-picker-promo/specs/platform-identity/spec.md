# Delta for platform-identity

## MODIFIED Requirements

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
