# Exploration: p11-home-por-rol — Home / experience per role (HANDOFF §10 Paso 5)

> Mode: hybrid · Strict TDD · `bunx ng test --watch=false` · BUN only · commits on `main` suffix `(p11-home-por-rol)`.
> Scope lock: `contracts/openapi.yaml` **READ-ONLY**. Roles exactly `worker | company | admin`. UI copy **es-AR**, artifacts/commits **English**. Platform is client-only behind `authGuard`.

## TL;DR

- **Spec delta: YES.** NEW option (`platform-home`) or MODIFIED `platform-feed` for the role-aware entry experience, **plus** MODIFIED `platform-jobs` for the W1-p10 `loadApplication` fix. A new route/nav also touches `platform-shell` + `site-shell-navigation`.
- **W1-p10 belongs in THIS change** (see §4): the worker home will surface application statuses, so a filter that shows *other workers'* statuses makes the home itself wrong. The plan (§10 Paso 5) explicitly assigns it here. It is a behavior change → its own MODIFIED delta.
- **`roleGuard` does NOT exist in the codebase.** HANDOFF §1 claims "Hay `roleGuard` con `data.roles`", but no such guard, no `data.roles`, and no role-gating exists (only `authGuard`). Any admin-only gating for p11/p12 must be built. (Discovery — recorded to Engram.)
- **There is no `ApplicationsStore`.** Applications are reachable only through `JobsStore.loadApplication`; no page lists a worker's applications today. A worker home needs new surface here.
- **Biggest binary decision (blocking):** does the role home replace `/plataforma`, or is it additive? Four pinned spec assertions fix `/plataforma` = the feed today (§6).
- **Size: ~400-600 lines across ~10 files → likely OVER the 400-line review budget.** Forecast: stacked work units (WU1 = W1-p10 fix; WU2 = home + role sections).

---

## 1. Current state (verified)

### Where each role lands today

| Step | Reality | Evidence |
|---|---|---|
| After login | `router.navigateByUrl('/plataforma')` — every role | `login.page.ts:98` |
| After registro | `router.navigateByUrl('/plataforma')` — every role | `registro.page.ts:162` |
| `/plataforma` renders | `PlatformFeedPage` (the feed) for **all** roles | `app.routes.ts:104-112`; `app.routes.spec.ts:135` |
| Feed role variance | Post composer **only** for `company` (`feed.page.ts:38`); comment composer for any authenticated (`:107`) | — |
| Platform chrome nav | Role-aware since p7 (`platformNavFor`) | `nav.ts:11-40`; `platform-header.component.ts:63` |
| Nav items | worker/admin: Novedades→`/plataforma`, Trabajos→`/plataforma/trabajos`, Mi perfil→`/plataforma/perfil`; company relabels **only** Trabajos→Vacantes, Mi perfil→Mi empresa (destinations identical) | `nav.spec.ts:21,25,34-45`; `platform-header.component.spec.ts:68,76,81-85` |
| Anonymous | No `<nav>` landmark, pill stays | `platform-header.component.spec.ts:59-65` |
| Gating | `authGuard` only; **no `roleGuard`, no `data.roles`** anywhere | `auth.guard.ts:11-16`; repo-wide grep → none |

**Consequence:** there is no "entry experience per role" today — all three roles funnel into the same feed. The only per-role differences in the whole platform are: (a) nav labels for company, (b) feed post composer for company, (c) perfil page which side it edits (`perfil.page.ts:44,95`), (d) job-detail apply form gated to worker.

### Demo data available (p10 fixtures — `mocks/fixtures.ts`)

| Entity | Count | Useful fields for a home | Reachable today as |
|---|---|---|---|
| Posts | 9 | `authorId` (company-1/2, worker-1/2/3), `content` | feed |
| Jobs | 7 (5 open, 2 closed) | `companyId` (`company-1` ×5, `company-2` ×2), `title`, `location`, `status` | `/plataforma/trabajos` |
| Applications | 7 (all 4 statuses) | `jobId`, `applicantId` (worker-1 ×1, worker-2 ×4, worker-3 ×2), `status` | **only** via job-detail (`loadApplication`) |
| Worker profiles | 3 | `fullName`, `skills`, `location`, `bio` | perfil (session user only) |
| Company profiles | 2 | `name`, `description`, `location` | perfil (session user only) |
| Demo accounts | 5 | `lucia@`, `norte@`, `martin@`, `sofia@`, `delta@` (all `demo1234`) | login |

