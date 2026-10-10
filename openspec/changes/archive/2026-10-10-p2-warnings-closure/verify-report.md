# Verification Report

**Change**: p2-warnings-closure
**Version**: N/A (delta specs in `openspec/changes/p2-warnings-closure/specs/`)
**Mode**: Strict TDD
**Verified**: 2026-10-10 · base `67cef06` → HEAD `6e05f10` · branch `main` (no branches/pushes)

## Verdict

**PASS WITH WARNINGS** — All spec scenarios are covered by passing runtime tests; the full gate is GREEN (exit 0, 493 tests / 56 files, 21 prerendered routes, no `plataforma` leak). Every apply-progress claim was independently re-proven by execution, including destructive mutation/seed probes. The warnings are non-blocking, design-accepted test-methodology trade-offs, not spec gaps.

## Completeness

| Metric | Value |
|--------|-------|
| Work units total | 6 |
| Work units complete | 6 |
| Tasks total | 22 (1.1–1.5, 2.1–2.5, 3.1–3.5, 4.1–4.5, 5.1–5.5, 6.1–6.6) |
| Tasks incomplete | 0 |

## Build & Tests Execution

**Gate**: ✅ `bun run gate` → **GATE_EXIT=0**

```text
$ bun run gate
= contract:lint (spectral)      → "No results with a severity of 'error' found!"
= contract:check (openapi-ts)   → ✨ no drift
= bunx ng lint                  → "All files pass linting."
= bunx ng test --watch=false    → Test Files 56 passed (56); Tests 493 passed (493)
= bunx ng build                 → "Prerendered 21 static routes."
= bun run verify:prerender      → PASS · routes verified: 21 (7 static + 6 services + 8 projects)
                                  · heads checked: 21 · CSR fallback ok · no localhost
                                  · server.ts absent · @angular/ssr only SSR dep · no plataforma leak
GATE_EXIT=0
```

**Tests**: ✅ 493 passed / ❌ 0 failed / ⚠️ 0 skipped (56 files)

**Build routes**: ✅ 21 prerendered (7 static + 6 services + 8 projects). Output root: `dist/Construction-Company-Agency/browser` (`dist/<project>/browser` layout).

**Leak scan**: ✅ `no plataforma leak` on the clean build.

## Independent Re-Proof (destructive probes)

| WU | Probe | Expected | Observed |
|----|-------|----------|----------|
| WU1 | Added `HttpClient.get('/__probe__')` before `httpMock.verify()` in `app.config.spec.ts`, ran full suite, reverted | 1 failing test | ✅ `src/app/app.config.spec.ts > bootstraps the platform subtree with zero HTTP` FAILED with `Expected no open requests, found 1: GET /__probe__`; suite 492 passed / 1 failed. Reverted → clean. |
| WU2 | Seeded `dist/Construction-Company-Agency/browser/plataforma/index.html` (+ dir), ran `bun scripts/verify-prerender.ts` | exit 1, both named | ✅ exit 1 with **2 hits**: `dist\...\browser\plataforma` AND `...\plataforma\index.html`; message `platform artifact present in client output`. Removed → exit 0 `· no plataforma leak`. |
| WU2 | `VERIFY_PRERENDER_DIST=/tmp/.../browser` (arbitrary root = `dist/browser` shape), seeded leak | hits named | ✅ root-agnostic; both artifacts named. Confirms `resolveDistRoot()` + override handle `dist/browser` and `dist/<project>/browser`. |
| WU3/WU4/WU5 | Removed `overrideProvider(AUTH_GATEWAY)`, the admin guard, and the `applicantId` predicate; ran full suite; reverted | covering tests fail | ✅ exactly 6 FAILS: `ports.spec.ts > swaps the auth adapter`; `mock-gateways.spec.ts > rejects a self-assigned admin role…`; `session.service.spec.ts > bubbles up the rejected admin role…`; `mock-gateways.spec.ts > filters by applicantId…`; `> combines jobId and applicantId…`; `> returns an empty page…`. Suite 487 passed / 6 failed. Reverted → clean. |
| WU4/WU5 | `git diff contracts/`; `git show --name-only` on all 6 commits | empty / none touch contracts | ✅ `git diff contracts/` empty; **no commit touched `contracts/`**. |
| WU6 | `mem_get_observation(848)`; `git show --stat 6e05f10` | #848 intact; WU6 docs-only | ✅ #848 still the archived `p2-platform-foundation/apply-progress` (W2/W3/W4/W5/W7 explicitly "out of scope"); `6e05f10` changed only `apply-progress.md`. |

Tree left clean: `git diff --stat` empty; only untracked openspec artifacts + `HANDOFF.md` remain.

## Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| server-rendering: Platform hydration without transfer cache | Platform hydrates with zero HTTP | `app.config.spec.ts > bootstraps the platform subtree with zero HTTP` | ✅ COMPLIANT |
| server-rendering | Zero-HTTP bootstrap is asserted by a test | same (HttpTestingController, zero pending) | ✅ COMPLIANT |
| server-rendering | Hydration comment is accurate | `app.config.ts` lines 20–24 (review) | ✅ COMPLIANT |
| platform-shell: Platform subtree excluded from prerender | No platform server route | `app.routes.server.spec.ts` (pre-existing, green) | ✅ COMPLIANT |
| platform-shell | No platform HTML is emitted | `bunx ng build` → 21 routes, no `plataforma` output | ✅ COMPLIANT |
| platform-shell | Leak scan fails gate | seeded-leak probe → exit 1 (2 hits) | ✅ COMPLIANT |
| platform-shell | gate wires the scan | `package.json` `gate … && bun run verify:prerender`; gate output runs it | ✅ COMPLIANT |
| platform-identity: Role model | Registration offers only self-service roles | `registro.page.spec.ts > offers only the self-service roles, never admin` | ✅ COMPLIANT |
| platform-identity | Role is computed from the session | `session.service.spec.ts > computes the role from the session` | ✅ COMPLIANT |
| platform-identity | Programmatic register rejects admin | `mock-gateways.spec.ts > rejects a self-assigned admin role…` | ✅ COMPLIANT |
| platform-identity | Worker and company register normally | `mock-gateways.spec.ts > registers a new account…` + `> registers a company account through me()` | ✅ COMPLIANT |
| platform-identity: Auth and profiles gateway ports | Mock adapter satisfies the port | mock-gateways auth/profiles suites | ✅ COMPLIANT |
| platform-identity | Adapter is swappable | `ports.spec.ts` swap tests | ✅ COMPLIANT |
| platform-identity | Each auth and profiles token proves swappability | `ports.spec.ts > swaps the auth adapter…` / `> swaps the profiles adapter…` | ✅ COMPLIANT |
| platform-jobs: Jobs gateway port and board | Board lists openings | `mock-gateways.spec.ts` Jobs suite (pre-existing) | ✅ COMPLIANT |
| platform-jobs | Detail resolves one opening | `mock-gateways.spec.ts > resolves one opening by id…` | ✅ COMPLIANT |
| platform-jobs | Unknown id is handled | same test (`unknown → null`) | ✅ COMPLIANT |
| platform-jobs | Jobs port proves swappability | `ports.spec.ts > swaps the jobs adapter…` | ✅ COMPLIANT |
| platform-jobs: Applications flow | Apply creates an application | `mock-gateways.spec.ts > creates applications as pending…` (pre-existing) | ✅ COMPLIANT |
| platform-jobs | Application status is tracked | `mock-gateways.spec.ts > seeds an application with a non-default status…` | ✅ COMPLIANT |
| platform-jobs | Filter by applicant | `mock-gateways.spec.ts > filters by applicantId…` + AND + empty | ✅ COMPLIANT |
| platform-jobs | Applications port proves swappability | `ports.spec.ts > swaps the applications adapter…` | ✅ COMPLIANT |
| delivery-evidence: TDD cycle evidence | TDD evidence complete/traceable (1.1–3.7) | `apply-progress.md` 22-row × 8-col table; archive tasks 1.1–3.7 all `[x]` | ✅ COMPLIANT |
| delivery-evidence | #848 NOT mutated | `mem_get_observation(848)` intact; WU6 commit docs-only | ✅ COMPLIANT |

**Compliance summary**: 22/22 scenarios compliant.

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|-------------|--------|-------|
| WU1 hydration comment | ✅ Implemented | `app.config.ts` comment matches design text verbatim; states zero HTTP + transfer cache default. |
| WU1 zero-HTTP test | ✅ Implemented | `bootstrapPlatform(harness,url)` helper, `/plataforma/login` + `/plataforma/registro`, `provideHttpClientTesting()` after `provideHttpClient()`. |
| WU2 leak scan | ✅ Implemented | `findPlatformArtifacts(root)` recurses dirs+files, `/plataforma/i` on repo-relative path; section 6 over `DIST_ROOT`; PASS line extended. |
| WU2 gate wiring | ✅ Implemented | `verify:prerender` script added; `gate` appends it after `ng build`. |
| WU3 DI swaps | ✅ Implemented | 5 `it` blocks; each `overrideProvider + toBe(custom) + sentinel method`. |
| WU4 admin guard | ✅ Implemented | Guard is **first** in `register` (before duplicate-email), exact message `Rol no permitido para el registro`. |
| WU4 SessionService | ✅ Unchanged | Error bubbles; test pins null user + null storage. |
| WU5 applicantId | ✅ Implemented | Additive `applicantId?: string`; AND-combined predicate identical in style to `jobId`/`status`. |
| WU6 evidence | ✅ Implemented | 22 rows (1.1–1.9, 2.1–2.6, 3.1–3.7), 8 columns. |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| W2 comment = zero-HTTP because mocked, cache still enabled | ✅ Yes | Verbatim design text. |
| W2 test home = extend `app.config.spec.ts` | ✅ Yes | No new spec file. |
| W3 integration = extend `verify-prerender.ts` **and** wire into `gate` | ✅ Yes | Wiring was genuinely missing before; now present. |
| W4 shape = one `it` per port (no table helper) | ✅ Yes | 4 explicit blocks mirror FEED. |
| W5 boundary = guard in `MockAuthGateway.register`, `SessionService` untouched | ✅ Yes | Confirmed by mutation probe (service test fails only when guard removed). |
| W5 error message exact | ✅ Yes | `Rol no permitido para el registro`. |
| W6 filter = additive type + AND predicates | ✅ Yes | No `jobId`/`status` regression (pre-existing tests green). |
| W7 location = this change's apply-progress, #848 untouched | ✅ Yes | Verified. |

