# Exploration: p5-warnings-closure (close carried warnings PS1 + PS2)

> Change: `p5-warnings-closure` · Repo: `construction-company-agency` · Date: 2026-10-11
> Artifact store: openspec · Phase: explore (read-only investigation, no implementation)
> Source of the carried items: `openspec/changes/archive/2026-10-10-p3-backend-foundation/verify-report.md` §9 + `HANDOFF.md` §4

## TL;DR (the answer first)

1. **Scope is exactly two carried items, both quality-only.** **PS1** = assert the JWT `exp` claim *directly* in the round-trip test; **PS2** = resolve `CONTRACT_PATH` being read by `config` but unconsumed by `cmd/server`. **PW2 is already closed** by `p4-postgres-persistence` (`cmd/server/main_test.go` + `buildStore`) — do **not** re-open it. **PC4** is a process note (commit-size budget), no code.
2. **PS1 is a pure test-strengthening** in one file (`backend/internal/auth/token_test.go`): parse the minted token, assert `exp` is present and `exp − iat == TTL`. This is **deterministic without a fake clock** because `Issue` derives both `iat` and `exp` from a single `now` (`token.go` L51–57); the difference is exactly the TTL. No production code changes.
3. **PS2 — recommend OPTION B: document usage; do NOT wire the guard into `main`.** The guard is deliberately test-shaped (design D3): it imports standard `testing` (`guard.go` L16), resolves the contract by walking up from the *source file* (`runtime.Caller`, `guard.go` L38), and its real job (response-drift detection) cannot run outside a driven HTTP harness. A binary can only re-validate the *document* — which `TestGuard_LoadsAndValidatesContract` already fails the default suite on. See §3 for the full tradeoff.
4. **No spec-observable behavior change ⇒ no delta spec and no capability MODIFIED.** This is a quality/doc closure. The SDD archive step should record "0 capabilities changed" (see §9).
5. **Strict TDD caveat:** neither item has new behavior, so a literal RED-first step is impossible (the PS1 assertion targets already-implemented behavior). PS1's meaningfulness must be proven by **mutation** (break `Issue`, watch the test fail, revert) — the Go analogue of the p3 guard-neuter experiment. PS2 is doc-only (TDD N/A). This must be surfaced to propose/apply.
6. **Delivery:** two tiny sequential local commits on `main` (tagged `(p5-warnings-closure)`), ~35–45 changed lines total. Each ≪ 400. Nothing pushed.

---

## 1. Problem statement

`p3-backend-foundation` verified **PASS WITH WARNINGS**. Two of its items survived `p4-postgres-persistence` still open and were carried into `HANDOFF.md` §4:

- **PS1 (verify §9 Suggestion S1)** — the backend-auth scenario *"Token carries the expected claims"* says the token must carry `sub`, `role`, **and `exp`**. Today `exp` is proven only *behaviorally* (an expired token is rejected); the round-trip test asserts `sub`+`role` only. The warning: assert `exp` **directly** in the JWT round-trip test, so the scenario maps to a literal assertion.
- **PS2 (verify §9 Suggestion S2)** — `config.Load()` reads `CONTRACT_PATH` into `Config.ContractPath`, but `cmd/server/main.go` never consumes that field; the kin-openapi guard runs test-only. The warning: **decide** — either (a) wire the guard as a CI-visible binary check, or (b) clearly document its usage.

Out of scope (do not include): **PW2** (no listener-binding/`cmd/server` test) was closed by `p4-postgres-persistence` C4 (`c67da42`): `main.go` now extracts `buildStore(ctx, cfg)` and `cmd/server/main_test.go` proves the empty-DSN memory path behaviorally (`TestBuildStore_EmptyDSNReturnsMemoryStore`). **PC4** (C4 = 600 > 400 budget) is a documented process deviation, no code.

---

## 2. Grounded evidence

### 2.1 PS1 — the JWT issuer and its round-trip test

