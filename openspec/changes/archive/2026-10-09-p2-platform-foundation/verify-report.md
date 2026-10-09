# Verify Report — `p2-platform-foundation`

- **Verdict:** **PASS WITH WARNINGS** (CRITICAL resolved by `2b5041a`; remaining WARNINGs unchanged)
- **Date:** 2026-10-09 (re-verification after post-verify fix)
- **Mode:** Strict TDD (verification-only; nothing fixed)
- **Runner:** `bun run gate` → `bunx ng test --watch=false` (Bun only)
- **Apply baseline:** `apply-progress` obs #848; changes S1a–S5 + post-verify fix S6 marked COMPLETE
- **Fix under re-verification:** `2b5041a` fix(seo): drop structured data on noindex routes

---

## Executive Summary

Re-verification is GREEN. The prior CRITICAL — the `HomeAndConstructionBusiness` JSON-LD leaking
onto `noindex` platform routes — is **resolved** by commit `2b5041a`: `SeoService.apply()` now
branches on `route.indexable === false`, calls `removeJsonLd()` (dropping any pre-existing
`script[type="application/ld+json"]`, so a client-side transition off an indexable route cannot
leak), and otherwise keeps the unchanged `writeJsonLd(url)` path. Two new tests cover the
scenario, and one pre-existing test that had asserted the wildcard leak was corrected.

The full gate is green: **56 test files / 482 tests pass**, lint is clean, Spectral reports no
errors, `contract:check` passes, and the production build emits exactly **21 prerendered routes**
with no platform output. An independent 5-case probe (written, run, then reverted) confirmed: (A)
indexable marketing routes still ship exactly one `HomeAndConstructionBusiness` script; (B)
`/plataforma/login` → `robots=noindex,nofollow` with **0** scripts; (C) an indexable → non-indexable
client transition removes the script and a later indexable route restores it; (D) the `**` wildcard
also drops structured data; (E) every authenticated platform child (`/plataforma`,
`/plataforma/trabajos`, `/plataforma/trabajos/job-1`, `/plataforma/perfil`) is noindex with 0
scripts. The change is now archive-ready modulo the remaining non-blocking WARNINGs below.

---

## Raw Gate Results

`bun run gate` — **exit 0**

| Stage | Result |
|---|---|
| Spectral (OpenAPI lint) | ✅ `No results with a severity of 'error' found!` |
| `contract:check` (`openapi-typescript --check`) | ✅ up to date (openapi-typescript 7.13.0) |
| ESLint | ✅ `All files pass linting.` |
| `bunx ng test --watch=false` | ✅ **56 files, 482 tests passed** |
| `bunx ng build` | ✅ 21 routes prerendered |
| Build artifact scan | ✅ `find dist -iname '*plataforma*'` → empty; no `dist/.../browser/plataforma` |

`dist/Construction-Company-Agency/prerendered-routes.json` lists exactly 21 routes (7 static + 6
`servicios/:slug` + 8 `proyectos/:slug`); no `**`, no `/plataforma`.

### Independent re-verification probe (temporary, reverted)

A probe spec was added, executed, and deleted (worktree clean afterwards). **5/5 passed:**

| Probe | Navigation | Asserted | Result |
|---|---|---|---|
| A | `/servicios` | `robots=index,follow`; 1 script; `@type` contains `HomeAndConstructionBusiness`; payload equals `buildJsonLd` | ✅ |
| B | `/plataforma/login` | `robots=noindex,nofollow`; `jsonLdScripts().length === 0` | ✅ |
| C | `/servicios` → `/plataforma/login` → `/nosotros` → `/plataforma/registro` | counts `1 → 0 → 1 → 0` | ✅ |
| D | `/servicios` → `/pagina-que-no-existe` (`**`) | `noindex,nofollow`; count `1 → 0` | ✅ |
| E | authenticated `/plataforma`, `/plataforma/trabajos`, `/plataforma/trabajos/job-1`, `/plataforma/perfil` | each `noindex,nofollow`; 0 scripts | ✅ |

