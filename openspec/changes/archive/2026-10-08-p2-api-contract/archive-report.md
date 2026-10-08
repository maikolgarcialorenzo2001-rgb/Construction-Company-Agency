# Archive Report: p2-api-contract

Change `p2-api-contract` is complete and archived. Verify passed with **PASS WITH WARNINGS** (0 CRITICAL; 9/17 spec rows COMPLIANT, 7 PARTIAL, 1 UNTESTED — the UNTESTED row is the backend contract-test requirement the spec itself defers to the backend session), and the 2 new capabilities (`api-contract`, `api-conformance`) are now the source of truth under `openspec/specs/`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p2-api-contract` (API contract as single source of truth; OpenAPI 3.1 at `contracts/openapi.yaml`) |
| Verify verdict | PASS WITH WARNINGS (`verify-report.md` + Engram #842, HEAD `e7d84b8`) |
| Tasks | 14/14 complete (all `[x]`) |
| Specs | 2 capabilities · 9 requirements / 17 scenarios (api-contract 5 req / 9 scen; api-conformance 4 req / 8 scen) |
| Final gate (verified by sdd-verify) | `bun run gate` exit 0 · contract:lint 0 errors · contract:check exit 0 · **378/378 tests** · 21-route build |
| Archive location | `openspec/changes/archive/2026-10-08-p2-api-contract/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Contract baseline decision (recorded at archive)

`contracts/openapi.yaml` `info.version: 1.0.0` is the **first publication** of the contract (the `contracts/` directory is new; no `src/` or `backend/` consumer existed before this change). Semver's first stable release is conventionally `1.0.0`, so no bump was due in this change. The spec's additive-minor rule becomes operative for the **NEXT** SDD change that modifies the published contract — e.g. adding an endpoint → `1.0.0 → 1.1.0`; a breaking edit → `2.0.0`. This baseline is annotated on the versioning requirement in both the archived delta and the promoted main spec.

## Artifacts read (audit trail)

| Artifact | File | Engram observation |
|---|---|---|
| Proposal | `openspec/changes/p2-api-contract/proposal.md` | #834 `sdd/p2-api-contract/proposal` |
| Specs (2 deltas) | `openspec/changes/p2-api-contract/specs/*/spec.md` | #836 `sdd/p2-api-contract/spec` |
| Design | `openspec/changes/p2-api-contract/design.md` | #837 `sdd/p2-api-contract/design` |
| Tasks | `openspec/changes/p2-api-contract/tasks.md` | #839 `p2-api-contract/tasks` |
| Apply progress | (Engram only — no file in change folder) | #840 `sdd/p2-api-contract/apply-progress - COMPLETE 4/4` |
| Verify report | `openspec/changes/p2-api-contract/verify-report.md` | #842 `sdd/p2-api-contract/verify-report` |
| Archive report | `openspec/changes/archive/2026-10-08-p2-api-contract/archive-report.md` | `sdd/p2-api-contract/archive-report` (this save) |

No `explore.md` in this change — exploration lives in `p2-platform-foundation/explore.md` (dependency).

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| api-contract | **Created** | Main spec did not exist → full delta copied to `openspec/specs/api-contract/spec.md` (5 requirements / 9 scenarios), with archive annotations. |
| api-conformance | **Created** | Main spec did not exist → full delta copied to `openspec/specs/api-conformance/spec.md` (4 requirements / 8 scenarios), with archive annotations. |

Modified capabilities: **None** — the 8 existing marketing capabilities under `openspec/specs/` were untouched, exactly as the proposal declared.

### Verify annotations applied at archive

Annotations live in **both** the archived delta spec and the promoted main spec.

1. **api-conformance / "Divergence fails the build" → PARTIAL (W1).** The guard fires under `bunx ng test` (RED-proof G3: drift → `TS2344` at `conformance.spec.ts`), not `ng build`, because only the conformance spec consumes the generated types and `tsconfig.app.json` excludes `**/*.spec.ts`. This is design D5 (generated types + type-level vitest spec) vs. the scenario's literal `ng build` wording. Close in `p2-platform-foundation` by declaring hand-written domain types against `components[...]`.
2. **api-conformance / "Response violating the contract fails" → UNTESTED (deferred by design).** The spec scopes Go out ("no Go code in this change"); the backend session inherits the requirement (kin-openapi contract tests, `go test ./...`). Deferred, not dropped.
3. **api-contract / governance scenarios — "Out-of-band edit is rejected", "Breaking change bumps major", "Additive change bumps minor" → PARTIAL (W4).** Review-time process rules with no runtime test by nature. Accepted as PARTIAL — not defects.
4. **api-contract / Versioning → baseline note (S1).** `1.0.0` first publication; additive-minor rule starts with the NEXT edit.
5. **W2 (D3 section order)** and **W3 (TDD table format)** are documentation/process caveats carried as follow-ups, not spec annotations (no behavioral effect).

