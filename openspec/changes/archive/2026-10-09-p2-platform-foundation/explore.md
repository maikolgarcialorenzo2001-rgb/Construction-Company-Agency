# Exploration: `p2-platform-foundation` — static marketing site → two-sided work platform

**Change**: `p2-platform-foundation` · **Phase**: explore · **Mode**: hybrid (disk + Engram `sdd/p2-platform-foundation/explore`)
**Verdict up front**: Build Phase 1 as a **platform subtree under `/plataforma`** with a **port/adapter (gateway) data layer against hand-written domain types**, contract at **`contracts/openapi.yaml`**, and the **contract definition split into a separate preceding change (`p2-api-contract`)** because it is a shared prerequisite of both this frontend phase and the external backend session.

---

## 1. Current State

The app is a fully static, prerendered, SEO-optimized marketing site with **zero HTTP at runtime**:

| Aspect | Today |
|---|---|
| Routes | 10 closed top-level routes in `app.routes.ts`, all lazy `loadComponent`, all `indexable: true` except `**` |
| Shell | `app.html`: skip link → `<app-header>` → `<main><router-outlet>` → `<app-footer>` → `<app-sticky-cta>` — one layout for every route |
| Data | `src/content/*.ts` typed constants (`satisfies` validated at build); no services, no observables of data |
| HTTP | `provideHttpClient()` already registered but unused; `provideClientHydration()` with an explicit "zero HTTP at bootstrap" contract (comment in `app.config.ts`) |
| State | Signals in OnPush components (quote page, consent service); no store layer |
| SEO | Per-route `data.seo` consumed by `SeoService`; robots `noindex` currently asserted to exist ONLY on `**` (`app.routes.spec.ts`) |
| Prerender | `app.routes.server.ts` derives the static prerender set from the browser route table (`prerenderStaticPaths(routes.map(path))`) — **every new top-level static route is auto-prerendered**; `**` is the only Client route |
| Roles/auth | None — navigation is public; `app.routes.spec.ts` asserts "guards no route" |

**Locked-in spec contracts that this change will collide with** (all `[B]` behavior contracts):

1. `site-shell-navigation` Req 1: "MUST register these routes … and **MUST NOT register any other top-level route**" — new routes violate it by design → delta required.
2. `site-shell-navigation` Req 3: header MUST link every top-level route → nav delta required.
3. `site-shell-navigation` Req 5 + 6: sticky mobile CTA and end-of-page CTA block on **every route except `/presupuesto`** — a WhatsApp CTA under a login/feed page is absurd → delta required.
4. `server-rendering` Req 1: prerender every public route — the platform subtree must become explicitly Client-rendered → delta required.
5. `seo-analytics-performance`: platform pages must be `noindex`; the route spec pins `noindex == ['**']` → test update + delta.
6. `app.release-matrix.spec.ts` pins per-route image/priority/CTA contracts — new routes need rows; platform rows get `cta: false`.

Untouched by design: `quote-lead-capture` (its "zero network traffic" Req 8 is scoped to the quote form), `content-model`, `services-catalog`, `projects-showcase`, `process-trust`.

---

## 2. Answers to the Four Pinned Questions

### Q1 — Contract file location: `contracts/openapi.yaml`

| Candidate | Verdict |
|---|---|
| **`contracts/openapi.yaml`** | ✅ **Chosen.** Top-level and language-neutral: it sits as a peer of `src/` (TypeScript) and `backend/` (Go) — neither implementation owns it, which is exactly what contract-first means. Stable, obvious path for both OpenCode sessions and for tooling scripts. |
| `api/openapi.yaml` | ❌ `api/` implies the API implementation lives there; the implementation lives in `backend/`. Ambiguous. |
| `backend/openapi.yaml` | ❌ Puts the contract under Go ownership — kills the symmetry the strategy is built on. |
| `docs/openapi.yaml` | ❌ Buries an executable artifact with prose; tools and sessions expect a conventional path. |

