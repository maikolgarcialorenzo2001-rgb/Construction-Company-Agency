# Archive Report: p8-warnings-closure

`p8-warnings-closure` is complete and archived. It closed the warnings carried from `p6-registro-role-picker-promo` (**S1, W1, S2**) and `p7-role-aware-nav` (**W1, S1**) as a **quality-only change with zero runtime behavior change**: one template de-drift plus test-config/coverage strengthening. The rendered DOM is **byte-identical**. Verify passed **PASS (0 CRITICAL)**. **0 capabilities MODIFIED** — **no spec delta existed** and spec sync was intentionally skipped; `openspec/specs/**` and `contracts/openapi.yaml` were not touched.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p8-warnings-closure` (close carried warnings p6-S1/W1/S2 + p7-W1/S1 — template de-drift + test-strengthening) |
| Verify verdict | **PASS** (0 CRITICAL; 1 minor WARNING on untracked non-change files) — `verify-report.md` |
| Work units | 3/3 complete — `8a575d3` (WU1), `86f535c` (WU2), `a38697c` (WU3), each ≪400 lines, tagged `(p8-warnings-closure)` on `main` |
| Tasks | 16/16 complete (1.1–1.4, 2.1–2.6, 3.1–3.4, 4.1–4.2) |
| Tests | 521/521 green (baseline 518 → +3 new tests + 1 assertion); `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` clean (AOT + strict TS + strictTemplates, 21 prerendered routes) |
| Capability changes | **0 MODIFIED** — spec sync skipped (no delta spec existed; see below) |
| Contract | `contracts/openapi.yaml` byte-identical across all commits (blob `2015c174…`, same as p5 archive) |
| Archive location | `openspec/changes/archive/2026-10-12-p8-warnings-closure/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p8-warnings-closure/archive-report` |
| Remote state | local commits only — **not pushed**, no PR/issue created (`main...origin/main [ahead 65]`) |

## Change summary

| Warning | Source | What it was | What closed it |
|---|---|---|---|
| **S1** | p6 | Header marketing CTA hardcoded `routerLink="/plataforma/registro"`, while the model `site.promo.ctaPath` (`content/site.ts:72`) was declared but unused → drift. | `8a575d3` — `header.component.html:51` now binds `[routerLink]="site.promo.ctaPath"`. Rendered DOM href is byte-identical (`ctaPath === '/plataforma/registro'`); existing approval test unchanged and green. |
| **W1 + S1** | p6 + p7 | `app.a11y.spec.ts` `TARGET_PATHS` listed marketing routes only; all `/plataforma/**` routes were axe-unscanned. | `86f535c` — added `/plataforma`, `/plataforma/login`, `/plataforma/registro` (13 routes total), seeded a demo company session in `beforeEach` **before** `TestBed.createComponent(App)` and cleared it in `afterEach`. |
| **S2** | p6 | `header.component.spec.ts` iterated `site.promo.plans` after a length check with no explicit non-empty guard (ghost-loop risk). | `8a575d3` — `expect(site.promo.plans.length).toBeGreaterThan(0);` added before the `forEach`. |
| **W1** | p7 | `platform-header.component.spec.ts` proved session reactivity via seeded storage + `role` seam; real `SessionService.login()` was untested. | `a38697c` — two real-login tests (company + worker) drive `await TestBed.inject(SessionService).login(...)` and assert the role-aware nav labels. |

Out of scope (unchanged, no code): **p7-W2 / p7-S2** (doc-only historical nits), any production logic beyond the CTA binding, new routes/guards/features, and `contracts/openapi.yaml`.

## Capability changes: 0 MODIFIED (spec sync skipped)

**No delta spec existed and no `openspec/specs/**` file was modified.** The change folder contained `explore.md`, `proposal.md`, `tasks.md`, `apply-progress.md`, `verify-report.md` — **no `specs/` directory**. This is intentional per the proposal's *Spec Delta Decision* ("No spec delta; 0 capabilities MODIFIED … Mirrors `p5-warnings-closure`, which archived with no spec sync"), and the archive step therefore performed **no spec merge**.

**Rationale.** Every fix changes *test configuration, test coverage, or a behavior-preserving template binding* — not specified behavior. The CTA now reads from its declared model source with a byte-identical rendered href; the a11y suite scans three more routes that were always expected to be accessible; the plans guard and the real-`login()` test strengthen existing evidence. No contract, route, status code, or runtime behavior changed, so a delta would be a no-op clarification at best — hence **0 capabilities MODIFIED, no sync**. No spec was invented.

## Accepted warnings

| # | Warning | Disposition |
|---|---|---|
| **W1** | No new executable behavior to verify. The change is test-strengthening + a behavior-preserving binding, so the verify phase could not execute new behavior. | **Accepted explicitly.** Verification rests on (a) full suite green (521/521), (b) mutation proofs reproduced from apply-time (CTA `ctaPath` flip → spec fails; worker-nav-as-company flip → fails), and (c) build + lint gates green. A limitation of the change's nature, not a defect. |
| **W2** | Working tree carries untracked local files (`fg.json`, `HANDOFF.md`) unrelated to the change. | **Accepted, out of scope.** Neither is part of the change; both are left untracked per constraints (this archive commit does not stage them). Not a verification defect. |

## Carried-warning ledger update

Source: p6 apply-progress/verify carried warnings + p7 apply-progress/verify carried warnings.

| Item | Status after this change | Closed by / evidence |
|---|---|---|
| **p6-S1** — Header CTA drift vs `ctaPath` | **CLOSED** | `8a575d3` — CTA bound to `site.promo.ctaPath`, DOM byte-identical. |
| **p6-W1** — platform routes unscanned for a11y | **CLOSED** | `86f535c` — 3 platform routes added to `TARGET_PATHS`, session seeded, storage cleared. |
| **p6-S2** — no explicit non-empty plans guard | **CLOSED** | `8a575d3` — `toBeGreaterThan(0)` guard added before the `forEach`. |
| **p7-W1** — real `SessionService.login()` untested | **CLOSED** | `a38697c` — company + worker real-login tests. |
| **p7-S1** — a11y coverage gap on authenticated route | **CLOSED** | `86f535c` — `/plataforma` scanned with a seeded session (verified as the feed, not a login redirect). |
| **p7-W2 / p7-S2** — doc-only historical nits | **REMAINS a documentation nit (no code)** | Out of scope by proposal decision; no behavioral impact. |

With these closed, **no code-carrying warnings from `p6` or `p7` remain open**; p7-W2/S2 are documentation nits only.

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `8a575d3` | WU1 `fix(header): bind promo CTA to ctaPath (p8-warnings-closure)` — `header.component.html` (+1), `header.component.spec.ts` (+1) |
| `86f535c` | WU2 `test(a11y): scan platform routes with seeded session (p8-warnings-closure)` — `app.a11y.spec.ts` (+27) |
| `a38697c` | WU3 `test(platform): cover real SessionService.login (p8-warnings-closure)` — `platform-header.component.spec.ts` (+12) |
| this commit | `docs(openspec): archive p8-warnings-closure with no spec sync (p8-warnings-closure)` — report written, folder moved to `archive/2026-10-12-p8-warnings-closure/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed. `angular.json` (incidental `M`) deliberately **not** committed; `HANDOFF.md`/`fg.json` left untracked.

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p8-warnings-closure/explore` |
| Proposal | `proposal.md` | `sdd/p8-warnings-closure/proposal` |
| Spec (delta) | *(none — 0 capabilities MODIFIED, no `specs/` dir)* | — |
| Design | *(intentionally skipped — no behavior change)* | — |
| Tasks | `tasks.md` | `sdd/p8-warnings-closure/tasks` |
| Apply progress | `apply-progress.md` | `sdd/p8-warnings-closure/apply-progress` |
| Verify report | `verify-report.md` | `sdd/p8-warnings-closure/verify-report` |
| Archive report | `archive-report.md` | `sdd/p8-warnings-closure/archive-report` (this save) |

## Checklist

- [x] No spec sync performed — **0 capabilities MODIFIED** (intentional; no delta artifact existed — change had no `specs/` dir)
- [x] `openspec/specs/**` untouched; `contracts/openapi.yaml` untouched (blob `2015c174…`)
- [x] Change folder moved to `openspec/changes/archive/2026-10-12-p8-warnings-closure/` with all present artifacts (explore, proposal, tasks, apply-progress, verify-report, this report)
- [x] Active `openspec/changes/` directory no longer contains `p8-warnings-closure/`
- [x] Entire moved archive directory staged (`git add`) so artifacts are **tracked**, not left untracked (prior incident `4802f19` avoided)
- [x] Engram archive report saved as `sdd/p8-warnings-closure/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `angular.json`, no `contracts/`, no `HANDOFF.md`, no `fg.json`, no push, no PR

## Next steps

The frontend warnings carried from `p6`/`p7` are now closed. No code-carrying warnings remain open; p7-W2/S2 are documentation nits only. Ready for the next planned change.

## SDD cycle complete

explore → proposal → tasks → apply → verify → archive. (`sdd-spec` and `sdd-design` were intentionally skipped — 0 capabilities MODIFIED, no behavior change.) All four in-scope carried warnings are closed with verified evidence; the archive preserves the full audit trail. SDD cycle complete.
