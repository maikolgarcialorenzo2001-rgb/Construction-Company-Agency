# Archive Report: p5-warnings-closure

`p5-warnings-closure` is complete and archived. It closed the **last two warnings** carried from `p3-backend-foundation` as a **quality-only change with zero production behavior change**: **PS1** asserts the JWT `exp` claim *directly* in the round-trip test (`exp − iat == TTL`), and **PS2** documents `CONTRACT_PATH` as **owned by the test-only contract guard**. Verify passed **PASS (0 CRITICAL)**. **0 capabilities MODIFIED** — spec sync was intentionally skipped; `openspec/specs/**` and `contracts/openapi.yaml` were not touched.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p5-warnings-closure` (close carried warnings PS1 + PS2 — test-strengthening + documentation only) |
| Verify verdict | **PASS** (0 CRITICAL) — `verify-report.md` (Engram #898); 14/14 acceptance criteria COMPLIANT |
| Work units | 2/2 complete — `36f59ee` (C1/PS1), `935da7d` (C2/PS2), each ≪400 lines, tagged `(p5-warnings-closure)` on `main` |
| Tasks | 10/10 complete (1.1–1.4, 2.1–2.3, 3.1–3.3) |
| Capability changes | **0 MODIFIED** — spec sync skipped (see below) |
| Contract | `contracts/openapi.yaml` byte-identical across `cefc4f7` → `36f59ee` → `935da7d` (blob `2015c174…`) |
| Final gate (verified by sdd-verify) | `go test ./...` green (52 PASS / 0 FAIL / 3 gated skips, no DB) · `go vet` clean · `go build` success · `gofmt` clean |
| Archive location | `openspec/changes/archive/2026-10-11-p5-warnings-closure/` |
| Artifact store | openspec (Engram observations referenced for traceability) |
| Remote state | local commits only — **not pushed**, no PR/issue created (`main...origin/main [ahead 52]`, `origin/main` = `cfe1adb`) |

## Change summary

| Warning | What it was | What closed it |
|---|---|---|
| **PS1** | The `backend-auth` scenario *"Token carries the expected claims"* mandates `sub`, `role`, **and `exp`**, but the round-trip test proved `exp` only *behaviorally* (an expired token is rejected); it asserted `sub`+`role` only. | `TestJWT_IssueVerifyRoundTrip` now decodes the **encoded wire** payload (`jwt.NewParser().ParseUnverified` + `jwt.MapClaims`) and asserts `exp`/`iat` are present and `int64(exp − iat) == int64(ttl.Seconds())`. Deterministic because `Issue` derives both from a single `now` (`token.go` L51–57). Test-only — no production change. |
| **PS2** | `config.Load()` reads `CONTRACT_PATH` into `Config.ContractPath`, but `cmd/server/main.go` never consumes it (the kin-openapi guard runs test-only). | **Option B: document.** `backend/README.md` + a `config.go` field comment state that `CONTRACT_PATH`'s live consumer is `contract.ResolvePath()` **at test time**; `Config.ContractPath` mirrors the env var (spec-required, forward-compatible); the composition root intentionally does **not** load the contract (test-only guard, design D3). Includes the exact runnable CI command `go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract`. |

Option A (wire the guard into `main`) was rejected: it would link std `testing` into the prod binary, add a `runtime.Caller` source-path hazard on the deploy host, and duplicate a check already enforced by the default suite and the frontend gate (proposal D1).

## Capability changes: 0 MODIFIED (spec sync skipped)

**No delta spec existed and no `openspec/specs/**` file was modified.** This is intentional per proposal D3 / explore §9, and the archive step therefore performed **no spec merge**.

**Rationale.** PS1 changes *test evidence*, not specified behavior — the `backend-auth` requirement *"JWT issuance and verification"* already mandates `exp` presence and the implementation already satisfies it; the change only makes the assertion literal. PS2 (Option B) documents an existing, spec-sanctioned design (blocker: the guard is test-only, design D3). Neither alters a contract, route, status code, or config behavior. Both `backend-auth` and `backend-runtime` baselines remain valid and green, so a delta would be a no-op clarification at best — hence **0 capabilities MODIFIED, no sync**.

## Accepted warnings

| # | Warning | Disposition |
|---|---|---|
| **W1** | No new executable behavior to verify. The change is test-strengthening + documentation, so the verify phase could not execute new behavior. | **Accepted explicitly.** Verification rests on (a) the default suite staying green, (b) independently reproduced mutation sensitivity (§4 of the verify report), and (c) the documented-command run + doc grep. A limitation of the change's nature, not a defect. |
| **W2** | Strict-TDD RED-first was not performed. For a test-only, no-behavior change, a literal RED is impossible (the assertion targets already-implemented `Issue` behavior). | **Accepted explicitly, sanctioned by proposal D2.** apply-progress marked RED "N/A" and substituted a **mutation proof** (break `Issue` → `exp − iat = 7200s` vs TTL 3600s → FAIL → revert clean), which the verify phase **independently reproduced**. Recorded as a deviation, not a violation. |

## Carried-warning ledger update

Source: `p3-backend-foundation` verify §9 + `HANDOFF.md` §4.

| Item | Status after this change | Closed by / evidence |
|---|---|---|
| **PW2** — no listener-binding / `cmd/server` test | **CLOSED** | `p4-postgres-persistence` (`c67da42`): `buildStore(ctx, cfg)` + `cmd/server/main_test.go` (`TestBuildStore_EmptyDSNReturnsMemoryStore`). |
| **PS1** — JWT `exp` asserted only behaviorally | **CLOSED by this change** | `36f59ee` — direct wire-payload `exp` assertion, mutation-proven. |
| **PS2** — `CONTRACT_PATH` read but unconsumed by `main` | **CLOSED by this change** | `935da7d` — ownership documented (Option B), runnable CI command given. |
| **PC4** — C4 commit = 600 lines > 400 budget | **REMAINS a process note (no code)** | Documented review-budget deviation from `p3`; split future large auth batches. No action. |

With PS1 + PS2 closed, **no warnings from `p3-backend-foundation` remain open**; PC4 is a standing process reminder only.

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `36f59ee` | C1 `test(backend): assert JWT exp claim directly in round-trip (p5-warnings-closure)` — `backend/internal/auth/token_test.go` only (23+/1−) |
| `935da7d` | C2 `docs(backend): document CONTRACT_PATH ownership by the contract guard (p5-warnings-closure)` — `backend/README.md`, `backend/internal/config/config.go` (17+/2−) |
| this commit | `docs(openspec): archive p5-warnings-closure with no spec sync (p5-warnings-closure)` — report written, folder moved to `archive/2026-10-11-p5-warnings-closure/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | #893 |
| Proposal | `proposal.md` | #895 `sdd/p5-warnings-closure/proposal` |
| Spec (delta) | *(none — 0 capabilities MODIFIED)* | — |
| Design | *(intentionally skipped — no behavior change)* | — |
| Tasks | `tasks.md` | #896 `sdd/p5-warnings-closure/tasks` |
| Apply progress | `apply-progress.md` | #897 `sdd/p5-warnings-closure/apply-progress` |
| Verify report | `verify-report.md` | #898 |
| Archive report | `archive-report.md` | `sdd/p5-warnings-closure/archive-report` (this save) |

## Checklist

- [x] No spec sync performed — **0 capabilities MODIFIED** (intentional per proposal D3; no delta artifact existed)
- [x] `openspec/specs/**` untouched; `contracts/openapi.yaml` untouched
- [x] Change folder moved to `openspec/changes/archive/2026-10-11-p5-warnings-closure/` with all present artifacts (explore, proposal, tasks, apply-progress, verify-report, this report)
- [x] Active `openspec/changes/` directory no longer contains `p5-warnings-closure/`
- [x] Engram archive report saved as `sdd/p5-warnings-closure/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `backend/`, no `contracts/`, no `HANDOFF.md`, no `fg.json`, no push, no PR

## Next steps

The foundation is green and warning-free. The next SDD changes are the **four backend resource domains**, each an independent follow-on change built on the foundation's ports, service layer, and OpenAPI contract guard:

- **jobs**
- **profiles**
- **feed**
- **applications**

## SDD cycle complete

explore → proposal → tasks → apply → verify → archive. (sdd-spec and sdd-design were intentionally skipped — 0 capabilities MODIFIED, no behavior change.) Both carried warnings PS1 + PS2 are closed with independently verified evidence; `p3-backend-foundation` now has **no open warnings** (PC4 remains a process note). SDD cycle complete — ready for the backend resource domain changes.