Single file, no versioned directory yet. Versioning lives in `info.version` (OpenAPI 3.1) + git history + SDD changes; a `contracts/v2/` directory only earns its cost if two major versions must be served in parallel (premature now).

**Ownership / versioning rules (to be codified in the `api-contract` capability spec):**

1. Contract edits happen ONLY through an SDD change — never as a side effect of frontend or backend feature work.
2. Breaking change ⇒ bump `info.version` major; both sides migrate inside that change window.
3. Additive change (new optional field / endpoint) ⇒ minor bump; backend may implement ahead, frontend must tolerate unknown fields.
4. Two conformance guards: frontend compile-time guard (Q2) and backend contract tests (backend session's concern — recorded in the contract spec so the other session inherits it).

### Q2 — Frontend consumption during the mock phase

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| **A. Domain types + port/adapter (gateway) with mock adapter** | Zero new deps; TDD-friendly (swap a provider in TestBed); matches the project's DI-config convention (`ENVIRONMENT` token pattern); swap to `HttpClient` adapter = one provider change | Types can drift from the contract silently unless a guard is added | Low |
| B. MSW (Mock Service Worker) intercepting real `HttpClient` calls | Production-identical code path; handlers document the API | New dep; jsdom + zoneless/hydration interplay; intercepting HTTP before any HTTP exists is complexity with no payoff; handlers are hand-written too — drift is NOT solved | Medium |
| C. Full codegen (`ng-openapi-gen`) + Prism mock server | Maximum fidelity | Heavy codegen churn, generated components presume a real server shape, an extra running process (Prism), overkill pre-backend | High |

**Recommendation: A + a lightweight conformance guard.** Structure:

- `contracts/openapi.yaml` → one devDep script (`bunx openapi-typescript contracts/openapi.yaml -o …/schema.gen.ts`) generated **only** for compile-time conformance: hand-written domain types are declared against the generated schema types, so a contract change that invalidates the domain model becomes a **build error**, not a runtime surprise.
- One gateway interface (port) per resource — `FeedGateway`, `JobsGateway`, `AuthGateway` — bound via an `InjectionToken`; `Mock*Gateway` implementation backed by fixtures now, `Http*Gateway` implementation later. The mock/real swap is a single `providers` change, testable by injecting the other adapter in TestBed.
- MSW becomes genuinely valuable exactly when real HTTP exists — defer it to the backend-integration change, not Phase 1.

### Q3 — What Phase 1 concretely needs on the Angular side

**Information architecture — platform lives under its own prefix, marketing home stays at `/`:**

| Route (es-AR) | Page | Notes |
|---|---|---|
| `/` | Marketing home (unchanged) | SEO's biggest asset; specs, prerender, release matrix all anchored on it — replacing it with an app feed would break `server-rendering`, `seo-analytics-performance` and the LCP contract at once |
| `/plataforma` | Platform home = company feed | Facebook-style post stream; composer gated to `company` role |
| `/plataforma/trabajos` | Jobs board (list) | Filters by trade/location/role — mock data |
| `/plataforma/trabajos/:id` | Job detail + apply action | Apply = create `Application` through `JobsGateway` (mock) |
| `/plataforma/login` | Login (mock) | UI-only; `SessionService` writes a mock session (localStorage) |
| `/plataforma/registro` | Register (mock) | Role picker: `worker` \| `company` (`admin` never self-assigned) |
| `/plataforma/perfil` | Profile view/edit | Worker profile (trade, experience) / company profile (name, logo, posts) |

Why prefix instead of replacing `/` or scattering top-level routes:

- One top-level entry (`plataforma`) minimizes the collision surface with the closed route table and the prerender derivation (single filter entry instead of 7).
- Platform pages are app-like and dynamic → the whole subtree is one `RenderMode.Client` decision in `app.routes.server.ts` (exact server-route matching semantics for a prefix need verification in design — flagged below).
- Marketing and platform get different chrome: platform routes suppress sticky CTA + end-of-page CTA block via route `data` (extending the existing `layout`-style data pattern), keeping `site-shell-navigation` deltas small and explicit.
- `/plataforma` is Spanish, consistent with `lang="es-AR"` UI copy.

**Other Phase 1 Angular work:**

- **Domain model**: `src/app/core/platform/domain/` — `User` (with `role: 'worker' | 'company' | 'admin'`), `Profile`, `Post` (feed item), `JobOpening`, `Application`, plus DTO↔domain mapping. Deliberately **not** in `src/content/` — that directory is the marketing content database under `content-model` spec rules (NAP single-source, placeholder release gate); mixing app fixtures there would drag them under those contracts.
- **Mock fixtures**: `src/app/core/platform/mocks/` — deterministic, `isPlaceholder`-flagged, validated against the contract-generated types.
- **Session/auth**: `SessionService` (signal-based `currentUser`, mock login/logout/register, role `computed`), functional `authGuard` on the platform children (redirect to `/plataforma/login`). This breaks the "guards no route" test — that test becomes "marketing routes unguarded, platform children guarded".
- **State approach (zoneless)**: signals end-to-end — injectable signal stores (`FeedStore`, `JobsStore`) with `signal`/`computed`, gateway calls resolving into signals, OnPush + `@if`/`@for` control flow. **No zone.js means an async gateway response that doesn't land in a signal simply never renders** — this is the single most likely implementation bug class in Phase 1.
- **Header**: one platform entry point ("Plataforma" / "Ingresar") driven by `site.nav` content, plus auth-aware affordance later; `site-shell-navigation` Req 3 delta redefines which routes the header must expose.
- **Layout switch**: `app.html` reads current route `data` to conditionally render sticky CTA / platform chrome — or a nested platform layout with its own `<router-outlet>` (design decision, see risks).

**Capabilities touched:**

| Capability | Action |
|---|---|
| `site-shell-navigation` | DELTA (new `/plataforma` subtree allowed, header entry, CTA exemptions) |
| `server-rendering` | DELTA (platform subtree = Client render mode, never prerendered) |
| `seo-analytics-performance` | DELTA (`noindex` on `/plataforma/**`; `SeoService` itself already supports it) |
| `api-contract` (NEW) | From the preceding contract change: single-source contract, versioning/ownership, both-side conformance |
| `platform-identity` (NEW) | Roles, profiles, mock session, guard behavior |
| `platform-feed` (NEW) | Company posts, composer, feed rendering |
| `platform-jobs` (NEW) | Job openings, applications, jobs board |

### Q4 — Contract in this change, or a separate preceding change?

**Recommendation: separate preceding change, `p2-api-contract`.**

Reasoning (SDD graph): the contract is a **shared prerequisite node** — both `p2-platform-foundation` (this change, frontend) and the external backend session hang off it. Burying it as Task 1 of this change couples two otherwise independent deliverables:

- The backend session is blocked until p2's first slice lands *and* has no independently archived, referenceable artifact — it would have to read a half-finished change folder.
- Defining the API surface (pagination, error envelope, auth model, resource shapes) is product-level design work with its own review and its own conformance guard; bundling it inflates a change that is already the largest in the project's history (budget risk for the 400-line review guard is already High before the contract's ~500+ lines of YAML).
- A separate change gives the contract its own spec (`api-contract` capability), its own verify gate, and an archive both sessions can point at: `openspec/changes/archive/YYYY-MM-DD-p2-api-contract/`.
- Naming stays coherent: the p2 *phase* = `{p2-api-contract, p2-platform-foundation}`; alphabetically the contract change sorts first, mirroring execution order.

