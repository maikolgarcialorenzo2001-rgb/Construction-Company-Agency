# Tasks: p2-warnings-closure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 (range 320–390) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single change · 6 sequential work-unit commits (WU1→WU6) on `main` |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

Task-level estimate (~350) corrects the exploration's ~295 upward: WU3 (4 typed DI swaps) is ~115 lines and WU6 (22-row evidence table) is ~55. Still under the 400 budget, so a single change is recommended; the 6 commits are the review units (realized on `main`, no branches/PRs/pushes, per locked settings). Risk is Medium only because strict-TDD evidence overhead can nudge the upper bound toward 400; if apply exceeds it, split WU3 → WU6 as the first chained cut.

### Suggested Work Units

| Unit | Goal | Commit boundary |
|------|------|-----------------|
| WU1 | W2: hydration comment + zero-HTTP bootstrap test | `test(platform): assert zero-HTTP platform bootstrap and fix hydration comment (p2-warnings-closure)` |
| WU2 | W3: dist/platform-leak scan + gate wiring | `build(gate): fail build on plataforma artifact in client output (p2-warnings-closure)` |
| WU3 | W4: DI swap tests for 4 ports | `test(platform): prove DI swap for auth, jobs, applications and profiles ports (p2-warnings-closure)` |
| WU4 | W5: admin role guard in mock register | `fix(platform): reject admin role in mock register (p2-warnings-closure)` |
| WU5 | W6: applicantId filtering | `feat(platform): filter mock applications by applicantId (p2-warnings-closure)` |
| WU6 | W7: TDD evidence backfill | `docs(sdd): backfill TDD cycle evidence for tasks 1.1–3.7 (p2-warnings-closure)` |

Every commit ends with `(p2-warnings-closure)`; sequential on `main`. Tests ship with code (work-unit-commits). Canonical: `bunx ng test --watch=false`; full gate `bun run gate`.

## WU1 — W2: hydration comment + zero-HTTP bootstrap test

| ID | Task | Files | Test name(s) | RED-first | TDD step |
|----|------|-------|--------------|-----------|----------|
| 1.1 | Add bootstrap zero-HTTP `it` to `describe('appConfig')`: providers `[...appConfig.providers, provideHttpClientTesting()]` (testing backend AFTER `provideHttpClient()`), inject `HttpTestingController`; `RouterTestingHarness.create()` → `navigateByUrl('/plataforma/login')` → `ApplicationRef.whenStable()` → `httpMock.verify()`. | `src/app/app.config.spec.ts` | `bootstraps the platform subtree with zero HTTP` | Temporarily inject `HttpClient` + fire probe `get('/__probe__')` before `verify()` → 1 pending → fails (proves the test detects HTTP). | RED |
| 1.2 | Remove probe; suite passes (zero-HTTP behavior pre-exists; no prod code needed). | — | same | — | GREEN |
| 1.3 | TRIANGULATE second navigation `/plataforma/registro`; extract `bootstrapPlatform(url)` helper if both reuse setup. | `src/app/app.config.spec.ts` | `…zero HTTP` (2 urls) | — | TRIANGULATE |
| 1.4 | Rewrite `provideClientHydration()` comment in `app.config.ts` to the exact design text (zero HTTP at bootstrap via in-memory gateways; transfer cache stays enabled by default). | `src/app/app.config.ts` | review (structural) | comment-only | GREEN (doc) |
| 1.5 | Gate: `bunx ng test --watch=false` green; commit. | — | — | — | GATE |

**Commit boundary:** `test(platform): assert zero-HTTP platform bootstrap and fix hydration comment (p2-warnings-closure)`.

## WU2 — W3: dist/platform-leak scan + gate wiring

Script-level TDD (top-level side-effecting script; seeded-leak run is the evidence, no vitest unit test — accepted trade-off).

