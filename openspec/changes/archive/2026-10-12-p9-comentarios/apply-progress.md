# Apply Progress: p9-comentarios — Batch 1 of 2 (WU1 + WU2) + Batch 2 (WU3) — COMPLETE

> Merged cumulative artifact. WU1/WU2 content from batch 1 is preserved verbatim below;
> WU3 (batch 2) is appended with its SHA, test counts, files, deviations and status.

**Change**: p9-comentarios · **Mode**: Strict TDD (vitest via `bunx ng test --watch=false`)
**Date**: 2026-10-12 · **Executed by**: sdd-apply (big-pickle)
**Artifact store**: hybrid (openspec file + Engram `sdd/p9-comentarios/apply-progress`)

## Summary

All three work units are implemented, tested, and committed on `main` (sequential local
commits, `(p9-comentarios)` suffix, stacked-to-main, no push). The feed now renders an
inline per-post comment thread + authenticated composer, sourced from the zoneless
`CommentsStore`. Full suite: **547 tests green (60 files)** — up from the 521 baseline
(+26). `bunx ng lint` clean; `bunx ng build` green; `Comment` NOT added to
`contract-conformance.ts` (guard 1.8 honored).

## Commits (stacked-to-main, local, no push)

| WU | Commit SHA | Message | Scope |
|---|---|---|---|
| WU1 | `c5919a6` | `feat(platform): add comments model, gateway port and seeded fixtures (p9-comentarios)` | model, port+token, mock gateway, fixtures + 3 specs |
| WU2 | `cbc8048` | `feat(platform): add zoneless per-post CommentsStore (p9-comentarios)` | store + store spec |
| WU3 | `0859ae1` | `feat(platform): add inline per-post comment thread and composer to feed (p9-comentarios)` | feed page + feed spec + tasks.md |

No work units remain.

## Test results

| Gate | Result |
|---|---|
| Baseline (safety net, pre-change) | 58 files / 521 passed |
| WU1 RED (3 specs, code absent) | compile errors (TS2307/TS18046) — expected |
| WU1 GREEN (target specs) | 3 files / 36 passed |
| WU1 full suite | 59 files / 532 passed (+11) |
| WU1 build guard (1.8) | `bunx ng build` green; `Comment` not in `contract-conformance.ts` |
| WU2 RED (store spec, code absent) | compile error (TS18046) — expected |
| WU2 GREEN after test fixes | 1 file / 7 passed |
| WU2 full suite | 60 files / 539 passed (+7) |
| WU3 safety net (feed.page.spec.ts, pre-edit) | 1 file / 10 passed |
| WU3 RED (feed spec, template absent) | 1 file / 7 failed, 11 passed (18) — expected |
| WU3 GREEN (feed spec) | 1 file / 18 passed |
| WU3 full suite (FINAL GATE) | **60 files / 547 passed** (+8) |
| WU3 lint (FINAL GATE) | `bunx ng lint` — all files pass |
| WU3 build (FINAL GATE) | `bunx ng build` green; `Comment` not in `contract-conformance.ts` |

New tests written: **26** (WU1: 11, WU2: 7, WU3: 8). Layer: Unit only (no
integration/E2E infra in repo).

## Files changed

