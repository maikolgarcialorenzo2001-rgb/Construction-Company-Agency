# Archive Report: p1-ssr-prerender

Change `p1-ssr-prerender` is complete and archived. Verify passed with **PASS WITH WARNINGS** (0 CRITICAL; 13/18 spec rows COMPLIANT, 3 PARTIAL, 2 UNTESTED — both UNTESTED rows resolved by explicit acceptance annotation below), and the 2 capability deltas (server-rendering created, seo-analytics-performance reqs 8–13 appended) are now the source of truth under `openspec/specs/`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p1-ssr-prerender` (build-time prerender + hydration, Option B, es-AR) |
| Verify verdict | PASS WITH WARNINGS (`verify-report.md` + Engram #827, tip `64137ca`) |
| Tasks | 14/14 deliverables complete (3 RED→GREEN process sub-checkboxes open → follow-up c) |
| Specs | 2 capabilities · 13 requirements / 17 scenarios (6 SR + 6 SEO 8–13) |
| Final gates (run by this archive phase) | lint pass · **364/364 tests pass** · 21-route build · verify script exit 0 |
| Archive location | `openspec/changes/archive/2026-10-08-p1-ssr-prerender/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Final gate (run by this archive phase)

| Gate | Result |
|---|---|
| `bunx ng lint` | `All files pass linting` (incl. `scripts/**/*.ts`) |
| `bunx ng test --watch=false` | **41 files, 364 tests, 0 failed** |
| `bunx ng build` | **21 static routes prerendered**, no budget warning (450 kB warn / 500 kB error) |
| `bun scripts/verify-prerender.ts` | **PASS** · 21 routes · 21 heads · CSR fallback ok · no localhost · `server.ts` absent · exit 0 |
| Working tree | only `openspec/` modified/untracked; `angular.json`, `src/`, `scripts/` untouched |

## Artifacts read (audit trail)

| Artifact | File | Engram observation |
|---|---|---|
| Explore | `openspec/changes/p1-ssr-prerender/explore.md` | #814 `sdd/p1-ssr-prerender/explore` |
| Proposal | `openspec/changes/p1-ssr-prerender/proposal.md` | #815 `sdd/p1-ssr-prerender/proposal` |
| Specs (2 deltas) | `openspec/changes/p1-ssr-prerender/specs/*/spec.md` | #817 `sdd/p1-ssr-prerender/spec` |
| Design | `openspec/changes/p1-ssr-prerender/design.md` | #818 `sdd/p1-ssr-prerender/design` |
| Tasks | `openspec/changes/p1-ssr-prerender/tasks.md` | #820 `sdd/p1-ssr-prerender/tasks` |
| Apply progress (incl. TDD evidence) | `openspec/changes/p1-ssr-prerender/progress.md` | #823 `sdd/p1-ssr-prerender/apply-progress` |
| Verify report | `openspec/changes/p1-ssr-prerender/verify-report.md` | #827 `sdd/p1-ssr-prerender/verify-report` |
| Archive report | `openspec/changes/archive/2026-10-08-p1-ssr-prerender/archive-report.md` | `sdd/p1-ssr-prerender/archive-report` |

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| server-rendering | **Created** | Full spec (6 requirements / 9 scenarios) copied from the delta — `openspec/specs/server-rendering/spec.md`. Includes the two archive annotations. |
| seo-analytics-performance | **Updated** | Requirements **8–13** (6 added / 11 scenarios) appended before `## Out of Scope`; AC rows 8–13 added. Existing reqs 1–7, Out of Scope, Release Gates untouched. |

### User decisions — annotations applied at archive (2 UNTESTED rows accepted, not dangling)

1. **SR-3 "Render error fails the build" → ACCEPTED: framework guarantee.** Angular prerender fails the build when a route render throws; no induced-failure test added by design (verify WARNING 1). The verify script's own negative path IS proven (`4a95927`: bogus dist root → exit 1). Annotated in `server-rendering/spec.md` under the scenario.
2. **SR-6 / R4 "CLS < 0.05" → ACCEPTED-DEFERRED.** Cannot be measured without real browser tooling (PerformanceObserver); the project has no E2E/browser tooling by design; measure when browser tooling lands (verify WARNING 3). Annotated in `server-rendering/spec.md` under Requirement 6.

Annotations live in both the archived delta spec and the promoted main spec (they were synced after annotation).

## Follow-ups

Visible, not silently dropped (source: verify report WARNINGs/SUGGESTIONs):

1. **Placeholder og:image host** — `images.example.com` ships in the prod head (`src/index.html:19`); swap before release (content-only, OD-3 accepted by design). Unfurls may 404 until then. *(verify WARNING 6)*
2. **Browser-level halves unverified** — SR-2 (real hydration attach/head preservation), SR-4 (post-JS not-found boot) and SEO-12 (raw-vs-client head equality) stay PARTIAL until E2E/browser tooling exists; the script covers the raw half only. *(verify WARNINGs 2, 5)*
3. **Process-evidence gaps T1.2 / T2.1 / T2.2** — RED→GREEN not independently recorded (spec + impl landed in the same commits `7647cee`, `8b758e6`); tests exist and pass. Known, honestly recorded; severity WARNING (process, not content). *(verify WARNING 4)*
4. **Wire test coverage into the gate** — no coverage tool installed; `--coverage` would enable the strict-TDD changed-file coverage table next change. *(verify SUGGESTION 3)*
5. **CLS measurement deferred** — per annotation above; measure R4 when browser tooling lands. *(verify WARNING 3)*

(Also noted: jsdom `navigation to another Document` noise ×4 is pre-existing/cosmetic — verify SUGGESTION 2.)

## Disposition of formerly untracked artifacts

`design.md`, `explore.md`, `proposal.md`, `specs/` and `verify-report.md` were intentionally untracked during apply; per the archive decision they are part of the change record and are committed with this archive (hybrid mode = shareable trail).

## Commits

| Commit | Work unit |
|---|---|
| `7647cee` … `64137ca` | apply + verify (prior phases) |
| this commit | `docs(openspec): archive p1-ssr-prerender with verify annotations (p1-ssr-prerender)` — annotations, spec sync, progress 100%, report, full change record incl. verify-report; folder moved to `archive/2026-10-08-p1-ssr-prerender/` |

Conventional format, one archive commit, no AI attribution, nothing pushed.

## Checklist

- [x] Both UNTESTED rows annotated per user decision (ACCEPTED / ACCEPTED-DEFERRED)
- [x] `server-rendering` spec created in `openspec/specs/`
- [x] `seo-analytics-performance` reqs 8–13 + AC rows 8–13 appended (reqs 1–7 untouched)
- [x] Final gate green: lint / 364 tests / 21-route build / verify script exit 0, `openspec/`-only diff
- [x] progress.md status → COMPLETE 100% (verify ✅, archive ✅)
- [x] Engram archive report saved as `sdd/p1-ssr-prerender/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Change folder moved to `openspec/changes/archive/2026-10-08-p1-ssr-prerender/`
- [x] Follow-ups recorded (5 items above)

SDD cycle complete: explore → proposal → spec → design → tasks → apply → verify → archive. Ready for the next change.
