# Proposal: p14-plantilla-publicacion — Base post template

## Intent

Feed posts render as inline markup with no header, media, or actions. We need one reusable Instagram-like post template as the BASE for future post types (worker job-request, company vacancy), plus demo-only follow/like/save. Later types then extend, not rewrite.

## Scope

### In Scope
- `PostTemplateComponent` (standalone, OnPush, zoneless, signal inputs): header (author name+role, Follow right), 1–10 image grid, actions bar (Like / Share / Save); es-AR copy; `data-testid`; a11y.
- Demo-only `PostView` + `PostKind` (`'standard'`) + projection slots (`[postBody]`, `[postExtra]`) for types 2/3.
- `EngagementGateway` port + DI token + `MockEngagementGateway` (localStorage, SSR-safe) + `EngagementStore` signals.
- `PlatformFeedPage` uses the template; fixtures gain 1–10 external `ImageAsset`-style URLs.

### Out of Scope (deferred)
Feed prioritization by follow; saved/bookmarks view; post types 2/3; any real backend / `openapi.yaml` edit; media upload; `/previa` adoption; follower counts/notifications.

## Capabilities

### New
- `platform-post-template`: template shell, `PostView`/`PostKind`, slots, a11y.
- `platform-engagement`: follow/like/save port, mock, store.

### Modified
- `platform-feed`: posts render through the template, not inline markup.

## Approach

Adopt exploration (a)-A + (b)-A: leave contract-shaped `Post` untouched; add demo-only `PostView`/`PostKind` (mirrors p9 `Comment`, NOT in `contract-conformance.ts`). Media = responsive grid, not carousel; missing URL → labeled placeholder.

### Resolved questions

| Q | Decision | Why |
|---|---|---|
| Follow | Stored edge only | Prioritization future; counts need aggregation |
| Share | Copy permalink to clipboard + feedback; no repost entity, outside the port | Base-only; reshare model belongs to future types |
| Save | Toggle + persist only | User deferred the Saved view |
| Author | Denormalized `authorName`/`authorRole` from `WORKER_PROFILES`/`COMPANY_PROFILES` | Mirrors p9; hides raw `authorId` |

## Affected Areas

| Area | Impact |
|---|---|
| `components/post-template/*` | New |
| `domain/models.ts` | Modified |
| `api/ports.ts`, `api/mock-engagement.gateway.ts` | Modified/New |
| `store/engagement.store.ts` | New |
| `mocks/fixtures.ts` (+spec) | Modified |
| `pages/plataforma/feed.page.ts` (+`.spec.ts`) | Modified |
| `openspec/specs/platform-feed` + new specs | Modified/New |
| `contracts/openapi.yaml`, `scripts/verify-prerender.ts` | Untouched |

## Risks

| Risk | L | Mitigation |
|---|---|---|
| `feed.page.spec.ts` (374 lines) DOM assertions | High | Rewrite selectors in same TDD step |
| Conformance foot-gun | Med | Keep new types out of `contract-conformance.ts` |
| Zoneless no-repaint | Med | Toggles `.set()` signals |
| `untracked()` loop | Med | Guard loads |
| a11y gate | Med | `aria-pressed`, names, grid |
| Media 404 | Med | External URLs + placeholder |

## Rollback Plan

Additive: revert the feed-integration commit restores inline markup; component/port/store become unreferenced. localStorage key (`constructora.platform.engagement`) is demo-only; clear or ignore.

## Dependencies

None external. Reuses `SessionService`, `PhotoGalleryComponent`, `CommentsStore` patterns; contract stays frozen.

## Success Criteria

- [ ] Feed posts render via one template (header/media/actions).
- [ ] Follow/like/save toggle, persist across reload, repaint.
- [ ] Types 2/3 extend via `PostKind` + slots without editing the shell.
- [ ] `bunx ng test --watch=false`, `bunx ng build`, lint, a11y, prerender pass.
- [ ] ~450–650 changed lines → chained PRs likely.
