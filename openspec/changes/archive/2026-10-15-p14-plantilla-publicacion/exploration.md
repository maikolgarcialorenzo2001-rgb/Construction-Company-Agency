## Exploration: p14-plantilla-publicacion — Base post template component (Instagram-like)

**Status**: success · **Artifact store**: hybrid (this file + Engram `sdd/p14-plantilla-publicacion/explore`)

### Current State

The platform has a **working feed with a minimal post render** and a **mature port/adapter + signals data layer**, but no template abstraction, no follow/like/save anything, and no post-type concept.

| Concern | Reality today | Evidence |
|---|---|---|
| Post model | `Post { id, authorId, content, attachments?, createdAt, updatedAt? }` — **bidirectionally bound** to contract `FeedPost` (cannot add fields) | `core/platform/domain/models.ts:67`; `contract-conformance.ts:77-78`; `contracts/openapi.yaml:217` (`additionalProperties: false`) |
| Feed render | `PlatformFeedPage` inlines the whole post markup in the page template: `<p>{{post.content}}</p>` + raw `{{post.authorId}}`, plus inline comment thread. **No header component, no media, no actions bar.** | `pages/plataforma/feed.page.ts:74-135` |
| Author identity | `Post` carries only `authorId`. The **denormalized-author precedent exists**: `Comment` carries `authorName`/`authorRole` and is deliberately *not* in `contract-conformance.ts` (no OpenAPI schema) | `models.ts:86-94`; p9 archive: "denormalized `authorName`/`authorRole` (mock-only)" |
| Follow / Like / Save / Share | **Zero.** No contract endpoint, no domain type, no store, no UI. Confirmed absent from `openapi.yaml`, `src/`, and all archived specs. | grep clean |
| Media | `attachments?: string[]` on Post exists; 2 of 9 fixtures have bare filenames (e.g. `planta-quilmes-antes.jpg`). **No image binaries in repo** — `ProjectPhoto.image` is an absolute external `ImageAsset` URL by design | `fixtures.ts:81,106`; `content.types.ts:13` |
| Post types | **Zero concept.** One flat `Post`. User wants a base template now, worker "job request" and company "vacancy" types later. | — |
| Data layer | Port/adapter: `FeedGateway` port behind `FEED_GATEWAY` `InjectionToken`, factory returns `MockFeedGateway` (in-memory, deterministic fixtures). Stores are root-provided signals, `.set()` only (zoneless). **Swapping to real HTTP is a provider change only.** | `api/ports.ts:66-69,111-114`; `store/feed.store.ts` |
| Backend | Go, self-contained, **only `/health` implemented**. Auth/feed "added in later work units" — i.e. **not yet wired to the frontend**, which runs 100% on mocks. | `backend/README.md:83-90` |
| Session | `SessionService` = signal + `localStorage` JSON blob. Mock auth, no server round-trip. Feeds `role()` / `currentUser()` to pages. | `auth/session.service.ts` |
| Previa (p13) | Static `/previa` renders a **reduced** feed (`<li>` with only `post.content`, testid `previa-feed-post`) from sync fixtures, **prerendered**. Adopting the full template here is a scope decision. | `previa.page.html:62-70`; `preview-fixtures.ts:82` |

**Entities**: companies live as `CompanyProfile` (id `company-N`, name), workers as `WorkerProfile` (id `worker-N`, fullName). `DEMO_ACCOUNTS` (6) maps `userId` → role; note **`authorId` uses the same `worker-N`/`company-N` keys** as `companyId`/profile ids — so author→profile resolution is a direct key match against `WORKER_PROFILES`/`COMPANY_PROFILES`.

### Affected Areas

- `src/app/pages/plataforma/feed.page.ts` (+ `.spec.ts`) — replaces inline `<li>` markup with the new template component; the biggest test-surface risk (374-line spec asserts current DOM).
- `src/app/components/post-template/` — **new** presentational component (naming follows `components/<name>/<name>.component.{ts,html,spec.ts}`).
- `src/app/core/platform/domain/models.ts` — new demo-only types (view-model / engagement / follow), mirroring the p9 `Comment` pattern (NOT added to `contract-conformance.ts`).
- `src/app/core/platform/api/ports.ts` — new `EngagementGateway` (or `FeedSocialGateway`) port + DI token, mock factory.
- `src/app/core/platform/api/mock-*.gateway.ts` — new mock adapter(s), fixture-backed.
- `src/app/core/platform/store/` — new `EngagementStore` (or extend `FeedStore`); possibly `FollowStore`.
- `src/app/core/platform/mocks/fixtures.ts` (+ spec) — richer `attachments` (external `ImageAsset`-style URLs, 1..10), possibly seeded engagement for other users.
- `openspec/specs/platform-feed/spec.md` — MODIFIED delta (header/actions/media requirements); possibly NEW capability `platform-post-template` / `platform-engagement`.
- **Not** `contracts/openapi.yaml` (READ-ONLY). **Not** `scripts/verify-prerender.ts`.