| ID | Task | Files | Evidence | RED-first | TDD step |
|----|------|-------|----------|-----------|----------|
| 2.1 | Seed `dist/<resolved>/plataforma/index.html`, run `bun scripts/verify-prerender.ts` → exits 0 today (leak undetected). | (seeded artifact) | script run | Seeded-leak exit 0 proves the gap. | RED |
| 2.2 | Add `findPlatformArtifacts(root)` (recursive; `relative(REPO_ROOT,entry)` matching `/plataforma/i`, files AND dirs) + section 6 over `DIST_ROOT`; each hit → `fail(path,'platform artifact present in client output')`. Re-run → exits 1 naming the file. | `scripts/verify-prerender.ts` | exit 1 | — | GREEN |
| 2.3 | TRIANGULATE: seed both a `plataforma/` dir and `plataforma/index.html`; both named. | `scripts/verify-prerender.ts` | exit 1 (2 hits) | — | TRIANGULATE |
| 2.4 | REFACTOR: reuse `DIST_ROOT` (no duplicate root resolution); extend PASS line with `· no plataforma leak`. | `scripts/verify-prerender.ts` | clean run exit 0 | — | REFACTOR |
| 2.5 | Add `"verify:prerender": "bun scripts/verify-prerender.ts"`; append `&& bun run verify:prerender` to `gate`. | `package.json` | `bun run gate` | — | GREEN |
| 2.6 | Remove seeded leak; `bun run gate` passes; commit. | — | — | — | GATE |

**Commit boundary:** `build(gate): fail build on plataforma artifact in client output (p2-warnings-closure)`.

## WU3 — W4: adapter-swap DI tests

Each `it` in `ports.spec.ts`: typed custom stub → `TestBed.overrideProvider(TOKEN,{useValue:custom})` → `expect(TestBed.inject(TOKEN)).toBe(custom)` → call one method and assert its sentinel (proves use, not just resolution). RED = write stub + identity `expect` BEFORE `overrideProvider` (DI returns the default mock → fails).

| ID | Task | Test name(s) | TDD step |
|----|------|--------------|----------|
| 3.1 | Auth stub; TRIANGULATE `await injected.me()` → `swap-user`. | `swaps the auth adapter with a provider change only` | RED→GREEN→TRI |
| 3.2 | Jobs stub; `await injected.byId('x')` → `null`. | `swaps the jobs adapter with a provider change only` | RED→GREEN→TRI |
| 3.3 | Applications stub; `await injected.list()` → empty sentinel `Page`. | `swaps the applications adapter with a provider change only` | RED→GREEN→TRI |
| 3.4 | Profiles stub; `await injected.worker('any')` → `fullName:'Swap'`. Add type imports (`AuthGateway`, `JobsGateway`, `ApplicationsGateway`, `ProfilesGateway`, `WorkerProfile`). | `swaps the profiles adapter with a provider change only` | RED→GREEN→TRI |
| 3.5 | REFACTOR: none (explicit per-port blocks preferred over a generic helper). Gate + commit. | — | GATE |

**Files:** `src/app/core/platform/api/ports.spec.ts` (tests only).
**Commit boundary:** `test(platform): prove DI swap for auth, jobs, applications and profiles ports (p2-warnings-closure)`.

## WU4 — W5: admin role guard in mock register

| ID | Task | Files | Test name(s) | RED-first | TDD step |
|----|------|-------|--------------|-----------|----------|
| 4.1 | Admin-reject test: `register({...,role:'admin'})` rejects `Rol no permitido para el registro`; then `me()` rejects `No autenticado`. | `mock-gateways.spec.ts` | `rejects a self-assigned admin role with a Spanish error and creates no session` | Guard absent → admin accepted → fails. | RED |
| 4.2 | Add guard FIRST in `MockAuthGateway.register` (before the duplicate-email check): `if (input.role === 'admin') throw new Error('Rol no permitido para el registro')`. | `mock-auth.gateway.ts` | same | — | GREEN |
| 4.3 | TRIANGULATE: `company` register succeeds through `me()`. | `mock-gateways.spec.ts` | `registers a company account through me()` | — | TRIANGULATE |
| 4.4 | Session test: `session.register({...admin})` rejects the message; `currentUser()` stays `null`; `localStorage.getItem(SESSION_STORAGE_KEY)` is `null`. | `session.service.spec.ts` | `bubbles up the rejected admin role and persists nothing` | — | RED→GREEN |
| 4.5 | REFACTOR: none (guard minimal). Gate + commit. | — | — | — | GATE |

