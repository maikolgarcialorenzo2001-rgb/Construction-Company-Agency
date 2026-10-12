# Archive Report: p6-registro-role-picker-promo

`p6-registro-role-picker-promo` is complete and archived. It is a **UI-only polish change** with a light marketing touch and **zero contract change**: the `/plataforma/registro` role control became a described, accessible single-choice radio picker (self-service roles only), and the marketing header gained a static, non-dismissible trial→paid promo strip. Verify passed **PASS WITH WARNINGS** (0 CRITICAL). Three capabilities were synced into their baselines: `platform-identity` (MODIFIED), `content-model` (ADDED), and `site-shell-navigation` (MODIFIED). `contracts/openapi.yaml` and the `Role` enum were never touched.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p6-registro-role-picker-promo` (described role picker on `/plataforma/registro` + typed `site.promo` + header promo strip) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL) — `verify-report.md` in the archived folder; 12/12 spec scenarios COMPLIANT |
| Work units | 3/3 complete — `dc15a7f` (WU1 picker), `41b5943` (WU2 content), `3a43a7c` (WU3 header strip), each tagged `(p6-registro-role-picker-promo)` on `main` |
| Tasks | 15/15 complete (1.1–1.5, 2.1–2.5, 3.1–3.3, 4.1–4.3) |
| Deltas | 3 capabilities · `platform-identity` MODIFIED (0 ADDED · 1 MODIFIED · 0 REMOVED) · `content-model` ADDED (1 ADDED) · `site-shell-navigation` MODIFIED (1 MODIFIED) |
| Changed lines (3 commits vs `0cfc1ee`) | 289 (under the 400 review budget; Low risk confirmed) |
| Final gate (verified by sdd-verify) | `bunx ng test --watch=false` → 56 files / 501 tests pass · `bunx ng lint` clean · `bunx ng build` prerenders 21 static routes · `bun run gate` PASS (21 routes verified, no plataforma leak) |
| Contract | `contracts/openapi.yaml` untouched; `git diff contracts/` empty; `Role` enum unchanged |
| Archive location | `openspec/changes/archive/2026-10-12-p6-registro-role-picker-promo/` |
| Artifact store | hybrid (files in `openspec/` + Engram topic keys) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Specs synced to source of truth

Deltas were merged by heading name; every unrelated baseline requirement was preserved.

| Domain | Action | Details |
|---|---|---|
| `platform-identity` | **Updated** (`openspec/specs/platform-identity/spec.md`) | **MODIFIED (1):** `### Requirement: Role model` — replaced with the described single-choice radio picker description (native `<fieldset>` group, `worker`/`company` only, per-role es-AR title + description, required valid default, `data-testid="registro-role"` on the group not inputs, chosen role sent to `register`). Requirement now carries 8 scenarios (5 picker scenarios added/reworded; session-computed role, admin rejection, and normal registration preserved). The W5 archive annotation was carried forward with the delta's wording. Baselines "Mock session, visibly demo", "Auth and profiles gateway ports", and "Profiles" preserved unchanged. |
| `content-model` | **Updated** (`openspec/specs/content-model/spec.md`) | **ADDED (1):** `### Requirement: 6. [C] Typed promo teaser` — appended after Requirement 5 and before "Out of Scope": `Site.promo` typed trial→paid teaser, absolute CTA path `/plataforma/registro`, 2–3 placeholder `plans` each `isPlaceholder: true`, `promo.isPlaceholder: true`, non-blocking to build/lint/tests and discoverable by the placeholder release gate. 3 scenarios added. Requirements 1–5 preserved unchanged. |
| `site-shell-navigation` | **Updated** (`openspec/specs/site-shell-navigation/spec.md`) | **MODIFIED (1):** `### Requirement: 3. [B] Header navigation and phone reachability` → renamed/replaced as `### Requirement: 3. [B] Header navigation, phone reachability and promo strip` — adds the static in-landmark promo strip (trial→paid copy, CTA to `/plataforma/registro`, non-dismissible, image-free) and tightens the platform entry to exactly one `a[href="/plataforma"]`. Scenarios 3.1–3.2 reworded, 2 promo scenarios added. Requirements 1, 2, 4, 5, 6 preserved unchanged. |

Merge result: no duplicate requirement headings in any of the three baselines; each ADDED requirement present exactly once; the MODIFIED requirements replaced in place with numbering/format conventions preserved. No table of contents existed in any of the three specs, so none required updating; acceptance-criteria tables were left untouched (the deltas did not alter them).

## Capability changes

