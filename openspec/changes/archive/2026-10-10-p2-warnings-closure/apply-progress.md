# Apply Progress: p2-warnings-closure

**APPLY STATUS: COMPLETE** — 6/6 work units implemented and committed on `main`; full gate GREEN EXIT=0 (493 tests / 56 files, 21 prerendered routes, `no plataforma leak`).

Mode: STRICT TDD (strict-tdd.md). Delivery: `ask-on-risk` → resolved by orchestrator as **single change under budget** (no `size:exception`, no chained-PR split). Chain strategy: `stacked-to-main`, realized as 6 sequential work-unit commits on `main` (solo repo, no branches/PRs/pushes). Every commit message ends with `(p2-warnings-closure)`. Canonical test runner: `bunx ng test --watch=false`; full gate: `bun run gate`.

BUN only throughout (no npm/npx/yarn); `contracts/openapi.yaml` untouched; archived Engram obs #848 NOT mutated.

## Per-Work-Unit Status

| WU | Scope (warning) | Commit | Status |
|----|-----------------|--------|--------|
| WU1 | W2: hydration comment + zero-HTTP bootstrap test | `b46cb25` | ✅ complete |
| WU2 | W3: `*plataforma*` leak scan + gate wiring | `7f6a81f` | ✅ complete |
| WU3 | W4: DI swap tests for AUTH/JOBS/APPLICATIONS/PROFILES ports | `aaf9ea8` | ✅ complete |
| WU4 | W5: `admin` role guard in `MockAuthGateway.register` | `a62f636` | ✅ complete |
| WU5 | W6: `applicantId` filtering in `MockApplicationsGateway.list` | `00555ec` | ✅ complete |
| WU6 | W7: TDD evidence backfill for tasks 1.1–3.7 | this file's commit | ✅ complete |

## Per-Work-Unit Gate Results

| WU | `bunx ng test --watch=false` | `bunx ng lint` | Build / scan | Notes |
|----|------------------------------|----------------|--------------|-------|
| WU1 | 483 passed (482 baseline + 1) | clean | — | RED via `/__probe__` probe: `Expected no open requests, found 1` → probe removed → GREEN. TRIANGULATE: `/plataforma/login` + `/plataforma/registro` through `bootstrapPlatform()` helper. |
| WU2 | — (script-level TDD) | — | Seeded-leak RED: script **exit 0** with leak present (undetected). GREEN: **exit 1** naming `dist\…\browser\plataforma` AND `…\plataforma\index.html` (2 hits). Clean run **exit 0** + `· no plataforma leak`. | `verify:prerender` script added; `gate` now appends `&& bun run verify:prerender` (gate previously never ran the script — wiring was part of the fix). |
| WU3 | 487 passed (483 + 4) | clean | — | RED = stubs + `expect(injected).toBe(custom)` **without** `overrideProvider` → 4 failed. GREEN = added the 4 `TestBed.overrideProvider` lines → 6/6 in file. |
| WU4 | 490 passed (487 + 3) | clean | — | RED = 2 admin-reject tests failed before guard (register resolved instead of rejecting). GREEN = 3-line guard placed FIRST in `register` (before duplicate-email check). TRIANGULATE: `company` register succeeds through `me()`. |
| WU5 | 493 passed (490 + 3) | clean | — | RED = TS2353 compile error (`applicantId` does not exist in `ApplicationsFilter`). GREEN = additive type + AND predicate. TRIANGULATE: AND semantics (both/none) + empty page. |
| WU6 | 493 (docs only, unchanged) | clean | — | Documentation only; triangulation skipped (documentation). |

Total changed lines (WU1–WU5 code/tests): 35 + 32 + 87 + 40 + 32 = **226**; plus WU6 docs ≈ 120 → **≈ 346**, under the 400-line budget.

## TDD Cycle Evidence (backfill: tasks 1.1–3.7, S1a/S1b/S2)

