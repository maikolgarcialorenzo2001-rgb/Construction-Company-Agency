# Verification Report — p13-modo-previa

**Change**: p13-modo-previa — Public static `/previa` preview + demo-role switcher
**Version**: N/A (delta specs, pre-archive)
**Mode**: Strict TDD
**Verified commit**: `5c639a3` on `feature/p13-modo-previa` (WU1 `75c0132` + WU2 `5c639a3`)
**Verdict**: ✅ **PASS WITH WARNINGS** — 0 CRITICAL, all gates green, 35/36 scenarios COMPLIANT + 1 PARTIAL

> **Bottom line for the reviewer:** Both work units are implemented, all four hard gates pass on fresh execution (**652/652 tests across 70 files**, lint clean, build prerenders **25 routes**, `verify:prerender` PASS), the protected files are untouched, and the platform-never-prerendered invariant holds with the count math expanded by `PREVIEW_ROLES.length`. The `/previa` showcase renders synchronously from fixtures and the emitted HTML is non-empty for all four pages; `/previa/admin` ships no `demo1234`; the top-level route table is `[...marketing, 'plataforma', 'previa', '**']`. Two WARNINGs remain: (1) no test reads the **built** `/previa*.html`, so the "Prerendered HTML is non-empty" scenario is covered only at component level; (2) the apply-progress artifact carries no consolidated TDD Cycle Evidence table. Neither blocks archive. **Archive readiness: READY.**

---

## 1. Completeness

| Metric | Value |
|--------|-------|
| Work units | 2/2 reported complete (WU1 `75c0132`, WU2 `5c639a3`) |
| Tasks total (checkbox-tracked) | 18 (WU1 12, WU2 8) |
| Tasks complete `[x]` | 18 |
| Tasks incomplete | 0 |
| Protected files | ✅ unchanged |

All checkboxes in `tasks.md` are `[x]` (WU1 lines 25–33, WU2 lines 48–56). Two `Status:` annotations are stale (WU1 header still says `pending` at `tasks.md:22`; WU2 says `implemented (awaiting verify)` at `tasks.md:45`) — process note, not a gap; both commits exist and both spec sets pass.

---

## 2. Gate Evidence (executed by the verifier on `5c639a3`)

**Tests**: ✅ **652 passed / 0 failed** across **70 files**
```text
bunx ng test --watch=false
 Test Files  70 passed (70)
      Tests  652 passed (652)
   Duration  12.33s
```
Pre-existing/benign jsdom noise only: `Not implemented: navigation to another Document` ×4 (from navigation specs).

**Lint**: ✅ Passed
```text
bunx ng lint
Linting "Construction-Company-Agency"...
All files pass linting.
```

**Build**: ✅ Passed — lazy `previa-page` chunk (8.32 kB) emitted; **Prerendered 25 static routes**
```text
bunx ng build
chunk-Dm9QhmAc.js   | previa-page |  8.32 kB |  2.48 kB
Prerendered 25 static routes.
Application bundle generation complete. [8.971 seconds]
```

**Prerender gate**: ✅ Passed — `previa` deliberately absent from the JSON-LD set
```text
bun run verify:prerender
PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak
```

**Build-artifact inspection** (verifier, `dist/Construction-Company-Agency/browser/`):
| Path | Bytes | Evidence |
|------|-------|----------|
| `previa/index.html` | 29,292 | 9 `previa-feed-post`, 5 `previa-job`, 1 `previa-worker`, 1 `previa-company`; `robots=noindex,nofollow` |
| `previa/worker/index.html` | 27,397 | 1 `previa-applications`, 7 `previa-application` |
| `previa/company/index.html` | 27,047 | 1 `previa-vacancies`, 5 `previa-vacancy` |
| `previa/admin/index.html` | 26,635 | 1 `previa-directory`, 6 `previa-directory-row`; **no `demo1234`** (`grep -r demo1234 previa/` → no match) |