**Commit boundary:** `fix(platform): reject admin role in mock register (p2-warnings-closure)`.

## WU5 — W6: applicantId filtering

| ID | Task | Files | Test name(s) | RED-first | TDD step |
|----|------|-------|--------------|-----------|----------|
| 5.1 | `list({applicantId:'worker-1'})` → exactly `app-1`. | `mock-gateways.spec.ts` | `filters by applicantId so an applicant only sees their own` | Filter ignored → count wrong → fails. | RED |
| 5.2 | Add `applicantId?: string` to `ApplicationsFilter` (`ports.ts`; doc comment → "jobId / applicantId / status"); add `(filter.applicantId === undefined || application.applicantId === filter.applicantId)` to the AND chain in `mock-applications.gateway.ts#list`. | `ports.ts`, `mock-applications.gateway.ts` | same | — | GREEN |
| 5.3 | TRIANGULATE: `{jobId:JOBS[1].id, applicantId:'worker-2'}` → `app-2`; `{jobId:JOBS[0].id, applicantId:'worker-2'}` → empty. | `mock-gateways.spec.ts` | `combines jobId and applicantId with AND semantics` | — | TRIANGULATE |
| 5.4 | TRIANGULATE: `applicantId:'sin-postulaciones'` → `[]`, `total:0` (empty justified by setup). | `mock-gateways.spec.ts` | `returns an empty page when no application matches` | — | TRIANGULATE |
| 5.5 | REFACTOR: keep predicate style identical to `jobId`/`status`. Gate + commit. | — | — | — | GATE |

**Commit boundary:** `feat(platform): filter mock applications by applicantId (p2-warnings-closure)`.

## WU6 — W7: TDD evidence backfill

Documentation only (Triangulation skipped: documentation). No production code.

| ID | Task | Files | Evidence |
|----|------|-------|----------|
| 6.1 | Create `apply-progress.md` with `## TDD Cycle Evidence (backfill: tasks 1.1–3.7, S1a/S1b/S2)` + 8 columns (Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, REFACTOR). | `openspec/changes/p2-warnings-closure/apply-progress.md` | inspection |
| 6.2 | Rows 1.1–1.9 from archived tasks.md test refs (`app.server-routes.shared.spec.ts`, `app.routes.server.spec.ts`, `app.routes.spec.ts`, `app.release-matrix.spec.ts`). | same | inspection |
| 6.3 | Rows 2.1–2.6 (`app.spec.ts` / `sticky-cta.component.spec.ts`). | same | inspection |
| 6.4 | Rows 3.1–3.7 (`conformance.spec.ts`, store specs). | same | inspection |
| 6.5 | Verify Engram obs #848 NOT mutated (`mem_get_observation(848)`); traceability via `openspec/specs/delivery-evidence`. | same | #848 unchanged |
| 6.6 | Commit. | — | GATE |

**Commit boundary:** `docs(sdd): backfill TDD cycle evidence for tasks 1.1–3.7 (p2-warnings-closure)`.

## Verification (sdd-verify)

- Run the safety net before each WU edit; full suite `bunx ng test --watch=false`.
- Full gate `bun run gate` (contract lint/check, ng lint, ng test, ng build, `verify:prerender`).
- `git diff contracts/` empty; `mem_get_observation(848)` unchanged.
- Each WU committed independently (work-unit-commits), tag `(p2-warnings-closure)`.
