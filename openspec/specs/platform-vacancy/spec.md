# platform-vacancy Specification

## Purpose

The vacancy capability lets a company publish a promo post (Plantilla 3) referencing 1..n of its own existing vacancies. Payload is demo-only and reference-only, the card resolves jobs live, projection is limited to `[postExtra]`, and the contract is frozen.

## Requirements

### Requirement: Vacancy kind and demo-only reference payload

The system MUST support `PostKind` values `'standard' | 'job-request' | 'vacancy'` and MUST carry an optional demo-only `VacancyPayload { jobIds: string[] }` (1..n) on the view model only. The payload MUST reference vacancies by id and MUST NOT copy job fields (title, location, budget, status).

#### Scenario: Kind widened and payload reference-only

- GIVEN a `PostView` with `kind = 'vacancy'` and `jobIds: ['job-1', 'job-2']`
- WHEN the view is constructed
- THEN `vacancy` is present only on the demo view model
- AND no job field from `JobOpening` is stored in the payload

#### Scenario: Contract artifacts remain zero-diff

- GIVEN the `platform-vacancy` capability applied
- WHEN comparing `contracts/openapi.yaml` and `contract-conformance.ts` against baseline
- THEN both are byte-identical
- AND `Post` / `PostInput` types are unchanged

### Requirement: Demo vacancy registry with deterministic state

The system MUST maintain a demo-only registry mapping `postId → { jobIds }` for `vacancy` posts. The registry MUST rebuild deterministically from seeds and MUST support reset between tests.

#### Scenario: Registry records payload on create

- GIVEN a company publishes a vacancy post with 2 selected jobs
- WHEN the gateway persists it to the demo timeline
- THEN the registry contains an entry for that `postId`
- AND the entry holds exactly the submitted `jobIds`

#### Scenario: Registry reset for test isolation

- GIVEN registry contains entries from a previous test
- WHEN a reset is invoked
- THEN the registry equals its seed snapshot
- AND no entries leak across tests

### Requirement: Vacancy seeds and fixture invariants

The fixtures MUST include ≥2 `vacancy` seed posts with resolvable `jobIds`, non-empty text (renderable by the untouched predicate), and a resolvable session author, positioned so existing fixture invariants hold. Seeds MUST be text-only.

#### Scenario: Seeds renderable with registry entries

- GIVEN seeded fixtures
- WHEN the feed timeline loads
- THEN ≥2 `vacancy` posts are present
- AND each has a matching registry entry resolving to existing jobs

#### Scenario: Fixture invariants preserved

- GIVEN the two vacancy seeds inserted before the job-request tail (`post-12` at index 9, `post-13` at index 10, so `post-10` — the first job-request — now sits at index 11)
- WHEN fixture, feed, release-matrix and a11y specs run
- THEN the job-request tail invariant and `feed.page` post-tail assertions pass
- AND the post-count assertion (11 → 13) is the only count churn
- AND the release matrix stays at 11 images

### Requirement: Author-aware creation

The mock gateway MUST author vacancy posts with the current session author's id, never a hardcoded id.

#### Scenario: Company post authored by session user

- GIVEN a `company` session (author id `company-1`)
- WHEN that company publishes a vacancy post
- THEN the created post's `authorId` equals `company-1`
- AND the registry records the payload for that post

### Requirement: Multi-vacancy card with status labels and Postularse link

The card MUST render one entry per promoted job with title, location, optional budget, and an es-AR status label (`jobStatusLabel`: `Abierta`/`Cerrada`). Each entry MUST render a "Postularse" `routerLink` to `/plataforma/trabajos/:id`, including when the job is closed — the label informs, the link is always present.

#### Scenario: Multi-job card renders every entry

- GIVEN a vacancy post promoting 3 of the company's jobs
- WHEN `/plataforma` renders
- THEN 3 entries appear, each with title, location, budget when present, and `Abierta`
- AND each entry has a "Postularse" link targeting its job route

#### Scenario: Closed job shows Cerrada with link still rendered

- GIVEN a vacancy post whose `jobIds` include a closed job
- WHEN the card renders
- THEN that entry shows `Cerrada`
- AND its "Postularse" link is still rendered pointing to that job's route

#### Scenario: Unresolvable job id skipped

- GIVEN a payload containing an id absent from `JobsStore`
- WHEN the card renders
- THEN that entry is skipped
- AND remaining entries render normally

### Requirement: Card projection via `[postExtra]` and guarded hydration

When any view has `kind === 'vacancy'`, the feed MUST project the card into `[postExtra]` only and MUST resolve `jobIds → JobOpening[]` via `JobsStore` with a one-shot guarded load — a single load for N vacancy views. `[postBody]` and `isRenderablePostView` MUST remain unchanged.

#### Scenario: Vacancy renders via postExtra only

- GIVEN a `vacancy` post with payload present
- WHEN the feed renders the post
- THEN the card is projected into `[postExtra]`
- AND `[postBody]` contains no vacancy fields
- AND the base template remains unmodified

#### Scenario: Single guarded hydration with live data

- GIVEN a timeline containing ≥2 vacancy posts
- WHEN `/plataforma` renders
- THEN `JobsStore.load()` executes exactly once
- AND cards show live job data (a job closed after seeding renders `Cerrada`)

### Requirement: Company composer mode toggle with scoped picker

The company composer MUST expose a mode toggle: normal mode (default) renders the existing textarea with `feed-composer`/`feed-publish` testids byte-compatible; "Buscar trabajadores" mode renders a vacancy picker filtered to `status === 'open' && companyId === session authorId`, plus optional text and photos. The two modes MUST be **exclusive** — the normal textarea form renders only in normal mode and the vacancy form only in vacancy mode, so the toggle switches the publish form instead of stacking both. The toggle MUST keep a stable position across modes.

#### Scenario: Normal mode is default and byte-compatible

- GIVEN a `company` session
- WHEN `/plataforma` renders
- THEN the toggle is present with normal mode active
- AND the textarea with `feed-composer` / `feed-publish` testids renders as before
- AND the vacancy form is absent while normal mode is active

#### Scenario: Picker scoped to own open vacancies

- GIVEN `company-1` with open jobs `job-1`, `job-2`, `job-6`, and `company-2` open jobs `job-4`, `job-5`
- WHEN "Buscar trabajadores" is selected
- THEN the picker lists only `company-1`'s open jobs
- AND closed jobs and other companies' jobs are absent
- AND the normal textarea form is absent while vacancy mode is active

### Requirement: Composite publish rule

To publish a vacancy post, ≥1 vacancy MUST be selected AND (text MUST be present OR ≥1 photo MUST be attached). Vacancy-only submissions MUST be rejected. `isRenderablePostView` MUST NOT be changed.

#### Scenario: Valid with text only

- GIVEN ≥1 own open vacancy selected, text present, 0 photos
- WHEN the company publishes
- THEN the post is created as `kind: 'vacancy'`
- AND the payload with `jobIds` is recorded in the registry

#### Scenario: Valid with photo only

- GIVEN ≥1 own open vacancy selected, no text, ≥1 photo attached
- WHEN the company publishes
- THEN the post is created as `kind: 'vacancy'`

#### Scenario: Vacancy-only rejected

- GIVEN ≥1 vacancy selected, no text, and 0 photos
- WHEN the company attempts to publish
- THEN the submission is rejected
- AND no post is created