**Key data facts for the home:**
- Demo worker login = `lucia@demo.test` → `userId: 'worker-1'`. Worker-1 has **exactly one** seeded application: `app-1` on `job-1`, status `accepted` (`fixtures.ts:344-352`). So "Mis postulaciones" for the demo worker = 1 item today.
- Demo company login = `norte@demo.test` → `company-1`. Company-1 authored **5 jobs** (`job-1,2,3,6,7`) and 4 posts.
- `APPLICATIONS` has worker-2/worker-3 rows for jobs 2,4,5,6,7 — exactly the source of the W1-p10 false statuses.

---

## 2. Spec-delta decision

| Capability | NEW / MODIFIED | Why | Confidence |
|---|---|---|---|
| `platform-home` | **NEW** (if dedicated home) | Role-aware entry experience + distinct per-role actions is a new capability | Med — depends on §3 fork |
| `platform-feed` | **MODIFIED** (if additive home) | Feed gains role-aware home sections / h1 | Med — alternative to above |
| `platform-jobs` | **MODIFIED** | "Applications flow": `JobsStore.loadApplication` MUST filter by `applicantId` (W1-p10) | High |
| `platform-shell` | **MODIFIED** | Route table gains a home child (or `/plataforma` child mapping changes) | High if new route |
| `site-shell-navigation` | **MODIFIED** | Route table + platform nav item set change (Inicio item / feed relocation) | High if new route |

**Decision:** Exactly one of `platform-home` (NEW) or `platform-feed` (MODIFIED) — never both — decided by §3. `platform-jobs` delta is independent and required.

---

## 3. What "home per role" means (the blocking fork)

The user instructions in HANDOFF §4 are **blank** ("📝 Instrucciones (usuario): (a completar)"). This is the one genuine fork.

### Fork A — where the entry home lives

| Option | Description | Pros | Cons | Blast radius |
|---|---|---|---|---|
| **A1. Replace `/plataforma` with a role home; move feed to `/plataforma/novedades`** | `/plataforma` → `PlatformHomePage`; nav gains Inicio→`/plataforma`, Novedades→`/plataforma/novedades` | Semantically correct "entry screen"; nav stays truthful | Touches p7/p8-stabilized nav + routes + a11y + release matrix; new child shifts `PLATFORM_CHILD_PATHS` | **High** (~6 spec files) |
| **A2. Dedicated `/plataforma/inicio`; `/plataforma` stays the feed** | login/registro redirect to `/plataforma/inicio`; nav gains Inicio (new child) | No route swap; feed untouched | Login/registro redirect changes; "Novedades" still `/plataforma` but is no longer the landing — mild nav/landing mismatch | **Medium** |
| **A3. Additive: keep `/plataforma` = feed; add role "acciones" panels at the top** | Feed page renders role-specific home sections | Lowest churn; no route/nav change | Weakest "pantalla de entrada"; h1 semantics stay "Novedades" | **Low** |

### Per-role content (grounded in fixtures, no backend)

| Role | Entry experience (proposed) | Data source | New surface needed |
|---|---|---|---|
| **worker** | "Mis postulaciones": list own applications + `applicationStatusLabel` | `ApplicationsGateway.list({ applicantId: userId })` (filter already exists) | **Yes** — no applications list UI/store today |
| **company** | "Mis vacantes": own job openings (`companyId === userId`) + "Publicar novedad" CTA (composer already in feed) | `JobsStore.openings().filter(j => j.companyId === userId)` (client-side; `JobsGateway.list` has **no** `companyId` filter) | Medium — reuse JobsStore + a derived computed |
| **admin** | Overview/placeholder + pointer to the future admin area | counts from fixtures | Minimal (full admin = Paso 7 `p12-admin`) |

### Recommendation

**A1 (replace `/plataforma`, relocate feed)** is the semantically correct reading of "pantalla de entrada", but it churns the p7/p8 nav contract that was just stabilized. **A3 (additive)** is the minimal-risk reading but arguably does not deliver a distinct entry *screen*.

**Recommended default: A2** — a dedicated `PlatformHomePage` at a new `/plataforma/inicio` child, login/registro redirect there, nav gains a first "Inicio" item. This delivers a real per-role landing with **no route swap**: the feed keeps `/plataforma`, and only the redirect target + a new nav item change. It keeps `PLATFORM_CHILD_PATHS` an additive edit.

> **This choice MUST be confirmed by the user before propose.** A1 vs A2 vs A3 changes the spec-delta target and the workload materially.

---

## 4. W1-p10 fix — `JobsStore.loadApplication`

**Belongs in THIS change.** Justification: (1) the plan explicitly assigns it to Paso 5 (`HANDOFF.md:54-56`); (2) the worker's role home surfaces application status, so the same wrong-status bug would surface on the home, not just job-detail — fixing one without the other leaves the feature visibly broken; (3) both need the same `applicantId` filter the gateway already supports. It gets its **own MODIFIED `platform-jobs` delta** because it is a behavior change pinned by current specs.