### Approaches

#### (a) Post data model + type extensibility

**Option A — Demo-only view-model + discriminated `kind`, composition over inheritance.** Keep contract-shaped `Post` untouched. Add a demo-only view-model (e.g. `FeedItem { post: Post; authorName: string; authorRole: 'worker'|'company'; kind: PostKind }`) where `PostKind = 'standard' | 'job-request' | 'vacancy'` (default `'standard'`). The base template renders `kind === 'standard'` structure and exposes **content-projection slots** (`<ng-content select="[postBody]">`, `[postExtra]`) for later types to extend.

| | Pros | Cons |
|---|---|---|
| A | Contract + conformance untouched (build-safe); follows the p9 `Comment` precedent exactly; later types extend via slots without touching the base; template is testable in isolation | One extra type to maintain; `kind` is app-level, not server-truth (acceptable — matches mock-first reality) |

**Option B — Widen contract-shaped `Post` with optional `type?` + counts.** Add `type?: string`, `likeCount?`, `isLiked?` etc. directly to `Post`.

| | Pros | Cons |
|---|---|---|
| B | Single flat type; no adapter mapping | **Breaks the "mirror the contract field-by-field" discipline**; optional fields are *tolerated* by `AssertExtends` but pollute a type whose whole purpose is contract fidelity; a future real-HTTP adapter would send fields the server rejects; conflates server truth with client-only engagement state |

**Option C — Angular component inheritance / strategy components per type.** A `BasePostComponent` subclassed by `JobRequestPostComponent` / `VacancyPostComponent`.

| | Pros | Cons |
|---|---|---|
| C | Familiar OOP | Angular strongly discourages component inheritance for templates (only class members inherit, not template); leads to copy-paste templates; harder to keep the shell (header/actions) identical; fights the zoneless/standalone conventions |

**Verdict (a): Option A.**

#### (b) Follow / like / save storage

**Option A — Port + mock gateway backed by `localStorage` (per-user, client-side).** New `EngagementGateway` port + mock adapter that seeds from fixtures and persists to `localStorage` (key like `constructora.platform.engagement`), read defensively (SSR-safe) exactly like `SessionService` / `AdminConfigStore`.

| | Pros | Cons |
|---|---|---|
| A | Follows the established port/adapter rule ("swapping to real HTTP later is a provider change only"); survives reload like the session does; deterministic-fixture testable; zero contract work | State is per-browser, not per-account-server; mock adapter must be careful to stay deterministic for tests |

**Option B — Pure in-memory mock gateway, no persistence.** Like `MockCommentsGateway`.

| | Pros | Cons |
|---|---|---|
| B | Simplest; identical to the comments precedent | Follows/likes/saves vanish on reload — a visibly worse demo than the session, which *does* persist; user expectation for follow is durability |

**Option C — Real backend endpoints.** Implement `/follows`, `/likes`, `/saves` in Go + contract.

| | Pros | Cons |
|---|---|---|
| C | "Real" | **Blocked**: `contracts/openapi.yaml` is READ-ONLY for all phases; backend serves only `/health`; frontend has no real HTTP adapter yet. Would require a contract change that this phase is forbidden to make. Out of scope by mandate. |

**Verdict (b): Option A**, with an explicit in-code comment that the persistence is demo-only and will be replaced by a real adapter when the contract grows follow endpoints (a *future* change that owns the contract edit, per `api-conformance` "contract edit lands first").

### Recommendation

Adopt **(a) Option A + (b) Option A**:

