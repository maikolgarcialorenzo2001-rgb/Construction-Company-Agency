# Proposal: p5-warnings-closure

> Change: `p5-warnings-closure` · Repo: `construction-company-agency` · Phase: propose · Date: 2026-10-11
> Grounded in `openspec/changes/p5-warnings-closure/explore.md`; evidence re-verified against source. `contracts/openapi.yaml` is READ-ONLY.

## Intent (WHAT/WHY)

- **WHAT**: Close the two warnings carried from `p3-backend-foundation` and still open per `HANDOFF.md §4` — as a **quality-only** change with **no production behavior change**.
  - **PS1** — assert the JWT `exp` claim *directly* (`exp − iat == TTL`) so the scenario *"Token carries the expected claims"* maps to a literal assertion, not only a behavioral one.
  - **PS2** — resolve `CONTRACT_PATH` being read by `config` but never consumed by `cmd/server`, by **documenting the guard's usage** (Option B).
- **WHY**: The p3 verify report shipped PASS WITH WARNINGS; these two are the last survivors. Closing them makes test evidence literal and the config surface self-explanatory, with zero runtime risk.

## Grounded Evidence

| Ref | Fact |
|-----|------|
| `token.go` L51 | `Issue` reads **one** clock: `now := time.Now()`. |
| `token.go` L56–57 | `IssuedAt = now`, `ExpiresAt = now.Add(j.ttl)` ⇒ `exp − iat == ttl` exactly (whole-second TTL). |
| `token_test.go` L11–32 | Round-trip asserts `UserID` L26, `Role` L29 — **no `exp` assertion**; `Verify` returns no `exp` (token.go L91). |
| `config.go` L27, L58 | `ContractPath` field + `cfg.ContractPath = os.Getenv("CONTRACT_PATH")` — read is spec-required (`config_test.go` L144). |
| `main.go` L6–24, L39–53 | Composition root imports no `contract`; `cfg.ContractPath` never read. |
| `guard.go` L16, L38, L143 | Guard imports std **`testing`**, resolves path via `runtime.Caller` (source-tree), exposes `ValidateHTTP(testing.TB, …)`. |
| `README.md` L32 | `CONTRACT_PATH` listed "Contract override" — no owner stated. |

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | **PS2: wire vs. document** | **Option B — document** (reject A) | A links `testing` into the prod binary (guard.go L16), adds a deploy-host path hazard (`runtime.Caller`, L38), and is redundant — the guard's document load is already enforced by `TestGuard_LoadsAndValidatesContract` and the frontend gate; a binary can only re-validate the document, not detect response drift. A trades a harmless, documented non-consumption for a `testing`-coupled dependency: net negative. |
| D2 | **Strict-TDD handling** | **Mutation-proven test strengthening** (no fake RED) | Neither item adds behavior, so RED-first is impossible. PS1's meaningfulness is proven by **mutation**: break `Issue` (`now.Add(2*j.ttl)`), watch the new assertion FAIL, revert via `git checkout -- internal/auth/token.go`; record command+output as evidence. Mirrors p3's guard-neuter repro. PS2 is doc-only (TDD N/A). |
| D3 | **Spec surface** | **No delta spec; 0 capabilities MODIFIED** | PS1 changes *test evidence*, not specified behavior; PS2 documents an existing, spec-sanctioned design (D3 test-only guard). Nothing alters a contract, route, status code, or config behavior. |
| D4 | **CI command** | Raw `go test` | `make` is unavailable on this win32 dev env ⇒ documentation gives `go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract`, not a Makefile target. |

## Scope

**In scope**
- PS1: extend `TestJWT_IssueVerifyRoundTrip` to decode the payload (`jwt.MapClaims`) and assert `exp`/`iat` present and `exp − iat == TTL`.
- PS2: document `CONTRACT_PATH` ownership + the CI command in `backend/README.md`; one-line comment on `Config.ContractPath`.

