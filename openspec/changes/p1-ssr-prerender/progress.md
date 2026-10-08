# Progress: `p1-ssr-prerender` — build-time prerender + client hydration

**Change:** `p1-ssr-prerender` (project: `construction-company-agency`) · **Mode:** hybrid (disk artifacts + Engram) · **Date:** 2026-10-08
**Status:** Slices 1–2 applied and gated green; slice 3 (per-slug heads) is the next work unit.

## Phase table

| Phase | Status | Evidence |
|---|---|---|
| explore | ✅ | `openspec/changes/p1-ssr-prerender/explore.md` |
| proposal | ✅ | `openspec/changes/p1-ssr-prerender/proposal.md` |
| spec | ✅ | `openspec/changes/p1-ssr-prerender/specs/` deltas |
| design | ✅ | `openspec/changes/p1-ssr-prerender/design.md` |
| tasks | ✅ | `openspec/changes/p1-ssr-prerender/tasks.md` (slices 1–2 checkboxes audited) |
| apply — slice 1 | ✅ | `7647cee` prerender plumbing + hydration |
| apply — slice 2 | ✅ | `8b758e6` og/twitter head + SITE_URL canonical; tests `9165e04` |
| apply — slice 3 | ⏳ pending | per-slug heads (`SeoService.override()` on detail pages) |
| apply — slice 4 | ⏳ pending | gate hardening (`scripts/verify-prerender.ts` + lint wiring) |
| verify | ⏳ pending | `sdd-verify` after all slices land |
| archive | ⏳ pending | `sdd-archive` after verify passes |

Gate at `9165e04`: `bunx ng lint` · `bunx ng test --watch=false` · `bunx ng build` — green (not re-run during this handoff).

Batch A (T2.2–T2.4 spec hardening), 2026-10-08: gate re-run green — `bunx ng lint` ✓ · `bunx ng test --watch=false` 356/356 ✓ · `bunx ng build` (21 prerendered routes) ✓.

## Locked decisions

| Decision | Choice |
|---|---|
| Rendering mode | **Option B** — build-time prerender: `outputMode: "static"` + `provideClientHydration()`; no Node server runtime |
| R2 (duplicate detail titles) | **In scope** — per-slug `SeoService.override()` in slice 3 |
| Tooling | **Bun-only** (`bunx ng …`, `bun add`); never hand-edit `bun.lock` |
| Server runtime | None — no root `server.ts`, no Express; only `@angular/ssr` (+ `platform-server`) added |

## Open risks (authoritative R-list, design §7 status)

| # | Status (design) | Mitigation |
|---|---|---|
| R1 localhost canonical | Resolved (OD-1) | `Environment.siteUrl` + dev fallback + env guard spec + dist `localhost` grep (grep lands in slice 4) |
| R2 duplicate detail titles | Resolved by scope (OD-2) | `override()` from content via `lookup.ts`; distinctness asserted dist-side (slice 3) |
| R3 placeholder og:image host | Mechanism complete, **value placeholder** | ships `site.ogImage.src` as-is (`images.example.com`); swap = content-only; unfurls may 404 — documented, non-blocking (OD-3 content decision) |
| R4 hydration CLS | Measured, not assumed | aspect-ratio placeholders in place; CLS + hydration smoke asserted in verify phase |
| R5 unknown-slug CSR fallback | Accepted for v1 | `PrerenderFallback.Client` + `**→Client`; late `noindex` accepted; host `404.html` follow-up |
| R6 build-time growth | Measured in slice 1 | delta vs 381.64 kB baseline recorded at first apply slice — **not yet recorded (see Known gaps)** |
| R7 root `server.ts` escaping lint | N/A for Option B | wire `lintFilePatterns` + `tsconfig.server.json` the day `server.ts` exists |

## Known gaps (from checkbox audit, 2026-10-08; batch A updates same date)

Left unchecked in `tasks.md` — slice 3/4 work or follow-up required:

| Task | Criterion | Why unchecked |
|---|---|---|
| T1.2 | RED→GREEN for shared enumeration spec | Spec exists, is content-derived and green, but spec + implementation landed in the same commit (`7647cee`) — RED phase not independently evidenced |
| T1.4 | Build-time delta recorded vs 381.64 kB baseline (R6) | No post-hydration bundle size recorded anywhere (commits, docs, Engram); R6 demands "measured, not assumed" — **batch B** |
| T2.1 | Guard spec RED→GREEN | Same process-evidence gap: spec added in the same commit as the values (`8b758e6`) |
| T2.2 | RED→GREEN for SeoService specs | Specs now written and GREEN (batch A: og:image/og:url/twitter:card written-once across navigations + production SITE_URL canonical/og:url never localhost), but green-on-first-run — implementation pre-existed, so RED→GREEN process evidence still absent (same class as T1.2/T2.1) |

**Resolved by batch A (2026-10-08):**

| Former gap | Evidence |
|---|---|
| T2.2 Req 8 — social tag appears once (`index.html` shipped THREE og:image) | Restored to exactly ONE `<meta property="og:image">`; occurrence-count guard in `app.document.spec.ts` now fails on any triplicate |
| T2.3 duplication guard tested | `count()` helper asserts exactly one of og:image/og:title/og:description/og:type in static `src/index.html` |
| T2.4 Req 8–9,11 unit specs GREEN | Hydration no-duplication spec (seeded static head → 3 navigations → single set of og/twitter/canonical, rewritten in place, `og:title == title`); prod-origin spec; `tasks.md` T2.2/T2.3/T2.4 sub-checkboxes flipped. Gate: `ng lint` ✓ · `ng test --watch=false` 356/356 ✓ · `ng build` 21 routes ✓ |

Note: `environment.guard.spec.ts` already covers prod `siteUrl` shape (absolute, no localhost) — do not duplicate. The test build file-replaces `environment.ts` with `environment.development.ts` (`siteUrl: ''`), so specs must inject `ENVIRONMENT` explicitly for prod-origin cases.

## Engram topic keys

| Topic | Key |
|---|---|
| explore | `sdd/p1-ssr-prerender/explore` |
| proposal | `sdd/p1-ssr-prerender/proposal` |
| spec | `sdd/p1-ssr-prerender/spec` |
| design | `sdd/p1-ssr-prerender/design` |
| tasks | `sdd/p1-ssr-prerender/tasks` |
| progress | `sdd/p1-ssr-prerender/progress` |

## Resume instructions

1. **Next:** slice 3 — per-slug heads (T3.1 `ServiceDetailPage`, T3.2 `ProjectDetailPage`, T3.3 gate) via orchestrator: `sdd-continue p1-ssr-prerender`.
2. Then slice 4 — gate hardening: `scripts/verify-prerender.ts` + `scripts/` lint wiring + end-to-end gate (T4.1–T4.3). The verify script's "og:image exactly once" assertion will catch the Known-gap triplicate.
3. Then `sdd-verify p1-ssr-prerender`, then `sdd-archive p1-ssr-prerender`.
4. All commands Bun-only: `bunx ng lint` · `bunx ng test --watch=false` · `bunx ng build` · `bun scripts/verify-prerender.ts`. Never npm/npx/yarn.