| Invariant | Result |
|-----------|--------|
| `dist/browser/plataforma/` exists | ✅ **absent** (`find` exit 1) — platform never prerenders |
| `/plataforma` path leak in `dist` | ✅ none (`verify:prerender` leak scan PASS) |
| `scripts/verify-prerender.ts` `STATIC_PATHS` contains `previa` | ✅ **no** (line 27: `['', 'servicios', 'proyectos', 'proceso', 'testimonios', 'nosotros', 'presupuesto']`) |

---

## 3. Protected Files (diff `bc70c3a..HEAD`)

```text
git diff --stat bc70c3a..HEAD -- contracts/openapi.yaml \
  src/app/core/platform/api/contract-conformance.ts angular.json scripts/verify-prerender.ts
(empty — exit 0)
```

| File | Status |
|------|--------|
| `contracts/openapi.yaml` | ✅ untouched |
| `src/app/core/platform/api/contract-conformance.ts` (no `DirectoryUser`/`AdminGateway`) | ✅ untouched |
| `angular.json` | ✅ untouched |
| `scripts/verify-prerender.ts` | ✅ unchanged |

Fully changed file list is scoped to `openspec/changes/p13-modo-previa/*` + the new preview code/specs + 4 route/spec files. Net: **822 insertions / 8 deletions** in `src` + `scripts` (830 lines).

---

## 4. Spec Compliance Matrix (36 scenarios) — 35/36 COMPLIANT · 1 PARTIAL · 0 UNTESTED · 0 FAILING

### platform-preview — 12/13 ✅ (1 PARTIAL)

| # | Requirement | Scenario | Covering test | Result |
|---|---|---|---|---|
| 1 | Public prerenderable preview route | Preview is reachable anonymously | `app.routes.spec.ts:187` nav `/previa` → `app-previa` (no guard/redirect) | ✅ COMPLIANT |
| 2 | Public prerenderable preview route | Preview is top-level, not platform | `app.routes.spec.ts:45-59` `ROUTE_TABLE`; `app.server-routes.shared.spec.ts:59-66` prefix keeps `previa` | ✅ COMPLIANT |
| 3 | Public prerenderable preview route | Preview opts out of indexing | `app.routes.spec.ts:78-87` (noindex `['plataforma','previa','**']`) + `:107-125` both children noindex | ✅ COMPLIANT |
| 4 | Public prerenderable preview route | Unknown role falls back deterministically | `previa.page.spec.ts:111-120` (`inventado` → default, no throw) + fixture `preview-fixtures.spec.ts:37-42` | ✅ COMPLIANT |
| 5 | Synchronous fixture snapshot | **Prerendered HTML is non-empty** | `previa.page.spec.ts:55-75` (sync render non-empty); **no test reads built `dist/previa/*.html`** | ⚠️ **PARTIAL** |
| 6 | Synchronous fixture snapshot | First render deterministic + hydration-stable | `previa.page.spec.ts:122-129` (two renders byte-identical) + `preview-fixtures.spec.ts:102-108` | ✅ COMPLIANT |
| 7 | Role variant content | Per-role sections render | `previa.page.spec.ts:77-89` (it.each 3 roles), `:91-99` worker apps, `:101-109` admin directory (no `demo1234`) | ✅ COMPLIANT |
| 8 | Role variant content | Role view works without JavaScript | `:role` bound to `input('role')` (`previa.page.ts:32-35`); built `worker/company/admin` HTML present | ✅ COMPLIANT |
| 9 | Client-only role switcher | Every demo account enters the platform | `preview-role-switcher.component.spec.ts:73-100` (loops all 6: `login(email,'demo1234')` + `currentUser` userId/role + navigate) | ✅ COMPLIANT |
| 10 | Client-only role switcher | No registration is required | `preview-role-switcher.component.spec.ts:75,99` (`register` never called) | ✅ COMPLIANT |
| 11 | Client-only role switcher | Switcher links are prerendered anchors | `preview-role-switcher.component.spec.ts:53-61` (`/previa/{worker,company,admin}`); `href`-bound plain `<a>` in `.html:39-47` | ✅ COMPLIANT |
| 12 | Preview noindex partition + prerender contracts | Noindex partition includes the preview | `app.routes.spec.ts:86` exact `['plataforma','previa','**']` | ✅ COMPLIANT |
| 13 | Preview noindex partition + prerender contracts | Verify script keeps preview out of JSON-LD | `scripts/verify-prerender.ts:27` (previa absent) + `verify:prerender` PASS | ✅ COMPLIANT |

