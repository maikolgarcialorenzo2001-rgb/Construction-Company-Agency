# Apply Progress: p5-warnings-closure

**APPLY STATUS: COMPLETE** — 2/2 work units implemented and committed on `main`; default suite GREEN EXIT=0 (`CGO_ENABLED=0 go test ./...` from `backend/`); `contracts/openapi.yaml` untouched.

Mode: STRICT TDD (strict-tdd.md). Delivery: `ask-on-risk` → resolved by orchestrator as **single change under budget** (no `size:exception`, no chained-PR split). Chain strategy: `stacked-to-main`, realized as **2 sequential work-unit commits on `main`** (solo repo, no branches/PRs/pushes). Every commit message ends with `(p5-warnings-closure)`. Canonical test runner: `CGO_ENABLED=0 ~/.local/bin/go test ./...` from `backend/`.

No production behavior change (test-strengthening + documentation only); `contracts/openapi.yaml` read-only and unchanged.

## Per-Work-Unit Status

| WU | Scope (warning) | Commit | Status |
|----|-----------------|--------|--------|
| WU1 (PS1) | Direct `exp` assertion in the JWT round-trip test, mutation-proven | `36f59ee` | ✅ complete |
| WU2 (PS2) | Document `CONTRACT_PATH` ownership by the contract guard (Option B) | `935da7d` | ✅ complete |

## Per-Work-Unit Gate Results

| WU | `go test ./...` (backend) | Notes |
|----|---------------------------|-------|
| WU1 | ✅ EXIT=0 (auth re-run 0.772s, all packages ok) | Strengthening has no RED-first (behavior pre-exists); meaningfulness proven by mutation (below). `token.go` NOT in this commit. |
| WU2 | ✅ EXIT=0 (config re-run 0.334s, all packages ok) | Doc-only; grep confirms the note + exact command in `README.md` and the field comment in `config.go`. |

Total changed lines: C1 24 (23+/1−) + C2 19 (17+/2−) = **43** (≪ 400).

## TDD Cycle Evidence

Strict TDD is active (`openspec/config.yaml` → `testing.strict_tdd: true`). Neither item adds behavior, so a literal RED-first step is **impossible** (the PS1 assertion targets already-implemented behavior). PS1's meaningfulness is proven by **mutation** — the Go analogue of p3's guard-neuter repro (per `proposal.md` D2). PS2 is doc-only (TDD N/A).

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `internal/auth/token_test.go` | Unit (wire) | ✅ baseline suite EXIT=0 | N/A (no new behavior) — mutation-proof instead | ✅ `TestJWT_IssueVerifyRoundTrip` PASS | ✅ mutation breaks it (7200s ≠ 3600s) | ➖ import only |
| 1.2 | `internal/auth/token_test.go` | Unit (wire) | ✅ baseline suite EXIT=0 | N/A — assertion targets existing `Issue` behavior | ✅ PASS (0.00s) | ✅ `exp − iat == TTL` mutation-sensitive | ➖ none needed |
| 1.3 | mutation of `internal/auth/token.go` (reverted) | Mutation proof | ✅ mutated run FAIL EXIT=1 | — | — | — | ✅ `git checkout --` reverted; `git status --porcelain` clean of `token.go` |
| 2.1 | `backend/README.md` | Docs (review) | ✅ n/a | ➖ Triangulation skipped: documentation | ✅ note + exact command present | ➖ | ➖ |
| 2.2 | `internal/config/config.go` | Docs (comment) | ✅ n/a | ➖ Triangulation skipped: documentation | ✅ field comment present | ➖ | ➖ |

## Mutation Proof Evidence (task 1.3 — required)

Mutation applied to `internal/auth/token.go` (`Issue`): `ExpiresAt: jwt.NewNumericDate(now.Add(j.ttl))` → `now.Add(2 * j.ttl)`.

Command (from `backend/`):

```sh
CGO_ENABLED=0 ~/.local/bin/go test ./internal/auth/ -run TestJWT_IssueVerifyRoundTrip -v
```

Output (captured — the new assertion FAILS under the mutated issuer):

