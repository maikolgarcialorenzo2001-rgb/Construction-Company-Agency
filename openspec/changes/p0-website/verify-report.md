## Verification Report — RE-VERIFY (supersedes the prior ❌ FAIL)

**Change**: p0-website
**Version**: `openspec/changes/p0-website` (7 FULL capabilities, greenfield; 43 requirements / 51 scenarios)
**Mode**: Strict TDD (runner `bunx ng test --watch=false`, vitest 4.1.11 / jsdom)
**Date**: 2026-10-06 (re-run after remediation)
**Base**: `main` @ `5e96067` (20 commits ahead of origin, `90bf11b`…`5e96067`, NOT pushed)
**Prior report**: same path, verdict ❌ FAIL (3 CRITICAL / 6 WARNING / 6 SUGGESTION) @ `69666d5`

### Verdict vs prior run

| | Prior run | This run |
|---|---|---|
| CRITICAL | 3 (C1, C2, C3) | **0** |
| WARNING | 6 (W1–W6) | 4 still open (W3–W6) + 2 new |
| SUGGESTION | 6 (S1–S5 + …) | 5 still open + 4 new |
| Gates | lint ✅ 337 tests ✅ 381.60 kB ✅ | lint ✅ **338** tests ✅ **381.64 kB** ✅ |
| Verdict | ❌ **FAIL** | ✅ **PASS WITH WARNINGS** |

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 48 |
| Tasks complete | 48 (`grep -c '^\- \[x\]'` = 48, `grep -c '^\- \[ \]'` = 0) |
| Tasks incomplete | 0 |
| Commits | 20 (`90bf11b` … `5e96067`), one work unit each |
| Remediation commit | `5e96067` — 5 files, +36/−12 (spec.md, design.md, matrix, not-found, content.spec) |
| Test files | 37 |
| Test cases | **338** |
| Working tree at end of verify | clean (the CLI's `analytics: false` write to `angular.json` was restored) |

### Build & Tests Execution (all gates run by this verifier)

**Lint**: ✅ Passed
```text
$ bunx ng lint
Linting "Construction-Company-Agency"...
All files pass linting.
```

**Tests**: ✅ 338 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
$ bunx ng test --watch=false
 Test Files  37 passed (37)
      Tests  338 passed (338)
   Duration  9.60s
(4× "Not implemented: navigation to another Document" — benign jsdom noise, documented in apply-progress)
```
338 = prior 337 + 1 new test (`content.spec.ts:51 walks the home hero image…`).

**Build**: ✅ Passed — **381.64 kB initial / 103.54 kB transfer**
```text
$ bunx ng build
                    | Initial total       | 381.64 kB | 103.54 kB
angular.json: initial maximumWarning 450kB, maximumError 500kB; anyComponentStyle 4kB/8kB
$ bunx ng build 2>&1 | grep -iE "warning|budget"   → no matches (no budget warning emitted)
Application bundle generation complete. [4.972 seconds]
```
Budget claim VERIFIED: 381.64 kB < 450 kB warn < 500 kB error.

**Coverage**: ➖ Not available
```text
$ bunx ng test --coverage
Code coverage requires either "@vitest/coverage-v8" or "@vitest/coverage-istanbul" to be installed.
```
Informational only (Strict TDD: coverage is never blocking).

---

### Spec Compliance Matrix

| # | Requirement | Scenario | Covering test | Result |
|---|-------------|----------|---------------|--------|
| **site-shell-navigation** |||||
| 1 | Complete es-AR route table | Every route resolves; unknown → 404 | `app.routes.spec.ts:25` · `:114` · `app.release-matrix.spec.ts` | ✅ COMPLIANT |
| 2 | Document language | `lang="es-AR"` | `app.document.spec.ts > declares the es-AR document language` | ✅ COMPLIANT |
| 3 | Header nav + phone | tel: from NAP + link per route | `header.component.spec.ts > links every top-level route…` · `…exactly one phone action…` | ✅ COMPLIANT |
| 4 | Footer NAP single source | NAP values + wa.me + GBP | `footer.component.spec.ts` · `content.spec.ts` NAP scan guard | ✅ COMPLIANT |
| 5 | Sticky CTA suppressed on quote | absent on `/presupuesto`, present elsewhere | `sticky-cta.component.spec.ts > renders nothing on the quote route…` · `…comes back when the user leaves` | ✅ COMPLIANT |
| 6 | End-of-page CTA block (amended) | last main-content section is the CTA on any route **except `/presupuesto`** | `app.release-matrix.spec.ts:114-137` — `cta:true` for `/pagina-que-no-existe` (:32), `cta:false` for `/presupuesto` (:31), nothing may follow the block (:129-135) | ✅ **COMPLIANT** (was ❌ FAILING) |
| 6 | — new scenario | No self-referential CTA on the quote route | `app.release-matrix.spec.ts:120-122` asserts `block === null` on `/presupuesto` | ✅ COMPLIANT |
| **content-model** |||||
| 1 | Typed content is the schema | shape violation fails the build | proven once with a temporary probe (session #793, `TS1360`), removed after; `satisfies` keeps enforcing at build time | ⚠️ PARTIAL (no persistent negative test) |
| 2 | NAP single source of truth | footer / sticky / JSON-LD agree | `content.spec.ts` NAP scan guard + `footer…` + `sticky-cta…` + `json-ld.spec.ts:54` | ✅ COMPLIANT |
| 3 | Image asset contract | **any** ImageAsset: non-empty alt, w/h > 0 | `content.spec.ts:45 contentImages({ site, home, services, projects })` + `:51 toContain(home.hero.image)` + loops `:55`/`:61`/`:68` | ✅ **COMPLIANT** (was ❌ FAILING) |
| 4 | Placeholder convention + release gate | single search finds them; suite/lint/build green | `grep -rn "isPlaceholder" src/` → finds `home.ts:39` etc.; `content.spec.ts:451,458` release gate; 3 gates green | ✅ COMPLIANT |
| 5 | Stable identifiers + integrity | unique slugs, no import-time network | `content.spec.ts:75` slug integrity · `:429` import purity | ✅ COMPLIANT |
| **services-catalog** |||||
| 1 | Catalog completeness 5–7 | size + entry completeness | `content.spec.ts:104` · `:110` | ✅ COMPLIANT |
| 2 | List renders whole catalog | N links in content order | `services-list.page.spec.ts` | ✅ COMPLIANT |
| 3 | Detail resolves by slug | known / unknown | `service-detail.page.spec.ts:30` · `:101` · `:108` | ✅ COMPLIANT |
| 4 | Detail closes with quote path | `/presupuesto` link + ≥1 related project | `service-detail.page.spec.ts:94` · `:61` | ✅ COMPLIANT |
| 5 | Imagery follows shared rules | one priority hero | `service-detail.page.spec.ts:53` + matrix | ✅ COMPLIANT |
| **projects-showcase** |||||
| 1 | Project evidence contract | 8–15 photos, before/after, non-empty fields | `content.spec.ts:152,177,190` | ✅ COMPLIANT |
| 2 | List renders every project | one card per project | `projects-list.page.spec.ts` | ✅ COMPLIANT |
| 3 | Detail renders full evidence | brief/m²/duration/budget/photos + unknown → 404 | `project-detail.page.spec.ts:83,104,123,70,77` | ✅ COMPLIANT |
| 4 | Detail links out to services + quote | related services resolve, CTA last | `project-detail.page.spec.ts:138,155` | ✅ COMPLIANT |
| 5 | Imagery follows shared rules | exactly one priority image | `project-detail.page.spec.ts:92` + matrix (`priority: 1`) | ✅ COMPLIANT |
| **process-trust** |||||
| 1 | Process steps | ordered, complete | `content.spec.ts:223–248` | ✅ COMPLIANT |
| 2 | `/proceso` numbered steps | N steps 1..N + duration | `process.page.spec.ts:35,41,65` | ✅ COMPLIANT |
| 3 | Named, attributed reviews | 3–5 attributed | `content.spec.ts:252,257` | ✅ COMPLIANT |
| 4 | `/testimonios` + GBP link | all reviews + exactly one external link | `testimonials.page.spec.ts:36,72` | ✅ COMPLIANT |
| 5 | Credentials and warranty | 4 credentials + warranty in content | `site.spec.ts:59,68` | ✅ COMPLIANT |
| 6 | `/nosotros` trust payload | story/credentials/warranty/NAP | `about.page.spec.ts:39,45,57,63` | ✅ COMPLIANT |
| 7 | Trust pages end with quote path | CTA last on 3 routes | `process…:80`, `testimonials…:104`, `about…:110` | ✅ COMPLIANT |
| **quote-lead-capture** |||||
| 1 | Field set | exactly 8 controls, no file input | `quote.page.spec.ts:145,177` | ✅ COMPLIANT |
| 2 | Validation blocks submit | invalid → no open + inline errors | `quote.page.spec.ts:209,238,251` | ✅ COMPLIANT |
| 3 | Honeypot silences silently | no open, no success, no error | `quote.page.spec.ts:307` | ✅ COMPLIANT |
| 4 | Consent is mandatory | unchecked → blocked + error | `quote.page.spec.ts:264` | ✅ COMPLIANT |
| 5 | Prefilled WhatsApp deep link | exact href, labels, encoding, photo invite | `quote.page.spec.ts:278,290` + `lead-links.spec.ts:51–133` | ✅ COMPLIANT |
| 6 | Success state phone fallback | visible `tel:` | `quote.page.spec.ts:335` | ✅ COMPLIANT |
| 7 | mailto same payload | body === message | `quote.page.spec.ts:345` + `lead-links.spec.ts:146` | ✅ COMPLIANT |
| 8 | Zero network traffic | 0 requests | `quote.page.spec.ts:355` | ✅ COMPLIANT |
| **seo-analytics-performance** |||||
| 1 | JSON-LD on every indexable route | valid, complete payload | `json-ld.spec.ts:16–106` + `seo.service.spec.ts:110` | ✅ COMPLIANT |
| 2 | JSON-LD from NAP, no leak | no `isPlaceholder`, phone matches | `json-ld.spec.ts:40,54` | ✅ COMPLIANT |
| 3 | Analytics inert without ID | empty/placeholder → no script, no request | `analytics.service.spec.ts:160,175,323` | ✅ COMPLIANT |
| 4 | Consent Mode v2 stub | pre-consent silence | `analytics.service.spec.ts:189` + `consent.service.spec.ts:14` | ✅ COMPLIANT |
| 5 | Three key events, no PII | one event per activation, PII-free | `phone-link…:57`, `whatsapp-link…:63`, `quote…:395`, `analytics…:278` | ✅ COMPLIANT |
| 6 | Image rendering rules | ≤1 priority (exactly 1 where a hero exists), rest lazy | `app.release-matrix.spec.ts:89,98` + page specs | ✅ COMPLIANT |
| 7 | WCAG AA basics | one h1, skip link first, focus visible, contrast | h1/skip link: `app.release-matrix.spec.ts:68,79`; **focus indicator / contrast 4.5:1 / focus order: no covering test** | ⚠️ PARTIAL |
| Release gates | placeholder NAP replaced pre-release (non-blocking) | grep + green gates | `grep` works, README documents it | ✅ COMPLIANT |

**Compliance summary**: **41/43 requirements COMPLIANT**, 2 PARTIAL, **0 FAILING** (was 39/43, 2 FAILING).

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Route table exactly 10, all lazy, no guards | ✅ Implemented | `app.routes.ts` — 9 `INDEXABLE` + 1 `NOINDEX` |
| NAP only in `content/site.ts` | ✅ Implemented | scan guard in `content.spec.ts` walks all `src/**/*.{ts,html}` |
| No component styles (D5) | ✅ Implemented | `grep -rn "styleUrl\|styles *:\s*\[" src/` → only the comment at `app.ts:12` |
| Zero `src/app/ui/` paths | ✅ Implemented | 0 hits in `src/`, `openspec/`, `README.md` |
| No unsuffixed component/page classes | ✅ Implemented | 25 exported classes: 12 `*Component`, 12 `*Page`, 3 `*Service`, 1 `App` — no component/page without its suffix |
| Release gate `isPlaceholder` | ✅ Implemented | `grep -rn "isPlaceholder" src/content/` finds `home.ts:39`, `site.ts:24`, … |
| GA4 double gate (real id ∧ consent) | ✅ Implemented | `analytics.service.ts` id gate before consent registration |
| Budgets 450/500 | ✅ Implemented | `angular.json:43-44`, build 381.64 kB |
| Detail pages can never render two CTAs | ✅ Implemented | `project-detail.page.html:107-111` / `service-detail.page.html:66-70`: `<app-cta-block>` and `<app-not-found />` sit in **mutually exclusive `@if`/`@else` branches** |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 Reactive forms | ✅ Yes | `quote.page.ts:70` `inject(NonNullableFormBuilder)` |
| D2 Runtime JSON-LD injection | ✅ Yes | `seo.service.ts:149 writeJsonLd(url)` via `DOCUMENT`, one script rewritten |
| D3 Reuse `NotFoundPage` | ✅ Yes | `<app-not-found />` in both detail pages + `**` route |
| D4 Consent stub | ✅ Yes | `ConsentService` defaults denied; no tag until grant |
| D5 Zero component styles | ✅ Yes | grep across `src/` → no `styleUrl` / `styles[]` in any component |
| D6 System font stack | ✅ Yes | `styles.css:26` `--font-sans`, no `@font-face`, no webfont request |
| D7 `@defer (on viewport)` gallery only | ✅ Yes | exactly one `@defer` block: `photo-gallery.component.html:3` |
| D8 Pure format helpers | ✅ Yes | `core/format.ts:28,44,52` |

---

### Strict TDD sections

#### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | `apply-progress` (Engram #792, rev 9) carries **"TDD Cycle Evidence (added at verify-remediation, Fix 5)"** — **11 slice rows** (S1…S10b), not 12 as claimed |
| All tasks have tests | ✅ | 48/48: 39 behavior tasks → `*.spec.ts`; 9 `[C]` data tasks (T2.1, T2.2, T3.1, T3.3, T5.1, T6.1, T7.1, T7.2, T8.1) → `satisfies`/`ng build` + `content.spec.ts` |
| RED confirmed (tests exist) | ✅ | **35/35** RED spec paths listed in the table exist in the tree (`testimonial-card.component.spec.ts` verified at its nested path) |
| GREEN confirmed (tests pass) | ✅ | all 11 GREEN commits exist in history (`90bf11b`, `f816d5b`, `f74c7af`, `57d8338`, `e82dc91+72fdab8+f88592a`, `377f462+115c6b1+b484e16`, `3907c00`, `d75e14c`, `f8ac598`, `ddb94df`, `69666d5`); 338/338 pass on execution |
| RED-before-GREEN plausibility | ⚠️ | 34/35 RED specs were **added by (or before) their claimed GREEN commit**; `app.config.spec.ts` was claimed in the **S10a** row but was added in **`69666d5` (S10b)** → **N3** |
| Triangulation adequate | ⚠️ | the table has no TRIANGULATE column — triangulation evidence stays narrative (session summaries #793/#799/#800) |
| Safety Net for modified files | ⚠️ | no SAFETY NET column; `app.spec.ts` (pre-existing scaffold, extended in S4) and `content.spec.ts` (pre-existing, extended S5–S7) have no recorded safety net |
| Honest exclusions | ✅ | `f7ed64b` explicitly flagged **NOT TDD** (rename carries no behavior); remediation `5e96067` disclosed as report-driven, not a fresh RED-first cycle |

**TDD Compliance**: 5/8 checks passed → **no CRITICAL** (the module's CRITICAL trigger is *no table*; the table exists and every listed file/commit checks out except one attribution).

#### Test Layer Distribution

| Layer | Tests (approx.) | Files | Tools |
|-------|------|-------|-------|
| Unit (pure fns, content contracts, lookups) | ~133 | 9 | vitest (no TestBed) |
| Integration (component + router + DOM) | ~205 | 28 | TestBed, `RouterTestingHarness` |
| E2E | 0 | 0 | not installed (no playwright/cypress/axe/lighthouse in `package.json`) |
| **Total** | **338** | **37** | |

(File-level split exact; test-level split approximate — derived from `it(` counts + `it.each` expansion.)

#### Changed File Coverage
Coverage analysis skipped — no coverage tool detected (`@vitest/coverage-v8` missing). Informational, not blocking.

#### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `src/app/app.release-matrix.spec.ts` | 103–110 | `for (const image of images) … expect(loading).toBe('lazy')` | Ghost loop (unchanged): the 5 image-less routes (`/presupuesto`, `/proceso`, `/testimonios`, `/nosotros`, 404) have **zero** `<img>` in `<main>`, so the body never runs there. Companions cover the real images: `service-card.component.spec.ts:67`, `project-card.component.spec.ts:98`, `photo-gallery.component.spec.ts:134` | WARNING (=W4, open) |
| `src/app/app.spec.ts` | 17–21 | `expect(app).toBeTruthy()` | Smoke test — `TestBed.createComponent` already throws on failure; proves nothing about behavior | WARNING (new, N4) |
| `src/app/app.spec.ts` | 23–28 | `expect(compiled.querySelector('router-outlet')).toBeTruthy()` | Smoke test — superseded by the behavioural assertions at `:43-52` and `:69-81` | WARNING (new, N4) |
| `src/app/pages/home/home.page.spec.ts` | 47 | `expect(priority[0].getAttribute('alt')).toBe(home.hero.image.alt)` | Vacuous equality in isolation, but **now backed by `content.spec.ts:55`** which fails on any empty alt in the graph → no longer a hole | ✅ OK (was WARNING) |
| `sticky-cta…spec.ts:72-74`, `photo-gallery…spec.ts:97,112-120` | — | `className` / `classList` assertions | Requirement-encoded: T4.4 / T6.3 ACs literally name `sm:hidden`, `pb-[env(safe-area-inset-bottom)]`, `aspect-[4/3]` | ✅ OK |

Tautologies (`expect(true).toBe(true)`): **0**. `vi.mock()` anywhere: **0** (664 `expect` calls, real services + spies → mock/assertion ratio 0). `toBeInTheDocument` smoke: **0**. Every "empty" assertion has a companion non-empty test (`expectUniqueSlugs` asserts non-empty first; `services ≥5`, `projects ≥3`, `steps ≥4`, `testimonials ≥3`).

**Assertion quality**: 0 CRITICAL, 3 WARNING (1 carried, 2 new).

#### Quality Metrics
**Linter**: ✅ No errors (`All files pass linting`)
**Type Checker**: ✅ No errors (`ng build` = `tsc` + AOT templates, green)

---

### Issues Found

#### CRITICAL

**None.** All three prior CRITICALs are RESOLVED (adjudicated below).

##### C1 — RESOLVED ✅ (`site-shell-navigation` Req 6 / `/presupuesto` + 404)

Claim-by-claim verification:

| Claim | Evidence | Verdict |
|---|---|---|
| spec line reads "Every route EXCEPT `/presupuesto`…" | `specs/site-shell-navigation/spec.md:85` | ✅ exact (claim said :83; actual :85) |
| updated scenario | `:87-91` "GIVEN any top-level route other than `/presupuesto`" | ✅ |
| new scenario | `:93-97` "No self-referential CTA on the quote route" | ✅ |
| new AC row `2a` | `:110` "CTA closes every route except `/presupuesto` (404 included)" | ✅ |
| 404 renders `<app-cta-block>` last | `pages/not-found/not-found.page.ts:24` (inside `<section>`, after the home link) | ✅ |
| no detail page can end with **two** CTAs | `project-detail.page.html:107` (CTA) vs `:110` (`<app-not-found />`) are in `@if` / `@else`; same structure `service-detail.page.html:66` / `:69`. `grep app-cta-block` → exactly one per resolved branch | ✅ impossible by structure |
| matrix flipped | `app.release-matrix.spec.ts:32` `/pagina-que-no-existe` → `cta: true`; `:31` `/presupuesto` stays `cta: false` | ✅ |
| suite green | 338/338, including `:114 closes every page with the CTA block…` | ✅ |

**Adjudication of the spec amendment: LEGITIMATE — not a weak assertion.** Evidence:
1. **The exemption was pre-planned, not retrofitted.** `tasks.md:114` (T10.6) read `cta-block last (except /presupuesto)` at `69666d5` — *before* the verify run; `tasks.md` was **not** touched by the remediation commit (`git show --stat 5e96067` = design.md, spec.md, matrix, not-found, content.spec only).
2. **Req 5 proves exceptions are written deliberately in this spec**: `spec.md:69` "A sticky CTA MUST be visible on every route EXCEPT `/presupuesto`, where the form is already the primary action" — same rationale, written at spec time by the same author.
3. **The genuinely invented exception (the 404) was fixed in CODE, not in the spec.** The prior report's strongest objection — "`**`/404 exception was invented at apply time" — is answered by adding the CTA to `not-found.page.ts` and flipping the matrix. The spec now only carries the exception that was already in the plan.
4. **The amendment is fully recorded**: requirement text + 2 scenarios + AC row 2a, and the matrix asserts the negative case (`block === null` on `/presupuesto`), so the exemption is *tested*, not just asserted.

Residual: `proposal.md:78` still says "CTA block ends **every** page" → **S7** (align the proposal wording at archive).

##### C2 — RESOLVED ✅ (`content-model` Req 3 now covers `home.hero.image`)

| Claim | Evidence | Verdict |
|---|---|---|
| walk includes `home` | `content.spec.ts:45` `contentImages({ site, home, services, projects })` | ✅ |
| focused assertion | `content.spec.ts:51-53` `expect(images).toContain(home.hero.image)` | ✅ (reference identity — proven below) |

**Proved it bites (read-only probe, `bun -e` against the real modules):**
```text
total images: 80
home.hero.image in walk (reference identity): true
empty-alt/zero-width asset detected by walk: true
alt of broken: ""  width: 0
```
Trace of each mutation:
- `home.hero.image.alt = ''` → `isImageAsset` (`lookup.ts:44`) only type-checks, so the asset stays in the walk → **`content.spec.ts:55-59` fails** (`"alt is empty for …"`).
- `width = 0` → still an `ImageAsset` by type → **`content.spec.ts:61-66` fails** (`toBeGreaterThan(0)`).
- `home` removed from line 45 again → **`content.spec.ts:51-53` fails** (`toContain` misses).
- The walk is now **complete**: `ImageAsset` appears only in `Site` (logo, ogImage), `Service.image`, `Project.photos[].image`, `HomeContent.hero.image` (`content.types.ts:79,80,102,108,157`); `Testimonial`/`ProcessStep` carry no images. **Guard is NOT vacuous.**

##### C3 — RESOLVED ✅ (`TDD Cycle Evidence` table exists)

- Table present in Engram #792 (`sdd/p0-website/apply-progress`, rev 9): `## TDD Cycle Evidence (added at verify-remediation, Fix 5)` with columns *Slice / RED spec / What went RED / GREEN commit*.
- **11 data rows** (S1, S2, S3, S4, S5, S6, S7, S8, S9, S10a, S10b) — the "12 rows" claim is off by one.
- `f7ed64b` explicitly flagged **NOT TDD** ("a rename carries no new behavior, so no RED was possible") ✅.
- All 35 RED spec paths exist; all 11 GREEN commits exist; 34/35 attributions verified against `git log --diff-filter=A`; **1 mismatch → N3**.
- No fabricated RED found: every listed spec file's first appearance is at or before its claimed GREEN commit.

#### WARNING

- **W1 — RESOLVED ✅ — hybrid store drift.** Engram #791 `sdd/p0-website/tasks` now opens with the `components/<name>/<name>.component.*` + `pages/…/*.page.*` convention, shows **48/48 `[x]`**, uses `components/layout/header`, `NotFoundPage`, and closes with an explicit note that the old no-suffix/`ui/…` scheme "is deprecated and superseded by the on-disk `openspec/…/tasks.md`, which is the source of truth". Engram #790 `sdd/p0-website/design` mirrors the on-disk design (`buildJsonLd(site, pageUrl)`, `not-found.page.ts` inline-template note, `validators.ts`, `signal(false)`, per-slot `sizes`, the release-matrix row "(the 404 included)") and carries the same supersession note. Verified by full `mem_get_observation` reads of #790 and #791.
- **W2 — RESOLVED ✅ — `design.md` stale claims.** All verified in `5e96067`'s diff and in the current file:
  | stale claim | now | evidence |
  |---|---|---|
  | `buildBusinessJsonLd(nap, extras)` | `buildJsonLd(site, pageUrl)` | `design.md:83` |
  | `not-found.page.ts\|.page.html\|.page.spec.ts` | `not-found.page.ts … (inline template; no own spec — checked by app.routes.spec.ts + release matrix)` | `design.md:96` |
  | `signal<'idle'\|'sent'>('idle')` | `signal(false)` | `design.md:193` |
  | `sizes="(min-width: 768px) 33vw, 100vw"` | heroes `45vw`, cards/gallery `50vw` per slot | `design.md:282` = matches `photo-gallery…html:12`, `project-detail…html:40,59,75`, `service-detail…html:32` |
  | `core/lead/validators.ts` missing | added to the file map | `design.md:81` |
- **W3 — STILL OPEN ⚠️ — T6.1 says "3–4 projects", `content/projects.ts` ships 8.** `tasks.md:78` unchanged (`projects.ts: 3–4 projects…`). No spec imposes a project count (only services 5–7, reviews 3–5, steps ≥4 are bounded); `content.spec.ts:154` asserts only `≥ 3`. **Severity: low** — a task-text deviation that *over*-delivers; fix the wording during `sdd-archive`.
- **W4 — STILL OPEN ⚠️ — ghost loop in the release matrix.** `app.release-matrix.spec.ts:103-110` never executes on the 5 image-less routes (`/presupuesto`, `/proceso`, `/testimonios`, `/nosotros`, 404 — each has 0 `<img>` in its template). Severity stays WARNING (not CRITICAL) because the lazy contract is genuinely exercised by non-empty companion fixtures: `service-card.component.spec.ts:67`, `project-card.component.spec.ts:98`, `photo-gallery.component.spec.ts:134`, plus `service/project-detail` hero specs.
- **W5 — STILL OPEN ⚠️ — Req 7 focus indicator / contrast 4.5:1 / focus order untested.** `grep -rniE "focus-visible|contrast|axe|lighthouse" --include="*.spec.ts" src/` → only `quote.page.spec.ts:196` (`tabindex="-1"` on the honeypot). No aXe/Lighthouse/playwright in `package.json`. **Adjudication: NOT a verify-blocking gap** — `design.md`'s "Not unit-tested (by design)" list covers CSS visual regressions and Lighthouse field metrics, and Req 7 is graded ⚠️ PARTIAL, not FAILING. **But it is not yet a *documented manual gate* either**: README's Release gate section (lines 56–65) lists only lint/test/build/grep. Before release, add an aXe/Lighthouse pass (focus-visible, 4.5:1 body contrast, focus order) to the README gate and run it once.
- **W6 — STILL OPEN ⚠️ — `home.isPlaceholder` asserted nowhere.** Release gate walks `site` only: `content.spec.ts:451` and `:458` `collectPlaceholderFlags(site)`. `grep -rn "home.isPlaceholder"` across `src/**` → 0 hits (`home.page.spec.ts` asserts nothing about it). The flag exists (`home.ts:39`) and **the README grep gate still finds it** (`grep -rn "isPlaceholder" src/content/` → `home.ts:39:  isPlaceholder: true`), so Req 4's discoverability holds; only the automated "home is flagged" assertion is missing. Deleting `home.ts:39` would fail no test.
- **NEW N3 — TDD evidence table has one factual error.** Engram #792 TDD table, **S10a row** lists `app.config.spec.ts` as a RED spec with GREEN `ddb94df`, but `git log --diff-filter=A -- src/app/app.config.spec.ts` → **`69666d5` (S10b)**, and `git show --stat ddb94df` contains no such file. The file exists and passes; only the attribution is wrong (S10b is the row that actually introduced it — `app.config.spec.ts` tests the `provideAppInitializer` wiring that S10b added). Also: the table has 11 rows, not 12, and no TRIANGULATE / SAFETY NET / REFACTOR columns.
- **NEW N4 — two scaffold smoke tests.** `app.spec.ts:17-21` (`expect(app).toBeTruthy()`) and `:23-28` (`router-outlet` `toBeTruthy()`). They prove nothing beyond what `TestBed.createComponent` already guarantees and are superseded by the behavioural tests at `:30-81`. Harmless, but per the assertion-quality rules they are smoke-test-only → WARNING (low). The remaining 662 assertions are behavioural.

#### SUGGESTION

- **S1 — STILL OPEN.** README `:62` greps `src/content/` while `design.md:297` and `tasks.md:114` say `src/`. (README's narrower path still finds every placeholder — verified — but the three texts disagree.)
- **S2 — STILL OPEN.** `design.md:223` `isRealGa4Id` regex `/^G-[A-Z0-9]{6,}$/` is stale *and* self-contradictory (its own comment claims `G-XXXXXXX` → false, but `{6,}` accepts it). Implementation `analytics.service.ts:51` uses `/^G-[A-Z0-9]{10}$/` + placeholder markers.
- **S3 — STILL OPEN.** `design.md:165-166` `HomeContent` listing still omits `isPlaceholder?: true` (`content.types.ts:163` declares it). Design prose `:176` states the intent, so only the interface listing is stale.
- **S4 — PARTIALLY FIXED.** `core/lead/validators.ts|.spec.ts` was added (`design.md:81`), and `lookup.spec.ts` is covered via `design.md:101` (`lookup.ts|.spec.ts`). Still missing from the file map: `environments/environment.token.ts`, `app.document.spec.ts`, `app.config.spec.ts`, `site.spec.ts`, `quote-options.spec.ts`. Sync during archive.
- **S5 — STILL OPEN.** `tasks.md:114` T10.6 still says "one `priority` image" where the matrix enforces per-route expected counts (`≤1`, exactly 1 where a hero exists). Prior adjudication (b) already accepted the *matrix*; only the task wording is loose.
- **NEW S6 — matrix comment now contradicts its own data.** `app.release-matrix.spec.ts:13-14` reads "the quote page owns its own form, so it is the only route that ends without one — **the wildcard route included**", which reads as "the 404 also ends without a CTA", while `:32` sets it `cta: true`. Introduced by `5e96067`. Reword to e.g. "…the only route that ends without one; the wildcard route now closes with it too."
- **NEW S7 — proposal wording.** `proposal.md:78` "CTA block ends **every** page" now over-arches amended Req 6. Align to "…every page except the quote route" during archive so proposal/spec stay consistent.
- **NEW S8 — slug-miss detail path has no direct CTA assertion.** `service-detail.page.spec.ts:101` / `project-detail.page.spec.ts` assert `app-not-found` is truthy but not that the branch closes with exactly one CTA. Covered indirectly (the wildcard route renders the same component with `cta: true`, and the `@if/@else` structure makes a double CTA impossible), so a cheap `expect(...querySelectorAll('app-cta-block')).toHaveLength(1)` on the slug-miss branch would close it.

### Adjudication of flagged apply-time deviations (updated)

| # | Deviation | Verdict | Reasoning |
|---|-----------|---------|-----------|
| a | wildcard/404 had no `app-cta-block` | ✅ **fixed in code** | 404 now renders the CTA (`not-found.page.ts:24`), matrix `cta: true`, Req 6 amended only for `/presupuesto` (pre-planned in `tasks.md:114`) → **C1 resolved** |
| b | matrix asserts `priority ≤ 1` (per-route exact counts) | ✅ acceptable | Req 6 body + scenario conditioned on "a page with a hero image"; matrix is stronger than the requirement. T10.6 wording still loose → **S5** |
| c | `buildJsonLd(site, pageUrl)` | ✅ acceptable | spec Req 1 needs `url`/`image`/`sameAs`; design line fixed → **W2 resolved** |
| d | `override()` clears on `NavigationStart` | ✅ acceptable | more correct than design's prose; covered by `seo.service.spec.ts:74,126` |
| e | `sanitize()` stricter than AC | ✅ acceptable | defense in depth; `analytics.service.spec.ts:278` |
| f | file-structure rename | ✅ **fully consistent now** | `openspec/`, `src/` **and** Engram #790/#791 all on the new convention → **W1 resolved** |
| g | `home.ts` `isPlaceholder` on the entry type | ✅ acceptable | matches design `:176`; interface listing stale → **S3**; unasserted → **W6** |

### Verdict

# ✅ PASS WITH WARNINGS

**Status: PASS.** Zero CRITICAL findings: the three prior CRITICALs are resolved and independently re-verified (spec amendment adjudicated as legitimate and pre-planned; the image-contract guard proven to bite by a read-only probe; the TDD Cycle Evidence table present with every listed file/commit cross-checked). All gates green — lint ✅ · **338/338 tests** ✅ · **381.64 kB / 103.54 kB** build (no budget warning) ✅ · D5 holds · 41/43 requirements COMPLIANT, 2 PARTIAL, 0 FAILING. **6 warnings remain** (W3, W4, W5, W6 pre-existing; N3 TDD-table attribution; N4 smoke tests) and 9 suggestions — all documentation/test-depth items that do not block release, none of them spec violations.