### platform-shell (MODIFIED) — 9/9 ✅

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Platform subtree route table | Every platform path resolves | `app.routes.spec.ts:177-199` (it.each incl. platform rows) | ✅ COMPLIANT |
| Platform subtree route table | Admin child is registered | `app.routes.spec.ts:89-105` (8 children, `admin` after `inicio`) | ✅ COMPLIANT |
| Platform subtree route table | Top-level table gains the preview route | `app.routes.spec.ts:45-59` (`previa` after `plataforma`, before `**`) | ✅ COMPLIANT |
| Platform subtree route table | Marketing routes are unchanged | `app.routes.spec.ts:57-59` (`MARKETING_ROUTE_TABLE` order intact) | ✅ COMPLIANT |
| Platform subtree route table | Preview and platform are structurally separate | `app.routes.spec.ts:107-125` (`previa` children `['',':role']`, not under `plataforma`) | ✅ COMPLIANT |
| Guarded platform children | Protected child redirects anonymous users | `auth.guard.spec.ts` (pre-existing) | ✅ COMPLIANT |
| Guarded platform children | Admin child is role-guarded | `app.routes.spec.ts:127-134` (`['admin']`, 2 guards) | ✅ COMPLIANT |
| Guarded platform children | Auth entry points stay open | `auth.guard.spec.ts` (pre-existing) | ✅ COMPLIANT |
| Guarded platform children | Marketing and preview routes stay unguarded | `app.routes.spec.ts:136-142` (no `canActivate`/`canActivateChild`/`resolve`) | ✅ COMPLIANT |

### server-rendering (MODIFIED) — 7/7 ✅

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| 1. [B] Prerender every public route at build | Complete prerender set | `app.routes.server.spec.ts:55-71` + build "25 static routes", all 4 `previa` HTML emitted, no `plataforma/` dir | ✅ COMPLIANT |
| 1. [B] Prerender every public route at build | Existing static routes are unregressed | `app.routes.server.spec.ts:73-83` + build 25 + leak scan PASS | ✅ COMPLIANT |
| 1. [B] Prerender every public route at build | Enumeration guard | `app.routes.server.spec.ts:65-66` (`+ PREVIEW_ROLES.length`) + `preview-fixtures.spec.ts:44-50` | ✅ COMPLIANT |
| Platform subtree render mode | Client render for the subtree | `app.routes.server.spec.ts:99-104` (`plataforma/**` → `Client`) | ✅ COMPLIANT |
| Platform subtree render mode | Prefix exclusion is exact and keeps the preview | `app.server-routes.shared.spec.ts:59-66` (`plataformas-curso` survives) | ✅ COMPLIANT |
| Platform subtree render mode | Preview param route is prerendered with client fallback | `app.routes.server.spec.ts:146-164` (`Prerender` + `PrerenderFallback.Client` + params === `PREVIEW_ROLES`) | ✅ COMPLIANT |
| Platform subtree render mode | Platform never prerenders | `app.routes.server.spec.ts:93-97` + no `dist/browser/plataforma` | ✅ COMPLIANT |

### platform-identity (MODIFIED) — 7/7 ✅

| Requirement | Scenario | Covering test | Result |
|---|---|---|---|
| Mock session, visibly demo | Login writes a mock session | `session.service.spec.ts` + `login.page.spec.ts:51` | ✅ COMPLIANT |
| Mock session, visibly demo | Admin demo account logs in | `session.service.spec.ts:68-88` (p12; role `admin`, userId `admin-1`, reload) | ✅ COMPLIANT |
| Mock session, visibly demo | Login exposes the admin demo credential | `login.page.spec.ts:40-49` (`admin@demo.test`, `demo1234`) | ✅ COMPLIANT |
| Mock session, visibly demo | All demo accounts are reachable from the preview switcher | `preview-role-switcher.component.spec.ts:73-100` (**loops all 6**) + `platform-identity` cross-check | ✅ COMPLIANT |
| Mock session, visibly demo | Demo is visible | `login.page.spec.ts` / registro (pre-existing) | ✅ COMPLIANT |
| Mock session, visibly demo | Auth makes no network call | `session.service.spec.ts` (pre-existing) | ✅ COMPLIANT |
| Mock session, visibly demo | Logout clears the session | `session.service.spec.ts` (pre-existing) | ✅ COMPLIANT |

