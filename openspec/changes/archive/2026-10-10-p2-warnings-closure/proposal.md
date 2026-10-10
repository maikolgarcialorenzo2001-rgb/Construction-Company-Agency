# Proposal: p2-warnings-closure

## Intent (WHAT/WHY)

The goal of `p2-warnings-closure` is to close the 6 carried non-blocking warnings (W2–W7) from the archived `p2-platform-foundation` change (commit 67cef06) so the frontend platform has no outstanding coverage/completeness debt. These warnings are coverage/completeness gaps (not spec violations) and were explicitly listed in the archived verify-report.

- **WHAT**: Address W2–W7 with minimal, testable changes across hydration bootstrap testing, build-gate scanning, adapter swap test coverage, mock auth validation, mock applications filtering, and TDD evidence backfill.
- **WHY**: The archived `p2-platform-foundation` left residual warnings that should be closed to maintain a clean platform baseline (zero-HTTP platform bootstrap tested, leak scan automated in gate, all adapter ports prove swappability, self-service role constraint enforced at boundary, mock gateways complete for demo/privacy, and TDD evidence fully captured).

## Evidence Base

Grounded in `openspec/changes/p2-warnings-closure/explore.md` with concrete paths/symbols:
- W2: `src/app/app.config.ts` (lines 20–24, comment inaccuracy), `app.config.spec.ts` (bootstrap tests), zero-HTTP by design (SessionService no HTTP, mock gateways in-memory; platform client-rendered in `app.routes.server.ts:44`).
- W3: `package.json` gate (no scan), `scripts/verify-prerender.ts` (268 LOC, does not scan for `dist/browser/plataforma`).
- W4: `src/app/core/platform/api/ports.ts` (FEED/JOBS/APPLICATIONS/AUTH/PROFILES tokens), `ports.spec.ts` swaps only `FEED_GATEWAY` (lines 44–72).
- W5: `models.ts:13` Role includes `admin`; OpenAPI `contracts/openapi.yaml` Role includes `admin` and register description states "(admin role cannot be self-assigned)"; `registro.page.ts` restricts to `worker|company`; `SessionService.register` passes through role; `mock-auth.gateway.ts` stores input.role without validation.
- W6: `mock-applications.gateway.ts` lists jobId/status only (lines 24–31); `ApplicationsFilter` in `ports.ts:55-58` has jobId/status only.
- W7: Archived apply-progress (Engram obs #848) TDD Cycle Evidence table omits tasks 1.1–3.7 (S1a/S1b/S2); tasks are marked [x] in Tasks.md.

## Scope (In/Out)

**In scope:**
- W2: Fix the hydration comment in `src/app/app.config.ts` to accurately reflect zero-HTTP platform bootstrap and that `provideClientHydration()` transfer cache behavior is as configured; add a bootstrap-level test asserting zero HTTP during platform bootstrap (e.g. navigate to `/plataforma/login` with `HttpTestingController` and assert no pending requests). Update `app.config.spec.ts` or add a focused spec consistent with existing TestBed/Jasmine setup.
- W3: Add automated scan to detect `dist/browser/plataforma` (or any `*plataforma*` under `dist/browser`, robust to `dist/<project>/browser` as in `verify-prerender.ts`). Implement by extending `scripts/verify-prerender.ts` (preferred, reuses dist-root resolution) and/or ensure the `gate` script in `package.json` runs it. The scan must fail the build if detected.
- W4: Add adapter swap tests for `AUTH_GATEWAY`, `JOBS_GATEWAY`, `APPLICATIONS_GATEWAY`, `PROFILES_GATEWAY` in `src/app/core/platform/api/ports.spec.ts`, mirroring the existing `FEED_GATEWAY` swap test (assert custom adapter resolves via DI).
- W5: Enforce self-service role constraint at the mock gateway boundary (MockAuthGateway). Reject `admin` on `register` (throw with clear message). Keep `Role` enum unchanged. UI remains `worker|company`. Contract `contracts/openapi.yaml` unchanged.
- W6: Add `applicantId` filtering to `src/app/core/platform/api/mock-applications.gateway.ts#list(filter)` and extend `ApplicationsFilter` in `ports.ts` to include optional `applicantId?`. Add corresponding test in `mock-gateways.spec.ts` (ApplicationsGateway section).
- W7: Backfill TDD cycle evidence table for tasks 1.1–3.7 (S1a/S1b/S2) in THIS change's apply-progress artifact (documentation backfill). Do **not** mutate the archived Engram observation (#848). Capture evidence with columns (Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, REFACTOR).

**Out of scope:**
- Any change to `contracts/openapi.yaml`.
- The real Go backend (separate track).
- Any new product feature.

## Decisions

- **W5 placement/semantics**: Enforce the self-service role constraint at the mock gateway boundary (`MockAuthGateway.register`) to mirror the future server boundary. On `register`, if `input.role === 'admin'` reject (throw). This bars self-assignment of `admin` while keeping `Role` enum unchanged and matching the OpenAPI `register` description "(admin role cannot be self-assigned)". Error message should follow existing style (Spanish, e.g. "Rol no permitido para registro" or consistent with existing messages like "Ya existe una cuenta con ese email").
- **W7 artifact location**: The TDD evidence table backfill will live in THIS change’s apply-progress artifact (documentation backfill), not by mutating the archived Engram observation (#848). This preserves the historical archive and records closure evidence for `p2-warnings-closure`.

## Approach

- Single SDD change `p2-warnings-closure` with **6 sequential work units** (commits), each a coherent deliverable (tests with code per work-unit-commits).
- Strict TDD where applicable (RED/GREEN/REFACTOR). Tests added alongside behavior changes (W2 bootstrap test, W5 validation tests, W6 filter test, W4 swap tests).
- BUN only (no npm/yarn/pnpm). Use `bun test`, `bun run gate`, etc. as per project standards.
- Commit tag `(p2-warnings-closure)` on each commit message.
- Total estimated LOC ~295 (< 400). No slice > ~100 lines; low coupling.
- Evidence-based against exploration; minimal, surgical changes.

## Slice/Commit Plan (6 work units, sequential)

1. **WU1 - W2: Hydration comment fix + zero-HTTP bootstrap test** (est ~40 LOC)
- Files: `src/app/app.config.ts`, `src/app/app.config.spec.ts` (or new focused spec)
- Changes: Correct comment to accurately reflect zero-HTTP platform bootstrap; add bootstrap test with `HttpTestingController` asserting no pending requests on platform navigation/bootstrap.
- Acceptance: Comment updated; test passes; zero HTTP asserted.

2. **WU2 - W3: Automated dist/platform-leak scan** (est ~30 LOC)
- Files: `scripts/verify-prerender.ts`, optionally `package.json` (gate) 
- Changes: Extend verify-prerender.ts to scan `dist/browser` (robust to `dist/<project>/browser`) and fail if any `*plataforma*` found. If not already invoked, ensure gate runs it (gate is `bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build` currently; can append script call). Prefer extending existing script.
- Acceptance: Scan fails if `dist/browser/plataforma` exists; passes in clean build.

3. **WU3 - W4: Adapter swap tests for all gateways** (est ~100 LOC, tests only)
- Files: `src/app/core/platform/api/ports.spec.ts`
- Changes: Add swap tests for AUTH_GATEWAY, JOBS_GATEWAY, APPLICATIONS_GATEWAY, PROFILES_GATEWAY mirroring FEED swap.
- Acceptance: All 5 ports prove swappability via DI.

4. **WU4 - W5: Service-level role guard (admin on register)** (est ~60–80 LOC prod+test)
- Files: `src/app/core/platform/api/mock-auth.gateway.ts`, `src/app/core/platform/api/mock-gateways.spec.ts` (and/or `src/app/core/platform/auth/session.service.spec.ts` if needed)
- Changes: MockAuthGateway.register rejects `admin` (throw). Add tests covering rejection and preserving allowed roles (worker/company). Role enum unchanged; UI unchanged.
- Acceptance: Programmatic register rejects `admin`; allowed roles still work; existing tests unaffected where behavior consistent.

5. **WU5 - W6: applicantId filtering in applications mock** (est ~15–25 LOC)
- Files: `src/app/core/platform/api/ports.ts`, `src/app/core/platform/api/mock-applications.gateway.ts`, `src/app/core/platform/api/mock-gateways.spec.ts`
- Changes: Add optional `applicantId?` to `ApplicationsFilter`; filter by applicantId in list(); add test case.
- Acceptance: Filtering by applicantId works; existing behavior unchanged.

6. **WU6 - W7: TDD evidence backfill (this change's apply-progress artifact)** (est ~15–25 LOC structured)
- Files: This change’s apply-progress artifact (new/updated documentation for `p2-warnings-closure`, not archived Engram obs #848)
- Changes: Backfill TDD Cycle Evidence table for tasks 1.1–3.7 (S1a/S1b/S2) with (Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, REFACTOR). Include references to existing evidence (session summaries/tasks) without mutating archived artifacts.
- Acceptance: Evidence table complete for 1.1–3.7; traceable to existing artifacts.

## Verification Plan

- Run BUN gate locally: `bun run gate` (contract lint/check, ng lint, ng test --watch=false, ng build). Also run verify-prerender.ts post-build.
- Ensure no changes to `contracts/openapi.yaml`.
- All new/updated tests pass with strict TDD where applied.
- Dist scan passes on clean build; would fail if leak introduced.
- Zero-HTTP bootstrap test uses HttpTestingController and asserts no pending requests.

## Risks

- **W5 behavior**: Throwing on `admin` register changes behavior for programmatic callers (test/demo only). Mitigate with clear Spanish error message consistent with existing style and add tests.
- **W2 test placement**: Platform is client-rendered; hydration is client-side. Use TestBed + HttpTestingController and navigate to platform route; avoid creating real HTTP calls.
- **W3 robustness**: Extend verify-prerender.ts (not duplicate logic). Handle Angular 22 output paths (`dist/<project>/browser`).
- **W6 type additive**: `ApplicationsFilter.applicantId?` is additive; no contract/runtime impact.
- **W7 artifact boundary**: Do not mutate archived Engram obs #848; write evidence into this change’s apply-progress artifact only.

## Next Recommended

Proceed to **spec** phase (`sdd-spec`) for `p2-warnings-closure` to produce delta specs (if any) and detailed acceptance criteria per work unit, then **tasks** to generate concrete task list, then **apply** with sequential commits per WU1–WU6 using tag `(p2-warnings-closure)`.