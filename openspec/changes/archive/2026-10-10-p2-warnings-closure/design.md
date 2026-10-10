# Design: p2-warnings-closure

## Technical Approach

Six low-coupling work units that close carried warnings W2–W7. Five ship behavior/test
changes (one commit each, tests-with-code, tag `(p2-warnings-closure)`); the sixth
backfills TDD evidence into **this** change's apply-progress artifact. No contract
change (`contracts/openapi.yaml` untouched). Stack: Angular 22 standalone zoneless,
vitest 4 via `@angular/build:unit-test` (jsdom), BUN only. Mapping: W2→WU1,
W3→WU2, W4→WU3, W5→WU4, W6→WU5, W7→WU6.

## Architecture Decisions

| Decision | Choice | Alternative rejected | Rationale |
|---|---|---|---|
| W2 comment | State zero-HTTP because data is mocked, and transfer cache stays enabled by default | Keep "Plain, no transfer cache" | `provideClientHydration()` enables the HTTP transfer cache by default; the old comment is false. Zero HTTP is true because gateways are in-memory, not because caching is off. |
| W2 test home | Extend `app.config.spec.ts` | New spec file | Reuses the existing `appConfig` + `RouterTestingHarness` setup; keeps bootstrap coverage in one place. |
| W3 integration | Extend `scripts/verify-prerender.ts` **and** wire it into `gate` | New dedicated script | Reuses `resolveDistRoot()`/`DIST_ROOT`; one gate entry point. Critically, the current gate never runs the script, so wiring is part of the fix. |
| W4 shape | One `it` per port (4 blocks) | Table-driven helper | Each port has a distinct interface; a generic helper would weaken stub typing and diff attribution. Mirrors the existing FEED swap test. |
| W5 boundary | Guard in `MockAuthGateway.register`; `SessionService` unchanged | Guard in `SessionService` / normalize role | Mirrors the future server boundary (OpenAPI: "admin cannot be self-assigned"); `SessionService.register` already propagates errors and the UI already catches them. |
| W5 error | `throw new Error('Rol no permitido para el registro')` | Normalize to `worker` | Fail loud beats silent coercion; message matches existing Spanish auth errors (`Ya existe una cuenta con ese email`). |
| W6 filter | Add `applicantId?` to `ApplicationsFilter`; AND-combine predicates | Replace jobId filter | Additive type, AND semantics keep `jobId`/`status` behavior identical (spec). |
| W7 location | Evidence table in this change's apply-progress artifact | Mutate Engram obs #848 | Archives are immutable audit trail (openspec convention); #848 must stay untouched. |