The two committed tests in `seo.service.spec.ts:122-140` cover B and C; the probe independently
extends the proof to the wildcard and every guarded child.

### Compile-time contract conformance — independent adversarial proof (not a claim)

| Probe | Mutation | Result |
|---|---|---|
| Forward direction | corrupt `contract-conformance.ts:51` binding | `bunx ng build` → **FAIL TS2344** |
| Reverse direction | `PostExact = Omit<Schema['FeedPost'], 'content'>` | `bunx ng build` → **FAIL TS2344** (missing `content`) |

Both reverted (`git checkout`). `contract-conformance.ts` is not imported by any non-spec file
(`grep` empty) yet is in the build program via `tsconfig.app.json`
(`include: ["src/**/*.ts"]`, `exclude: ["src/**/*.spec.ts"]`) — so the guard genuinely gates
`ng build`, not just the test run.

---

## Per-Requirement Verification

Status legend: **PASS** = all scenarios covered by passing tests · **PARTIAL** = implemented but
partly uncovered · **FAIL** = required behavior absent/violated · **UNTESTED** = no covering test.

### platform-shell

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Route table — every platform path resolves | PASS | `app.routes.spec.ts:162` (unknown `/plataforma/**` → 404); `auth.guard.spec.ts:86` |
| Route table — marketing routes unchanged | PASS | `app.routes.spec.ts:41,92`; `auth.guard.spec.ts:74` |
| Chrome & CTA — suppressed on platform | PASS | `sticky-cta.component.spec.ts:73`; `app.release-matrix.spec.ts:145` |
| Chrome & CTA — marketing CTA preserved / quote exception | PASS | `sticky-cta.component.spec.ts:46,56,64` |
| Prerender exclusion — no platform server route | PASS | `app.routes.server.spec.ts:90,96` |
| Prerender exclusion — no platform HTML emitted | PARTIAL | Manual `find dist …` empty; **no automated/gate check** (W3) |
| Platform pages are noindex | PASS | `app.routes.spec.ts:62,72` |
| Guarded children — protected redirects / auth open / marketing unguarded | PASS | `auth.guard.spec.ts:37,62,74` |
| Release-matrix rows declared | PASS | `app.release-matrix.spec.ts:53,102,145`; app chrome switch |

### platform-identity

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Role model — registration offers only self-service roles | PASS | `registro.page.spec.ts:45` (`SELF_SERVICE_ROLES = worker,company`) |
| Role model — role computed from session | PASS | `session.service.spec.ts:47` |
| Mock session — login writes / demo visible / no network / logout clears | PASS | `session.service.spec.ts:35,94,68`; `login.page.spec.ts:29,40`; `registro.page.spec.ts:34` |
| Auth & profiles ports — mock satisfies port | PASS | `mock-gateways.spec.ts` |
| Auth & profiles ports — adapter swappable | PARTIAL | Swappability proven only for the Feed port (`ports.spec.ts`); no auth/profiles swap test (W5) |
| Profiles — worker + company round-trip | PASS | `mock-gateways.spec.ts`; `perfil.page.spec.ts` |

### platform-feed

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Feed port — mock satisfies / adapter swappable | PASS | `mock-gateways.spec.ts`; `ports.spec.ts` |
| Feed renders via signals — async paint / loading+empty | PASS | `feed.store.spec.ts`; `feed.page.spec.ts` |
| Company-gated composer — company sees / worker does not | PASS | `feed.page.spec.ts` |

### platform-jobs

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Jobs port & board — lists / detail / unknown id | PASS | `jobs-list.page.spec.ts`; `job-detail.page.spec.ts` |
| Jobs via signal store — async openings paint | PASS | `jobs.store.spec.ts` |
| Applications flow — apply creates / status tracked | PASS | `job-detail.page.spec.ts`; `jobs.store.spec.ts`; `application-status.spec.ts` (see W7) |