Backfill of the archived `p2-platform-foundation` foundation tasks. Cells cite the archived evidence (archived `tasks.md` checkboxes and archived apply-progress, Engram obs #848 per-slice rows) — the archive itself is NOT copied or mutated.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `app.server-routes.shared.spec.ts` | Unit | ✅ (archived) | ✅ Written (archived tasks.md 1.1 [x]) | ✅ Passed (#848 S1a) | ✅ exclusion + boundary `plataformas-curso` kept | ✅ `isWithinPrefix` helper |
| 1.2 | `app.server-routes.shared.ts` | Unit | ✅ (archived) | ✅ Written first (tasks.md 1.1 RED) | ✅ Passed (#848 S1a) | ✅ boundary-exact | ✅ boundary-exact prefix match |
| 1.3 | `app.routes.server.ts` | Unit | ✅ (archived) | ✅ RED from 1.1/1.4 | ✅ Passed (#848 S1a) | ✅ `plataforma/**` Client entry | ✅ `PLATFORM_PREFIX` reused |
| 1.4 | `app.routes.server.spec.ts` | Unit | ✅ (archived) | ✅ Written (tasks.md 1.4 [x]) | ✅ Passed (#848 S1a) | ✅ no Prerender path under `plataforma` + Client covers subtree | ✅ (archived) |
| 1.5 | `app.routes.spec.ts` | Integration (router table) | ✅ (archived) | ✅ Written (tasks.md 1.5 [x]) | ✅ Passed (#848 S1a) | ✅ exact paths, `plataforma` before `**`, children noindex | ✅ marketing order unchanged |
| 1.6 | `platform-paths.ts`, `nav.ts`, `app.routes.ts` | Integration | ✅ (archived) | ✅ RED from 1.5 | ✅ Passed (#848 S1a) | ✅ parent + 6 lazy children | ✅ single `PLATFORM_PREFIX` const |
| 1.7 | stub pages (plataforma) | Integration | ✅ (archived) | ✅ (lazy, OnPush, no HTTP) | ✅ Passed (#848 S1a) | ✅ 6 stub pages | ✅ lazy chunks only |
| 1.8 | `app.release-matrix.spec.ts` | Integration | ✅ (archived) | ✅ RED→GREEN (tasks.md 1.8 [x]) | ✅ Passed (#848 S1a) | ✅ platform rows `cta:false, images:0` | ✅ (archived) |
| 1.9 | gate S1a | Build gate | ✅ (archived) | — | ✅ test+lint+build, `dist/browser/plataforma` absent | — | — |
| 2.1 | `app.spec.ts` / `sticky-cta.component.spec.ts` | Integration | ✅ (archived) | ✅ Written (tasks.md 2.1 [x]) | ✅ Passed (#848 S1b) | ✅ header/footer/sticky/cta-block absent, platform-header present | ✅ `isPlatform` signal |
| 2.2 | `app.ts` + `app.html` | Integration | ✅ (archived) | ✅ RED from 2.1 | ✅ Passed (#848 S1b) | ✅ `PlatformHeaderComponent` + "Modo demo" pill | ✅ `toSignal(NavigationEnd)` |
| 2.3 | `sticky-cta.component.spec.ts` | Unit | ✅ (archived) | ✅ Written (tasks.md 2.3 [x]) | ✅ Passed (#848 S1b) | ✅ reuse boundary-exact `isPlatformPath` | ✅ (archived) |
| 2.4 | `sticky-cta.component.ts` | Unit | ✅ (archived) | ✅ RED from 2.3 | ✅ Passed (#848 S1b) | ✅ platform pages never import `app-cta-block` | ✅ (archived) |
| 2.5 | `layout/header.component.html` | Integration | ✅ (archived) | ✅ (site.nav stays marketing-only) | ✅ Passed (#848 S1b) | ✅ one static "Plataforma" link | ✅ (archived) |
| 2.6 | gate S1b | Build gate | ✅ (archived) | — | ✅ test+lint+build | — | — |
| 3.1 | `conformance.spec.ts` | Unit (compile-time) | ✅ (archived) | ✅ `@ts-expect-error AssertExtends` probe (tasks.md 3.1 [x]) | ✅ Passed (#848 S2a) | ✅ bidirectional drift probe | ✅ `AssertExtends` pure type |
| 3.2 | domain + `contract-conformance.ts` | Build (W1 closure) | ✅ (archived) | ✅ RED from 3.1 | ✅ Passed (#848 S2a: drift mutation FAILS build) | ✅ TS2353/TS1360/TS2322 drift proof | ✅ (archived) |
| 3.3 | `api/ports.ts` | Unit | ✅ (archived) | ✅ (tokens + factories) | ✅ Passed (#848 S2b) | ✅ 5 ports | ✅ `providedIn:'root'` factories |
| 3.4 | `api/mock-*.gateway.ts` + `mocks/fixtures.ts` | Unit | ✅ (archived) | ✅ (fixtures `satisfies readonly Post[]`) | ✅ Passed (#848 S2b) | ✅ `isPlaceholder:true` audit marker | ✅ (archived) |
| 3.5 | store specs (feed/jobs) | Unit (zoneless) | ✅ (archived) | ✅ Written (tasks.md 3.5 [x]) | ✅ Passed (#848 S2c: 432 tests) | ✅ async `.set()` + `detectChanges`/`whenStable` paint | ✅ signals/computed |
| 3.6 | `store/feed.store.ts`, `store/jobs.store.ts` | Unit | ✅ (archived) | ✅ RED from 3.5 | ✅ Passed (#848 S2c) | ✅ async state transitions | ✅ signal stores |
| 3.7 | gate S2 | Build gate | ✅ (archived) | — | ✅ `bun run gate` GREEN (432 tests); drift rename ⇒ build FAILS, revert ⇒ green | — | — |

## TDD Cycle Evidence (this change: WU1–WU6)

Rows use `WUn/task` labels to avoid colliding with the backfill numbering above. Evidence is first-hand from this apply run (RED run outputs quoted in the per-WU gate table).

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| WU1/1.1 | `src/app/app.config.spec.ts` | Integration (router harness + `HttpTestingController`) | ✅ 482/482 baseline | ✅ Probe-based: injected `HttpClient.get('/__probe__')` before `verify()` → `Expected no open requests, found 1` → FAIL | ✅ 483 tests | ✅ `bootstrapPlatform` helper: `/plataforma/login` AND `/plataforma/registro` | ✅ helper extracted (both navigations reuse setup) |
| WU1/1.2 | — | Integration | ✅ 482/482 | Probe removed → zero-HTTP behavior pre-exists | ✅ 483 tests (2/2 in file) | — | — |
| WU1/1.4 | `src/app/app.config.ts` (comment) | review (structural) | ✅ 483/483 | comment-only (doc) | ✅ lint clean | — | — |
| WU1/1.5 | — | gate | — | — | ✅ lint + 483 tests | — | — |
| WU2/2.1 | (seeded artifact) | Build script (bun/node) | ✅ 21-route dist build | ✅ Seeded `dist/<resolved>/plataforma/index.html` → script **exit 0** (leak undetected) | — | — | — |
| WU2/2.2 | `scripts/verify-prerender.ts` | Build script | ✅ (script) | — | ✅ Re-run → **exit 1** naming the artifact | — | — |
| WU2/2.3 | `scripts/verify-prerender.ts` | Build script | ✅ (script) | — | ✅ **exit 1, 2 hits** (`plataforma` dir AND `plataforma/index.html` both named) | ✅ dir + file both named | — |
| WU2/2.4 | `scripts/verify-prerender.ts` | Build script | ✅ (script) | — | ✅ clean run **exit 0** `· no plataforma leak` | — | ✅ reuses `DIST_ROOT` (no duplicate root resolution) |
| WU2/2.5 | `package.json` | gate config | ✅ (script) | — | ✅ `verify:prerender` script + gate appends `&& bun run verify:prerender` (final gate proves wiring) | — | — |
| WU2/2.6 | — | gate | — | — | ✅ seeded leak removed; full gate GREEN EXIT=0 | — | — |
| WU3/3.1 | `src/app/core/platform/api/ports.spec.ts` | Unit (DI, TestBed) | ✅ 483/483 | ✅ stub + identity, no `overrideProvider` → FAIL | ✅ 487 tests | ✅ `me()` sentinel `swap-user` | ➖ None (explicit blocks per port, per design) |
| WU3/3.2 | same | Unit (DI) | ✅ 483/483 | ✅ same RED (4 failed incl. jobs) | ✅ 487 tests | ✅ `byId('x')` → null sentinel | ➖ None |
| WU3/3.3 | same | Unit (DI) | ✅ 483/483 | ✅ same RED | ✅ 487 tests | ✅ `list()` empty sentinel Page | ➖ None |
| WU3/3.4 | same | Unit (DI) | ✅ 483/483 | ✅ same RED | ✅ 487 tests | ✅ `worker('any')` → `fullName:'Swap'` | ➖ None |
| WU3/3.5 | — | gate | — | — | ✅ lint + 487 tests | — | — |
| WU4/4.1 | `src/app/core/platform/api/mock-gateways.spec.ts` | Unit | ✅ 487/487 | ✅ admin register RESOLVED (guard absent) → FAIL | ✅ 490 tests | — | — |
| WU4/4.2 | `src/app/core/platform/api/mock-auth.gateway.ts` | Unit | ✅ 487/487 | — | ✅ 3-line guard first in `register` | — | — |
| WU4/4.3 | `mock-gateways.spec.ts` | Unit | ✅ 487/487 | (company already accepted — regression pin) | ✅ 490 tests | ✅ company register succeeds through `me()` | ➖ None (guard minimal) |
| WU4/4.4 | `src/app/core/platform/auth/session.service.spec.ts` | Unit | ✅ 487/487 | ✅ `session.register({role:'admin'})` persisted (guard absent) → FAIL | ✅ 490 tests | ✅ error bubbles up, `currentUser()` null, storage null | ➖ None |
| WU4/4.5 | — | gate | — | — | ✅ lint + 490 tests | — | — |
| WU5/5.1 | `mock-gateways.spec.ts` | Unit | ✅ 490/490 | ✅ TS2353 (`applicantId` not in `ApplicationsFilter`) → compile FAIL | ✅ 493 tests | — | — |
| WU5/5.2 | `ports.ts` + `mock-applications.gateway.ts` | Unit | ✅ 490/490 | — | ✅ additive `applicantId?` + AND predicate | — | — |
| WU5/5.3 | `mock-gateways.spec.ts` | Unit | ✅ 490/490 | — | ✅ 493 tests | ✅ `{jobId:JOBS[1],applicantId:'worker-2'}` → `app-2`; `{jobId:JOBS[0],applicantId:'worker-2'}` → empty | ✅ predicate style identical to `jobId`/`status` |
| WU5/5.4 | `mock-gateways.spec.ts` | Unit | ✅ 490/490 | — | ✅ 493 tests | ✅ `applicantId:'sin-postulaciones'` → `[]`, `total:0` | — |
| WU5/5.5 | — | gate | — | — | ✅ lint + 493 tests | — | — |
| WU6/6.1–6.6 | `openspec/changes/p2-warnings-closure/apply-progress.md` | Docs | ✅ 493/493 | — | ✅ table complete, 8 columns | ➖ Triangulation skipped: documentation | — |

## Final Gate Output Summary

`bun run gate` → **EXIT=0** (chain: `bun run contract:lint && bun run contract:check && bunx ng lint && bunx ng test --watch=false && bunx ng build && bun run verify:prerender`).

| Step | Result |
|------|--------|
| contract:lint (spectral) | ✅ 0 errors |
| contract:check (openapi-typescript) | ✅ no drift (`git diff contracts/` empty) |
| ng lint | ✅ all files pass |
| ng test | ✅ **493 tests / 56 files** |
| ng build | ✅ **21 static routes prerendered** (7 static + 6 services + 8 projects) |
| verify:prerender | ✅ `PASS · routes verified: 21 … · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak` |
| dist leak scan | ✅ `find dist -iname '*plataforma*'` → 0 hits |
| Engram obs #848 | ✅ unchanged (verified via `mem_get_observation(848)` before and after; no mutation performed) |

## Deviations from Design

None — implementation matches `design.md` exactly (comment text, `Rol no permitido para el registro`, AND-filter semantics, gate wiring, W7 evidence location in this change's apply-progress).

## Issues / Risks

- WU1/WU3 RED is probe/mutation-based (behavior pre-existed): documented honestly in the evidence table (WU1/1.1 probe run failed with 1 pending request; WU3/3.1–3.4 stub-without-override run failed 4 tests).
- WU2 has no vitest unit test (top-level side-effecting script): the seeded-leak exit-0→exit-1 run is the accepted evidence per design.
- WU4 changes programmatic `register` behavior for `admin` — test/demo callers only; UI never offers admin; the error message and tests pin the contract.
- `applicantId` filter is additive and currently unused by UI (demo/privacy completeness per W6).

## Rollback

Revert per work unit (each commit is autonomous): `git revert 00555ec` ⇒ WU5; `a62f636` ⇒ WU4; `aaf9ea8` ⇒ WU3; `7f6a81f` ⇒ WU2; `b46cb25` ⇒ WU1.