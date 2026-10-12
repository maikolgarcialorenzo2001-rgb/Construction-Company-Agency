# Archive Report: p9-comentarios

`p9-comentarios` is complete and archived. It adds a **demo-mode comments capability** (HANDOFF §10 Paso 3): a `Comment`/`CommentInput` domain model, a swappable `CommentsGateway` port with a deterministic `MockCommentsGateway`, seeded placeholder fixtures, a **zoneless per-post `CommentsStore`**, and an **inline per-post comment thread + authenticated composer** in the platform feed. UI copy is es-AR; artifacts and commits are English. Verify passed **PASS WITH WARNINGS** (0 CRITICAL, non-blocking carried warnings only). Spec sync ran: **1 capability CREATED** (`platform-comments`) and **1 capability MODIFIED** (`platform-feed`). `contracts/openapi.yaml` was **not touched**.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p9-comentarios` (comments domain + fixtures + zoneless store + inline thread/composer — demo mode) |
| Verify verdict | **PASS WITH WARNINGS** (0 CRITICAL; carried NG8107 cosmetic + static-`seq` brittleness) — see note below |
| Work units | 3/3 complete — `c5919a6` (WU1), `cbc8048` (WU2), `0859ae1` (WU3), each on `main`, tagged `(p9-comentarios)` |
| Tasks | 14/14 complete (1.1–1.8, 2.1–2.2, 3.1–3.2, Final Gate) |
| Tests | 547/547 green (60 files); baseline 521 → **+26** new tests; `bunx ng test --watch=false` |
| Lint / build | `bunx ng lint` clean; `bunx ng build` green (AOT + strict TS + strictTemplates) |
| Capability changes | **1 CREATED** (`platform-comments`), **1 MODIFIED** (`platform-feed`) |
| Contract | `contracts/openapi.yaml` untouched; `Comment` NOT added to `contract-conformance.ts` (no OpenAPI schema exists) |
| Archive location | `openspec/changes/archive/2026-10-12-p9-comentarios/` |
| Artifact store | **hybrid** — filesystem archive + Engram `sdd/p9-comentarios/archive-report` |
| Remote state | local commits only — **not pushed**, no PR/issue created (`main...origin/main [ahead 70]`) |

## Change summary

| Piece | What it is | Evidence |
|---|---|---|
| **Domain model** | `Comment { id, postId, authorId, authorName, authorRole, body, createdAt }` + `CommentInput { postId, body }` in `domain/models.ts`, re-exported via the domain barrel. Deliberately **absent** from `contract-conformance.ts` (no OpenAPI schema). | `c5919a6` — `models.ts`; guard 1.8 (`ng build` green, `Comment` not in conformance). |
| **Gateway port** | `CommentsGateway` (`list(postId)`, `create(input)`) bound to `COMMENTS_GATEWAY` (`providedIn: root`, factory `new MockCommentsGateway()`). Swappable via provider only. | `c5919a6` — `ports.ts`; `ports.spec.ts` token + swap tests. |
| **Mock gateway + fixtures** | `MockCommentsGateway` (static seq ids `comment-new-<n>`, ISO `createdAt`, demo author, copy-on-read/write); `COMMENTS` seeds post-1:2, post-3:1, post-2:0, all `isPlaceholder: true`. | `c5919a6` — `mock-comments.gateway.ts`, `fixtures.ts`; `mock-gateways.spec.ts`, `fixtures.spec.ts`. |
| **Zoneless store** | `CommentsStore` — `signal<Record<string, { status; comments }>>` keyed by post id, guarded `load(postId)`, `add(postId, body)` appending chronologically. No per-post `computed` in the view loop. | `cbc8048` — `comments.store.ts`; `comments.store.spec.ts` (7 scenarios, zoneless harness). |
| **Feed inline thread + composer** | Inline comment thread + composer inside each `feed-post` `<li>`; unique control ids `comment-content-<postId>` (labeled), `aria-live="polite"`, gated on `effectiveRole() !== null` (worker/company/admin). Load effect uses `untracked`. | `0859ae1` — `feed.page.ts`; `feed.page.spec.ts` (+8 scenarios). |

## Spec sync summary (canonical specs updated)

| Domain | Action | Details |
|---|---|---|
| `platform-comments` | **Created** | NEW capability (no canonical dir existed). 6 ADDED requirements copied verbatim from the delta, scaffolding (`## ADDED Requirements`) stripped → `openspec/specs/platform-comments/spec.md`. |
| `platform-feed` | **Updated** | MODIFIED requirement *“Feed renders via signals (zoneless)”* replaced in the existing canonical spec: body extended with the inline comment-thread sentence + the new *“Inline comment thread per post”* scenario. `(Previously: …)` marker removed. 2 other requirements preserved untouched (Feed gateway port, Company-gated composer). |

