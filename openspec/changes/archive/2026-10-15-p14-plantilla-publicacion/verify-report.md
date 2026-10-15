# Verification Report — p14-plantilla-publicacion

**Change**: p14-plantilla-publicacion — Base post template (Instagram-like)
**Version**: N/A (delta specs, pre-archive)
**Mode**: Strict TDD
**Verified revision**: branch `feature/p14-plantilla-publicacion` @ HEAD `0ebe311` (WU1 `77e040e` → WU2 `5e45929` → WU3 `c60f8e2` → WU4 `0ebe311`), compared against `origin/main` @ `6d7c349`
**Artifact store**: hybrid — Engram `sdd/p14-plantilla-publicacion/verify-report` + this file

---

## Verdict

**PASS WITH WARNINGS** — all gates green (`706/706` tests, build, lint, full `gate`), every spec scenario traced to a passing covering test except one PARTIAL, all four design invariants hold. Three WARNINGs are process/asset-quality issues (one unproven spec clause, one review-budget report inaccuracy, one demo-media quality gap); **no CRITICAL findings**.

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 20 |
| Tasks complete | 20 |
| Tasks incomplete | 0 |

All 20 tasks in `tasks.md` are checked; each slice's gate task (1.5 / 2.7 / 3.3 / 4.5) is corroborated by real execution below.

---

## Build, Tests & Gates (executed by verifier)

**Tests**: ✅ 706 passed / 0 failed / 0 skipped (74 files)

```text
> bunx ng test --watch=false
 Test Files  74 passed (74)
      Tests  706 passed (706)
   Duration  12.98s
```

**Build**: ✅ Passed (25 static routes prerendered)

```text
> bunx ng build
Prerendered 25 static routes.
Application bundle generation complete. [5.908 seconds]
Output: dist/Construction-Company-Agency
```

**Lint**: ✅ All files pass

```text
> bunx ng lint
Linting "Construction-Company-Agency"...
All files pass linting.
```

**Full release gate** (`bun run gate` = contract:lint + contract:check + lint + test + build + verify:prerender + verify:previa): ✅ ALL PASS

```text
PASS · routes verified: 21 (7 static + 6 services + 8 projects) · heads checked: 21 · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep · no plataforma leak
PASS · previa pages verified: 4 (previa + worker, company, admin) · full row counts · noindex · no demo credential · no plataforma leak
```

**Coverage**: ➖ Not available — `angular.json > test` (`@angular/build:unit-test`) configures no coverage reporter; no coverage threshold exists. Per strict-TDD rules this is informational, not a failure.

**Type check**: ✅ implicit — `ng build` (Angular AOT/TS) compiled clean.

---

## Spec Compliance Matrix

19 scenarios across 3 capabilities. **18/19 COMPLIANT · 1/19 PARTIAL.**

### platform-post-template (NEW)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| R1 Header + follow toggle | Header layout and follow a11y | `post-template.component.spec.ts:156` (name+role, no `authorId`) + `:176` (aria-pressed false→true, "Seguir"→"Siguiendo", `follow:worker-1:company-2`, edge in store) | ✅ COMPLIANT |
| R2 Media grid 1–10 | Grid range and clamp | `:214` (12→10 imgs, `+2`, lazy+alt) · `:235` (11→`+1`, 10→none) · `:226` (1 img) · `:247` (0→block hidden) | ✅ COMPLIANT |
| R2 Media grid 1–10 | Missing media placeholder | `:254` (empty URL → `post-media-placeholder` "Imagen no disponible", **zero** `<img>`) · `:263` (mixed) | ✅ COMPLIANT |
| R3 Actions bar | Like/save toggle through the store | `:286` (like) · `:302` (save) — `aria-pressed` false→true + store records viewer+post | ✅ COMPLIANT |
| R3 Actions bar | Share copies permalink only | `:318` (clipboard called once with `/plataforma`+`post-1`, "Enlace copiado", store `toEqual(stateBefore)` on all 3 selectors) · `:338` (rejection path) | ✅ COMPLIANT |
| R4 Projection slots | Projection keeps the shell | `:384` (projected body+extra over intact header/media/follow/like/share/save, standard body hidden) + `:376` (default body) | ✅ COMPLIANT |
| R5 Zoneless repaint | Store change repaints | `:406` (external `store.toggleLike` → `aria-pressed` true after tick) + `engagement.store.spec.ts:153` | ✅ COMPLIANT |
| R6 Demo-only view-model | Build green without conformance entries | `bunx ng build` ✅; `contract-conformance.ts` and `openapi.yaml` **zero diff** vs `origin/main` (see Invariants) | ✅ COMPLIANT |
| R7 Axe gate | Gate passes | `app.a11y.spec.ts:177` — seeds session, non-vacuous template presence (`>0`), axe `runOnly` `button-name`/`nested-interactive`/`list`/`label` → `[]` violations + per-control accessible-name loop | ✅ COMPLIANT |

