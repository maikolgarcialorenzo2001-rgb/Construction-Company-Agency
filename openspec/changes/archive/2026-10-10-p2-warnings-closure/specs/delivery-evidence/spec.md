# Delta for delivery-evidence

## ADDED Requirements

### Requirement: TDD cycle evidence is complete and traceable

The apply-progress artifact of a change that closes carried warnings MUST record a TDD Cycle Evidence table covering every implementation task of the closed work, including the foundation tasks 1.1–3.7 (S1a/S1b/S2), with columns Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, and REFACTOR. The backfill MUST NOT mutate archived observations (e.g. Engram observation #848).

#### Scenario: Evidence table covers the foundation tasks

- GIVEN the apply-progress artifact for `p2-warnings-closure`
- WHEN its TDD Cycle Evidence table is inspected
- THEN tasks 1.1–3.7 appear with all eight columns populated
- AND each row is traceable to a test file

#### Scenario: Archived records stay immutable

- GIVEN archived Engram observation #848
- WHEN the W7 backfill is performed
- THEN #848 is unchanged
- AND the closure evidence lives in this change's apply-progress artifact

## Acceptance Criteria

| # | Criterion | Proven by |
|---|---|---|
| 1 | TDD Cycle Evidence table covers tasks 1.1–3.7 with all eight columns | inspection of this change's apply-progress artifact |
| 2 | Engram obs #848 is not mutated | `mem_get_observation(848)` unchanged |