- **`platform-identity` (MODIFIED):** registration's role control is specified as a described single-choice picker; only `worker`/`company` offered; `admin` never offered; programmatic `admin` rejection boundary unchanged.
- **`content-model` (ADDED):** a typed, placeholder-flagged `site.promo` teaser with optional placeholder plans, auditable by the existing release gate.
- **`site-shell-navigation` (MODIFIED):** the marketing header now includes a static promo strip inside the header landmark with a registration CTA.

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `dc15a7f` | WU1 `feat(platform): offer self-service roles as radio cards on registro (p6-registro-role-picker-promo)` — `registro.page.ts` + `.spec.ts` |
| `41b5943` | WU2 `feat(content): add a typed placeholder promo teaser to site (p6-registro-role-picker-promo)` — `content.types.ts`, `site.ts`, `site.spec.ts`, `content.spec.ts` |
| `3a43a7c` | WU3 `feat(shell): render a static promo strip inside the header (p6-registro-role-picker-promo)` — `header.component.html` + `.spec.ts` |
| this commit | `docs(openspec): archive p6-registro-role-picker-promo with spec sync (p6-registro-role-picker-promo)` — 3 deltas merged, report written, folder moved to `archive/2026-10-12-p6-registro-role-picker-promo/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Carried warnings (follow-ups — not blocking)

| # | Warning | Disposition | Concrete fix |
|---|---|---|---|
| **W1** | New interactivity on `/plataforma/registro` is outside the axe scan. `src/app/app.a11y.spec.ts:18-29` scans 10 marketing/404 paths; `/plataforma/registro` is absent, so the radio group has no axe `label` / `nested-interactive` / `region` coverage — only the structural DOM assertions in `registro.page.spec.ts`. Native semantics (explicit `label` wrapper, `fieldset`/`legend`) mean it is a coverage risk, not a defect. No spec scenario requires it. | **Carried.** Non-blocking; a11y coverage gap, not a violation. | Add `'/plataforma/registro'` to `TARGET_PATHS` in `app.a11y.spec.ts:18` (the page renders without a session, so no auth stubbing is needed). |
| **S1** | `site.promo.ctaPath` is declared and tested (`content.types.ts:110`, `site.ts:72`, asserted in `site.spec.ts:134`) but not consumed — `header.component.html:51` uses a literal `routerLink="/plataforma/registro"`, so the path has two sources that can drift. | **Accepted-by-design.** The design's Interfaces snippet and task 3.2 explicitly mandated the literal; behaviour is correct today. | Bind `[routerLink]="site.promo.ctaPath"` in `header.component.html:51`. |

Recorded as follow-ups; neither gates the archive (no CRITICAL, no WARNING that blocks closure). A third, minor suggestion (S2: add `expect(site.promo.plans.length).toBeGreaterThan(0)` before the plans loop in `header.component.spec.ts`) is noted here for completeness and is non-blocking.

## Out-of-scope working-tree notes (not committed)

- `angular.json` (modified, `M`): pre-existing CLI side-effect (`"analytics": false` + `schematicCollections` reformat). Unrelated to this change — **not staged**.
- `HANDOFF.md`, `fg.json` (untracked): out of scope — **not staged**.
- The change folder itself (now archived) and the three canonical specs are the only archive scope.

## Checklist

- [x] `platform-identity` delta merged by heading name — 1 MODIFIED replaced in place; unrelated requirements preserved
- [x] `content-model` delta — 1 ADDED appended before "Out of Scope"; requirements 1–5 preserved
- [x] `site-shell-navigation` delta — 1 MODIFIED replaced in place; requirements 1, 2, 4, 5, 6 preserved
- [x] No duplicate requirement headings; each ADDED present exactly once
- [x] Change folder moved to `openspec/changes/archive/2026-10-12-p6-registro-role-picker-promo/` with all artifacts (explore, proposal, specs, design, tasks, apply-progress, verify-report, this report)
- [x] Active `openspec/changes/` no longer contains `p6-registro-role-picker-promo/`
- [x] Engram archive report saved as `sdd/p6-registro-role-picker-promo/archive-report` (`capture_prompt: false`, type `architecture`, project `construction-company-agency`)
- [x] Commit stages openspec only — no `angular.json`, no `HANDOFF.md`, no `fg.json`, no push, no PR
- [x] `contracts/openapi.yaml` untouched (read-only respected)

## SDD cycle complete

explore → proposal → spec → design → tasks → apply → verify → archive. The `/plataforma/registro` role chooser is now a described, accessible single-choice picker offering only self-service roles, and the marketing header carries a static trial→paid promo strip driven by the typed content graph. W1 (a11y path coverage) and S1 (`ctaPath` binding) are carried as follow-ups but do not gate closure.
