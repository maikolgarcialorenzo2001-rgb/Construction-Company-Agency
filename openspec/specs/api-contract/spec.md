# API Contract Specification

## Purpose

Defines `contracts/openapi.yaml` — the single, language-neutral source of truth for the platform HTTP API consumed by the Angular frontend (`src/`) and the Go backend (`backend/`) — plus the ownership and versioning rules that keep both sessions from drifting.

## Requirements

### Requirement: Single contract document

The system MUST keep exactly one OpenAPI 3.1 document at `contracts/openapi.yaml`, positioned as a peer of `src/` and `backend/` so neither consumer owns it. The document MUST be valid OpenAPI 3.1 and lint-clean under a linter runnable via `bunx` (exact tool chosen at design).

#### Scenario: Contract is valid and lint-clean

- GIVEN the repository at any mainline commit
- WHEN the contract validation command runs
- THEN the document parses as valid OpenAPI 3.1
- AND the linter reports zero errors

#### Scenario: Contract is language-neutral

- GIVEN a change to `contracts/openapi.yaml`
- WHEN reviewing the diff
- THEN the change contains only the YAML contract — no TypeScript- or Go-specific artifacts

### Requirement: API surface coverage

The contract MUST define paths, operations, request/response schemas, and auth requirements for every in-scope domain:

| Domain | Operations |
|--------|-----------|
| Auth | register, login, me |
| Roles | `worker` \| `company` \| `admin` (admin never self-assigned) |
| Profiles | worker profile, company profile (read/update) |
| Feed posts | create, read, update, delete, timeline listing |
| Job posts | create, read, update, delete, listing/search |
| Applications | create (postulación), list, status transitions |

#### Scenario: Each domain is fully described

- GIVEN the contract document
- WHEN inspecting any in-scope domain
- THEN it has at least one path, an operation per listed capability, and request/response schemas

#### Scenario: Role model is constrained

- GIVEN the auth and profile schemas
- WHEN inspecting the role field
- THEN it is constrained to exactly `worker`, `company`, or `admin`

### Requirement: Shared envelope conventions

All list endpoints MUST share one pagination envelope component; all error responses MUST share one error envelope component referenced across operations.

#### Scenario: Pagination envelope is uniform

- GIVEN any paginated endpoint (timeline, job listing, applications)
- WHEN reading its response schema
- THEN items and page metadata (page, pageSize, total) come from the same shared component schema

#### Scenario: Error envelope is uniform

- GIVEN any operation that can return 4xx/5xx
- WHEN reading its error responses
- THEN they reference the shared error component (code, message, optional details)

### Requirement: Contract ownership — SDD-only edits

`contracts/openapi.yaml` MUST only be modified as part of an OpenSpec change (proposal → spec → design → tasks → apply → archive). It MUST NOT be edited as a side effect of frontend or backend feature work.

#### Scenario: Out-of-band edit is rejected

- GIVEN a PR that changes `contracts/openapi.yaml`
- WHEN no active OpenSpec change covers the edit
- THEN review rejects it (verify gate fails)

> **Archive annotation (verify PARTIAL — governance/review-time, W4):** No runtime test can cover this process scenario; enforcement is at code review plus the SDD gate. Accepted as PARTIAL — process rule, not a defect.

### Requirement: Versioning and change control

`info.version` MUST follow semver: a breaking change (removal, rename, type narrowing, newly required field) MUST bump the major; an additive change (new optional field, new endpoint) MUST bump the minor. Both consumers MUST migrate within the change window of a major bump.

#### Scenario: Breaking change bumps major

- GIVEN an edit that removes an endpoint or makes a previously optional field required
- WHEN the change lands
- THEN `info.version` major is incremented in the same change

#### Scenario: Additive change bumps minor

- GIVEN an edit that adds a new optional field or endpoint
- WHEN the change lands
- THEN `info.version` minor is incremented and major is unchanged

> **Archive annotation (baseline decision — verify S1):** `info.version: 1.0.0` is the **first publication** of `contracts/openapi.yaml`; semver's first stable release is conventionally `1.0.0` and there is no predecessor to bump from. The additive-minor rule becomes operative for the **NEXT** SDD change that modifies the published contract (e.g. adding an endpoint → `1.0.0 → 1.1.0`). This baseline is recorded so the next edit is unambiguous.
>
> **Archive annotation (verify PARTIAL — governance/review-time, W4):** Both versioning scenarios are review-time governance rules with no runtime test by nature. Accepted as PARTIAL — process rule, not a defect.