| File | Action | WU |
|---|---|---|
| `src/app/core/platform/domain/models.ts` | Modified | 1 — `Comment` + `CommentInput` next to `Post`/`PostInput` |
| `src/app/core/platform/api/ports.ts` | Modified | 1 — `CommentsGateway` + `COMMENTS_GATEWAY` (providedIn root, factory `new MockCommentsGateway()`) |
| `src/app/core/platform/api/mock-comments.gateway.ts` | Created | 1 — in-memory mock (static seq ids, ISO `createdAt`, demo author, copy on read/write) |
| `src/app/core/platform/mocks/fixtures.ts` | Modified | 1 — `seededComments` + `COMMENTS` (post-1: 2, post-3: 1, post-2: 0; all `isPlaceholder: true`) |
| `src/app/core/platform/api/ports.spec.ts` | Modified | 1 — token resolution (instanceof), swap test, resolve-all extension |
| `src/app/core/platform/api/mock-gateways.spec.ts` | Modified | 1 — `CommentsGateway mock` describe (filter, copies, empty, create, ids advance) |
| `src/app/core/platform/mocks/fixtures.spec.ts` | Created | 1 — seed counts, placeholder flag, model shape, createdAt order |
| `src/app/core/platform/store/comments.store.ts` | Created | 2 — zoneless per-post record signal, guarded `load`, `add` with sort |
| `src/app/core/platform/store/comments.store.spec.ts` | Created | 2 — 7 scenarios incl. zoneless paint harness |
| `src/app/pages/plataforma/feed.page.ts` | Modified | 3 — inline thread + composer inside each `feed-post` `<li>`; unique ids, labeled textarea, `aria-live="polite"`, `untracked` load effect |
| `src/app/pages/plataforma/feed.page.spec.ts` | Modified | 3 — +8 scenarios (seeded threads, loading/empty, role gating, unique ids/labels, duplicate-id, aria-live, submit append) |
| `openspec/changes/p9-comentarios/tasks.md` | Modified | WU1/WU2/WU3 + Final Gate tasks marked `[x]` |
| `openspec/changes/p9-comentarios/design.md` | Created | WU1 — pre-staged design artifact rode along in `c5919a6` (see deviations) |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 port token wiring | `api/ports.spec.ts` | Unit | ✅ 521/521 | ✅ Written | ✅ Passed | ✅ 2 cases + resolve-all ext | ➖ None needed |
| 1.2 mock gateway behavior | `api/mock-gateways.spec.ts` | Unit | ✅ 521/521 | ✅ Written | ✅ Passed | ✅ 5 cases | ➖ None needed |
| 1.3 fixtures seed | `mocks/fixtures.spec.ts` (new) | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 4 cases | ➖ None needed |
| 1.4 model shape | `mocks/fixtures.spec.ts` (runtime shape) | Unit | N/A | ✅ Written before model existed | ✅ Passed | ➖ Single (structural type; triangulation skipped: purely structural — proven at compile time by `satisfies` + runtime by fixtures spec) | ➖ None needed |
| 1.5–1.7 (impl) | covered by 1.1–1.3 | Unit | — | ✅ (same RED) | ✅ Passed | — | ➖ None needed |
| 1.8 build guard | n/a | — | — | n/a | ✅ `ng build` green | — | — |
| 2.1 store spec | `store/comments.store.spec.ts` (new) | Unit | N/A (new) | ✅ Written (7 cases) | ✅ Passed (2 test-setup bugs fixed, see deviations) | ✅ 7 cases | ➖ None needed |
| 2.2 store impl | covered by 2.1 | Unit | — | ✅ (same RED) | ✅ Passed | — | ➖ None needed |
| 3.1 feed thread spec | `pages/plataforma/feed.page.spec.ts` (ext, +8) | Unit | ✅ 10/10 (feed spec pre-edit) | ✅ Written (7 failed, 11 passed RED) | ✅ Passed (18/18) | ✅ 8 cases (seeded/loading/empty + 3 roles + anon + ids/labels + duplicate-id + aria-live + submit) | ➖ None needed |
| 3.2 feed thread impl | covered by 3.1 | Unit | — | ✅ (same RED) | ✅ Passed (after `untracked` fix, see deviations) | — | ✅ Extracted `untracked` load effect + local `posts` const |
| Final Gate | `bunx ng test` + `bunx ng lint` + `bunx ng build` | — | ✅ 539 (pre-WU3) | n/a | ✅ 547 green / lint clean / build green | — | — |

## Deviations from design

1. **`design.md` rode along in WU1 commit** — `openspec/changes/p9-comentarios/design.md`
   was already staged (by the design phase) and got included in commit `c5919a6`
   (8 files). Source scope of WU1 is unaffected; this is this change's own artifact.
   Left as-is rather than amending.
2. **No dedicated `domain/models.spec.ts`** — design's TDD plan allows "covered via
   type tests where trivial": the model's shape is proven at compile time by
   `satisfies readonly Placeholder<Comment>[]` and at runtime by the fixtures spec.
   Matches tasks.md (no model-spec task listed).
