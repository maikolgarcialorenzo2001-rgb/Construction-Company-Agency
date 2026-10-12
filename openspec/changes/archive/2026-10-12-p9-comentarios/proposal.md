# Proposal: p9-comentarios — Comments domain model + fixtures

## Intent

HANDOFF §10 Paso 3: add fake comments and a functional inline thread in **demo mode** — static fixtures only, no backend, no contract change (§10.2).

## Scope

### In Scope
- `Comment` + `CommentInput` model; `CommentsGateway` port + in-memory `MockCommentsGateway`.
- Seeded fixtures (2 on `post-1`, 1 on `post-3`, 0 on `post-2`), flagged `isPlaceholder: true`.
- `CommentsStore` — zoneless signals indexed by post id.
- Inline thread + composer under each feed post (all authenticated roles).

### Out of Scope
- Contract/OpenAPI change; `Comment` in `contract-conformance.ts`; backend persistence.
- Post-detail route, pagination, reactions.

## Capabilities

### New Capabilities
- `platform-comments`: comment domain (model, port, mock, fixtures, store) + authenticated composer.

### Modified Capabilities
- `platform-feed`: feed MUST render an inline comment thread per post (attach point only).

## Spec Delta Decision

**Yes.** New: `platform-comments`. Modified: `platform-feed` (one requirement).

## Approach

Add `Comment` next to `Post` in `domain/models.ts`; add `CommentsGateway` + `COMMENTS_GATEWAY` token in `api/ports.ts`, wired to an in-memory `MockCommentsGateway`. `list(postId)` filters by post; `create` uses a synthetic id. `CommentsStore` holds `signal<Record<string, CommentsState>>`, read per post — never a `computed` inside `@for`. Thread renders inline in `feed.page.ts`; composer gated on `effectiveRole() !== null`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `domain/models.ts` | Modified | +`Comment`, `CommentInput` |
| `api/ports.ts` | Modified | +`CommentsGateway`, token |
| `api/mock-comments.gateway.ts` | New | in-memory mock gateway |
| `mocks/fixtures.ts` | Modified | +seeded comments |
| `store/comments.store.ts` | New | zoneless per-post store |
| `pages/plataforma/feed.page.ts` | Modified | inline thread + composer |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `Comment` in `contract-conformance.ts` breaks `ng build` | Med | Do NOT add it; no schema exists |
| AXE `duplicate-id` on per-post composer | Med | unique `[attr.id]="'comment-content-'+post.id"` |
| `effect` re-load / loop | Med | load once per post; guard on state |
| Size ~400+ lines | High | 3 sequential work-unit commits |
| Uncontrolled textarea reset | Low | reuse `form.reset()` handler |

## Rollback Plan

Revert the work-unit commits on `main` (local sequential, no branches/pushes). Changes are additive except the feed `<li>`; removing the thread/composer plus the two new files restores the feed. `contracts/openapi.yaml` untouched.

## Dependencies

None.

## Artifacts

`openspec/changes/p9-comentarios/proposal.md` · Engram `sdd/p9-comentarios/proposal`

## Success Criteria

- [ ] `bunx ng build` + `bunx ng test --watch=false` green (strict TDD).
- [ ] Feed shows seeded threads; new comments append in demo mode.
- [ ] Composer only for authenticated roles; anonymous excluded.
- [ ] Feed a11y scan passes (no `duplicate-id`).

## Next Recommended

`sdd-spec` — delta specs for `platform-comments` (NEW) + `platform-feed` (MODIFIED).