### platform-engagement (NEW)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| R1 Swappable adapter | Adapter swap | `ports.spec.ts:208` (provider-only swap; custom adapter read + toggle) + `:188` default resolution + `:194` envelope | ✅ COMPLIANT |
| R2 Follow is a stored edge | Edge persists, no counts | Edge: `mock-engagement.gateway.spec.ts:88` (fresh instance re-hydrates) + `post-template.component.spec.ts:196` (stored edge paints engaged). **"No follower-count/notification UI" has no covering test**; static grep found no such UI. | ⚠️ PARTIAL |
| R3 Like/save persist across reload | State survives reload | `engagement.store.spec.ts:70` (fresh store paints seeded liked) + `gateway.spec.ts:88` (reload) + `ports.spec.ts:194` (save persisted under `{v:1}`) | ✅ COMPLIANT |
| R3 Like/save persist | Storage missing or corrupt | `gateway.spec.ts:96` (corrupt JSON) · `:104` (SSR `localStorage === undefined`, no throw) · `:116` (wrong version) · `:124` (malformed snapshot) · `:132` (missing/non-object state) | ✅ COMPLIANT |
| R4 Signal-based store | Computed selector flips | `engagement.store.spec.ts:94` (toggle→true, toggle→false same tick) + `:108` (null viewer→false) + `:120` (routes through gateway) | ✅ COMPLIANT |

### platform-feed (MODIFIED)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| R1 Feed renders via signals | Async posts paint | `feed.page.spec.ts:45` | ✅ COMPLIANT |
| R1 Feed renders via signals | Loading and empty states | `feed.page.spec.ts:59` · `:89` | ✅ COMPLIANT |
| R1 Feed renders via signals | Inline comment thread per post | `feed.page.spec.ts:330,364,400,416,426,448,461,478` (all 8 prior thread/composer/id/live-region tests retained) | ✅ COMPLIANT |
| R1 Feed renders via signals | Posts render through the shared template | `feed.page.spec.ts:112` (one `app-post-template` per `feed-post` li) · `:132` (denormalized name+role for company AND worker; all 5 `authorId`s absent from textContent) · `:155` (media from fixtures: 10/1/0) · `:176` (session viewer → persisted under `worker-1`) · `:199` (anonymous → no engagement) | ✅ COMPLIANT |
| R2 (ADDED) Fixture media URLs | Fixtures cover the grid range | `fixtures.spec.ts:193` (all attachments absolute `https://`) · `:201` (counts min 1, max 10) | ✅ COMPLIANT (see W-3) |

**Compliance summary**: 18/19 scenarios compliant, 1/19 PARTIAL, 0 FAILING, 0 UNTESTED.

---

## Design Coherence

| Decision | Followed? | Evidence |
|---|---|---|
| **D1** flat `PostView`/`PostKind='standard'` in `models.ts`, not in conformance | ✅ Yes | `domain/models.ts:86` only `'standard'`; conformance grep → no matches |
| **D2** `toPostView` in `mocks/post-views.ts`; `FeedStore` untouched | ✅ Yes | `feed.page.ts:170` `views = computed(() => store.posts().map(toPostView))`; `feed.store.ts` not in diff |
| **D3** port `load()` + 3 `toggle*` resolving full state; adapter owns flip+persist | ✅ Yes | `mock-engagement.gateway.ts:94-121` (readState→mutate→writeState→return copy); store never touches storage |
| **D4** injected store + `viewerId` input; no per-post `computed` in `@for` | ✅ Yes | `post-template.component.ts:48,59` (component-instance-level computeds); `feed.page.ts:87` passes `[viewerId]`; page-level `viewerId` computed at `:167` |
| **D5** `await gateway → state.set()` (no optimistic/rollback) | ✅ Yes | `engagement.store.ts:56-66` — all three `.set(await gateway…)`; no `.update()`/mutate anywhere |
| **D6** plain lazy `<img>` grid clamped to 10 + `+N` | ✅ Yes | `post-template.component.html:32-58`; `MAX_MEDIA = 10` at `:16`; `loading="lazy"`; no `NgOptimizedImage` |
| **D7** thread stays page-side in the `li`; `[postExtra]` free | ✅ Yes | `feed.page.ts:86-146` thread inside `li` after `<app-post-template>`; `[postExtra]` unused |
| **D8** share = clipboard permalink + es-AR feedback; store unchanged | ✅ Yes | `post-template.component.ts:88-95`; asserts store `toEqual(stateBefore)` |
| Zoneless discipline (no manual CD) | ✅ Yes | no `ChangeDetectorRef`/`markForCheck`/`detectChanges` in any changed production file |
| SSR-safe storage (`typeof localStorage === 'undefined'` guard) | ✅ Yes | `mock-engagement.gateway.ts:24-30`; only guarded access; no `window`/`document`/`sessionStorage` in changed files |

