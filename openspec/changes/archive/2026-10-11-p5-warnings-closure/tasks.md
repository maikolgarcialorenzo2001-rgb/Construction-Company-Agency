# Tasks: p5-warnings-closure

> Change `p5-warnings-closure` · Repo `construction-company-agency` · Phase tasks · 2026-10-11
> Inputs: `proposal.md` (Engram 895), `explore.md` (Engram 893). **sdd-spec / sdd-design skipped** (0 capabilities MODIFIED).
> Runner: `CGO_ENABLED=0 go test ./...` from `backend/` (module `cca/backend`); `contracts/openapi.yaml` **READ-ONLY**.
> Delivery: 2 sequential local commits on `main`, each ends `(p5-warnings-closure)`, ≤400 lines, no push.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~27 total (C1 ≈15, C2 ≈12) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single unit — 2 commits for clean history |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Commit | Base/Notes |
|------|------|--------|-----------|
| 1 (PS1) | Direct `exp` assertion in the JWT round-trip test, mutation-proven | C1 | `main`; test-only, no production change |
| 2 (PS2) | Document `CONTRACT_PATH` ownership + CI command | C2 | `main`; independent of C1 |

## Phase 1: PS1 — Direct `exp` assertion (C1)

No new behavior ⇒ RED-first impossible; proven by mutation step 1.3.

- [x] **1.1** — Add `github.com/golang-jwt/jwt/v5` to the import block of `backend/internal/auth/token_test.go`.
- [x] **1.2** — In `TestJWT_IssueVerifyRoundTrip`, name the TTL `const ttl = time.Hour` and pass it to `NewJWT`. After the `sub`/`role` checks, decode the payload: `var claims jwt.MapClaims; jwt.NewParser().ParseUnverified(token, &claims)`. Assert `exp`/`iat` present (`float64`) and `int64(exp-iat) == int64(ttl.Seconds())`.
  - Files: `backend/internal/auth/token_test.go` (+1 import, ~+14 lines). No production change.
- [x] **1.3 — MUTATION PROOF (required evidence)**: temporarily break `Issue` (`ExpiresAt: jwt.NewNumericDate(now.Add(2*j.ttl))`); run `CGO_ENABLED=0 go test ./internal/auth/ -run TestJWT_IssueVerifyRoundTrip`; capture the **FAIL**. Then `git checkout -- backend/internal/auth/token.go`; confirm `git status --porcelain` lists only `token_test.go`.
- [x] **1.4 — Verify**: `CGO_ENABLED=0 go test ./...` green from `backend/`. **Commit boundary C1**: `test(backend): assert JWT exp claim directly in round-trip (p5-warnings-closure)`.

## Phase 2: PS2 — Document `CONTRACT_PATH` ownership (C2)

Doc-only (TDD N/A). Option B — document, no runtime wiring.

- [x] **2.1** — In `backend/README.md` (Configuration section, by the `CONTRACT_PATH` row): state the consumer is `contract.ResolvePath()` at **test time**; `config.Config.ContractPath` mirrors the env var (spec-required, forward-compatible); the composition root intentionally does not load the contract (test-only guard, design D3). Include the exact CI command: `go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract`.
- [x] **2.2** — One-line comment on `ContractPath` in `backend/internal/config/config.go` (L25–27): consumed by `contract.ResolvePath()` (guard, test-time), not by the composition root.
- [x] **2.3 — Verify**: `grep -R "ResolvePath" backend/README.md backend/internal/config/config.go` finds the note + exact command; `go test ./...` still green. **Commit boundary C2**: `docs(backend): document CONTRACT_PATH ownership by the contract guard (p5-warnings-closure)`.

## Phase 3: Final Verification (no commit)

- [x] **3.1** — `CGO_ENABLED=0 go test ./...` from `backend/` passes; `contracts/openapi.yaml` unchanged.
- [x] **3.2** — Mutation evidence captured (1.3); `token.go` unmodified in the C1 commit.
- [x] **3.3** — Each commit ≤400 changed lines (`git show --stat`); subjects end `(p5-warnings-closure)`; nothing pushed.

**Work-unit rule**: tests ship with their behavior; docs ship as one unit; every commit ends `(p5-warnings-closure)`.