Tradeoff accepted: one extra SDD cycle overhead. Kept small — its scope is `contracts/openapi.yaml` + capability spec + ownership rules + the frontend conformance guard script; no backend code, no frontend UI.

---

## 3. Affected Areas

- `src/app/app.routes.ts` + `app.routes.spec.ts` — closed route table (`toEqual` on exact 10 paths), "guards no route", "noindex only `**`" all fail by design → contract updates
- `src/app/app.routes.server.ts` + `app.server-routes.shared.ts` — auto-prerender derivation must exclude the platform subtree
- `src/app/app.html`, `components/layout/{header,footer,sticky-cta}.component.ts` — layout/nav switch, CTA suppression outside `/presupuesto`
- `src/app/app.release-matrix.spec.ts` — route-contract rows for every new route
- `src/app/app.config.ts` — hydration "zero HTTP at bootstrap" assumption; HTTP is already provided
- `src/app/core/seo/seo.service.ts` — supports `indexable: false` today; no code change expected, spec/test change yes
- **New**: `contracts/openapi.yaml`; `src/app/core/platform/{domain,store,mocks,auth}/`; `src/app/pages/{feed,jobs,auth,profile}/`

## 4. Risks

1. **Contract drift between the two sessions** — two OpenCode sessions, no CI tie. Mitigated by: single contract file, SDD-only edits, frontend compile-time conformance guard, backend contract tests recorded as a spec requirement.
2. **Prerender auto-derivation** — any new top-level static route is silently prerendered (`prerenderStaticPaths` derives from the browser table). If missed, mock feed HTML ships in static output and breaks when the backend arrives. Must be an explicit, tested exclusion; **server-route matching semantics for a `plataforma` prefix need verification in design** (do static entries match by prefix? order-dependent?).
3. **Zoneless async rendering** — responses not landing in signals never paint. Every gateway/store flow needs a signal-bound test (existing harness pattern: `detectChanges` + `whenStable`).
4. **Spec collisions are intentional, not accidental** — routes, CTA rules, noindex and release matrix all fail on purpose; the spec deltas must land before apply or the suite stays red for the wrong reasons.
5. **Hydration vs future HTTP** — once `Http*Gateway` lands, responses during boot interact with `provideClientHydration()` transfer cache; today's "plain, no transfer cache" comment becomes stale. Platform pages are lazy + Client-rendered, which contains the blast radius, but the design must revisit it.
6. **Repo contention, one repo, two sessions** — `backend/` (Go) and `src/` (TS) share git history. Rule to record: backend session commits only `backend/` + `contracts/` changes (via its own SDD change); frontend commits `src/` + `openspec/`.
7. **Review workload** — this change far exceeds the 400-line PR budget → `sdd-tasks` must forecast chained PRs (expect: `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `400-line budget risk: High`).
8. **Demo honesty** — mock auth/apply flows presented to prospects must be visibly demo behavior (product note, not code).

## 5. Approaches (summary)

1. **Platform subtree + gateway/adapter mock layer** (recommended) — `/plataforma` prefix, own chrome, signals, `Mock*Gateway` behind DI tokens, contract in separate preceding change.
   - Pros: zero SEO/prerender collateral, minimal spec-delta surface, clean backend swap, matches existing DI/OnPush/content patterns. Effort: **High** (large but decomposable into chained PRs).
2. **Replace `/` with the platform feed, marketing demoted** — Pros: single identity. Cons: breaks 3 archived capabilities, the prerender contract and the LCP/SEO asset at once. Effort: **High** + regression risk. Rejected.
3. **Top-level flat routes without prefix** (`/feed`, `/trabajos`, `/login`…) — Pros: shorter URLs. Cons: 7 entries fighting the closed route table, 7 prerender exclusions, CTA/noindex rules applied route-by-route. Rejected in favor of one subtree.

## 6. Ready for Proposal

**Yes.** The orchestrator should:

1. Create change **`p2-api-contract`** first (proposal → spec `api-contract` → design → tasks → apply): `contracts/openapi.yaml` (OpenAPI 3.1, covering feed posts, jobs, applications, auth/profiles) + ownership rules + the frontend conformance guard script.
2. Then run the normal cycle for **`p2-platform-foundation`**, with `state.yaml` deps pointing at `p2-api-contract`.
3. Tell the user that spec deltas on `site-shell-navigation`, `server-rendering` and `seo-analytics-performance` are expected and intentional, and that tasks will forecast chained PRs (400-line budget risk: High).
4. Backend session starts only after `p2-api-contract` is archived.