### Exact current behavior

`jobs.store.ts:74-81`:
```ts
async loadApplication(jobId: string): Promise<void> {
  const page = await this.applications.list({ jobId });   // filter by jobId ONLY
  const application = page.items[0] ?? null;              // first row wins
  ...
}
```

### Correct demo behavior

Filter by **both** `jobId` **and** the current user's `applicantId`:

```ts
const page = await this.applications.list({ jobId, applicantId }); // → own row or empty
```

The gateway **already supports it** — `MockApplicationsGateway.list` AND-combines `jobId` + `applicantId` + `status` (`mock-applications.gateway.ts:24-32`), and `platform-jobs` spec already documents the filter (archive annotation W6 CLOSED). **Only the store doesn't pass it.**

### Applicant source (design decision for design phase)

| Option | Mechanism | Store impact | Test impact |
|---|---|---|---|
| **S1. Signature `loadApplication(jobId, applicantId?)`; page passes `session.currentUser()?.userId`** *(recommended)* | Store stays session-free (matches current comment + feed/jobs store style); page injects `SessionService` | Pure signature change | Store specs pass `'worker-1'`; page specs seed a session |
| S2. `JobsStore` injects `SessionService`, reads `currentUser().userId` | One call site unchanged | Store gains a session dep (breaks its "no session" comment) | Store specs need a seeded session |

**Also gate the status block to the applying worker.** Today the template shows `application` for **any** role (`job-detail.page.ts:55-60`), so a company/anonymous viewer sees "Estado de tu postulación". Under the fix the block should render only when `effectiveRole() === 'worker'` and an application exists.

### Blast radius (exact pinned tests)

| Test file | Lines | Pins today | Change required |
|---|---|---|---|
| `store/jobs.store.spec.ts` | 115-123 | `loadApplication(JOBS[0])` → `applicantId 'worker-1'`, `accepted` | Pass `applicantId` arg |
| `store/jobs.store.spec.ts` | 125-132 | `loadApplication(JOBS[2])` → `none` | Pass `applicantId` arg |
| `pages/plataforma/job-detail.page.spec.ts` | 74-86 | job-1 + `role:'worker'` (no session) → 'Aceptada' | Seed worker-1 session (or new seam) |
| `pages/plataforma/job-detail.page.spec.ts` | 88-100 | job-2 + `role:'worker'` → **'Pendiente'** | **Pins the bug** — must become "no status + apply form visible" (the W1-p10 RED) |
| `api/mock-gateways.spec.ts` | (W6 tests) | applicantId filter already covered | No change expected |
| `pages/plataforma/job-detail.page.spec.ts` | 185-202 | worker-1 session, job-3 → apply form | Already correct; stays green |

---

## 5. Blast radius for a new route / nav change (feeds the forecast)

| File | Line | Pinned today | If new `/plataforma/inicio` child (A2) |
|---|---|---|---|
| `app.routes.spec.ts` | 28 | `PLATFORM_CHILD_PATHS = ['', 'trabajos', 'trabajos/:id', 'login', 'registro', 'perfil']` | Insert `'inicio'` (order-sensitive) |
| `app.routes.spec.ts` | 135 | `/plataforma` → `app-platform-feed` | unchanged (A2 keeps feed at root) |
| `app.a11y.spec.ts` | 159 | `/plataforma` h1 === `'Novedades'` | unchanged (A2); **breaks** under A1/A3-if-h1-changes |
| `app.release-matrix.spec.ts` | 44 | row `/plataforma` feed, 0 images | Add `/plataforma/inicio` row (0 images, cta false) |
| `app.a11y.spec.ts` | 19-33 | TARGET_PATHS list | Add `/plataforma/inicio` |
| `nav.spec.ts`, `platform-header.component.spec.ts` | 21,40 / 68,76,81 | nav labels/paths/hrefs | Add "Inicio" item → all four assertions change |
| `site-shell-navigation/spec.md` | 26,62 | route table + platform nav item set | Add home route + Inicio nav |
| `platform-shell/spec.md` | 7 | platform children list | Add child |
| `login.page.ts` / `registro.page.ts` | 98 / 162 | redirect to `/plataforma` | Redirect to `/plataforma/inicio` |

> `app.routes.spec.ts:28,76` is order-sensitive (`'inicio'` insertion point matters).

---

