# Exploration: p10-fixtures — Expanded demo fixtures (HANDOFF §10 Paso 4)

**Scope lock**: no contract change. `contracts/openapi.yaml` is READ-ONLY. Fixtures are client-side
placeholder data for the static demo; no capability behavior changes.

## TL;DR
- **Spec delta**: NO. Data-only change. No new/modified capability; `platform-feed`, `platform-comments`,
  `platform-jobs` behavior is untouched. Precedent: `p8-warnings-closure` (no capability change →
  proposal + tasks only). Recommend skipping **spec** and **design** phases.
- **Deliverable**: richer `mocks/fixtures.ts` — more posts, jobs, profiles, applications — every entry
  still `isPlaceholder: true`.
- **Biggest risk**: `JobsStore.loadApplication` filters by `jobId` only and shows `items[0]`
  (`jobs.store.ts:76-77`), so *the order/first app per job* drives the visible detail status. Adding
  applications can silently change `job-detail` behavior.
- **Second risk**: ~10 hard-coded count/id assertions across 6 spec files pin today's exact fixture
  shape; they must be re-pinned or derived.

---

## Current inventory (evidence)

| Entity | Export | Count | Where (`mocks/fixtures.ts`) | Consumers |
|---|---|---|---|---|
| Posts | `FEED_POSTS` | **3** | L35-63 | `feed.page.ts:74`, `MockFeedGateway` (`mock-feed.gateway.ts:11`) |
| Comments | `COMMENTS` | **3** | L67-104 | `feed.page.ts:82-104`, `MockCommentsGateway` (`mock-comments.gateway.ts:14`) |
| Jobs | `JOBS` | **3** (2 open, 1 closed) | L108-147 | `jobs-list.page.ts:29`, `job-detail.page.ts:45-51`, `MockJobsGateway` (`mock-jobs.gateway.ts:7`) |
| Applications | `APPLICATIONS` | **2** (1 accepted, 1 pending) | L151-174 | `job-detail.page.ts:55-59`, `MockApplicationsGateway` (`mock-applications.gateway.ts:7`) |
| Worker profile | `WORKER_PROFILE` | **1** (worker-1) | L178-191 | `perfil.page.ts:221`, `MockProfilesGateway` (`mock-profiles.gateway.ts:16-18`) |
| Company profile | `COMPANY_PROFILE` | **1** (company-1) | L193-206 | `perfil.page.ts:232`, `MockProfilesGateway` (`mock-profiles.gateway.ts:19-21`) |
| Demo accounts | `DEMO_ACCOUNTS` | **2** (worker-1, company-1) | L210-231 | `MockAuthGateway` (`mock-auth.gateway.ts:18`) |

Today's ids and pinned semantics:
- `post-1`/`post-3` have comments, `post-2` has **0** (the empty-thread sentinel).
- `job-1` open (Vicente López), `job-2` open (Villa Crespo, CABA), `job-3` closed (Rosario).
- `app-1` = job-1 / worker-1 / **accepted**; `app-2` = job-2 / worker-2 / **pending**; job-3 has **no**
  seeded application.
- All entries carry `isPlaceholder: true`; the `satisfies readonly Placeholder<T>[]` clause is the
  compile-time shape proof (`fixtures.ts:22-23`, L60, L98, L144, L171, L188, L203, L225).

## Models (`domain/models.ts`) — fields that drive visible variety

| Type | Key fields | Variety driver |
|---|---|---|
| `Post` (L67-74) | `authorId`, `content`, `attachments?`, `createdAt` | author (company vs worker), content kind; feed shows raw `authorId` (`feed.page.ts:77`) — **no author-name lookup** |
| `Comment` (L86-94) | `postId`, `authorName`, `authorRole`, `body`, `createdAt` | thread count per post, author role mix, chronological order |
| `JobOpening` (L103-112) | `title`, `description`, `location?`, `budget?`, `status: 'open'\|'closed'` (L101) | rubro/trade in title, barrio/ciudad, status |
| `Application` (L122-132) | `jobId`, `applicantId`, `message?`, `status: pending\|accepted\|rejected\|withdrawn` (L122) | status label on job-detail; referential ids |
| `WorkerProfile` (L22-32) | `fullName`, `phone?`, `location?`, `bio?`, `skills?` | profile page only reads the session user (worker-1) |
| `CompanyProfile` (L42-53) | `name`, `description?`, `contactEmail?`, `website?`, `location?` | profile page only reads company-1 |

## Consumers — where MORE data adds visible value

