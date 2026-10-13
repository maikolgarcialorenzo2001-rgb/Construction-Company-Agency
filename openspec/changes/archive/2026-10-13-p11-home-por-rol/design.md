# Design: p11-home-por-rol — Role-aware entry home + W1-p10 fix

## Technical Approach

A2 (additive): a new lazy `PlatformHomePage` at `/plataforma/inicio`; `/plataforma` stays the feed. Login/registro redirect there; nav gains a leading "Inicio" item. Worker home reads a new `ApplicationsStore`; company filters `JobsStore.openings()` client-side; admin renders a placeholder. W1-p10 lands first as an independent work unit: `loadApplication(jobId, applicantId?)` scopes to the caller and the job-detail status block becomes worker-only. Maps to deltas `platform-home` (NEW), `platform-jobs`, `platform-shell`, `site-shell-navigation`.

## Architecture Decisions

### Decision: Applications surface — new `ApplicationsStore`

| Option | Tradeoff | Verdict |
|---|---|---|
| Extend `JobsStore` | Grows a board/detail store with an account-list concern; two APPLICATIONS_GATEWAY read shapes in one store | Rejected |
| New `ApplicationsStore` | One gateway per store; mirrors `FeedStore`/`CommentsStore` (signals, `.set()` only) | **Chosen** |

Rationale: the store convention is one concern per store. "Mis postulaciones" is account state, not board state; `JobsStore.loadApplication` stays job-scoped.

### Decision: applicant source — S1 (caller-supplied)

`loadApplication(jobId: string, applicantId?: string)`. The store stays session-free (keeps its current comment); the page injects `SessionService` and passes `session.currentUser()?.userId`. When `applicantId` is absent the store sets `none` — it MUST NOT fall back to `items[0]` (the W1-p10 root cause).

### Decision: status-block gating

`@if (effectiveRole() === 'worker' && store.application(); as application)`. Company/admin/anonymous never see "Estado de tu postulación".

### Decision: home data loading

One effect tracks `session.currentUser()`; store calls are wrapped in `untracked()` (p9 lesson — prevents re-load loops). The home injects `JobsStore` (worker row titles + company filter) and `ApplicationsStore` (worker rows).

### Decision: admin scope

Static `<p data-testid="home-admin-placeholder">`, no controls. Full tooling deferred to `p12-admin`.

## Data Flow

```
login/registro ──navigate──▶ /plataforma/inicio
PlatformHomePage
  effect(session.currentUser) ──untracked──▶ JobsStore.load()            ─▶ JOBS_GATEWAY.list()
                              └──────────▶ ApplicationsStore.load(userId)─▶ APPLICATIONS_GATEWAY.list({applicantId})
  worker  : applications.applications() + jobById map (title)
  company : myOpenings = openings().filter(o => o.companyId === userId)
  admin   : static placeholder

job-detail: effect(id) ─▶ loadApplication(id, session.currentUser()?.userId) ─▶ status block gated to worker
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/core/platform/store/applications.store.ts` (+`.spec.ts`) | Create | Worker applications surface |
| `src/app/pages/plataforma/platform-home.page.ts` (+`.spec.ts`) | Create | Role-aware home |
| `.../store/jobs.store.ts` (+spec) | Modify | `loadApplication(jobId, applicantId?)`; no `items[0]` fallback |
| `.../plataforma/job-detail.page.ts` (+spec) | Modify | Pass userId; worker-only status block |
| `src/app/app.routes.ts` (+`app.routes.spec.ts`) | Modify | Add `inicio` child |
| `.../platform/nav.ts` (+`nav.spec.ts`) | Modify | Leading "Inicio" item |
| `.../platform-header/platform-header.component.spec.ts` | Modify | 4 nav assertions |
| `.../plataforma/login.page.ts` (+spec) | Modify | Redirect to `/plataforma/inicio` |
| `.../plataforma/registro.page.ts` (+spec) | Modify | Redirect to `/plataforma/inicio` |
| `src/app/app.a11y.spec.ts` | Modify | Add `/plataforma/inicio` to TARGET_PATHS |
| `src/app/app.release-matrix.spec.ts` | Modify | Add home row (0 img, cta false) |
| `HANDOFF.md` | Modify | Doc: correct false `roleGuard`/`data.roles` (line 15) |

## Interfaces / Contracts

```ts
// applications.store.ts
type ApplicationsStatus = 'idle' | 'loading' | 'ready' | 'empty';
interface ApplicationsState { status: ApplicationsStatus; applications: Application[]; }
class ApplicationsStore {
  readonly state = signal<ApplicationsState>({ status: 'idle', applications: [] });
  readonly status = computed(() => this.state().status);
  readonly applications = computed(() => this.state().applications);
  load(applicantId: string): Promise<void>;   // guard: skip if same id already ready
}
// jobs.store.ts
loadApplication(jobId: string, applicantId?: string): Promise<void>;  // absent id → 'none', never items[0]
```

Home template: exactly one `<h1>Inicio</h1>`; `<ul><li data-testid="home-application">` (worker) / `home-vacancy` (company); `data-testid="home-publish"` link to `/plataforma`; per-role empty states.

## Testing Strategy (strict TDD — RED first per WU)

| WU | RED specs (write first) | Then implement |
|---|---|---|
| **WU1** W1-p10 | `jobs.store.spec.ts`: pass `'worker-1'` at 115-123/125-132; new job-2 w/o applicantId → `none`. `job-detail.page.spec.ts:88-100` → seed worker-1 session, assert job-2 shows **no** status + apply form | `jobs.store.ts`, `job-detail.page.ts` |
| **WU2** home | new `applications.store.spec.ts` (own rows only; empty); new `platform-home.page.spec.ts` (worker/company/admin sections, empty states) | `applications.store.ts`, `platform-home.page.ts` |
| **WU3** wiring | `app.routes.spec.ts` (child list + `it.each` row); `nav.spec.ts`; `platform-header.component.spec.ts`; `login/registro.page.spec.ts` (`/plataforma/inicio`) | `app.routes.ts`, `nav.ts`, `login.page.ts`, `registro.page.ts` |

`PLATFORM_CHILD_PATHS = ['', 'inicio', 'trabajos', 'trabajos/:id', 'login', 'registro', 'perfil']` — order-sensitive, `inicio` at index 1. The a11y scan runs under the **company** session, so the home must be violation-free for company (one h1 "Inicio", `<ul>` lists, labelled links/landmarks). release-matrix row: `{ path: '/plataforma/inicio', images: 0, priority: 0, cta: false }`.

## Migration / Rollout

No migration. Three sequential commits on `main`, suffix `(p11-home-por-rol)`; each WU reverts independently.

## Open Questions

None blocking. `roleGuard` code explicitly deferred to `p12-admin`.