## 6. Risks / gotchas

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | `roleGuard`/`data.roles` **does not exist** despite HANDOFF claiming it — admin-only home gating has no foundation | **HIGH** | Build a `roleGuard` in p11 or defer admin gating to `p12-admin`; correct HANDOFF |
| R2 | No `ApplicationsStore`; worker home needs new surface | MED | Add a small `ApplicationsStore` or extend `JobsStore` |
| R3 | `JobsGateway.list` has no `companyId` filter → company home must filter client-side | LOW | `openings().filter(j => j.companyId === userId)` |
| R4 | `/plataforma` h1 is pinned `'Novedades'` by a11y — a home that changes the entry h1 breaks the scan | MED | A2 keeps feed h1; A1/A3 must update the a11y pin |
| R5 | New route is order-sensitive in `PLATFORM_CHILD_PATHS` | LOW | Insert in the declared order |
| R6 | WU size exceeds 400-line review budget | MED | Stack WU1 (W1-p10 fix) before home WUs |
| R7 | p7/p8 nav contract just stabilized; A1 re-churns it | MED | Prefer A2 (additive nav item) |
| R8 | Company-1 owns 5 jobs; worker-1 has only 1 application — home lists may look thin | LOW | Acceptable for demo; more fixtures already exist for worker-2/3 (reachable in Paso 8) |
| R9 | a11y scan runs under a **company** session (`app.a11y.spec.ts:82-88`) — a new home must be violation-free for company | MED | Keep landmar/e/id/label hygiene; add the route to TARGET_PATHS |

## 7. Open questions (need user input before propose)

1. **[BLOCKING] Fork A1 / A2 / A3** — does the role home replace `/plataforma` (A1), live at `/plataforma/inicio` (A2, recommended), or is it additive to the feed (A3)?
2. **Admin home scope in p11**: minimal overview/placeholder now (full tools in `p12-admin`), or something richer?
3. **`roleGuard`**: build it in p11 (to prepare `p12-admin`), or defer entirely to `p12-admin`?
4. **Company home**: is a client-side `companyId` filter acceptable (no gateway change), or add a `companyId` filter to `JobsGateway.list`?
5. **W1-p10 signature**: S1 (`loadApplication(jobId, applicantId)`, page supplies) or S2 (store injects `SessionService`)?

## 8. Estimated size (review-workload forecast)

| Work unit | Files | Rough LOC |
|---|---|---|
| **WU1 — W1-p10 fix** | `jobs.store.ts`, `jobs.store.spec.ts`, `job-detail.page.ts`, `job-detail.page.spec.ts` | ~70-110 |
| **WU2 — role home** | new `platform-home.page.ts` + spec, new `applications.store.ts` (+spec) or JobsStore extension | ~180-280 |
| **WU3 — route/nav wiring** | `app.routes.ts`, `nav.ts`, `nav.spec.ts`, header spec, `app.routes.spec.ts`, `app.a11y.spec.ts`, `app.release-matrix.spec.ts`, login/registro redirects | ~80-140 |
| **Spec deltas** | `platform-home` (or `platform-feed`), `platform-jobs`, `platform-shell`, `site-shell-navigation` | artifact-only |
| **Total** | **~10-12 files** | **~330-530 changed lines** |

> **Decision needed before apply: Yes** · **Chained PRs recommended: Yes** · **400-line budget risk: Medium-High**.
> Recommend 2-3 stacked work-unit commits on `main` (WU1 first, independently reviewable; then WU2/WU3).

## 9. Affected areas

- `src/app/core/platform/store/jobs.store.ts` — `loadApplication` filters by `applicantId` (W1-p10).
- `src/app/pages/plataforma/job-detail.page.ts` — pass applicantId; gate status block to worker.
- `src/app/pages/plataforma/` — **NEW** home page component (+ spec).
- `src/app/core/platform/store/` — **NEW** applications store (or extend `JobsStore`).
- `src/app/core/platform/nav.ts` + `nav.spec.ts` — new "Inicio" item.
- `src/app/app.routes.ts` — new home child (+ `app.routes.spec.ts`, `platform-shell` spec).
- `src/app/pages/plataforma/login.page.ts`, `registro.page.ts` — landing redirect.
- `src/app/app.a11y.spec.ts`, `app.release-matrix.spec.ts` — add the home route row/target.
- `openspec/specs/platform-jobs/spec.md`, `platform-shell/spec.md`, `site-shell-navigation/spec.md` — deltas.
- `HANDOFF.md:15` — correct the false `roleGuard`/`data.roles` claim.

## 10. Next recommended step

Run **sdd-propose** after the user resolves the §7 blockers — **Q1 (fork) first**, since it decides the spec-delta target and the workload. Bring: W1-p10 fix as MODIFIED `platform-jobs`; the chosen home delta; nav/route wiring; WU1-before-WU2 ordering.

**Ready for Proposal: No** — blocked on Q1 (home location) and Q3 (`roleGuard`).
