# Progress: `p1-ssr-prerender` — build-time prerender + client hydration

**Change:** `p1-ssr-prerender` (project: `construction-company-agency`) · **Mode:** hybrid (disk artifacts + Engram) · **Date:** 2026-10-08
**Status:** Slices 1–4 applied and gated green; ready for `sdd-verify`.

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
| apply — slice 3 | ✅ | `f3aa861` service per-slug head; ProjectDetailPage per-slug head + slice 3 gate (2nd slice-3 commit) |
| apply — slice 4 | ✅ | `dbdc8c3` scripts/ lint wiring · `4a95927` verify script · T4.3 gate commit (tasks.md + progress.md) |
| verify | ⏳ pending | `sdd-verify` after all slices land |
| archive | ⏳ pending | `sdd-archive` after verify passes |

Gate at `9165e04`: `bunx ng lint` · `bunx ng test --watch=false` · `bunx ng build` — green (not re-run during this handoff).

Batch A (T2.2–T2.4 spec hardening), 2026-10-08: gate re-run green — `bunx ng lint` ✓ · `bunx ng test --watch=false` 356/356 ✓ · `bunx ng build` (21 prerendered routes) ✓.

Batch B (T1.4 build-size evidence, R6), 2026-10-08: `bunx ng build` ✓ — initial total **409.17 kB** raw (112.01 kB est. transfer), 21 prerendered routes, no budget warning emitted.

Batch C (slice 3 — per-slug heads, T3.1–T3.3), 2026-10-08: gate re-run green — `bunx ng lint` ✓ · `bunx ng test --watch=false` **364/364** ✓ (356 + 8 new SEO specs) · `bunx ng build` (21 prerendered routes) ✓. Commits: `f3aa861` "feat(seo): per-slug head override on ServiceDetailPage" + "feat(seo): per-slug head override on ProjectDetailPage + slice 3 gate".

Batch D (slice 4 — gate hardening, T4.1–T4.3), 2026-10-08: `dbdc8c3` "chore(lint): wire scripts/ for linting/typecheck" (`lintFilePatterns` += `scripts/**/*.ts`; decision in commit body: no `tsconfig.scripts.json` — Bun typechecks at run time, eslint covers type-aware rules) · `4a95927` "feat(verify): add content-derived post-build prerender assertions" (`scripts/verify-prerender.ts`, 268 LOC, zero new deps; RED proof: bogus dist root → exit 1 with per-assertion listing). Full gate end-to-end green — `bunx ng lint` ✓ · `bunx ng test --watch=false` **364/364** ✓ · `bunx ng build` (21 prerendered routes) ✓ · `bun scripts/verify-prerender.ts` — **PASS: 21 routes verified (7 static + 6 services + 8 projects) · 21 heads checked · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep** · exit 0. Req 1/4/5 file inventory satisfied by script asserts (Req 5: no root `server.ts`, no Express, `@angular/ssr` only SSR dep). R6 delta NOT re-measured — batch B evidence stands (409.17 kB vs 381.64 kB baseline, +27.53 kB / +7.21%). R4 head stability noted via the per-page exactly-once head assertions (title/description/robots/canonical/og:*/twitter:card) on all 21 prerendered pages.

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
| R6 build-time growth | **Measured & recorded (batch B)** | Baseline **381.64 kB** → current **409.17 kB** = **+27.53 kB (+7.21%)**; under warn budget 450 kB by **40.83 kB**, under error budget 500 kB by **90.83 kB** (`bunx ng build`, 2026-10-08) |
| R7 root `server.ts` escaping lint | N/A for Option B | wire `lintFilePatterns` + `tsconfig.server.json` the day `server.ts` exists |

## Known gaps (from checkbox audit, 2026-10-08; batch A updates same date)

Left unchecked in `tasks.md` — slice 3/4 work or follow-up required:

| Task | Criterion | Why unchecked |
|---|---|---|
| T1.2 | RED→GREEN for shared enumeration spec | Spec exists, is content-derived and green, but spec + implementation landed in the same commit (`7647cee`) — RED phase not independently evidenced |
| T2.1 | Guard spec RED→GREEN | Same process-evidence gap: spec added in the same commit as the values (`8b758e6`) |
| T2.2 | RED→GREEN for SeoService specs | Specs now written and GREEN (batch A: og:image/og:url/twitter:card written-once across navigations + production SITE_URL canonical/og:url never localhost), but green-on-first-run — implementation pre-existed, so RED→GREEN process evidence still absent (same class as T1.2/T2.1) |

**Resolved by batch A (2026-10-08):**

| Former gap | Evidence |
|---|---|
| T2.2 Req 8 — social tag appears once (`index.html` shipped THREE og:image) | Restored to exactly ONE `<meta property="og:image">`; occurrence-count guard in `app.document.spec.ts` now fails on any triplicate |
| T2.3 duplication guard tested | `count()` helper asserts exactly one of og:image/og:title/og:description/og:type in static `src/index.html` |
| T2.4 Req 8–9,11 unit specs GREEN | Hydration no-duplication spec (seeded static head → 3 navigations → single set of og/twitter/canonical, rewritten in place, `og:title == title`); prod-origin spec; `tasks.md` T2.2/T2.3/T2.4 sub-checkboxes flipped. Gate: `ng lint` ✓ · `ng test --watch=false` 356/356 ✓ · `ng build` 21 routes ✓ |

**Resolved by batch B (2026-10-08):**

| Former gap | Evidence |
|---|---|
| T1.4 build-time delta vs 381.64 kB baseline (R6) | `bunx ng build` initial total **409.17 kB** raw (chunk 253.23 + main 137.90 + styles 18.03; est. transfer 112.01 kB); baseline 381.64 kB → **+27.53 kB (+7.21%)**; headroom **40.83 kB** to 450 kB warn, **90.83 kB** to 500 kB error (no warning emitted); 21 prerendered routes; `tasks.md` T1.4 Req 3,6 sub-checkbox flipped |

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

1. **Next:** `sdd-verify p1-ssr-prerender`, then `sdd-archive p1-ssr-prerender`.
2. All commands Bun-only: `bunx ng lint` · `bunx ng test --watch=false` · `bunx ng build` · `bun scripts/verify-prerender.ts`. Never npm/npx/yarn.