```text
=== RUN   TestJWT_IssueVerifyRoundTrip
    token_test.go:52: exp - iat = 7200s, want the TTL 3600s
--- FAIL: TestJWT_IssueVerifyRoundTrip (0.00s)
FAIL
FAIL	cca/backend/internal/auth	0.465s
FAIL
EXIT_CODE=1
```

Revert + clean confirmation:

```text
$ git checkout -- backend/internal/auth/token.go
$ git status --porcelain
 M backend/internal/auth/token_test.go
?? HANDOFF.md
?? fg.json
?? openspec/changes/p5-warnings-closure/
```

`token.go` is absent from `git status` (mutation fully reverted). C1's `git show --stat` lists only `backend/internal/auth/token_test.go`, so the shipped C1 commit contains **no production change**.

Pre-mutation (GREEN) control run:

```text
=== RUN   TestJWT_IssueVerifyRoundTrip
--- PASS: TestJWT_IssueVerifyRoundTrip (0.00s)
PASS
ok  	cca/backend/internal/auth	0.469s
```

## Final Verification (Phase 3)

`CGO_ENABLED=0 ~/.local/bin/go test ./...` from `backend/` → **EXIT=0**; all packages ok:

```text
ok  	cca/backend/cmd/server
ok  	cca/backend/internal/auth
ok  	cca/backend/internal/config
ok  	cca/backend/internal/contract
ok  	cca/backend/internal/domain
ok  	cca/backend/internal/httpapi
ok  	cca/backend/internal/service
?   	cca/backend/internal/store	[no test files]
ok  	cca/backend/internal/store/memory
ok  	cca/backend/internal/store/postgres
?   	cca/backend/internal/store/storetest	[no test files]
ok  	cca/backend/migrations
EXIT_CODE=0
```

| Check | Result |
|-------|--------|
| `contracts/openapi.yaml` unchanged | ✅ `git status --porcelain contracts/` empty; not in C1/C2 stats |
| `token.go` unmodified in C1 | ✅ C1 stat = `token_test.go` only (23+/1−) |
| Commit size ≤ 400 lines | ✅ C1 24, C2 19 |
| Subjects end `(p5-warnings-closure)` | ✅ both commits |
| Nothing pushed | ✅ `git status -sb` → `main...origin/main [ahead 52]`; `origin/main` still at `cfe1adb` |
| Doc grep (task 2.3) | ✅ `README.md` L41 `contract.ResolvePath()`, L49 `go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract`; `config.go` L27 comment |

## Commits

| Commit | Message | Files | Stat |
|--------|---------|-------|------|
| `36f59ee` | `test(backend): assert JWT exp claim directly in round-trip (p5-warnings-closure)` | `backend/internal/auth/token_test.go` | 23 insertions(+), 1 deletion(-) |
| `935da7d` | `docs(backend): document CONTRACT_PATH ownership by the contract guard (p5-warnings-closure)` | `backend/README.md`, `backend/internal/config/config.go` | 17 insertions(+), 2 deletions(-) |

## Deviations from Design

None — implementation matches `proposal.md` (D1 Option B, D2 mutation-proof, D4 raw `go test`). One cosmetic fix during C2: the `README.md` `CONTRACT_PATH` table row was re-padded so the `Purpose` column stays aligned (Markdown tables render regardless, but the house style is a tidy table).

## Issues / Risks

- **No observable behavior change** ⇒ the verify phase has no new behavior to execute; verification rests on (a) the default suite staying green, (b) the mutation sensitivity captured above, and (c) the documentation grep. Accepted explicitly per `proposal.md` Risks.
- **Mutation proof procedure** must leave no trace; verified: `token.go` absent from `git status` and from C1 before commit (risk R1 mitigated).
- `config.Config.ContractPath` remains unconsumed by `cmd/server` **by design** (now documented) — a reviewer may still prefer Option A; `proposal.md` D1 documents the structural blockers (testing link, source-path fragility, redundancy, wrong layer).

## Rollback

Each commit is autonomous and additive: `git revert 935da7d` ⇒ WU2 (docs); `git revert 36f59ee` ⇒ WU1 (test assertion). No production source, contract, or frontend touched ⇒ zero blast radius.
