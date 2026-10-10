# Exploration: p2-warnings-closure

## Context

The change `p2-platform-foundation` is archived (2026-10-09, commit 67cef06) with final gate **482 tests / 56 files, 21 prerendered routes, no `dist/browser/plataforma`**. The archived verify-report lists 6 non-blocking warnings (W2–W7) that are coverage/completeness gaps, not spec violations. The task is to ground each in real code (paths, symbols, line numbers) and recommend slice/commit structure.

## Current State by Warning

### W2 — Zero-HTTP hydration on /plataforma not tested; in-code hydration comment inaccurate

**Location references:**
- `src/app/app.config.ts` lines 20–24: `provideClientHydration()` call with comment "Attaches to the prerendered DOM instead of re-rendering it..." and says "Plain, no transfer cache: the app performs zero HTTP at bootstrap and all content is bundled." (lines 21–23). The comment claims "no transfer cache" but Angular's `provideClientHydration()` by default enables HTTP transfer cache; zero HTTP during platform bootstrap is true here because the platform pages perform no HTTP requests on init (all data comes from mocked gateways/stores populated from in-memory fixtures). The verify-report calls the comment misleading but inert (no HTTP at bootstrap).
- `app.config.spec.ts` (lines 1–76) exercises app initialization; it does not assert zero HTTP for platform routes.
- The verify-report explicitly states: "Hydration — platform hydrates with zero HTTP. **UNTESTED** — No test asserts zero HTTP during platform bootstrap." (verify-report server-rendering table + WARNING #2). It also notes the comment inaccuracy.

**Concrete evidence of zero-HTTP behavior (by design):**
- Platform routes are lazy-loaded; pages/components inject gateways/stores that use mock implementations (no `HttpClient` calls at bootstrap). Examples: `SessionService` reads from `localStorage` only (storage() helper, no HTTP). `FeedStore`/`JobsStore` call gateway methods (mocks, in-memory) — tests show async paint via signals. `LoginPage`/`RegistroPage`/`PerfilPage` call `SessionService` methods; SessionService's own test (session.service.spec.ts lines 94–103) verifies "issues no HTTP request for any auth action" using `HttpTestingController`.
- The platform subtree is client-rendered (`{ path: '${PLATFORM_PREFIX}/**', renderMode: RenderMode.Client }` in `app.routes.server.ts` line 44), no prerendering of platform HTML.

**What to test/fix:**
- Bootstrap-level test asserting zero HTTP during platform navigation/bootstrap (could be an integration test that navigates to `/plataforma/login` with `HttpTestingController` and expects no pending requests). This aligns with the verify-report suggestion: "Add a bootstrap test asserting zero HTTP for the platform subtree, and correct the `provideClientHydration()` comment in `app.config.ts`."
- Comment: `app.config.ts:23` "no transfer cache" is inaccurate as stated; clarify that while no HTTP is issued at platform bootstrap (mocked data), `provideClientHydration()` keeps transfer cache enabled by default.

### W3 — No automated/gate scan that `dist/browser/plataforma` is absent

**Location references:**
- `package.json` line 14: `gate` script — currently `bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build` (no scan step). The manual verification was `find dist -iname '*plataforma*'` → empty (verify-report line 44, 92, 190).
- `scripts/verify-prerender.ts` exists (268 LOC) as the post-build prerender assertions script from p1-ssr-prerender (verifies routes, head, CSR fallback, no localhost, server.ts absent). It does **not** currently scan for `plataforma` directory in `dist/browser`. Looking at the script: it walks `dist/browser` for prerendered routes and checks heads; it does not assert that directories matching `plataforma` are absent.
- `angular.json` output is `dist/browser` (p1-ssr-prerender/angular.json). Build in gate runs `bunx ng build` (static prerendered output).
- Tasks for p2-platform-foundation S1a task 1.9 explicitly said "assert `dist/browser/plataforma` absent" in gate notes, but the actual `gate` script in package.json as archived is the 5-step chain above — the automated scan step was not added to the committed gate script (or was left as manual). Verify-report W3 states the gap clearly.

**Recommendation:** add an automated scan (e.g. in gate or extend verify-prerender.ts) to fail if any `*plataforma*` appears under `dist/browser` (or specifically `dist/**/browser/plataforma`). The script should be robust to Angular's output subdir (`dist/<project>/browser` as handled in verify-prerender.ts line 33–46).

### W4 — Adapter-swappable proven only for the Feed port

**Location references:**
- `src/app/core/platform/api/ports.ts`: defines 5 token ports — `FEED_GATEWAY` (line 91), `JOBS_GATEWAY` (96), `APPLICATIONS_GATEWAY` (101), `AUTH_GATEWAY` (109), `PROFILES_GATEWAY` (114). Each factory returns a mock implementation.
- `src/app/core/platform/api/ports.spec.ts` lines 13–73: first test injects all 5 and checks method presence (lines 18–42). Second test (lines 44–72) swaps `FEED_GATEWAY` with a custom adapter and verifies swappability — **only Feed**. No swap tests for auth/profiles/jobs/applications.
- `src/app/core/platform/api/mock-gateways.spec.ts` tests behavior of all mocks (lines 13–189). Does not test DI swap.
- The verify-report states: "Adapter-swappable proven only for the Feed port. `ports.spec.ts` swaps `FEED_GATEWAY`; auth/profiles token swap is not exercised..." (WARNING #4).

**Assessment:** DI pattern is identical across all 5 ports (same `InjectionToken` with `providedIn:'root'` + factory returning mock). The scope to add swap tests per port is small and low risk; each is a copy of the Feed swap test asserting a custom implementation resolves. This is genuinely separable and ~5–15 lines per additional swap assertion.

### W5 — Role restriction is UI-only; programmatic `register` accepts any `Role`

**Location references:**
- Domain: `src/app/core/platform/domain/models.ts` line 13 defines `Role = 'worker' | 'company' | 'admin'`.
- OpenAPI: `contracts/openapi.yaml` line 39–45 shows `Role` enum includes `worker`, `company`, `admin` (lines 41–44). Also operation `register` description at line 383 says "(admin role cannot be self-assigned)". The schema for register request body references `#/components/schemas/Role` at line 401; the schema itself includes `admin`.
- Registration UI: `src/app/pages/plataforma/registro.page.ts` lines 12–15 defines `SELF_SERVICE_ROLES` as `worker, company` only; template renders those options (lines 71–74). The page's spec `registro.page.spec.ts:45-52` asserts "offers only the self-service roles, never admin".
- Session/service layer: `src/app/core/platform/auth/session.service.ts:83-88` calls `this.auth.register(input)` and constructs `user: User = { userId: registered.userId, email: input.email, role: input.role }` from the input (line 85) — it does **not** filter/restrict the role. It passes through whatever `RegisterInput` contains.
- Auth gateway (mock): `src/app/core/platform/api/mock-auth.gateway.ts:27-39` stores and returns `user.role = input.role` (line 34). No validation rejecting `admin` on register.
- `SessionService` spec covers registration behavior (session.service.spec.ts:79-92) but does not test admin case.

**What "server-side / service-level role guard" means here:** There is no real backend; the "server" boundary in this mock/demo system is the gateway/service layer. The verify-report notes W5 as defense-in-depth gap: form restricts to worker|company, but programmatic `register()` accepts any `Role`. Suggested action is to add a server-side/service-level role guard (so even if called programmatically, registration rejects or normalizes roles to exclude `admin`).

**Semantic choice (decision needed):** Given it's mock-only/demo, the guard could be in `MockAuthGateway.register` (treating gateway as server boundary) or in `SessionService.register` (application service). The verify-report says "registration `role` enum must exclude `admin` (UI already restricts to worker|company — keep it that way server-side too)" — this points to enforcing the constraint at the boundary that would exist server-side. For the mock gateways, adding validation there is clean. Also need to decide behavior on violation (throw error consistent with existing error messages style? e.g. 'Rol no permitido para registro' in Spanish or similar to existing messages like 'Ya existe una cuenta con ese email').

### W6 — `MockApplicationsGateway.list` filters by `jobId` only, not `applicantId`

**Location references:**
- `src/app/core/platform/api/mock-applications.gateway.ts` lines 24–31: `list(filter: ApplicationsFilter = {})` filters by `jobId` and `status` only; no `applicantId` filter. `ApplicationsFilter` is defined in `ports.ts` lines 55–58 as `{ jobId?, status? }`.
- OpenAPI: `GET /applications` supports query params `jobId` and `status` (seen in openapi.yaml around applications endpoints; filter shape matches). The domain `Application` has `applicantId` (models.ts line 107). There is no `applicantId` query param in the current contract for listing applications? Let us look: grep for applicantId in openapi around list operations — the schema has `applicantId` as required in Application (line ~in schema), but the list/filter params? Not obvious from the earlier grep; but the code's filter type matches what the mock implements (jobId, status). The verify-report says "MockApplicationsGateway.list has no `applicantId` filter" and calls it a demo-level gap (privacy). Adding filtering by `applicantId` is a small change to the mock's filter logic and potentially to `ApplicationsFilter` type if needed.

**Scope:** Modify `mock-applications.gateway.ts` to also filter by `filter.applicantId` when provided. Also update `ApplicationsFilter` in ports.ts if the contract/domain allow it (but we must not change contract unless specified; check if applicantId filtering is implied). The warning is a completeness gap in the mock implementation for privacy/demo scenarios; implementation is straightforward.

### W7 — TDD cycle evidence table omits tasks 1.1–3.7 (S1a/S1b/S2)

**Location references:**
- Archived `apply-progress.md` (obs #848) contains "TDD Cycle Evidence" table starting around line ~220 in the retrieved content. The table lists tasks 4.1–6.5 and S6, but not 1.1–3.7. The verify-report WARNING #7 confirms this: "TDD cycle evidence table omits tasks 1.1–3.7 (S1a/S1b/S2)". Evidence exists in session summaries/task checkboxes but not in the per-task cycle table format.
- Tasks.md shows S1a/S1b/S2 tasks 1.1–3.7 are all checked `[x]` with gates passed.
- The archived apply-progress has a per-slice checklist (lines ~40–90 in the retrieved apply-progress) and then the TDD Cycle Evidence table starting with task 4.1.

**What needs to be done:** Backfill the TDD cycle evidence table for tasks 1.1–3.7 with columns (Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, REFACTOR). This is documentation/backfill work in the archived artifact context? But we're creating a new change `p2-warnings-closure` to "close" these warnings. So for W7, the action is to add the missing evidence entries (likely by updating the apply-progress or creating appropriate artifacts for this change). But the task says "produce the exploration artifact" and investigate — we need to identify what files contain the evidence table and what tasks map to.

Looking at how apply-progress is structured: it's an Engram artifact (#848) and also exists as a file? No — apply-progress is stored in Engram (the archive-report lists it as "Engram only — no file in change folder" at line 28). So backfilling W7 means updating/adding that Engram artifact or creating documentation as part of this change. But the exploration artifact is what we're writing now.

## Scope Assessment — Separable work units?

**W2 (comment fix + bootstrap zero-HTTP test):** Small. Fix comment in `app.config.ts` (1–3 lines). Add a new spec or extend existing — e.g. add a test in `app.config.spec.ts` or create a new test that navigates to platform route with `HttpTestingController` and asserts no pending requests. Estimated ~20–40 changed lines (comment + test). Low coupling.

**W3 (automated dist scan):** Two possible approaches: add a step to `gate` script in `package.json`, OR extend `scripts/verify-prerender.ts` to scan for `plataforma` under `dist`. Extending verify-prerender.ts is cleaner (reuses existing dist-root resolution logic). Adds ~10–30 lines to verify-prerender.ts. Also could modify package.json gate to append `bun scripts/verify-prerender.ts` style check? Or just extend the script. Estimated <30 lines. Low coupling.

**W4 (adapter swap tests):** Add swap tests for AUTH_GATEWAY, JOBS_GATEWAY, APPLICATIONS_GATEWAY, PROFILES_GATEWAY in `ports.spec.ts` — 4 additional "it" blocks mirroring lines 44–72. Each ~25 lines, total ~100 lines. Pure test additions, no production changes. Low coupling, highly separable.

**W5 (service-level role guard):** Need to decide placement. Best at gateway boundary (MockAuthGateway) to mirror "server-side" validation. Modify `mock-auth.gateway.ts` register() to reject `admin` (throw). Also potentially update SessionService? Or just gateway. Also maybe update RegisterInput type or add validation. Contract says Role enum includes admin; the constraint is "admin cannot be self-assigned" — so register must reject admin. That’s a behavioral change. Need to add tests too (e.g. in mock-gateways.spec.ts or session.service.spec.ts). Estimated ~30–60 production lines + ~20–40 test lines = ~60–100 lines. Moderate coupling (affects register flow). Clear work unit.

**W6 (applicantId filtering):** Modify `mock-applications.gateway.ts` list() to filter by `applicantId`. Also update `ApplicationsFilter` in ports.ts to include `applicantId?` (type only, no runtime impact). Add test case in `mock-gateways.spec.ts` ApplicationsGateway section. Estimated ~15–25 lines. Low coupling.

**W7 (TDD evidence backfill):** Documentation artifact update. If stored as Engram observation (#848), we need to update it via `mem_update` or create a new observation. If we were doing the full apply/archive cycle for this change, we'd produce artifacts. But exploration phase — we just need to plan. This is more of a documentation/metadata fix than code. Estimated 0–20 lines of structured content added. Separable.

## Recommended Split vs Single Change

All warnings are small, independent gaps. However, they touch different areas (hydration, build gates, DI, auth validation, mock filtering, documentation). With the chained-PR/work-unit-commits rules (review budget 400 lines, split if >400), and the fact that these are distinct concerns, the cleanest approach is **multiple work units** — but as a single SDD change `p2-warnings-closure`, we can break into slices.

Suggested slice breakdown (each is a coherent work unit, tests with code per work-unit-commits):
- **Slice 1 (W2)**: Comment correction + zero-HTTP bootstrap test. (~40 LOC max)
- **Slice 2 (W3)**: Dist scan automation (extend verify-prerender.ts + possibly gate). (~30 LOC max)  
- **Slice 3 (W4)**: Adapter swap tests for all gateways (ports.spec.ts). (~100 LOC, tests only)
- **Slice 4 (W5)**: Service-level role guard for admin on register. (~80 LOC prod+test)
- **Slice 5 (W6)**: applicantId filtering in applications mock. (~25 LOC)
- **Slice 6 (W7)**: TDD evidence backfill (documentation). (~20 LOC structured)

Total ~295 LOC, well under 400. These could be done as 6 sequential commits in one change (or grouped), but better as separate work units. Since chained-PR budget is 400 and risk is Low/Medium, a single PR/change with 6 commits is fine. No slice exceeds ~100 lines. No hidden coupling detected.

**Recommendation:** One SDD change `p2-warnings-closure` with 6 work units (commits). Do not split into separate changes — they are all closing the same batch of carried warnings from the previous archived change. Follow work-unit-commits: each commit is a deliverable behavior/fix/test addition with its own verification.

## Risks and Unknowns

- **W5 behavior on violation:** Need to choose error message and whether to throw synchronously. Existing register throws on duplicate email with Spanish message 'Ya existe una cuenta con ese email' (mock-auth.gateway.ts:29). Consistent to throw 'Rol no permitido para registro' or similar. Also SessionService.register doesn't catch — bubbles up; UI already shows error via try/catch (registro.page.ts:131-133). Risk: changing behavior could affect any code calling register programmatically (but only test/demo code exists).
- **W2 test placement:** Need to ensure we don't create HTTP calls; use `HttpTestingController` and navigate to platform route. Also platform is client-rendered — hydration happens on client. Test should run in browser-like test environment (Jasmine/Vitest with TestBed as existing tests do).
- **W3 script robustness:** verify-prerender.ts already handles Angular 22 output paths with subdir detection (dist/<project>/browser). Adding the check there is good; also consider checking for `plataforma` as directory name.
- **Contract vs implementation (W6):** ApplicationsFilter type change is additive (optional field). No OpenAPI change needed per warning description — warning is just about mock implementation. Keep contract unchanged.
- **W7 Engram update:** Need to call `mem_update` with observation #848? Or better, save new apply-progress/notes for this change. Since we're in explore phase creating artifacts for `p2-warnings-closure`, W7 might be addressed by documenting evidence in this change's artifacts rather than modifying archived ones. Need to clarify intent — "backfill the evidence table" suggests updating the historical record; but better to be precise.

## Ready for Proposal?

**Yes.** All warnings are grounded in concrete code locations with line numbers. Scope is small and separable. No major unknowns blocking proposal/spec. The only minor decision is W5 error message/placement (gateway vs service) — can be decided in design/spec phase.

## Executive Summary

Investigation of W2–W7 against the actual codebase confirms they are discrete gaps: (W2) hydration comment inaccuracy + missing zero-HTTP bootstrap test; (W3) missing automated dist/platform-leak scan in gate/verify-prerender; (W4) only Feed port has swap test; (W5) register accepts any Role (UI-only restriction); (W6) MockApplicationsGateway.list lacks applicantId filter; (W7) TDD evidence table missing for S1a/S1b/S2. All are <100 LOC per work unit, total ~295 LOC. Recommend **one SDD change `p2-warnings-closure` with 6 sequential work units** (commits). Low coupling, low risk. Ready to proceed to proposal/spec.