**Coherence checks:** no `## ADDED/MODIFIED/REMOVED` scaffolding and no `(Previously:)` markers remain in either canonical spec (grep-verified). Requirements not mentioned in the delta were preserved.

## Accepted warnings (carried from verify)

| # | Warning | Disposition |
|---|---|---|
| **W1** | `NG8107` cosmetic — Angular template warning on an optional-chained binding in the feed thread. | **Accepted, non-blocking.** Cosmetic template lint advisory; `bunx ng lint` and `bunx ng build` are both green. No behavioral impact. |
| **W2** | `MockCommentsGateway.seq` is **static** → comment ids are global across instances; tests asserting an exact suffix are brittle to suite ordering. | **Accepted, mitigated.** Specs assert the `comment-new-<n>` pattern + monotonic advancement instead of exact suffixes (apply-progress deviation 3). |
| **W3** | `verify-report.md` was **not present** on disk nor in Engram at archive time (hybrid store). | **Accepted, noted.** The archive uses the orchestrator-supplied verdict (`PASS WITH WARNINGS`, 0 CRITICAL) and its carried warnings. No verify content was invented. Env/process gap, not a code defect. |

## Commits (all local on `main`)

| Commit | Work unit |
|---|---|
| `c5919a6` | WU1 `feat(platform): add comments model, gateway port and seeded fixtures (p9-comentarios)` |
| `cbc8048` | WU2 `feat(platform): add zoneless per-post CommentsStore (p9-comentarios)` |
| `0859ae1` | WU3 `feat(platform): add inline per-post comment thread and composer to feed (p9-comentarios)` |
| this commit | `docs(openspec): archive p9-comentarios with spec sync (p9-comentarios)` — canonical specs synced + `archive-report.md` written + folder moved to `archive/2026-10-12-p9-comentarios/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed. `angular.json` (incidental `M`) deliberately **not** committed; `HANDOFF.md`/`fg.json` left untracked.

## Artifacts read (audit trail)

| Artifact | File (archived) | Engram observation |
|---|---|---|
| Explore | `explore.md` | `sdd/p9-comentarios/explore` (#929) |
| Proposal | `proposal.md` | `sdd/p9-comentarios/proposal` (#930) |
| Spec (delta) | `specs/platform-comments/spec.md`, `specs/platform-feed/spec.md` | `sdd/p9-comentarios/spec` (#931) |
| Design | `design.md` | `sdd/p9-comentarios/design` (#932) |
| Tasks | `tasks.md` | `sdd/p9-comentarios/tasks` (#933) |
| Apply progress | `apply-progress.md` | `sdd/p9-comentarios/apply-progress` (#934) |
| Verify report | *(absent on disk and in Engram — see W3)* | — |
| Archive report | `archive-report.md` | `sdd/p9-comentarios/archive-report` (this save) |

## Checklist

- [x] Delta specs synced BEFORE archive move — `platform-comments` created, `platform-feed` modified
- [x] No leftover `## ADDED/MODIFIED` scaffolding or `(Previously:)` markers in canonical specs
- [x] Change folder moved to `openspec/changes/archive/2026-10-12-p9-comentarios/` with all present artifacts
- [x] Active `openspec/changes/` no longer contains `p9-comentarios/`
- [x] Entire moved archive directory staged (`git add -A`) so artifacts are **tracked**, not left untracked (prior p7/p8 incident avoided)
- [x] Commit stages `openspec/` only — no `angular.json`, no `contracts/`, no `HANDOFF.md`, no `fg.json`, no push, no PR
- [x] Engram archive report saved as `sdd/p9-comentarios/archive-report` (`capture_prompt: false`, type `architecture`)

## Next steps

`p9-comentarios` closes HANDOFF §10 Paso 3 (demo comments + inline thread). No blocking issues remain; W1/W2 are cosmetic/brittleness advisories and W3 is a missing-artifact process note. Ready for the next planned change.