**Scenario inventory**: platform-preview 13 + platform-shell 9 + server-rendering 7 + platform-identity 7 = **36**. Summary: **35/36 COMPLIANT · 1/36 PARTIAL · 0 UNTESTED · 0 FAILING**.

---

## 5. Explicit Invariant Checks (requested)

| Check | Result | Evidence |
|-------|--------|----------|
| `/previa` and `/previa/:role` are top-level/child of `previa` + prerendered | ✅ | `app.routes.ts:186-210` (children `''` + `':role'`); `app.routes.server.ts:27-30` (derived `previa`) + `:46-51` (`previa/:role`); build 25 |
| Top-level table is `[...marketing, 'plataforma', 'previa', '**']` | ✅ | `app.routes.spec.ts:45-59` asserts exact order |
| Platform-never-prerendered invariant holds | ✅ | `app.routes.server.spec.ts:93-97`; no `dist/browser/plataforma/` |
| `app.routes.server.spec.ts` count math (`+ PREVIEW_ROLES.length`) correct | ✅ | `:65-66`; actual = `8 + 3 + 6 + 8 = 25` = build output |
| `/previa` + `/previa/:role` are `NOINDEX` | ✅ | `app.routes.spec.ts:78-87,107-125`; built `robots=noindex,nofollow` |
| Prerendered `/previa/admin/index.html` contains **no** `demo1234` | ✅ | `grep -r demo1234 dist/.../previa/` → no match |
| No `/plataforma` path leak in `dist` | ✅ | `verify:prerender` "no plataforma leak"; no `plataforma/` dir. (Footer links to `/plataforma/registro` are page *content*, not artifact paths — spec constrains the artifact path only.) |
| Snapshot rendered synchronously from fixtures (no store/await/PendingTasks), non-empty in built HTML | ✅ | `previa.page.ts:30-41` pure `computed`; `previa.page.spec.ts:29-33,55-75` (one `detectChanges`); built HTML non-empty (9 feed / 5 jobs) |
| Switcher client-only (no write during render), covers all 6 accounts, adds no guard | ✅ | `preview-role-switcher.component.spec.ts:63-71` (no write), `:73-100` (6 accounts), `app.routes.spec.ts:114-124,136-142` (no guard) |

---

## 6. Known Prior Findings — Re-check

| # | Prior finding | Status | Evidence |
|---|---------------|--------|----------|
| (a) | WU1 fresh review: missing post-build NON-EMPTY assertion for `/previa` HTML | ⚠️ **STILL PRESENT → WARNING** | No spec reads `dist/**/previa/*.html` (grep for `dist/`/`readFile` in specs finds only `src/index.html` + HTML templates). `verify:prerender.ts:27` intentionally excludes `previa`. Scenario 5 marked PARTIAL; verifier confirmed non-emptiness manually in §2. |
| (b) | WU2 review W1: switcher test must cover all 6 accounts | ✅ **FIXED** | `preview-role-switcher.component.spec.ts:73-100` now `for (const account of DEMO_ACCOUNTS)` asserting `login(email,'demo1234')` + `currentUser` userId/role + `navigate('/plataforma/inicio')` per account, clearing localStorage between iterations. |

---

## 7. TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ | `#983` (engram `sdd/p13-modo-previa/apply-progress`) documents WU2 + the W1 fix, but contains **no RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR table**; no separate WU1 apply-progress observation exists |
| All tasks have tests | ✅ | 18/18 checkbox tasks map to existing spec files |
| RED confirmed (tests exist) | ✅ | `preview-fixtures.spec.ts`, `previa.page.spec.ts`, `preview-role-switcher.component.spec.ts` + 4 modified route/spec files — all on disk, each carries a "Strict-mode RED" header |
| GREEN confirmed (tests pass) | ✅ | 652/652 on fresh execution |
| Triangulation adequate | ✅ | `it.each` 3 roles (`previa.page.spec.ts:77-89`); 6-account loop (`preview-role-switcher...:73-100`); resolver known/unknown/empty; determinism |
| Safety Net for modified files | ⚠️ | Not explicitly recorded; the full suite (652) was green before and after, and modified specs share a passing baseline |