| Consumer | Reads | Visible variety today | Value of more data |
|---|---|---|---|
| `feed.page.ts` | `FEED_POSTS` + per-post `COMMENTS` | content + **raw authorId**; inline threads (`authorName`, `body`) | **HIGH** — more posts + varied comment authors |
| `jobs-list.page.ts` | `JOBS` | `title` + `location` (`jobs-list.page.ts:36-38`) | **HIGH** — distinct rubros + locations |
| `job-detail.page.ts` | one `JOBS` by id + first `APPLICATIONS` by jobId | title/location/description + application status label | **MEDIUM** — status variety limited by first-app-per-job |
| `perfil.page.ts` | session worker/company only | worker-1 / company-1 fields | **LOW** — extra profiles invisible until a role-switcher (Paso 8) |
| applications UI | — | **no dedicated page** | Applications variety is largely **latent** |
| login/registro | `DEMO_ACCOUNTS` | 2 demo logins | extra accounts enable logging in as worker-2/3 |

## Proposed target dataset

| Entity | Target count | Variety dimensions (fields that MUST vary) | Sentinel constraints |
|---|---|---|---|
| Posts | **9** (keep 1-3; add 4-9) | `authorId` (company-1, worker-1/2/3), content kind (avance, búsqueda, oficio/tip), some `attachments` | keep `post-1` content unchanged; keep `post-2` thread empty |
| Comments | **~12** | `postId`, `authorRole` (worker + company), `body`, ascending `createdAt` per thread | keep `post-1`=2, `post-2`=0, `post-3`=1 **exactly** |
| Jobs | **7** (keep 1-3; add 4-7) | rubro (plomería, pintura, herrería, dirección/arquitectura…), `location` (La Plata, Quilmes, Tigre, Córdoba…), `status` (mix), `budget` (present/absent) | keep `job-1` open, `job-2` open+CABA, `job-3` closed + no app; ≥1 closed |
| Applications | **7** covering all 4 statuses | `status` (pending/accepted/rejected/withdrawn), `jobId`, `applicantId` (worker-1/2/3), `message`, dates | **app-1/job-1 must stay first** (worker-1, accepted); **app-2/job-2 must stay first** (pending); do NOT add a 2nd worker-1 app, a 2nd `pending`, or a 2nd `accepted` |
| Worker profiles | **3** (worker-1/2/3) | `skills`, `bio`, `location` | seed new ids in `mock-profiles.gateway.ts:16-18` Map; add matching `DEMO_ACCOUNTS` |
| Company profiles | **2** (company-1/2) | `name`, `description`, `location` | seed in `mock-profiles.gateway.ts:19-21`; add account |
| Demo accounts | **5** | — | all `password: 'demo1234'` |

> Keep every list ≤ **20** entries: `paginate` defaults to `pageSize: 20` (`fixtures.ts:239`).

## Tests to add / update

### Add — `mocks/fixtures.spec.ts` (extend beyond comments)
- `FEED_POSTS` / `JOBS` / `APPLICATIONS`: count (or `≥ N`), every entry `isPlaceholder === true`.
- Shape conformance: sample entries match the domain model enums/fields.
- **Referential integrity**: every `comment.postId` ∈ `FEED_POSTS` ids; every `application.jobId` ∈
  `JOBS` ids; every `application.applicantId` ∈ known worker ids; comments ascending `createdAt`
  per thread.
- Keep the existing comment-thread assertions (post-1=2, post-3=1, post-2=0) if sentinels are preserved.

### Update — existing specs that hard-code counts/ids
| Spec | Lines | What is pinned | Why it breaks |
|---|---|---|---|
| `mocks/fixtures.spec.ts` | 9-11, 22-37 | post-1=2 / post-3=1 / post-2=0; `COMMENTS[0]` identity; thread timestamps | comment counts/order change |
| `api/mock-gateways.spec.ts` | 74-76, 97-98, 106, 112-113, 115-117, 251, 258-260, 270, 292-298 | accepted==1, pending==1, `worker-1→['app-1']`, `JOBS[1]+worker-2→['app-2']`, `post-1→['comment-1','comment-2']`, post-3 length 3 | applications/comments grow |
| `pages/plataforma/feed.page.spec.ts` | 44-45, 216-235, 262-271, 314, 332, 370 | post order + first-3 posts' comment counts; **exact** id list `['comment-content-post-1','post-2','post-3']`; post-1==3 after add | posts grow/reorder |
| `store/comments.store.spec.ts` | 49, 60-76, 82-93, 120, 126, 147-152, 159, 174, 198-213 | post-1→comment-1/2 (len 2), post-2→empty | post-1 comment count changes |
| `store/jobs.store.spec.ts` | 57, 65-73, 118-122, 128-131 | items[0] 'Albañil…', `JOBS[1]` title, `loadApplication(JOBS[0])→accepted`, `loadApplication(JOBS[2])→none` | first-app-per-job / job order |
| `pages/plataforma/job-detail.page.spec.ts` | 26, 32-34, 76, 90, 194 | `JOBS[0]→accepted`, `JOBS[1]→pending`, `JOBS[2]` no app for worker-1 | first-app-per-job |
| `store/feed.store.spec.ts` | 63, 66-67, 102 | `items[0]` content = 'Avance de obra en Villa Crespo' | post-1 content/order |