**Issuer** — `backend/internal/auth/token.go`:

| Ref | Lines | Fact |
|---|---|---|
| `JWT.ttl` | L36–39 | `ttl time.Duration` carried by the issuer, set in `NewJWT` (L45). |
| `Issue` clock | L51 | `now := time.Now()` — **one** clock read. |
| `IssuedAt` | L56 | `jwt.NewNumericDate(now)` |
| `ExpiresAt` | L57 | `jwt.NewNumericDate(now.Add(j.ttl))` |
| `Verified claims` | L91 | `Verify` returns only `{UserID, Role}` — **no `exp`** reaches the test. |

**Test** — `backend/internal/auth/token_test.go` L11–32 (`TestJWT_IssueVerifyRoundTrip`): issues with `NewJWT("top-secret", time.Hour)`, verifies, asserts `claims.UserID` (L26) and `claims.Role` (L29). **There is no `exp` assertion**, and the returned `Claims` struct does not expose it — hence the warning.

**What "assert `exp` directly" means here:** decode the minted token's payload and assert the `exp` claim is present and equals `iat + TTL`. Because both claims are minted from one `now` (L51–57) and `jwt.NewNumericDate` truncates to whole seconds, `exp − iat` is **exactly** the TTL for a whole-second TTL (e.g. `time.Hour`) — a clock-independent, fully deterministic assertion. A fake clock is therefore **not required**; if absolute-time assertions were ever wanted, `jwt.NewParser(jwt.WithTimeFunc(...))` would be the seam, but it is unnecessary here.

**Minimal test shape (black-box, wire-level):**

```go
const ttl = time.Hour
j := NewJWT("top-secret", ttl)
token, err := j.Issue("user-1", domain.RoleWorker)
// ... existing Verify() assertions for sub + role ...

var claims jwt.MapClaims // github.com/golang-jwt/jwt/v5
if _, _, err := jwt.NewParser().ParseUnverified(token, &claims); err != nil {
    t.Fatalf("ParseUnverified() error = %v", err)
}
exp, ok := claims["exp"].(float64)
if !ok {
    t.Fatal(`token is missing the "exp" claim`)
}
iat, ok := claims["iat"].(float64)
if !ok {
    t.Fatal(`token is missing the "iat" claim`)
}
if got := int64(exp - iat); got != int64(ttl.Seconds()) {
    t.Errorf("exp - iat = %ds, want the TTL %ds", got, int64(ttl.Seconds()))
}
```

`MapClaims` reads the *encoded* payload (strongest form of "direct"). The internal alternative — `jwt.NewParser().ParseUnverified(token, &tokenClaims{})` then read `c.ExpiresAt`/`c.IssuedAt` — is possible since the test is `package auth`, but it asserts Go structs rather than the wire claims; prefer `MapClaims`.

**Files:** only `backend/internal/auth/token_test.go` (+1 import line, +~14 assertion lines). No production change.

### 2.2 PS2 — `CONTRACT_PATH` reads vs. consumption

| Ref | Lines | Fact |
|---|---|---|
| `config.Config.ContractPath` | `config.go` L25–27 | Field documented as "optionally overrides the resolved openapi.yaml location". |
| `config.Load` read | `config.go` L58 | `cfg.ContractPath = os.Getenv("CONTRACT_PATH")` |
| `config_test` assertion | `config_test.go` L128–150 (`TestLoad_ReadsOverrides` L144) | Asserts the field is populated ⇒ the read is **spec-required** (`backend-runtime` "Environment configuration" lists `CONTRACT_PATH`). |
| `cmd/server/main.go` | L6–24, L50–53 | Imports `auth/config/httpapi/service/store/memory/postgres/migrations` — **no `contract`**. `cfg.ContractPath` is never read. |
| Guard's own override | `guard.go` L33–36 (`ResolvePath`) | Reads `CONTRACT_PATH` **directly from the env** — the guard does not use `cfg.ContractPath` either. |
| Guard is test-shaped | `guard.go` L16 | Imports standard **`testing`** (for `ValidateHTTP(testing.TB, …)`, L143–147). |
| Guard path resolution | `guard.go` L38–43 | `runtime.Caller(0)` → walks up from the **source file**; only valid from a source checkout. |
| Doc surface | `backend/README.md` L32 | `CONTRACT_PATH` listed with purpose "Contract override" — no owner stated. |