**TDD compliance: 4/6 fully green, 2 flagged (WARNING-level, non-blocking).** RED traces are visible distributed across `tasks.md` (WU1/WU2 RED-first lists, all `[x]`) and in-file RED annotations; the module's default for a missing consolidated table is CRITICAL, but the intent — every listed spec exists and passes and each names its RED precondition — is independently satisfied, so it is reported as **WARNING (documentation/process)**, not a blocker.

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (pure + component) | 3 files | `preview-fixtures.spec.ts`, `previa.page.spec.ts`, `preview-role-switcher.component.spec.ts` | vitest + TestBed |
| Integration (router / a11y / matrix) | 4 files | `app.routes.spec.ts`, `app.routes.server.spec.ts`, `app.release-matrix.spec.ts`, `app.a11y.spec.ts` | `RouterTestingHarness`, axe-core |
| E2E | 0 | — | not installed |
| **Total changed spec files** | **7** | | |

### Changed File Coverage
Coverage analysis skipped — no coverage tool detected (informational only).

### Assertion Quality
✅ **All assertions verify real behavior.** No tautologies, no orphan-empty checks, no ghost loops (every loop is preceded by an explicit length assertion: `preview-role-switcher...:42,79` and `previa.page.spec.ts:137`), no type-only-only assertions, no CSS-class/implementation coupling. Spies (`session.login`, `session.register`, `router.navigateByUrl`) assert real production calls with concrete values, not call counts.

### Quality Metrics
**Linter**: ✅ No errors · **Type checker**: ✅ `ng build` clean · **Coverage tool**: ➖ not available.

---

## 8. Correctness & Design Coherence

| Decision | Followed? | Evidence |
|---|---|---|
| D1 route shape (one `previa` grouping, `''` + `:role` children) | ✅ | `app.routes.ts:186-210` |
| D2 prerender derivation reuses `prerenderStaticPaths` + explicit `previa/:role` | ✅ | `app.routes.server.ts:27-30,46-51` |
| D3 R2 chrome — accept marketing header/footer + sticky CTA | ✅ | `app.release-matrix.spec.ts:106-120` (locks `app-header`, asserts no `app-platform-header`) |
| D4 sync data path (no store/await/PendingTasks) | ✅ | `previa.page.ts:30-41`; `previa.page.spec.ts:28-33` (one `detectChanges`) |
| D5 shared pure role module (no Angular imports) | ✅ | `preview-fixtures.ts:1-23` |
| D6 `PREVIEW_ROLES` + `resolvePreviewRole` fallback | ✅ | `preview-fixtures.ts:26-33` |
| D7 admin directory drops `password` | ✅ | `preview-fixtures.ts:87-91`; `previa.page.spec.ts:101-109`; built admin HTML no `demo1234` |
| D8 `NOINDEX` on parent + both children; `verify-prerender.ts` untouched | ✅ | `app.routes.ts:188,195,203`; `verify-prerender.ts` unchanged; built `robots=noindex,nofollow` |
| D9 deterministic representative entities | ✅ | `preview-fixtures.ts:73-92` (no `Date.now()`/random) |

**Documented deviation (accepted):** `app.routes.server.ts:50` spreads `[...previewRoleParams()]` because the helper returns `readonly Record<string,string>[]`, which the design's literal snippet couldn't satisfy. Non-behavioral, justified in apply-progress. ✅

**Resolved design Open Questions:** R2 chrome → accepted and locked by test (`app.release-matrix.spec.ts:106-120`). es-AR copy → pinned in `previa.page.ts:38-45` + switcher `.html`. Optional post-build assertion → **not** implemented (see WARNING 1).

---

## 9. Issues Found

