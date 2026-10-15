# Tasks: p14-plantilla-publicacion — Base post template

RED→GREEN via `bunx ng test --watch=false`; each slice gates `bunx ng build` + `bunx ng lint`; specs co-located.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450–650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | WU1 → WU2 → WU3 → WU4 (stacked) |
| Decision needed before apply | Yes |
| Chain strategy | stacked-to-main (cached) |
| Guardrails | Green+build+lint per slice; `feed-post` on `li`; thread selectors, conformance, openapi untouched |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Design guard (verbatim): Forecast 450–650 lines > 400-line budget → **Decision needed before apply: Yes · Chained PRs recommended: Yes · 400-line budget risk: High**. Chain: **WU1** model + mapper + fixtures → **WU2** port + adapter + store → **WU3** template → **WU4** feed + a11y (owns the spec rewrite alone); each slice green independently.

### Suggested Work Units

PR1 view-model+mapper+fixtures (→main) → PR2 port+adapter+store (stack PR1) → PR3 template (stack PR2) → PR4 feed+a11y, owns spec rewrite (stack PR3). Retarget to main after each predecessor merges.

## Phase 1: View-Model & Fixtures (WU1 / PR1)

- [x] 1.1 RED: `core/platform/mocks/post-views.spec.ts` — denormalized name/role, `kind: 'standard'`, profile-key lookup.
- [x] 1.2 GREEN: `PostKind`/`PostView` in `core/platform/domain/models.ts` (no conformance entry) + `toPostView()` in `core/platform/mocks/post-views.ts`.
- [x] 1.3 RED: `core/platform/mocks/fixtures.spec.ts` — attachments absolute `https`, counts span 1–10.
- [x] 1.4 GREEN: update `FEED_POSTS` URLs in `core/platform/mocks/fixtures.ts`.
- [x] 1.5 Gate: tests+build+lint; conformance/openapi byte-identical.

## Phase 2: Engagement Port, Adapter & Store (WU2 / PR2)

- [x] 2.1 RED: `core/platform/api/ports.spec.ts` — `ENGAGEMENT_GATEWAY` token; adapter swap provider-only.
- [x] 2.2 GREEN: `EngagementSnapshot`/`EngagementState`/`EngagementGateway` + token in `core/platform/api/ports.ts`.
- [x] 2.3 RED: `core/platform/api/mock-engagement.gateway.spec.ts` — `{v:1}` at `constructora.platform.engagement`; corrupt/SSR → `{}` no-throw; toggle persists.
- [x] 2.4 GREEN: `core/platform/api/mock-engagement.gateway.ts` — SSR-safe localStorage; `load` + `toggleFollow/Like/Save`.
- [x] 2.5 RED: `core/platform/store/engagement.store.spec.ts` — guarded load; same-tick selector flip; null viewer→false; mutations end `state.set()`.
- [x] 2.6 GREEN: `core/platform/store/engagement.store.ts` — signals/computed; guarded ctor load; `await gateway → state.set()`.
- [x] 2.7 Gate: tests+build+lint.

## Phase 3: PostTemplateComponent (WU3 / PR3)

- [x] 3.1 RED: `components/post-template/post-template.component.spec.ts` — name/role not `authorId`; `post-follow` `aria-pressed` + "Seguir"→"Siguiendo"; grid 1/10 + overflow "+2"; empty URL placeholder; like/save→store; share clipboard + store unchanged; `[postBody]` keeps shell; repaint (stub clipboard).
- [x] 3.2 GREEN: `components/post-template/post-template.component.ts/.html` — OnPush zoneless standalone; injected store + `viewerId`; header/follow, lazy grid, `post-like`/`post-share`/`post-save`, `[postBody]`/`[postExtra]`, testids `post-*`.
- [x] 3.3 Gate: tests+build+lint.

## Phase 4: Feed Integration & A11y (WU4 / PR4)

- [x] 4.1 RED: rewrite `pages/plataforma/feed.page.spec.ts` — template-in-feed, name not `authorId`; `feed-post` on `li`; thread selectors untouched.
- [x] 4.2 GREEN: `pages/plataforma/feed.page.ts` — `views = computed(map(toPostView))`, `<app-post-template [post] [viewerId]>` in `li`, guarded ctor `load()`; thread page-side.
- [x] 4.3 RED: extend a11y spec — axe `/plataforma`: `button-name`, `nested-interactive`, `list`, `label` clean.
- [x] 4.4 GREEN: fix regressions (accessible names, `aria-pressed`).
- [x] 4.5 Full gate: `bunx ng test --watch=false` + `bunx ng build` + `bunx ng lint`.
