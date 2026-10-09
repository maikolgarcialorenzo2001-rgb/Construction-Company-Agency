# Archive Report: p2-platform-foundation

Change `p2-platform-foundation` is complete and archived. Verify passed with **PASS WITH WARNINGS** (0 CRITICAL; the single CRITICAL found on first verify — the `HomeAndConstructionBusiness` JSON-LD leaking onto `noindex` platform routes — was **resolved in `2b5041a`** and independently re-proven). The 4 new capabilities (`platform-shell`, `platform-identity`, `platform-feed`, `platform-jobs`) are now the source of truth under `openspec/specs/`, and the 4 modified capabilities were merged into their baselines.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p2-platform-foundation` (platform subtree under `/plataforma`; gateway ports + mocks; W1 closure) |
| Verify verdict | PASS WITH WARNINGS (0 CRITICAL) — `verify-report.md` + Engram #855, HEAD `2b5041a` |
| Tasks | 35/35 complete (all `[x]`) — S1a, S1b, S2, S3, S4, S5 |
| Deltas | 8 capabilities · 26 requirements / 57 scenarios (4 new, 4 modified) |
| Final gate (verified by sdd-verify) | `bun run gate` exit 0 · Spectral 0 errors · `contract:check` up to date · **56 files / 482 tests** · **21-route build**, no `dist/browser/plataforma` |
| Fix under re-verification | `2b5041a` fix(seo): drop structured data on noindex routes |
| Archive location | `openspec/changes/archive/2026-10-09-p2-platform-foundation/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Artifacts read (audit trail)

| Artifact | File | Engram observation |
|---|---|---|
| Explore | `explore.md` | #832 `sdd/p2-platform-foundation/explore` |
| Proposal | `proposal.md` | #844 `sdd/p2-platform-foundation/proposal` |
| Specs (8 deltas) | `specs/*/spec.md` | #845 `sdd/p2-platform-foundation/spec` |
| Design | `design.md` | #846 `sdd/p2-platform-foundation/design` |
| Tasks | `tasks.md` | #847 `sdd/p2-platform-foundation/tasks` |
| Apply progress | (Engram only — no file in change folder) | #848 `sdd/p2-platform-foundation/apply-progress` |
| Verify report | `verify-report.md` | #855 `sdd/p2-platform-foundation/verify-report` |
| Archive report | `openspec/changes/archive/2026-10-09-p2-platform-foundation/archive-report.md` | `sdd/p2-platform-foundation/archive-report` (this save) |

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| `platform-shell` | **Created** | New baseline `openspec/specs/platform-shell/spec.md` (6 requirements / 12 scenarios). Archive annotation on "No platform HTML is emitted" (PARTIAL — W3). |
| `platform-identity` | **Created** | New baseline `openspec/specs/platform-identity/spec.md` (4 requirements / 10 scenarios). Annotations: "Adapter is swappable" (PARTIAL — W4), "Registration offers only self-service roles" (W5). |
| `platform-feed` | **Created** | New baseline `openspec/specs/platform-feed/spec.md` (3 requirements / 6 scenarios). |
| `platform-jobs` | **Created** | New baseline `openspec/specs/platform-jobs/spec.md` (3 requirements / 6 scenarios). Annotation on "Applications flow" (W6). |
| `site-shell-navigation` | **Updated** | 4 requirements replaced (1, 3, 5, 6) with the platform-aware delta; requirements 2 and 4, Context, Out of Scope and Acceptance Criteria preserved. 10 scenarios. |
| `server-rendering` | **Updated** | Requirement 1 replaced (platform excluded from derivation); 2 requirements appended — "Platform subtree render mode", "Platform hydration without transfer cache" (UNTESTED — W2 annotation). 5 scenarios. |
| `seo-analytics-performance` | **Updated** | Requirement 14 appended ("Platform subtree is noindex", 3 scenarios); annotation records the RESOLVED CRITICAL and fix `2b5041a`. |
| `api-conformance` | **Updated** | "Frontend compile-time conformance" replaced (now build-graph-bound, W1 **closed** annotation); "Platform domain type bindings" appended (PASS — adversarially proven). Existing "Backend contract tests" (deferred-by-design) and "Drift response procedure" (governance) annotations preserved. 5 scenarios. |

Modified capabilities preserved all unrelated baseline requirements and its surrounding sections; no destructive deletions occurred.

## Follow-ups (carried forward, not silently dropped)

Source: verify-report WARNINGs/SUGGESTIONs + `HANDOFF.md` §1.