### site-shell-navigation (delta)

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Req 1 — complete es-AR route table / no route displaced | PASS | `app.routes.spec.ts:98+`; `:41` |
| Req 3 — header phone/sections/platform entry + platform chrome nav | PASS | `header.component.spec.ts:60,77,85`; `app.spec.ts` |
| Req 5 — sticky CTA suppressed on quote / across platform / present elsewhere | PASS | `sticky-cta.component.spec.ts:56,73,83,46,64` |
| Req 6 — CTA closes pages / none on quote / none on platform | PASS | `app.release-matrix.spec.ts:145` |

### server-rendering (delta)

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Req 1 — complete prerender set | PASS | `app.routes.server.spec.ts:54,70`; manual 21-route artifact |
| Req 1 — enumeration guard (derived, survives slug add/remove) | PASS | `app.server-routes.shared.spec.ts:13,22,31`; `app.routes.server.spec.ts:103,123` |
| Render mode — client for subtree | PASS | `app.routes.server.spec.ts:96` |
| Render mode — prefix exclusion exact (`plataformas-curso` survives) | PASS | `app.server-routes.shared.spec.ts:59` |
| Hydration — platform hydrates with zero HTTP | UNTESTED | No test asserts zero HTTP during bootstrap (W2) |

### seo-analytics-performance (delta)

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Req 14 — platform routes declare noindex | PASS | `app.routes.spec.ts:62,72` |
| Req 14 — platform page emits `robots` noindex | PASS | `seo.service.spec.ts:122-127` (DOM-level platform head); probe B/E |
| Req 14 — **no structured-data leak on platform** | **PASS** (was FAIL) | **Resolved in `2b5041a`.** `seo.service.ts:99-105` branches on `indexable === false` → `removeJsonLd()` (`:174-177`); tests `seo.service.spec.ts:122-140`; probe A–E |

### api-conformance

| Requirement (scenario) | Status | Evidence |
|---|---|---|
| Divergence fails the build | PASS | Independent mutation → `TS2344` (forward + reverse) |
| Generation is reproducible | PASS | `contract:check` in gate |
| Generated code is derived, not authored | PARTIAL | Enforced by `contract:check`; no dedicated test |
| Feed post binds to schema / every domain type bound | PASS | `contract-conformance.spec.ts`; build graph inclusion |

---

## Findings

### CRITICAL — RESOLVED

0. **[RESOLVED in `2b5041a`] Structured-data leak on `/plataforma/**` (was spec violation +
   untested).** `SeoService.apply()` wrote the `HomeAndConstructionBusiness` JSON-LD on every
   `NavigationEnd`, so `/plataforma/login` shipped `robots=noindex,nofollow` **and**
   `jsonLdCount=1`.
   - **Fix:** `src/app/core/seo/seo.service.ts:99-105` now branches on `route.indexable === false`
     → `removeJsonLd()` (`:174-177`), else the unchanged `writeJsonLd(url)`. `writeJsonLd` is
     untouched (still rewrites one node in place), so indexable marketing behavior is identical.
   - **Tests:** `seo.service.spec.ts:122-127` (platform head → noindex + 0 scripts) and
     `:129-140` (indexable → noindex drops the script → next indexable restores it). The prior
     `:142-156` test was corrected to navigate indexable routes only (it had asserted the wildcard
     leak the spec now forbids).
   - **Independent re-proof:** temporary 5-case probe (A–E above) passed 5/5, including the `**`
     wildcard and all guarded platform children; probe reverted, worktree clean.
   - **Regression:** 21 prerendered routes, no plataforma output, unique top-level titles test
     green — unchanged.

### WARNING

2. **[WARNING] `server-rendering` Req — "Platform hydrates with zero HTTP" is untested.**
   No test asserts zero HTTP during platform bootstrap. Additionally, `provideClientHydration()`
   in `app.config.ts` keeps the HTTP transfer cache enabled by default, so the in-code comment
   "Plain, no transfer cache" is inaccurate — inert here (no HTTP at bootstrap), but misleading.