## Follow-ups

Visible, not silently dropped (source: verify WARNINGs/SUGGESTIONs + apply notes):

1. **S2 — Replace the provisional server URL before deploy.** `contracts/openapi.yaml` `servers` points at `https://api.constructora-ejemplo.com.ar` (described "Provisional"). The promoted Spectral rule `oas3-api-servers` requires ≥1 server, so a placeholder is justified until the backend has a real origin. Swap before first deploy. *(verify S2)*
2. **S3 — Constrain the register request role enum.** `POST /auth/register` `role` references the full `Role` enum (includes `admin`) with a description noting admin cannot be self-assigned. Consider a dedicated request enum (`worker|company`) so "admin never self-assigned" is enforced structurally rather than by description. *(verify S3)*
3. **W1 — Close the guard-placement gap.** Until `p2-platform-foundation` binds hand-written domain types to `components[...]`, the frontend conformance guard only fires under `ng test`, not `ng build`. *(verify W1; annotated on the scenario)*
4. **S5 — Re-check the root `ajv@8.20.0` override after any dependency bump.** The root pin works around bun hoisting two nested ajv 8.20.0 copies (breaking Spectral's `instanceof` check; root cause in Engram #841 `tooling/ajv-dual-copy-bug`). A future dependency bump could silently "clean it up" and re-break `contract:lint`. *(verify S5)*
5. **S4 — Strengthen path assertions.** `conformance.spec.ts` `not.toBeNever()` path checks are existence-only; add response-shape assertions for register / me / profile-get for stronger triangulation. *(verify S4 — non-blocking)*

Also noted: Engram observation #840 (`apply-progress`) is contested by two pending conflict observations — unrelated to this archive, flagged for awareness.

## Backend handoff (unblock signal)

The backend session (Go + Gin, `backend/`) may start **NOW**. It implements against `contracts/openapi.yaml` and **inherits** the `api-conformance` **Backend contract tests** requirement (R3): automated contract tests that validate every implemented operation's HTTP responses against `contracts/openapi.yaml`. Recommended shape (from design): `backend/internal/contract/contract_test.go` using kin-openapi (`openapi3.Loader` + `openapi3filter.ValidateResponse`) — (1) each implemented Gin route MUST map to a contract path + operationId, (2) recorded status/body MUST validate; gate with `go test ./...`. Guard configuration is contract-adjacent → SDD-only edits.

## Disposition of formerly untracked artifacts

`design.md`, `proposal.md`, `specs/` and `verify-report.md` were intentionally untracked during apply; per the archive decision they are part of the change record and are committed with this archive (hybrid mode = shareable trail). `p2-platform-foundation/explore.md` remains untracked — it belongs to a different (future) change lifecycle and is **not** part of this archive commit.

## Commits

| Commit | Work unit |
|---|---|
| `cfe1adb` … `e7d84b8` | apply + verify (prior phases) |
| this commit | `docs(openspec): archive p2-api-contract with verify annotations (p2-api-contract)` — annotations, spec sync (2 new capabilities), report, full change record incl. verify-report; folder moved to `archive/2026-10-08-p2-api-contract/` |

Conventional format, one archive commit, English, no AI attribution, nothing pushed.

## Checklist

- [x] Backend contract-test row annotated as deferred-by-design (not dangling)
- [x] PARTIAL governance rows + W1 guard-placement row annotated in delta **and** main spec
- [x] `1.0.0` baseline decision recorded in both specs
- [x] `api-contract` + `api-conformance` specs created in `openspec/specs/`
- [x] Existing 8 marketing capabilities untouched (`Modified: None`)
- [x] Change folder moved to `openspec/changes/archive/2026-10-08-p2-api-contract/`
- [x] Engram archive report saved as `sdd/p2-api-contract/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Follow-ups recorded (5 items + conflict note)
- [x] Commit stages `openspec/` only — no `contracts/`, no `src/`, no push, no PR

SDD cycle complete: proposal → spec → design → tasks → apply → verify → archive. Backend session and `p2-platform-foundation` are unblocked.