## Data Flow

    /plataforma/**  (client-rendered, RenderMode.Client)
        │
        ▼
    lazy page ──inject──► SessionService ──► AUTH_GATEWAY ──► MockAuthGateway (in-memory)
        │                                         │
        ▼                                         └─ register(role==='admin') ──► throw Spanish error
    RouterTestingHarness ──► HttpTestingController.verify()  == zero pending           (tests)

    bunx ng build ──► dist/<project>/browser ──► verify-prerender.ts (resolveDistRoot + leak scan) ──► gate exit

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/app.config.ts` | Modify | Rewrite the `provideClientHydration()` comment (WU1) |
| `src/app/app.config.spec.ts` | Modify | Add zero-HTTP platform bootstrap test (WU1) |
| `scripts/verify-prerender.ts` | Modify | Add `*plataforma*` leak scan over resolved client root (WU2) |
| `package.json` | Modify | Add `verify:prerender`; append it to `gate` (WU2) |
| `src/app/core/platform/api/ports.spec.ts` | Modify | Add AUTH/JOBS/APPLICATIONS/PROFILES swap tests (WU3) |
| `src/app/core/platform/api/mock-auth.gateway.ts` | Modify | Reject `admin` in `register` (WU4) |
| `src/app/core/platform/api/mock-gateways.spec.ts` | Modify | Admin-reject + company-accept tests; applicantId tests (WU4, WU5) |
| `src/app/core/platform/auth/session.service.spec.ts` | Modify | Admin error bubbles up, nothing persisted (WU4) |
| `src/app/core/platform/api/ports.ts` | Modify | Add `applicantId?: string` to `ApplicationsFilter` (WU5) |
| `src/app/core/platform/api/mock-applications.gateway.ts` | Modify | Filter by `applicantId` (WU5) |
| `openspec/changes/p2-warnings-closure/apply-progress.md` | Create (apply) | TDD evidence table for 1.1–3.7 (WU6) |

## Interfaces / Contracts

```ts
// ports.ts (WU5) — additive, no contract change
export interface ApplicationsFilter {
  jobId?: string;
  status?: ApplicationStatus;
  applicantId?: string;   // NEW
}
```

WU1 comment (exact text):
```ts
// Attaches to the prerendered DOM instead of re-rendering it, preserving the
// per-route head through boot (Req 2). No HTTP is issued at platform bootstrap:
// platform data comes from in-memory mock gateways, not the network. The HTTP
// transfer cache stays enabled (provideClientHydration default) for any future
// HTTP-backed page.
```

WU4 guard (exact, placed first in `register`):
```ts
if (input.role === 'admin') {
  throw new Error('Rol no permitido para el registro');
}
```

## WU1 — W2: comment fix + zero-HTTP bootstrap test

- **Test** (`app.config.spec.ts`, new `it` in `describe('appConfig')`): `'bootstraps the platform subtree with zero HTTP'`.
  Providers: `[...appConfig.providers, provideHttpClientTesting()]` (**order matters** — testing
  backend must follow `provideHttpClient()`), then `TestBed.inject(HttpTestingController)`.
- **Flow**: `await RouterTestingHarness.create()` → `await harness.navigateByUrl('/plataforma/login')`
  (unguarded route, avoids the `authGuard` redirect) → `await TestBed.inject(ApplicationRef).whenStable()`
  → `httpMock.verify()`.
- **Why it proves zero HTTP**: the testing backend never auto-responds, so ANY request issued during
  bootstrap/route activation stays pending and `verify()` throws. Passing = none issued
  (mirrors the existing `'issues no HTTP request for any auth action'` pattern).
- **Zoneless notes**: no `fakeAsync`/`tick`; `RouterTestingHarness` and `whenStable()` await the
  lazy `import()` and signal-driven paint. Meaningful signal writes happen inside the awaited promises.
- **TDD**: RED is mutation-based (behavior pre-exists): temporarily inject `HttpClient` and fire a
  probe `get('/__probe__')` before `verify()` → test fails (1 pending). Remove probe → GREEN.
  TRIANGULATE: navigate both `/plataforma/login` and `/plataforma/registro`.
  REFACTOR: extract `bootstrapPlatform(url)` helper if reused.
- **Commit**: `test(platform): assert zero-HTTP platform bootstrap and fix hydration comment (p2-warnings-closure)`

## WU2 — W3: dist/platform-leak scan + gate wiring

- **Scan** (`verify-prerender.ts`, new section 6): helper `findPlatformArtifacts(root)` recurses dirs
  and files, collecting `relative(REPO_ROOT, entry)` where `entry` matches `/plataforma/i`
  (case-insensitive; catches files AND empty dirs). Run over `DIST_ROOT` (already robust to
  `dist/browser` and `dist/<project>/browser`). Each hit → `fail(path, 'platform artifact present in client output')`.
- **Exit/message**: script already exits `1` if `failures.length > 0`, printing one `✗ <path>: <message>`
  line each; clean run exits `0`. Extend the PASS line with `· no plataforma leak`.
- **Gate**: add `"verify:prerender": "bun scripts/verify-prerender.ts"`; gate becomes
  `... && bunx ng build && bun run verify:prerender`.
- **Robustness**: `VERIFY_PRERENDER_DIST` override still honored; if `DIST_ROOT` is missing the
  existing "browser output root missing" failure already fires.
- **TDD** (script-level seeded-leak proof): RED = seed `dist/<resolved>/plataforma/index.html`, run
  script → before the scan it exits 0 (leak undetected). GREEN = add scan → exits 1 naming the file.
  TRIANGULATE = seed both a `plataforma/` dir and a `plataforma/index.html`.
  REFACTOR = reuse `DIST_ROOT` (no duplicate root resolution).
- **Trade-off**: no vitest unit test (script is top-level side-effecting); the seeded-leak run is the
  evidence. Kept minimal per scope.
- **Commit**: `build(gate): fail build on plataforma artifact in client output (p2-warnings-closure)`

## WU3 — W4: adapter-swap DI tests

Four `it` blocks in `ports.spec.ts`, each: define a typed custom stub, `TestBed.overrideProvider(TOKEN,
{ useValue: custom })`, `const injected = TestBed.inject(TOKEN)`, `expect(injected).toBe(custom)`, then
call one method and assert its sentinel (proves it is used, not just resolved). Add type imports
(`AuthGateway`, `JobsGateway`, `ApplicationsGateway`, `ProfilesGateway`, `WorkerProfile`).

- `'swaps the auth adapter with a provider change only'` — `me()` returns `swap-user`.
- `'swaps the jobs adapter with a provider change only'` — `byId('x')` returns `null`.
- `'swaps the applications adapter with a provider change only'` — `list()` returns empty sentinel page.
- `'swaps the profiles adapter with a provider change only'` — `worker('any')` returns `fullName:'Swap'`.
- **TDD**: RED = write the custom stub + `expect(injected).toBe(custom)` first (DI returns the default
  mock → fails), then add the `overrideProvider` line → GREEN. TRIANGULATE = call a stub method and
  assert the sentinel. REFACTOR = none (explicit blocks preferred over a generic helper).
- **Commit**: `test(platform): prove DI swap for auth, jobs, applications and profiles ports (p2-warnings-closure)`

## WU4 — W5: role guard at the mock auth boundary

- **Prod** (`mock-auth.gateway.ts`): add the guard shown above, first in `register` (before the
  duplicate-email check, so a prohibited role is always reported as such).
- **Tests**:
  - `mock-gateways.spec.ts` → `'rejects a self-assigned admin role with a Spanish error and creates no session'`:
    `register({...,role:'admin'})` rejects with the exact message; `me()` then rejects `'No autenticado'`.
  - `mock-gateways.spec.ts` → `'registers a company account through me()'`: role `company` succeeds
    (worker already covered by the existing register test).
  - `session.service.spec.ts` → `'bubbles up the rejected admin role and persists nothing'`:
    `session.register({...admin})` rejects with the message; `currentUser()` stays `null`;
    `localStorage.getItem(SESSION_STORAGE_KEY)` is `null`.
- **SessionService**: no change — `register` awaits the gateway and lets the error propagate;
  `registro.page.ts` already maps `cause.message` into `error()`. Confirmed by the new spec.
- **TDD**: RED = add tests first (guard absent → admin accepted, test fails). GREEN = add 3-line guard.
  TRIANGULATE = admin rejected **and** company accepted **and** no session persisted.
  REFACTOR = none (guard is minimal).
- **Commit**: `fix(platform): reject admin role in mock register (p2-warnings-closure)`

## WU5 — W6: applicantId filtering

- **Prod**: `ports.ts` adds `applicantId?: string` (doc comment updated to "jobId / applicantId /
  status"); `mock-applications.gateway.ts#list` adds
  `(filter.applicantId === undefined || application.applicantId === filter.applicantId)` to the AND chain.
- **Semantics**: all provided filters AND-combine; omitted filters are ignored (matches existing
  `jobId`/`status`). No match → `paginate([])` → `{ items: [], meta: { page:1, pageSize:20, total:0 } }`.
- **Tests** (`mock-gateways.spec.ts`, ApplicationsGateway describe):
  - `'filters by applicantId so an applicant only sees their own'` — `worker-1` → exactly `app-1`.
  - `'combines jobId and applicantId with AND semantics'` — `{jobId: JOBS[1].id, applicantId:'worker-2'}`
    → `app-2`; `{jobId: JOBS[0].id, applicantId:'worker-2'}` → empty.
  - `'returns an empty page when no application matches'` — `applicantId:'sin-postulaciones'` → `[]`, `total:0`.
- **TDD**: RED = tests first (filter ignored → wrong count). GREEN = add predicate. TRIANGULATE = AND
  + empty case. REFACTOR = keep predicate style identical to existing `jobId`/`status`.
- **Commit**: `feat(platform): filter mock applications by applicantId (p2-warnings-closure)`

## WU6 — W7: TDD evidence backfill

- **Deliverable**: a new section in `openspec/changes/p2-warnings-closure/apply-progress.md` (created
  during apply), titled `## TDD Cycle Evidence (backfill: tasks 1.1–3.7, S1a/S1b/S2)`.
- **Columns**: Task, Test File, Layer, Safety Net, RED, GREEN, TRIANGULATE, REFACTOR.
- **Rows**: 1.1–1.9, 2.1–2.6, 3.1–3.7, sourced from the archived `tasks.md` test references
  (e.g. 1.1 `app.server-routes.shared.spec.ts`; 1.4 `app.routes.server.spec.ts`; 1.5 `app.routes.spec.ts`;
  1.8 `app.release-matrix.spec.ts`; 2.1 `app.spec.ts`/`sticky-cta.component.spec.ts`; 3.1 `conformance.spec.ts`;
  3.5 store specs). Each RED/GREEN/TRIANGULATE/REFACTOR cell cites the archived evidence (session
  summaries / task checkboxes) without copying it.
- **Boundary**: Engram obs **#848 is NOT mutated** (`mem_get_observation(848)` unchanged). Traceability
  via `openspec/specs/delivery-evidence`.
- **Commit**: `docs(sdd): backfill TDD cycle evidence for tasks 1.1–3.7 (p2-warnings-closure)`

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Bootstrap (jsdom) | Zero-HTTP platform navigation | `RouterTestingHarness` + `HttpTestingController.verify()` |
| Build gate (node/bun) | No `*plataforma*` in client output | `scripts/verify-prerender.ts` seeded-leak proof + wired into `gate` |
| DI unit | All 5 ports swappable | `TestBed.overrideProvider` + inject identity + sentinel method call |
| Gateway unit | Admin reject; worker/company accept; no session | `mock-gateways.spec.ts`, `session.service.spec.ts` |
| Gateway unit | applicantId / AND / empty | `mock-gateways.spec.ts` |
| Docs | TDD evidence 1.1–3.7 | inspection of this change's apply-progress |

Canonical command: `bunx ng test --watch=false`; full gate `bun run gate`.

## Work-Unit → Spec Requirement Traceability

| WU | Spec (delta) | Requirement / Scenario |
|---|---|---|
| WU1 | `server-rendering` | Platform hydration without transfer cache — zero-HTTP test + accurate comment |
| WU2 | `platform-shell` | Platform subtree excluded from prerender — leak scan fails gate; gate wires scan |
| WU3 | `platform-identity`, `platform-jobs` | Auth/profiles ports + Jobs port + Applications flow — each token proves swappability |
| WU4 | `platform-identity` | Role model — programmatic register rejects admin; worker/company succeed |
| WU5 | `platform-jobs` | Applications flow — `list({ applicantId })`; existing behavior unchanged |
| WU6 | `delivery-evidence` | TDD cycle evidence complete and traceable; #848 immutable |

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|---|---|---|
| WU2 false-positive if a future lazy chunk is named `*plataforma*` | Low | Chunks are hash-named today; the `*plataforma*` match is intentional (any platform-named client artifact is a leak signal). |
| WU2 script has no vitest unit test | Medium | Accepted for scope; seeded-leak RED/GREEN run documented as the evidence. |
| WU1/WU3 RED is probe/mutation-based (behavior pre-exists) | Medium | Honest characterization testing; RED proven by a seeded failure, documented in the evidence table. |
| WU4 changes programmatic `register` behavior | Low | Test/demo callers only; UI never offers admin; message + tests pin the contract. |
| `gate` runtime grows (build + scan) | Low | Scan reuses a walk already done for the localhost sweep; negligible. |

## Migration / Rollout

No migration. No feature flags. `applicantId` is additive and unused by UI yet. Revert = `git revert`
per WU commit; each commit is autonomous.

## Open Questions

None blocking.