3. **[WARNING] `platform-shell` — "No platform HTML is emitted" is not in the gate.**
   Verified manually (`find dist -iname '*plataforma*'` empty), but no automated test or gate step
   scans `dist/browser` for the platform subtree, so a regression would not be caught by CI.

4. **[WARNING] `platform-identity` — "Adapter is swappable" proven only for the Feed port.**
   `ports.spec.ts` swaps `FEED_GATEWAY`; auth/profiles token swap is not exercised. The DI
   pattern is the same, so risk is low, but the identity scenarios are not individually covered.

5. **[WARNING] Role restriction is UI-only (defense-in-depth gap).**
   `SELF_SERVICE_ROLES = [worker, company]` is enforced and tested at the form
   (`registro.page.spec.ts:45`), but `SessionService.register`/`MockAuthGateway.register` accept
   any `Role` if invoked programmatically. Spec wording ("offered") is satisfied; acceptable for
   a mock demo, flagged for awareness.

6. **[WARNING] `MockApplicationsGateway.list` has no `applicantId` filter.**
   `mock-applications.gateway.ts:24-31` filters by `jobId`/`status` only. No delta spec requires
   per-applicant privacy, so this is an acceptable demo-level gap — not a violation.

7. **[WARNING] TDD Cycle Evidence table omits tasks 1.1–3.7 (S1a/S1b/S2).**
   `apply-progress` provides per-task RED/GREEN evidence for S3–S5 (tasks 4.1–6.5) only. The
   earlier slices are covered by session summaries/task checkboxes, not by the strict per-task
   cycle table. Tests exist and pass, so this is an evidence-completeness gap.

### SUGGESTION

8. `seo.service.spec.ts:71-84` asserts title uniqueness over **top-level** routes only; nested
   platform children are not included in the uniqueness set (their titles are distinct in code,
   so no collision today).
9. `sticky-cta.component.spec.ts:90-98` asserts Tailwind CSS class strings — implementation-detail
   coupling that will churn on styling changes (pre-existing baseline test).
10. Stale doc comment in `app.routes.ts:8-10` still says "the wildcard route is the only noindex
    one", but every `/plataforma/**` route is now `NOINDEX` too. Comment-only, no runtime effect.

---

## TDD Compliance (Strict Mode)

- ✅ Gate green: 56 files / 482 tests passing; isolated probe runs confirm the runner works per-file.
- ✅ Test files exist for every slice; reported file counts match reality.
- ✅ RED/GREEN documented (via `apply-progress`) and re-confirmed GREEN for the whole suite.
- ✅ Post-verify fix followed TDD: `apply-progress` S6 records a genuine RED (`2 failed / 9 passed`
  in `seo.service.spec.ts` before the fix) → GREEN (`11 passed` in-file, 482 full suite).
- ✅ Assertion quality: no tautologies, orphan empty checks, or type-only weak assertions found;
  the "renders nothing" checks (`jsonLdScripts()` length 0) are paired with positive companions
  (Probe A / `:131`, `:139`, `:151` assert exactly one script on indexable routes).
- ⚠️ Per-task TDD cycle evidence missing for tasks 1.1–3.7 (WARNING #7) — unchanged.
- ✅ The previously-blocking scenario (JSON-LD leak) now has a covering, passing test.

---

## Recommendation

**Archive-ready.** The CRITICAL is resolved and independently re-proven; no blocking findings
remain. The WARNINGs (#2–#7) are pre-existing coverage/completeness gaps and demo-level decisions,
not spec violations — they can be tracked but do not block archive.

Optional, non-blocking follow-ups (unchanged from the first pass):

1. (W2) Add a bootstrap test asserting zero HTTP for the platform subtree, and correct the
   `provideClientHydration()` comment in `app.config.ts`.
2. (W3) Add a gate step scanning `dist/browser` for a `plataforma` directory.
3. (W7) Backfill per-task TDD cycle evidence for tasks 1.1–3.7.
4. (SUGGESTION #10) Fix the stale `app.routes.ts:8-10` doc comment.
