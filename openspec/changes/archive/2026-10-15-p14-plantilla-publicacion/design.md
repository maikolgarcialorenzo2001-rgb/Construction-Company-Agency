# Design: p14-plantilla-publicacion — Base post template

## Technical Approach

Contract `Post`/`openapi.yaml` frozen (p9 `Comment` precedent). Demo-only `PostView`/`PostKind` feeds a standalone, OnPush, zoneless `PostTemplateComponent` (header / 1–10 grid / actions + `[postBody]`/`[postExtra]` slots). Follow/like/save: port → localStorage adapter → signal store; share = component clipboard. Feed `li`s render via the template; comment thread page-side.

## Architecture Decisions

| Topic | Rejected | Decision (why) |
|---|---|---|
| **D1** View-model | Widen `Post`; wrapper | Flat `PostView` + `PostKind = 'standard'` in `models.ts`, mirroring `Comment`: one template input, no conformance risk |
| **D2** Author mapping | Widen port; page imports fixtures | `toPostView(post)` in `mocks/post-views.ts` resolves profiles by key (`preview-fixtures` precedent); `FeedStore` untouched; name never raw id |
| **D3** Engagement port | Snapshot CRUD | `load()` + `toggleFollow/Like/Save(viewer, …)` resolving full `EngagementState`; adapter owns flip + persist |
| **D4** Template wiring | Outputs via page | Injected store + `viewerId` input: reads already couple it; per-post computeds in `@for` are forbidden |
| **D5** Mutation timing | Optimistic update | `await gateway → state.set()` — matches `FeedStore`; no rollback path |
| **D6** Media | `NgOptimizedImage`; carousel | Plain lazy `<img>`, grid clamped to 10 (+ `post-media-overflow` `+N`): bare-string attachments lack intrinsic size |
| **D7** Thread placement | Project into `[postExtra]` | Thread stays in the page `li`; slots are for types 2/3, not chrome |
| **D8** Share | Port method | Clipboard permalink + es-AR feedback; store provably unchanged |

## Data Flow

```
[post-like click]
  Template → Store.toggleLike(v,p) ──await──▶ MockEngagementGateway
  │                                            └ localStorage `constructora.platform.engagement`
  │                                              {v:1, state}; absent/corrupt/SSR → {}
  ◀── state.set(updated) ── repaint ──▶ [attr.aria-pressed] re-evaluates

load:   page ctor → store.load() (guarded) → adapter read
render: posts → views = computed(map(toPostView)) → <app-post-template [post] [viewerId]>
```

## File Changes

| File | Action | Description |
|---|---|---|
| `core/platform/domain/models.ts` | Modify | `PostKind`, `PostView`, no-conformance guard comment |
| `core/platform/mocks/post-views.ts` + `.spec.ts` | Create | `toPostView` mapper |
| `core/platform/api/ports.ts` + `ports.spec.ts` | Modify | `EngagementGateway` + token |
| `core/platform/api/mock-engagement.gateway.ts` + `.spec.ts` | Create | SSR-safe adapter, `{v:1}` envelope |
| `core/platform/store/engagement.store.ts` + `.spec.ts` | Create | signals, guarded `load`, `toggle*` |
| `components/post-template/post-template.component.{ts,html,spec.ts}` | Create | shell, slots, testids `post-*` |
| `core/platform/mocks/fixtures.ts` + `.spec.ts` | Modify | absolute URLs, 1–10 span |
| `pages/plataforma/feed.page.ts` | Modify | computeds; template in `li` |
| `pages/plataforma/feed.page.spec.ts` | Modify | selector rewrite (same TDD step) |

## Interfaces / Contracts

```ts
// demo-only, no conformance entry
export type PostKind = 'standard'; // future kinds
export interface PostView {
  id: string; kind: PostKind; authorId: string; authorName: string;
  authorRole: Role; content: string; attachments: string[]; createdAt: string;
}
// api/ports.ts
export interface EngagementSnapshot { following: string[]; liked: string[]; saved: string[] }
export type EngagementState = Record<string, EngagementSnapshot>; // viewerId → sets
export interface EngagementGateway {
  load(): Promise<EngagementState>;
  toggleFollow(viewerId: string, authorId: string): Promise<EngagementState>;
  toggleLike(viewerId: string, postId: string): Promise<EngagementState>;
  toggleSave(viewerId: string, postId: string): Promise<EngagementState>;
}
```

Selectors `isFollowing/isLiked/isSaved(viewer, target)` read `state()` in template bindings; null viewer → false. `FeedStore`/`contract-conformance.ts` stay byte-identical.

## Testing Strategy (strict TDD: RED first, co-located, `bunx ng test --watch=false`)

| Slice | Spec (RED first) | Proves |
|---|---|---|
| 1 | `post-views.spec`, `fixtures.spec` | denormalized mapping; https URLs spanning 1–10 |
| 2 | `ports.spec`, `mock-engagement.gateway.spec`, `engagement.store.spec` | adapter swap, key/version, corrupt/SSR-safe, guarded load |
| 3 | `post-template.component.spec` | a11y names, clamp `+2`, placeholder, toggles → store, share + store unchanged, `[postBody]` host, repaint |
| 4 | `feed.page.spec` rewrite; existing `app.a11y.spec` | template-in-feed, names not `authorId`, axe gate |

Per slice: `bunx ng build` + `bunx ng lint`.

## Migration / Rollout

No migration. Additive; rollback = revert the feed-integration commit; the localStorage blob is demo-only.

## Work-Unit Slicing (delivery: `ask-on-risk`, chain `stacked-to-main`)

Forecast 450–650 lines > 400-line budget → **Decision needed before apply: Yes · Chained PRs recommended: Yes · 400-line budget risk: High**.
Chain: **WU1** model + mapper + fixtures → **WU2** port + adapter + store → **WU3** template → **WU4** feed + a11y (owns the spec rewrite alone); each slice green independently.

## Risks & Mitigations

| Risk | L | Mitigation |
|---|---|---|
| `feed.page.spec.ts` rewrite (374 lines) | High | WU4 step; keep `feed-post` on `li`; thread selectors untouched |
| Conformance foot-gun | Med | new types never enter `contract-conformance.ts`; build each slice |
| Zoneless no-repaint | Med | mutations end in `state.set`; assert after `whenStable` |
| `untracked()` effect loop | Med | one-shot guarded `load()` in ctor, no new effect |
| a11y gate `/plataforma` | Med | `aria-pressed`, author-naming labels, plain grid |
| Media fixtures without binaries | Med | absolute URLs + labeled placeholder |
| jsdom lacks clipboard | Med | stub `navigator.clipboard` |

## Open Questions

None — see D3/D7/D8; `/previa` untouched.