---

## Invariants (adversarial audit)

| Invariant | Result | Evidence |
|---|---|---|
| `contracts/openapi.yaml` untouched | ✅ | `git diff origin/main..HEAD -- contracts/` → empty; full `gate` `contract:check` passed |
| `contract-conformance.ts` unaware of `PostView`/`PostKind`/engagement types | ✅ | `git diff origin/main..HEAD -- …/contract-conformance.ts` → empty; `git grep` for those tokens → no matches |
| `angular.json` NOT committed, still modified-but-**unstaged** | ✅ | `git status` → ` M angular.json`, `git diff --cached` empty. Diff is a pre-existing bun/analytics cosmetic change (`analytics: false` + reformatted `schematicCollections`), unrelated to p14 |
| Scope deferrals NOT implemented | ✅ | `PostKind = 'standard'` only; no saved/bookmarks route (`app.routes.ts` unchanged); no feed sort/prioritization (`feed.store.ts`/`feed.page.ts` have no `following`/`.sort`) |
| `feed-post` stays on `li`; thread selectors untouched | ✅ | `feed.page.ts:86` `<li data-testid="feed-post">`; all 8 thread tests retained byte-identical |
| Prerender safety | ✅ (scoped) | `gate` prerendered 25 routes + `verify:prerender`/`verify:previa` PASS. Note: `/plataforma` is a **CSR route** (not prerendered), so SSR-safety is proven by the `stubGlobal('localStorage', undefined)` unit test, not by prerender |

---

## Strict TDD Verification

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | `apply-progress` includes evidence tables for all 4 batches; Batches 3–4 use the extended cycle table (Layer / Safety Net / RED / GREEN / TRIANGULATE / REFACTOR) |
| All tasks have tests | ✅ | 20/20 — 16 implementation tasks map to co-located specs; 4 are gate tasks |
| RED confirmed (tests exist) | ✅ | Every named spec file exists on disk |
| GREEN confirmed (tests pass) | ✅ | 706/706 pass on verifier execution; specific files: template 19/19, gateway 11/11, store 5/5, post-views 7/7, feed 23/23 |
| Triangulation adequate | ✅ | template: 12→`+2`/11→`+1`/10→none/1/0; company vs worker vs fallback author; null viewer; clipboard accept+reject; gateway: corrupt/wrong-version/malformed/SSR; store: guarded load + null viewer |
| Safety Net for modified files | ✅ | 681/681 (WU3) and 700/700 (WU4) baselines reported; `feed.page.spec.ts` old version preserved in git — retained tests proven byte-identical (below) |

**TDD Compliance**: 6/6 checks passed (see S-3 for the one reproducibility caveat).

### RED/GREEN genuineness audit

- **Assertions weakened to pass?** ❌ No. `git diff 6d7c349..HEAD -- feed.page.spec.ts` removed **exactly one line** — the old one-line `afterEach`, replaced by an expanded cleanup block. **Zero assertions deleted, zero selectors weakened.** All 18 prior tests are byte-identical; +5 new tests added (18→23).
- **Coverage dropped in the rewrite?** ❌ No — 18 retained + 5 new.
- **Trivial/tautological assertions?** ❌ None. Every new test drives a click, projection, store write, or fixture inspection and asserts rendered output/state.
- **Ghost-loop risk:** mitigated — `app.a11y.spec.ts` asserts `templates.length > 0` before the per-template name loop (non-vacuous guard); `fixtures.spec.ts` URL loop has a companion non-empty count assertion.

### Test Layer Distribution

| Layer | Tests (p14 files) | Files | Tools |
|-------|-------------------|-------|-------|
| Unit | 28 (post-views 7, fixtures +2, ports +3, gateway 11, store 5) | 5 | Vitest + TestBed |
| Integration | 44 (template 19, feed page 23, a11y +1, release-matrix row) | 4 | Vitest + TestBed + axe-core |
| E2E | 0 | 0 | not installed |
| **Total (p14-related)** | **72** | **9** | runner-reported suite total: **706 / 74 files** |