3. **`comment-new-1` exactness** — the exact `comment-new-1` id is asserted only in
   the first create test. Because `MockCommentsGateway.seq` is static (as designed),
   exact suffixes across multiple creates are brittle to suite ordering; later tests
   assert the `comment-new-<n>` pattern and monotonic advancement instead. No code
   deviation.
4. **Test-cycle command** — during RED/GREEN cycles `bunx ng test --watch=false
   --include='<spec>'` targeted single files for speed; the full suite ran after
   each work unit (canonical command per config.yaml).
5. **WU3 effect must use `untracked` (design gap, fixed)** — design claims the store
   `load` guard alone "prevents effect re-load loops". It does not. Because the feed
   effect calls `comments.load(post.id)` *synchronously*, the `this.state()` signal
   read at the top of `load` is **tracked by the effect**; the subsequent
   `state.update` then re-triggers the effect. The guard only stops `loading`/`ready`,
   and `empty` must stay retryable (store spec relies on retry after error), so the
   cycle is unbreakable without `untracked`. Fix in `feed.page.ts`: read
   `store.posts()` (tracked) then run the load loop inside `untracked(() => ...)`.
   Without it the vitest worker hung/OOM'd (~283 s). This is a correction to the
   design's rationale, not its INTENT (the intent — no load loop — is preserved).
6. **WU3 commit scope** — the commit includes `tasks.md` (the change's task tracker,
   marked `[x]`) alongside `feed.page.ts` + `feed.page.spec.ts`. `apply-progress.md`
   and the other `openspec/` change files (proposal/explore/specs) are left untracked,
   matching batch 1 (where the report was never committed and only `design.md` slipped
   into `c5919a6`). `angular.json` (incidental `M`) deliberately not committed.
7. **Feed spec flush cycle** — the seeded-thread test needs two
   `detectChanges → whenStable → detectChanges` cycles: the posts paint first, and the
   per-post comment loads are kicked by the effect *during* that paint, so their
   resolution paints on the next cycle. This is test-harness timing, not a code bug.

## Issues found (during implementation)

- 2 store-spec failures after first WU2 GREEN were **test-setup bugs**, not
  implementation bugs: (a) missing `fixture.detectChanges()` after starting `load()`
  before asserting the loading paint; (b) retry-assertion expected 1 comment while the
  mock gateway returns both post-1 seeds. Tests corrected (fixing the test, not the code).
- `MockCommentsGateway` copy semantics verified: mutating a returned comment does not
  corrupt the internal list.
- **WU3 effect loop** (see deviation 5): vitest worker "exited unexpectedly" after
  ~283 s with no assertion — a symptom of the effect writing a signal it had
  (inadvertently) tracked. Diagnosed by reasoning about Angular's dynamic effect
  dependency tracking; fixed with `untracked`. Re-run dropped to 1.8 s.

## Risks

- `MockCommentsGateway.seq` is static (per design) → comment ids are global across
  instances; individual tests relying on exact suffixes are brittle to new tests that
  call `create` earlier in the suite. Mitigated in specs (regex + monotonicity).
- The `untracked` load effect is the subtle correctness hinge for WU3: any future
  refactor that drops `untracked` (or reads `comments.state()` at the effect top level)
  reintroduces the infinite loop. Covered functionally by the feed spec (which hangs
  without the fix).
- `MockCommentsGateway` is a root singleton seeded at construction; `create` pushes into
  its internal array. Within one test's TestBed the appended comment persists, so the
  submit test asserts relative counts (2 → 3) rather than absolute totals.

## Next steps

- Proceed to **sdd-verify** for `p9-comentarios` (all 3 WUs + Final Gate complete).
- Optional: if a future pass touches the store, consider guarding the effect at the
  call site rather than relying on `untracked` (or document the requirement in the store).

## Rollback

Revert `c5919a6`, `cbc8048` and `0859ae1` on `main` (local) to return to pre-change
state; `contracts/openapi.yaml` untouched.