**Current truth:** the variable has exactly one live consumer — `contract.ResolvePath()` at **test time**. `config.Config.ContractPath` is a mirrored, spec-mandated read that the runtime composition root never uses.

### 2.3 Out-of-scope confirmations (do not include)

- **PW2 — CLOSED** by `p4-postgres-persistence` C4 (`c67da42`): `cmd/server/main.go` L70–88 (`buildStore`) + `main_test.go` `TestBuildStore_EmptyDSNReturnsMemoryStore` / `TestBuildStore_RejectsInvalidDSN`. (Note: it closed the *store-wiring* gap and the comment on L12–14 claims PW2; it did **not** add a literal listener-bind test. The carried item as written in §4 of HANDOFF is closed; no further action taken here.)
- **PC4 — process only** (600-line commit, ~214 production lines). Committed as a documented review-budget deviation. No code.

---

## 3. PS2 decision — wire vs. document

### Option A — wire the guard as a CI-visible binary check

Add a `-check-contract` branch to `cmd/server/main.go` that resolves the path (honoring `cfg.ContractPath`, else `contract.ResolvePath()`), calls `contract.Load(path)` and exits non-zero on failure. Optionally a `make check-contract` target.

- **Pros:** literally consumes `cfg.ContractPath` (kills the dead-config smell); gives a runnable, CI-visible command; a behavior change → a genuine Strict-TDD RED/GREEN unit (`TestCheckContract_RejectsMissingFile`, `TestCheckContract_AcceptsRepoContract`).
- **Cons (decisive):**
  1. **`testing` leaks into the production binary.** `contract` imports standard `testing` (`guard.go` L16). Importing `contract` from `main` links `testing` — and its `-test.*` flags — into the shipped server. Avoidable only via an extra refactor (change `ValidateHTTP`'s parameter from `testing.TB` to a local `interface{ Helper(); Fatalf(string, ...any) }`).
  2. **Path resolution is source-tree-bound.** `ResolvePath` uses `runtime.Caller` (L38) walking up from the package source dir. In a deployed binary that path does not exist ⇒ wiring the guard into the runtime startup path would create a **production-only failure mode**. It is safe *only* as a dev/CI invocation.
  3. **Redundant.** `TestGuard_LoadsAndValidatesContract` already loads **and `doc.Validate`s** the contract under the default `go test ./...`; the frontend gate (`bun run gate` → `contract:lint`/`contract:check`) validates it too. A binary adds no new failure coverage.
  4. **Wrong layer.** The guard's actual value is **response-drift detection**, which needs a driven request/response harness; a binary can only re-check the document. Option A buys the smell-fix, not the purpose.

### Option B — document usage (recommended)

Document, in `backend/README.md` (and a one-line comment on `Config.ContractPath`), that **`CONTRACT_PATH`'s live consumer is `contract.ResolvePath()` at test time**; `config.Config.ContractPath` mirrors the variable so the configuration surface is complete and forward-compatible; the composition root intentionally does **not** load the contract because the guard is a test-only harness (design D3), and response conformance can only be checked by driving requests in-process.

- **Pros:** zero production/runtime risk; no `testing` link; no fragile path on a deploy host; consistent with design D3; ~10–15 doc lines. The warning explicitly sanctions "clearly document its usage".
- **Cons:** `Config.ContractPath` remains unconsumed by `main` (by design, now documented). A reviewer could still prefer a runnable check — mitigated by documenting the exact command to run the check in CI.

**Decision: Option B.** Rationale: the guard is structurally test-only (imports `testing`; resolves the contract from the source tree), its document-load is already enforced by the existing default-suite test and the frontend gate, and its real job (response drift) is unreachable from a binary. Wiring it into `main` would trade a harmless, documented non-consumption for a `testing`-coupled dependency and a deploy-host path hazard — a net negative. **This is a design decision to confirm** (see Recommendation); if the maintainer insists on a runnable check, the preferred form is a dev/CI-only `go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract` command (zero new production code), **not** a runtime flag.

> Side note (not this warning): because `CONTRACT_PATH` is genuinely a guard/test concern while the `backend-runtime` spec lists it under *runtime* environment configuration, the cleanest long-term closure would be a spec MODIFY moving `CONTRACT_PATH` ownership out of `config`. That is a larger governance move that **undoes a p3 spec decision** and is **out of scope** here; surfaced only as context.

---

## 4. Scope

**In scope**
- PS1: strengthen `TestJWT_IssueVerifyRoundTrip` (or add a focused sibling test) to assert the `exp` claim directly (`exp − iat == TTL`). Test-only.
- PS2: documentation closure (Option B) making `CONTRACT_PATH` ownership explicit and giving the CI command.

**Out of scope**
- PW2 (closed by p4), PC4 (process only).
- Any runtime wiring of the contract guard; any `-check-contract` flag; any `make` target (given `make` is unavailable in the win32 dev env, a raw `go test` command is documented instead).
- Any production-code change; any change to `contracts/openapi.yaml` (READ-ONLY).
- Any spec delta (see §9).

---

## 5. Exact file plan

| # | File | Change | ~Lines |
|---|---|---|---|
| 1 | `backend/internal/auth/token_test.go` | Add `github.com/golang-jwt/jwt/v5` import; assert `exp` present and `exp − iat == ttl` from the decoded payload. | +15 |
| 2 | `backend/README.md` | Add a short "Contract guard / `CONTRACT_PATH`" note: consumer = `contract.ResolvePath()` (test-time), D3 test-only rationale, and the CI command. | +10 |
| 3 | `backend/internal/config/config.go` | One-line comment on `ContractPath`: consumed by `contract.ResolvePath()` (guard, test-time), not by the composition root. | +2 |

**Not touched:** `contracts/openapi.yaml`, any `*_test.go` other than `token_test.go`, any production source, `go.mod`/`go.sum`, specs, Makefile, `.env.example` (already lists `CONTRACT_PATH`).

**Total: ~27 changed lines across 3 files** (≪ 400). This is small enough to be a **single work unit**; it is split into two commits only for clean history (§7).

---

## 6. Test strategy · Strict TDD

| Item | Test action | RED-first? | Meaningfulness proof |
|---|---|---|---|
| **PS1** | Extend `token_test.go` to parse the token and assert `exp`/`iat`. | **No** — the behavior already exists; the first run is GREEN. | **Mutation proof**: temporarily change `Issue` to `now.Add(2*j.ttl)` (or drop `ExpiresAt`) → the new assertion FAILS → revert with `git checkout -- internal/auth/token.go`; record as the TDD-equivalent evidence (mirrors p3's guard-neuter repro). |
| **PS2 (B)** | No test (doc-only). | N/A | N/A. |
| **PS2 (A, if chosen)** | `main_test.go`: `TestCheckContract_RejectsMissingFile` (RED) then `AcceptRepoContract`; implement flag. | Yes | Real RED/GREEN. |

**Runner:** `CGO_ENABLED=0 go test ./...` from `backend/` via the `go` wrapper. Default suite stays dependency-free. The gated Postgres suite is irrelevant here and must not be invoked.

**Honesty flag (must reach propose/apply):** under Strict TDD, a test-only change has no legitimate RED step. Apply should either (a) record PS1 as "test strengthening — RED not applicable; mutation proof attached", or (b) if a true RED unit is required, the change must adopt PS2 Option A. This is a substantive decision, not a formality.

---

## 7. Slice / commit plan

Sequential local work-unit commits on `main`; no branches, PRs, or pushes; every message ends `(p5-warnings-closure)`.

| Commit | Message | Files | ~Lines |
|---|---|---|---|
| **C1** | `test(backend): assert JWT exp claim directly in round-trip (p5-warnings-closure)` | `backend/internal/auth/token_test.go` | 15 |
| **C2** | `docs(backend): document CONTRACT_PATH ownership by the contract guard (p5-warnings-closure)` | `backend/README.md`, `backend/internal/config/config.go` | 12 |

Both ≪ 400. If the orchestrator prefers a single commit, merge into one; two is cleaner because each is an independent work unit (test vs. docs). No `openspec/` staging is needed for the code commits; the archive commit (openspec-only) happens at archive time.

---

## 8. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | PS1 mutation proof leaves a modified `token.go` | Low | Revert with `git checkout --` immediately; verify `git status` clean before committing (p3's proven procedure). |
| R2 | No observable behavior change ⇒ verify has little to execute | Low | Verify = run the default suite + assert the new `exp` assertion exists and is mutation-sensitive; accept the doc grep. |
| R3 | Reviewer expects Option A (runnable check) and rejects B as "papering over" | Medium | §3 documents the structural blockers; provide the exact CI command; surface A vs B as a decision in the proposal. |
| R4 | `make` unavailable in this dev env | Low | Document a raw `go test … -run TestGuard_LoadsAndValidatesContract` command; do not add a Makefile target. |
| R5 | `ParseUnverified` uses a hard-coded claim key string | Low | Acceptable — the claim name is the contract (`exp`/`iat`); the assertion is intentionally wire-level. |
| R6 | `time.Hour` TTL + whole-second `NumericDate` truncation advertised as exact | Low | True for whole-second TTLs; keep the test TTL at `time.Hour` (already used) so `exp − iat` is exact. |

---

## 9. Delta-spec decision

**No delta spec; no capability MODIFIED.** PS1 changes *test evidence*, not specified behavior — the `backend-auth` requirement *"JWT issuance and verification"* already mandates `exp` presence and the implementation already satisfies it; the change only makes the assertion literal. PS2 (Option B) is documentation of an existing, spec-sanctioned design (D3 test-only guard). Neither alters a contract, a route, a status code, or a config behavior.

**Consequence for archive:** the archive step should record "0 capabilities changed / no spec sync needed". If the team wants an auditable spec touch, the only honest deltas are *clarifications* (not behavior): a MODIFY to `backend-auth` ("JWT issuance and verification" — make the direct-`exp` assertion explicit) and/or `backend-runtime` ("Environment configuration" — state `CONTRACT_PATH` is guard-owned). **Surface this choice**; recommended default is **no delta**.

---

## Recommendation

Proceed to **`sdd-propose`** for `p5-warnings-closure` scoped strictly to **PS1 (test assertion) + PS2 Option B (documentation)**. Roughly 27 lines across three files, zero production/runtime risk, contract untouched. Two decisions must be confirmed before apply:

1. **PS2: Option B (document) vs. Option A (wire a CI check).** Recommendation: **B**, for the structural reasons in §3 (testing-link, source-path fragility, redundancy, wrong layer).
2. **Strict-TDD handling for a no-behavior change:** accept PS1 as a mutation-proven test strengthening (RED N/A), or escalate to Option A to obtain a real RED unit.

## Ready for Proposal

**Yes** — the two carried items are fully grounded in real code, the PS2 fork is analyzed with a clear recommendation, the file set and line budget are exact, and there is no blocker. The proposal should carry the Option A/B decision (recommend B) and the no-delta-spec / RED-not-applicable note into its open questions.