### Changed File Coverage

Coverage analysis **skipped** — no coverage reporter configured in `angular.json > test`.

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| — | — | — | **No issues found** | — |

**Assertion quality**: ✅ All assertions verify real behavior (no tautologies, no orphan-empty checks, no type-only assertions, no implementation-detail coupling, no mock-heavy tests).

### Quality Metrics

**Linter**: ✅ No errors (all files pass)
**Type Checker**: ✅ No errors (`ng build` AOT clean)
**Coverage tool**: ➖ Not configured

---

## Issues Found

### CRITICAL
None.

### WARNING

- **W-1 — Spec clause "no follower-count or notification UI exists" has no covering test.** `platform-engagement` R2 scenario "Edge persists, no counts" (`specs/platform-engagement/spec.md`) is only half-covered: edge persistence is tested (`mock-engagement.gateway.spec.ts:88`, `post-template.component.spec.ts:196`), but the absence of follower-count/notification UI is asserted nowhere (`git grep -i "follower|notification"` across `*.spec.ts` → no matches). Static inspection confirms no such UI exists, so risk is low, but per Strict TDD the scenario is ⚠️ PARTIAL. *Fix: add an absence assertion (e.g. assert no counter element renders in the header).*

- **W-2 — WU2 exceeds the 400-line review budget and was reported as within it.** `apply-progress` claims "WU2 = 6 files, ~330 changed lines → within the ≤400 per-PR review budget". Actual `git show --numstat 5e45929` = **619 changed lines** (153+122+62+1+171+79), exceeding the `chained-pr` budget. WU3 (618) was correctly self-flagged for `size:exception`; WU2's breach was not. *Fix: acknowledge WU2 alongside WU3 in the size decision, or split the spec files.*

- **W-3 — Fixture media URLs are absolute `https` but point at reserved `example.com`, so they render as broken images.** `fixtures.ts:81,106` use `https://images.example.com/plataforma/*.webp` (IANA-reserved; no binaries). The template's `post-media-placeholder` only handles **empty** URL strings, not load failures, so a real browser will show 11 broken images on `/plataforma`, defeating the spec rationale "so the media grid never references missing binaries" (title: "Fixture media URLs are renderable"). jsdom does not fetch images, so no test catches it. Demo-only data (`isPlaceholder: true`) and a documented design risk, hence WARNING not CRITICAL. *Fix: serve a few real placeholder assets, or add an `(error)` fallback to the placeholder.*

### SUGGESTION

- **S-1 — Spec wording vs design deviation on "computed selectors".** `platform-engagement` R4 says state MUST be "signals with computed selectors"; the implementation uses plain methods (`isFollowing/isLiked/isSaved`) reading `state()`, which design D3/D4 explicitly chose. The scenario (same-tick flip) passes. Consider aligning the spec wording with "signal-reading selectors".
- **S-2 — Report line-count inaccuracy.** `apply-progress` twice states the feed spec is a "374→578-line rewrite"; actual is **374→500** (`--numstat 127/1`). All other line-budget numbers audited exact (WU4 187/13; WU3 618; WU1 187).
- **S-3 — RED-first is trusted, not independently reproducible.** Each work unit is a single squashed commit containing spec + implementation together, so git history cannot prove tests failed before they passed. Reported RED evidence (missing-module build errors) is plausible and consistent (new modules), but no failing-run log is persisted. *Consider committing RED separately or attaching a run log next time.*
- **S-4 — No single test asserts liked **and** saved after a fresh store load.** `engagement.store.spec.ts:70` seeds `liked` only; save persistence is proven separately (`ports.spec.ts:194`, `gateway.spec.ts:63`). Together they cover the scenario; a combined reload assertion would tighten it.
- **S-5 — `/plataforma` is a CSR route, not prerendered**, so the SSR-safety guarantee rests entirely on the `localStorage === undefined` unit test (`gateway.spec.ts:104`) rather than a prerender of the real route. Acceptable by design (the route is auth-gated), noted for completeness.

---

## Verdict

**PASS WITH WARNINGS**

All build/test/lint/gate evidence is green and independently reproduced (706/706, 25 prerendered routes, full `gate` PASS); 18/19 spec scenarios are backed by passing covering tests; all five design invariants (frozen contract, conformance blindness, unstaged `angular.json`, deferrals absent, no manual CD) hold; and the `feed.page.spec.ts` rewrite removed zero assertions. The three WARNINGs are process/asset-quality gaps — none blocks archive, but W-2 (review budget) warrants an explicit size decision and W-1/W-3 are worth closing before `/plataforma` is shown to a real user.