**Out of scope**
- PW2 (closed by p4 `c67da42`); PC4 (process only).
- Any runtime wiring, `-check-contract` flag, or `make` target; any production-code change.
- Any edit to `contracts/openapi.yaml`; any spec delta.

## Approach

Black-box, wire-level assertion: after the existing `Verify` checks, `jwt.NewParser().ParseUnverified(token, &claims)` with `jwt.MapClaims` reads the *encoded* payload (strongest form of "direct"). Keep the TTL at `time.Hour` (already used) so `exp − iat` is exact. Documentation states ownership: `config.Config.ContractPath` mirrors the env var (spec-required, forward-compatible); the live consumer is `contract.ResolvePath()` at test time; the composition root intentionally does not load the contract (test-only guard, design D3).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/internal/auth/token_test.go` | Modified | +1 import; assert `exp`/`iat` from the decoded payload |
| `backend/README.md` | Modified | Contract-guard / `CONTRACT_PATH` ownership note + CI command |
| `backend/internal/config/config.go` | Modified | One-line comment on `ContractPath` |
| `contracts/openapi.yaml` | Unchanged | Read-only; never edited |

**Not touched:** any production source, any other `*_test.go`, `go.mod`/`go.sum`, specs, Makefile, `.env.example`.

## Slice / Commit Plan (≤400 lines each)

Sequential local work-unit commits on `main`; no branches/PRs/pushes; each message ends `(p5-warnings-closure)`.

| Commit | Message | Files | ~Lines |
|--------|---------|-------|--------|
| **C1** | `test(backend): assert JWT exp claim directly in round-trip (p5-warnings-closure)` | `backend/internal/auth/token_test.go` | 15 |
| **C2** | `docs(backend): document CONTRACT_PATH ownership by the contract guard (p5-warnings-closure)` | `backend/README.md`, `backend/internal/config/config.go` | 12 |

Total ≈ 27 lines (≪ 400). Test ships with the code it verifies; docs ship as one unit.

## Test / Verification Strategy

- **Runner**: `CGO_ENABLED=0 go test ./...` from `backend/` (default suite stays dependency-free; gated Postgres suite not invoked).
- **PS1**: new assertion is GREEN; **mutation proof** = break `Issue`, assertion FAILS, revert, `git status` clean before commit.
- **PS2**: doc-only — verify = grep the two files for the note + exact command; no test.
- **Verify phase**: default suite green, the `exp` assertion present and mutation-sensitive, doc note present.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mutation proof leaves modified `token.go` | Low | Revert immediately; verify `git status` clean (p3-proven procedure). |
| No observable behavior ⇒ verify has little to run | Low | Verify = suite + mutation sensitivity + doc grep; accept explicitly. |
| Reviewer prefers Option A (runnable check) | Med | D1 documents structural blockers; provide the exact `go test … -run TestGuard_LoadsAndValidatesContract` command. |
| `make` unavailable in dev env | Low | Document raw `go test` command; do not add a Makefile target. |

## Rollback Plan

All changes are additive (a test assertion, doc lines). Rollback = `git revert` of C1/C2. No production source, contract, or frontend is touched ⇒ zero blast radius.

## Success Criteria

- [ ] `go test ./...` passes; the round-trip test asserts `exp` present and `exp − iat == TTL` from the decoded payload.
- [ ] Mutation proof captured (break `Issue` ⇒ assertion fails ⇒ revert); `token.go` unmodified in the final commit.
- [ ] `backend/README.md` states `CONTRACT_PATH` is consumed by `contract.ResolvePath()` at test time and gives the exact CI command.
- [ ] `contracts/openapi.yaml` unchanged; no production code changed; no spec delta.
- [ ] Two commits on `main`, each ≪400 lines, tagged `(p5-warnings-closure)`; nothing pushed.

## Next Recommended

**Spec and design are N/A** (no behavior change, 0 capabilities MODIFIED) — recommend the pipeline **skip sdd-spec and sdd-design** and go straight to **sdd-tasks** (or apply) for `p5-warnings-closure`.