**Design deviations**: None.

## TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Two tables in `apply-progress.md` (backfill 1.1–3.7; this-change WU1–WU6). |
| All tasks have tests | ✅ | 6/6 WUs; WU2 = build-gate seed proof, WU6 = docs (both design-accepted). |
| RED confirmed (tests exist) | ✅ | Probe/mutation re-proved RED for WU1 (1 pending), WU3 (swap), WU4 (admin×2), WU5 (applicantId×3). |
| GREEN confirmed (tests pass) | ✅ | Full suite 493/493 on HEAD; gate exit 0. |
| Triangulation adequate | ✅ | WU1 two URLs; WU4 accept-company + reject-admin; WU5 AND + empty-page. |
| Safety Net for modified files | ✅ | 482→493 baseline tracked per WU; all files tracked (modified, not new). |

**TDD Compliance**: 6/6 checks passed. WU1/WU3 RED is honestly characterized as probe/mutation-based (behavior pre-existed) — re-proved by my probes, not trusted from the report.

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | majority | e.g. `ports.spec.ts`, `mock-gateways.spec.ts`, `session.service.spec.ts` | vitest 4 (`@angular/build:unit-test`, jsdom) |
| Integration | several | `app.config.spec.ts` (RouterTestingHarness), `registro.page.spec.ts` | Angular TestBed + vitest |
| E2E | 0 | — | not installed (build-gate script covers WU2) |
| Build-gate | 1 script | `scripts/verify-prerender.ts` | bun |
| **Total** | **493** | **56** | |

### Changed File Coverage

Coverage tool not detected in cached capabilities → **skipped** (informational, not a failure). All changed files are directly exercised by the passing specs mutation-probed above.

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| — | — | — | None found | — |

**Assertion quality**: ✅ All assertions verify real behavior. No tautologies, no ghost loops, no smoke-only tests. Empty-collection assertions (WU5 empty page, WU3 empty list) have companion non-empty assertions with the same setup (`['app-1']`, `['app-2']`). `toBe(custom)` identity assertions are each combined with a value assertion (sentinel method result).

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. **WU2 has no vitest unit test** — `verify-prerender.ts` is a top-level side-effecting script verified only by the seeded-leak proof + gate wiring. Explicitly accepted in `design.md`/`tasks.md`. Regression safety now depends on the gate staying wired; a future gate refactor could silently drop it.
2. **WU1/WU3 RED is characterization (probe/mutation) rather than test-first** — the zero-HTTP and swap behaviors pre-existed; RED was manufactured by a probe/removed override. Honestly disclosed in apply-progress and independently re-proved here. Meets the letter of the spec (covering tests exist and fail without the behavior) but not strict test-first history.

**SUGGESTION**:
1. `applicantId` filter is additive and currently unused by the UI (demo/privacy completeness); consider wiring it to the session once a real session provides the applicant id.
2. Add a documented single-file test invocation (e.g. build `@angular/build:unit-test` include/filter) to speed strict-TDD RED/GREEN loops; currently every probe needed a full 56-file run.

## Exact Commands Run

```text
bun run gate                                   # GATE_EXIT=0
bunx ng test --watch=false                     # 493 passed / 56 files (after WU1 probe: 492/1 fail)
bun scripts/verify-prerender.ts                # exit 0 clean; exit 1 with seeded leak (2 hits)
VERIFY_PRERENDER_DIST=/tmp/leaktest/browser bun scripts/verify-prerender.ts   # root-agnostic proof
git diff contracts/                            # empty
git show --name-only b46cb25 7f6a81f aaf9ea8 a62f636 00555ec 6e05f10   # none touch contracts/
git diff --shortstat 67cef06 6e05f10           # 343 insertions, 6 deletions (226 code/tests + 123 docs)
git checkout -- <probed files>                 # revert all probes; tree clean
```