*(`mock-gateways.spec.ts:26,29,42,52-54` and the `FEED_POSTS.length`-derived assertions are safe —
they derive from the arrays, not literals.)*

## Gotchas
- **First-app-per-job semantics** (`jobs.store.ts:76-77`): `list({ jobId })` → `items[0]`. Adding a
  second application to job-1/job-2 re-orders the visible status. `applicationStatusLabel` already
  maps all 4 statuses (`application-status.ts:8-13`), so `rejected`/`withdrawn` render correctly if
  they land on *app-1/app-2's* jobs — which is exactly what would break the specs.
- **Profiles Map is explicitly seeded** (`mock-profiles.gateway.ts:16-21`): extra profile fixtures are
  inert unless added to the Map. Extra profiles are also unreachable without matching `DEMO_ACCOUNTS`.
- **a11y scan** (`app.a11y.spec.ts:19-33`) audits `/plataforma` under a **company** session → the feed
  renders every post + thread. More DOM must stay violation-free (`duplicate-id`, `label`; comment
  composer ids are `comment-content-{postId}` — unique as long as post ids are unique).
- **Release matrix** (`app.release-matrix.spec.ts:44-49`) asserts `/plataforma/*` render 0 images; the
  feed/jobs/profile fixtures render no `<img>`, so keep it that way (unless attachments add images).
- **Compile-time `satisfies` proof**: new entries must use valid `JobStatus` / `ApplicationStatus` /
  `Role` enum values or `bunx ng build` fails.
- Cosmetic: seeded comment dates are 2025 while posts/jobs are 2026 — align if touching the file.

## Spec-delta decision
**NO capability delta.** Fixtures are demo placeholder data; no capability's requirements/scenarios
change. `contracts/openapi.yaml` stays READ-ONLY. Skip the **spec** phase; skip or minimally-cover the
**design** phase (trivial data change). Precedent: `p8-warnings-closure`.

## Risks
- **R1 (HIGH)** — `loadApplication` first-item semantics: new applications can silently change
  job-detail status. Mitigation: pin `app-1`/`app-2` as first per job, or change `loadApplication` to
  filter by `applicantId` (behavior change → needs its own spec).
- **R2 (HIGH)** — ~10 literal count/id assertions across 6 spec files break if sentinels change.
- **R3 (MED)** — keep every list ≤ 20 or pagination hides data (`paginate` default, `fixtures.ts:239`).
- **R4 (LOW)** — a11y scan must stay green over the larger feed.
- **R5 (LOW)** — `satisfies` proof: enum/field drift fails the build.
- **R6 (LOW)** — extra worker/company profiles look like dead data until Paso 8 (role-switcher).

## Open questions
1. Confirm target counts: **9 posts / 7 jobs / 7 applications / 5 profiles** (or smaller)?
2. Add a **second company** (`company-2`) as post/job author (needs new account + profile)?
3. Keep job-detail's "first app per job" and re-pin sentinels, **or** change `loadApplication` to filter
   by `applicantId` (behavior change, separate spec)?
4. Make extra worker profiles reachable now (accounts + login) or defer reachability to Paso 8?

## Next recommended
Proceed to **propose** (small, data-only) → **tasks**. Skip **spec** and **design** (no capability
delta). Strict TDD: fixtures tests land with the fixtures change.

## Size estimate
`fixtures.ts` ≈ +130-160; `fixtures.spec.ts` ≈ +60-90; gateway/profile seeding ≈ +10; 6 spec-file
touch-ups ≈ +40-70. **Total ≈ 240-330 changed lines across ~8 files** (under the 400-line budget →
single change, ~2 work-unit commits).

## Ready for Proposal
**Yes** — subject to the 4 open questions above; none block a strawman proposal.