### 🔴 CRITICAL (blocks archive)
**None.**

### 🟡 WARNING
1. **No test asserts the built `/previa*.html` is non-empty (or noindex / JSON-LD-free).** The `platform-preview` scenario "Prerendered HTML is non-empty" is covered only at component level (`previa.page.spec.ts:55-75`); no spec reads `dist/Construction-Company-Agency/browser/previa/*.html`, and `verify-prerender.ts:27` intentionally keeps `previa` out of `STATIC_PATHS`. This is the same gap the WU1 fresh review flagged, and it is exactly the optional item the design left open (`design.md:135-136`). **Minimal fix:** add a `node:fs` spec that, after `ng build`, `readFileSync`s `dist/.../previa/index.html` and asserts it contains a known fixture string (e.g. `FEED_POSTS[0].content`) and a `noindex` robots meta — without joining `STATIC_PATHS`.
2. **`apply-progress` has no consolidated TDD Cycle Evidence table** (`#983` covers WU2 only; WU1 has no observation). RED/GREEN traces live distributed in `tasks.md` and in-file RED headers. **Minimal fix:** upsert `sdd/p13-modo-previa/apply-progress` with a RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR table spanning WU1+WU2.

### 🟢 SUGGESTION
1. `roleLabel` is duplicated verbatim in `previa.page.ts:44-45` and `preview-role-switcher.component.ts:46-47`; extract into the pure `preview-fixtures.ts` module.
2. `tasks.md` status lines are stale (`:22` WU1 `pending`, `:45` WU2 `implemented (awaiting verify)`) though all checkboxes are `[x]` and both commits exist; update to `done` before archive.
3. Implementing WARNING 1 would also close the design's only remaining Open Question (`design.md:135-136`).
4. Process: actual `src`/`scripts` change is 830 lines (WU1 +548, WU2 +278) against a `High` workload forecast — consistent with the declared risk; no PR gate applies (stacked local commits).

---

## 10. Delta-Spec Consistency

The four delta specs are internally consistent. `platform-shell` (top-level `previa`, unguarded, structurally separate from `plataforma`) matches `platform-preview` (same shape, NOINDEX partition) and `server-rendering` (`+ PREVIEW_ROLES.length`, `prerenderStaticPaths` keeps `previa`, drops only the platform prefix). `platform-identity` (6 accounts reachable from the switcher, no registration) matches `platform-preview` "Client-only role switcher". No contradictions; the design's two substantive Open Questions are resolved (R2 accepted+locked; copy pinned).

---

## 11. Verdict

**✅ PASS WITH WARNINGS.** All four hard gates pass on fresh execution (652/652 tests / 70 files, lint clean, build emits 25 prerendered routes, `verify:prerender` PASS). Two work units are complete and independently revertible; protected files (`contracts/openapi.yaml`, `contract-conformance.ts`, `angular.json`, `scripts/verify-prerender.ts`) are untouched; the platform-never-prerendered invariant holds; `/previa/{,worker,company,admin}` HTML is non-empty, noindex, and password-free; the switcher is client-only and covers all 6 demo accounts. 35/36 scenarios COMPLIANT, 1 PARTIAL (WARNING 1), 0 UNTESTED, 0 FAILING, 0 CRITICAL. The two WARNINGs are non-blocking.

| Dimension | Status |
|---|---|
| Tasks complete | ✅ 18/18 |
| Spec scenarios compliant | ⚠️ 35/36 COMPLIANT + 1 PARTIAL |
| Strict TDD compliance | ⚠️ 4/6 fully green (2 documentation WARNINGs) |
| Tests / Lint / Build / Prerender | ✅ 652/652 / ✅ / ✅ 25 routes / ✅ |
| Protected files | ✅ untouched |
| Cross-cutting invariants | ✅ all pass |
| CRITICAL / WARNING / SUGGESTION | **0 / 2 / 4** |

**Archive readiness: READY** — proceed to `sdd-archive` (sync the 4 delta specs). Recommended follow-ups before or after archive: add the post-build `/previa` assertion (WARNING 1) and consolidate the TDD evidence table (WARNING 2).