1. **(W2) Platform bootstrap HTTP not asserted + inaccurate hydration comment.** No test asserts zero HTTP during platform bootstrap; `provideClientHydration()` in `app.config.ts` keeps the HTTP transfer cache enabled by default, so the "Plain, no transfer cache" comment is misleading (inert today). Add a bootstrap test and correct the comment. *(annotated on `server-rendering`)*
2. **(W3) No platform-HTML gate step.** `dist/browser/plataforma` absence was verified manually but no automated gate/CI step scans `dist/browser` for the subtree. Add a build-artifact scan. *(annotated on `platform-shell`)*
3. **(W4) Adapter swap proven only for the Feed port.** `ports.spec.ts` swaps `FEED_GATEWAY` only; the auth/profiles token swap is not individually exercised (same DI pattern, low risk). *(annotated on `platform-identity`)*
4. **(W5) Registration role restriction is UI-only.** `SELF_SERVICE_ROLES = [worker, company]` is enforced/tested at the form, but `SessionService.register` / `MockAuthGateway.register` accept any `Role` if invoked programmatically. The contract-level exclusion is also carried by `p2-api-contract` follow-up S3. *(annotated on `platform-identity`)*
5. **(W6) `MockApplicationsGateway.list` has no `applicantId` filter.** Filters by `jobId`/`status` only; no delta requires per-applicant privacy — accepted demo-level gap. *(annotated on `platform-jobs`)*
6. **(W7) TDD cycle evidence incomplete for tasks 1.1–3.7.** `apply-progress` provides per-task RED/GREEN evidence for S3–S5 (tasks 4.1–6.5) only; S1a/S1b/S2 are covered by session summaries/task checkboxes. Tests exist and pass — evidence-completeness gap. Backfill the cycle table.
7. **(S5 from `p2-api-contract`) `ajv@8.20.0` root pin is fragile.** The pin works around bun hoisting two nested copies (breaking Spectral's `instanceof`). Re-check `contract:lint` after any `bun add`/`bun update`.
8. **(SUGGESTION) Stale `app.routes.ts:8-10` doc comment.** It says "the wildcard route is the only noindex one", but every `/plataforma/**` route is `NOINDEX` too. Comment-only, no runtime effect.
9. **(SUGGESTION) Nested platform titles not in the uniqueness set.** `seo.service.spec.ts` asserts title uniqueness over top-level routes only; nested platform children are distinct in code. Extend the set opportunistically.

## CRITICAL resolution record

The first verify pass raised one CRITICAL: `SeoService.apply()` wrote the `HomeAndConstructionBusiness` JSON-LD on every `NavigationEnd`, so `/plataforma/login` shipped `robots=noindex,nofollow` **and** `jsonLdCount=1`. Resolved in `2b5041a`: `seo.service.ts` branches on `route.indexable === false` → `removeJsonLd()` (dropping any pre-existing `script[type="application/ld+json"]`, so a client-side transition off an indexable route cannot leak), else the unchanged `writeJsonLd(url)`. Two new tests plus an independent 5-case probe (A–E, reverted) confirmed indexable marketing routes still emit exactly one script and all platform children emit zero. Annotated on `seo-analytics-performance` Req 14.

## Final gate result

`bun run gate` — **exit 0**:

| Stage | Result |
|---|---|
| Spectral (OpenAPI lint) | ✅ No error-severity results |
| `contract:check` (`openapi-typescript --check`) | ✅ up to date |
| ESLint | ✅ all files pass |
| `bunx ng test --watch=false` | ✅ **56 files / 482 tests passed** |
| `bunx ng build` | ✅ **21 routes prerendered** |
| Build artifact scan | ✅ no `dist/browser/plataforma` |

## Commits

| Commit | Work unit |
|---|---|
| `49b3082` … `2b5041a` | apply S1a–S5 + post-verify SEO fix (prior phases) |
| this commit | `docs(openspec): archive p2-platform-foundation with verify annotations (p2-platform-foundation)` — spec sync (4 new + 4 updated capabilities), report, full change record incl. verify-report; folder moved to `archive/2026-10-09-p2-platform-foundation/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Disposition of HANDOFF.md

`HANDOFF.md` remains **untracked** — it is a session handoff note, not a change artifact, and is not part of the openspec tree. It is now stale (it describes `p2-platform-foundation` as "2 of 6 slices done" with a RED working tree, which no longer holds). Recommended: the maintainer either deletes it or rewrites it for the next session; this archive does not commit or modify it.

## Checklist

- [x] 4 new capabilities created in `openspec/specs/` (platform-shell, platform-identity, platform-feed, platform-jobs)
- [x] 4 modified capabilities merged into baselines, preserving unrelated requirements
- [x] CRITICAL resolution (`2b5041a`) annotated on the `seo-analytics-performance` delta and main spec
- [x] W2–W7 follow-ups annotated where spec-relevant (W2, W3, W4, W5, W6) and recorded here (W7)
- [x] Change folder moved to `openspec/changes/archive/2026-10-09-p2-platform-foundation/`
- [x] Engram archive report saved as `sdd/p2-platform-foundation/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `src/`, no `contracts/`, no `HANDOFF.md`, no push, no PR
- [x] Working tree after commit: only intentional untracked file (`HANDOFF.md`) remains

SDD cycle complete: explore → proposal → spec → design → tasks → apply → verify → archive. The `p2-api-contract` W1 guard-placement follow-up is closed by this change. The next SDD change starts from a green marketing baseline (21 prerendered routes) plus the platform foundation.