1. **Model**: leave `Post` alone. Introduce a demo-only `PostView` (or `FeedItem`) view-model + a `PostKind` discriminated union with `'standard'` as the only member this change; later types add members and switch cases, and the base template exposes `<ng-content>` slots so type-specific blocks drop in without editing the shell.
2. **Component**: one new standalone, OnPush, zoneless, signal-input presentational component `PostTemplateComponent` under `src/app/components/post-template/`, with three internal regions: header (author name + role, Follow button on the right), media (1–10 images, reusing the `NgOptimizedImage` + external-`ImageAsset` pattern from `PhotoGalleryComponent`), actions bar (Like / Share-reenviar / Save-guardar). Co-located spec; es-AR copy; `data-testid` hooks.
3. **Engagement**: one new `EngagementGateway` port (follow / like / save toggle methods, keyed by viewer + target) + mock adapter persisted to `localStorage` (SSR-safe read, mirroring `SessionService`) + one signal store. Follow state is per-viewer; likes and saves are per-post-per-viewer.
4. **Feed integration**: `PlatformFeedPage` swaps its inline `<li>` markup for `<app-post-template>`, keeping the existing comment thread as-is for now (or projected into a slot — design phase decides). The 374-line `feed.page.spec.ts` will need DOM-selector updates; treat that as a known, budgeted cost.

This keeps the contract frozen, honors the "ports + zoneless signals + fixtures" architecture, mirrors the p9 precedent for client-only entities, and makes post-types 2 and 3 additive rather than a rewrite.

**Ready for Proposal**: **Yes.**

### Scope Boundaries

| In p14 (this change) | Deferred (future change) |
|---|---|
| Base/standard post template component (header, 1–10 media, actions bar) | Worker "job request" post type |
| Follow button + follow/unfollow mechanism (storage only) | Company "vacancy" post type |
| Like / Save / Share-reenviar buttons (state + storage) | **Feed prioritization by follows** (explicitly future — confirm to user) |
| Demo-only persistence via port + mock + localStorage | Real backend endpoints / any `openapi.yaml` edit |
| `PostView`/`PostKind` scaffolding so types 2/3 can extend | Saved/bookmarks **collection view** (button exists now, view is later) |
| Wire template into the platform feed page | `/previa` adoption of the full template (optional; keep reduced unless asked) |
| | Media upload / real image binaries (repo has none by design) |

### Risks

- **`feed.page.spec.ts` is large and asserts the current inline DOM** — swapping in the template will break many selectors. Budget explicit time; update in the same TDD step, don't bolt on after.
- **Contract-conformance foot-gun**: new demo-only types must NOT be added to `contract-conformance.ts` (they have no OpenAPI schema; adding them breaks `ng build`, exactly like `Comment`/`DirectoryUser`).
- **Zoneless paint**: a Follow/Like/Save toggle that mutates a plain variable instead of `.set()`ing a signal will silently never repaint — the single most common bug class in this codebase (documented in p2/p9).
- **`untracked()` loop**: if the template's Follow state is loaded via an `effect` over `posts()`, repeat the p9 lesson — read/write the engagement store inside `untracked` or guard the load, or the effect re-triggers forever.
- **A11y**: Follow/Like/Save are icon-or-text toggles — need `button-name`, `aria-pressed`, keyboard reachability. `app.a11y.spec.ts` scans `/plataforma` with a seeded session and axe rules (`button-name`, `nested-interactive`, `label`, `list`); a bad template fails the gate. Carousel-ish media (if arrow-navigated) adds `nested-interactive` risk — prefer a simple responsive grid for 1–10 images unless the user demands paging.
- **Media fixtures have no binaries**: `attachments` are bare filenames. Rendering them as `<img src>` will 404. Fixtures must supply external `ImageAsset`-style URLs or the media region must render a labeled placeholder for missing assets.
- **Prerender**: platform is client-only, so no prerender risk *unless* `/previa` adopts the template — and `/previa` is prerendered and asserted by `scripts/verify-previa.ts` (exact `previa-feed-post` counts and fixture-derived content). Touching previa's feed markup touches that post-build gate.
- **Strict TDD + 400-line review budget**: component + port + mock + store + fixtures + spec is plausibly > 400 changed lines. Expect `sdd-tasks` to recommend **chained PRs**; delivery mode is `stacked-to-main` per HANDOFF.

### Open Questions for the User (design/propose should confirm)

1. **Follow scope**: is Follow purely a stored edge for now (no visible follower counts, no notifications)? The exploration assumes yes — the button and the persisted relationship only.
2. **Share/Repost ("reenviar")**: what does it *do* in p14 — no-op button with state, copy-link, or reshare-into-feed? Affects the port surface.
3. **Save/Guardar**: confirm the button toggles and persists state but no collection view ships in p14.
4. **Author identity**: confirm the header should show the denormalized author name (resolved from `WORKER_PROFILES`/`COMPANY_PROFILES` in the mock, per the `Comment` precedent) rather than the raw `authorId`.
