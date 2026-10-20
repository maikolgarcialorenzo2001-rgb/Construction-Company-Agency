# platform-job-request Specification

## Purpose

The job-request capability enables a worker to publish a structured "Solicitud de empleo" (Plantilla 2) in the feed. The structured payload is demo-only, projected only into `[postExtra]`, never into `[postBody]`, and does not alter the contract.

## Requirements

### Requirement: Job-request kind and demo-only payload

The system MUST support `PostKind` values `'standard' | 'job-request'`. The system MUST carry an optional demo-only `jobRequest` payload on the feed view model only; the `Post` contract, `FeedPostInput`, and `contract-conformance.ts` MUST remain unchanged.

#### Scenario: Kind widened and payload isolated from contract

- GIVEN a `PostView` with `kind = 'job-request'`
- WHEN the view is constructed
- THEN `jobRequest` is present only on the demo view model
- AND contract conformance contains no entries for `jobRequest` or `PostKind` extension beyond the demo surface

### Requirement: Demo kind/payload registry with deterministic state

The system MUST maintain a demo-only registry mapping `postId → JobRequestPayload` for `job-request` posts. The registry MUST be deterministic from seeds and MUST support reset between tests.

#### Scenario: Registry records payload on create

- GIVEN a worker creates a `job-request` post
- WHEN the gateway persists it to the demo timeline
- THEN the registry contains an entry for that `postId`
- AND the entry holds the structured payload

#### Scenario: Registry reset for test isolation

- GIVEN registry contains entries from a previous test
- WHEN a reset is invoked
- THEN the registry becomes empty
- AND no entries leak across tests

### Requirement: Worker solicitud composer (fields and constraints)

The system MUST render a worker-gated solicitud form with 4 required fields: *Puesto/rubro*, *Disponibilidad/jornada*, *Modalidad*, *Experiencia*. The system MUST allow *Texto libre* as optional, and MUST allow 1–10 *Fotos* as optional. The composer MUST NOT expose a "zona" field. The system MUST use reactive forms for the worker form; the company composer remains signal-based.

#### Scenario: Worker sees solicitud form

- GIVEN a `worker` session
- WHEN the feed composer renders
- THEN the solicitud form is present
- AND it contains the 4 required fields plus optional text and photos

#### Scenario: Company sees textarea composer

- GIVEN a `company` session
- WHEN the feed composer renders
- THEN the solicitud form is absent
- AND the existing textarea composer is present

#### Scenario: Admin sees no composer

- GIVEN an `admin` session
- WHEN the feed composer renders
- THEN no composer is rendered (flag for design)

### Requirement: Composite publish rule (Q1=a)

To publish a `job-request` post, the 4 required fields MUST be present AND valid, AND (free text MUST be present OR ≥1 photo MUST be attached). Structured-only submissions (4 requireds with no text and no photos) MUST be rejected. The feed predicate `isRenderablePostView` MUST NOT be changed.

#### Scenario: Valid with free text only

- GIVEN a worker form with 4 requireds valid and free text present
- WHEN the worker publishes
- THEN the post is created as `kind: 'job-request'`
- AND the payload is recorded in the demo registry

#### Scenario: Valid with at least one photo only

- GIVEN a worker form with 4 requireds valid and 0 text but ≥1 photo attached
- WHEN the worker publishes
- THEN the post is created as `kind: 'job-request'`

#### Scenario: Structured-only rejected

- GIVEN a worker form with 4 requireds valid, no text, and 0 photos
- WHEN the worker attempts to publish
- THEN the submission is rejected
- AND no post is created

### Requirement: Structured card rendered only via `[postExtra]`

The system MUST render the job-request structured card using a dedicated component projected into the feed post's `[postExtra]` slot when `post().kind === 'job-request'`. The system MUST NOT project structured fields into `[postBody]`. The shell remains unchanged.

#### Scenario: Job-request renders via postExtra only

- GIVEN a `job-request` post with payload present
- WHEN the feed renders the post
- THEN the structured card is projected into `[postExtra]`
- AND `[postBody]` contains no structured fields
- AND the base template remains unmodified

### Requirement: Author-aware creation and demo seeds

The mock gateway MUST create posts using the current session author's id (not a hardcoded `company-1`). The fixtures MUST seed 2–3 `job-request` posts with deterministic payloads and absolute `https` attachment URLs (when present).

#### Scenario: Worker post authored by session user

- GIVEN a `worker` session (current user id `worker-1`)
- WHEN that worker publishes a `job-request`
- THEN the created post's `authorId` equals `worker-1`

#### Scenario: Demo seeds include job-request posts

- GIVEN seeded fixtures
- WHEN the feed timeline loads
- THEN there are at least 2 `job-request` posts present
- AND each has `kind: 'job-request'` with a matching registry entry

### Requirement: Payload scope is strictly demo-only

The structured payload MUST reside only in the demo registry and the view model. The system MUST NOT add fields to `Post`, `FeedPostInput`, OpenAPI, or `contract-conformance.ts`.

#### Scenario: Contract remains unchanged

- GIVEN the `platform-job-request` capability applied
- WHEN comparing contract artifacts
- THEN `contracts/openapi.yaml` and `contract-conformance.ts` remain unchanged
- AND no new contract properties for job-request exist
