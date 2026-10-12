# Explore: p8-warnings-closure (close accumulated warnings from p6 and p7)

## Project Standards (auto-resolved)
- cognitive-doc-design: lead with the answer; tables/checklists.
- work-unit-commits: commit by work unit; tests with code.
- go-testing is Go-specific and NOT applicable here.

## Constraints (locked)
- Angular 22.2.0, standalone, ZONELESS signals, TS strict, Tailwind v4. **BUN ONLY.**
- **Strict TDD ACTIVE** (`bunx ng test --watch=false`).
- UI copy es-AR; artifacts **English**.
- `contracts/openapi.yaml` READ-ONLY.
- Artifact store **hybrid**: write `openspec/changes/p8-warnings-closure/explore.md` AND `mem_save` (topic_key `sdd/p8-warnings-closure/explore`, `capture_prompt: false`, project `construction-company-agency`).

## Current State (verified, file:line)

### p6-W1: `/plataforma/registro` absent from `app.a11y.spec.ts` TARGET_PATHS
- **File:** `src/app/app.a11y.spec.ts:18-29` (TARGET_PATHS const) — platform routes (`/plataforma`, `/plataforma/login`, `/plataforma/registro`, etc. under authGuard) are not included. Only marketing/public routes are scanned.
- **Impact:** The registration radio group (p6 context) is never axe-scanned. Adding `/plataforma/registro` to TARGET_PATHS will subject that page to axe-core under the existing ruleset.

### p6-S1: `site.promo.ctaPath` declared+asserted but header uses literal `/plataforma/registro`
- **Content model:** `src/content/site.ts:72` has `ctaPath: '/plataforma/registro'`. `src/content/content.types.ts:106-113` defines `Promo.ctaPath`.
- **Header template:** `src/app/components/layout/header.component.html:50-56` — CTA uses `routerLink="/plataforma/registro"` as a literal string (not bound to `site.promo.ctaPath`).
- **Spec:** `src/app/components/layout/header.component.spec.ts:117` asserts `cta?.getAttribute('href')).toBe('/plataforma/registro')` and `cta?.textContent?.trim()).toBe(site.promo.ctaLabel)`.
- **Drift risk:** If `site.promo.ctaPath` changes, template/spec could diverge; template is the source of truth for the href in the rendered DOM.

### p6-S2: header spec iterates `site.promo.plans` without non-empty guard
- **Spec:** `src/app/components/layout/header.component.spec.ts:126-130` iterates `site.promo.plans` with `forEach` and accesses `rows[index]` without asserting `rows.length === site.promo.plans.length` first? Actually lines 126-130: it does `expect(rows).toHaveLength(site.promo.plans.length)` (line 125), then iterates. So the guard exists. However "header spec iterates `site.promo.plans` without a non-empty guard" — the warning says "without a non-empty guard" (spec smell). The spec does length check, so maybe the intent is defensive guard? Or perhaps the warning is that if plans can be empty, iteration behavior needs guard. But `site.promo.plans` is readonly array from content; current content has 3 items.

### p7-W1: login reactivity proven only via `role` input seam, not a real `SessionService.login()`
- **Spec:** `src/app/pages/plataforma/platform-header/platform-header.component.spec.ts` — tests show `seedSession('company')` + `create()` with no role input (lines ~105-108) proves session seeding works. Also has `setInput('role', 'worker')` after render (lines ~121-129). The warning says "login reactivity proven only via the `role` input seam, not a real `SessionService.login()` (logout is real)".
- **Current behavior:** SessionService reads from localStorage at construction (`session.service.ts:66` calls `readStoredSession()`), writes on login/logout. Seeding localStorage then constructing the component (which injects SessionService) is equivalent to having a real session. So "real SessionService.login()" path isn't directly tested in the header spec — but SessionService has its own comprehensive tests including login/logout.

### p7-S1: `/plataforma` and `/plataforma/login` absent from TARGET_PATHS
- **Same as p6-W1:** `app.a11y.spec.ts:18-29` missing platform paths. Also note: `/plataforma` is behind `authGuard` (routes.ts:106). `/plataforma/login` is open (routes.ts:134-141).

### p7-W2/p7-S2: doc-only nits
- "apply-progress "safety net N/A"; diff size note — likely NO code change"

### Platform pages & a11y mechanics
- **A11y spec mechanics:** `app.a11y.spec.ts` uses `goto()` which navigates via router, flushes change detection, appends fixture.nativeElement to document.body, then runs `axe.run(document, AXE_OPTIONS)` scanning the full document (not fixture root) — critical for landmark rules. Also asserts every enabled rule was evaluated (`passes/violations/incomplete/inapplicable` all contain the rule id). Ruleset includes `landmark-one-main`, `page-has-heading-one`, `region`, `list`, `duplicate-id`, plus basic controls.
- **App shell:** `src/app/app.html:1-13` has skip link, renders platform header when `isPlatform()` true else marketing header; has `<main id="main" tabindex="-1">` with router-outlet. Platform routes use platform header (separate from marketing). Marketing footer/sticky-cta only shown for non-platform routes.
- **Platform pages:** 
  - `login.page.ts` has `<section>` wrapper, `<h1>Ingresar</h1>` (line ~18), form with labels/inputs, no main landmark inside page component (main is in app shell). Also has `role="alert"` on error (line ~52). Uses proper labels (`for` attributes matching ids).
  - `registro.page.ts` has `<h1>Crear cuenta</h1>` (line ~49), fieldset with legend for role radio group (lines ~83-107), proper labels. Radio inputs have `name`, `value`, `required`. No main inside.
  - `feed.page.ts` has `<h1>Novedades</h1>` (line ~21), switches between loading/empty/ready states, lists posts in `<ul>/<li>`. Also gated composer for company role.
- **SessionService:** `session.service.ts:66` initializes signal from `readStoredSession()` which reads from localStorage (defensive). So if localStorage is seeded before component instantiation, the service sees it. Also `isAuthenticated()` is `session() !== null`. `authGuard` checks `session.isAuthenticated()`.

### Routing/auth implications for a11y scanning
- `/plataforma/login` and `/plataforma/registro` are **open routes** (no authGuard). So scanning them directly via router navigation is fine.
- `/plataforma` (feed) is behind `authGuard` — requires `session.isAuthenticated() === true`. If not authenticated, guard returns `router.createUrlTree(['/plataforma/login'])` (line 15 in authGuard). So navigating to `/plataforma` without session will redirect to `/plataforma/login`. That means scanning `/plataforma` without seeding session would effectively scan the login page again (or just navigate to login). Also the guard runs during navigation; the a11y test navigates and flushes — with an unauthenticated session, the destination becomes login. So to scan the actual feed page, we need an authenticated session before navigation to `/plataforma`.

## Feasibility + Approach per warning

### p6-W1: Add `/plataforma/registro` to TARGET_PATHS
- **Type:** Code change (test config)
- **Approach:** Add `'/plataforma/registro'` to `TARGET_PATHS` array in `app.a11y.spec.ts`.
- **Feasibility:** Easy. Route is open, no auth needed. Page has h1, proper form structure with labels/fieldset — likely passes current AXE_RULES.
- **Impact:** +1 route scanned; may catch regressions on registration form.

### p6-S1: Bind header CTA to `site.promo.ctaPath` (drift risk)
- **Type:** Code change (template)
- **Approach:** Change `header.component.html` line ~51 from `routerLink="/plataforma/registro"` to `routerLink]="site.promo.ctaPath"`. Also ensure `site` is available (HeaderComponent already imports/uses `site` — see template uses `site.nap.name`, `site.nav`, `site.promo.text`, `site.promo.ctaLabel` etc., so likely `site` is exposed; need to confirm component exposes it).
- **Check component:** Let us verify HeaderComponent exposes `site`. Also spec already asserts the exact href string matches — changing template to bind means same rendered value; test still passes as-is.
- **Feasibility:** Easy. Removes drift between content model and template.
- **Tradeoff:** Better maintainability (single source of truth) vs no functional change.

### p6-S2: Guard against empty plans in header spec
- **Type:** Test strengthening (spec)
- **Approach:** The warning says "iterates `site.promo.plans` without a non-empty guard". Current spec does `expect(rows).toHaveLength(site.promo.plans.length)` before iterating — this is effectively a guard. But maybe they want an explicit non-empty assertion like `expect(site.promo.plans.length).toBeGreaterThan(0)` or ensure we don't blindly index? Or perhaps the test should guard with `if (site.promo.plans.length > 0)` before iterating? The current code iterates via forEach after length check; that’s fine. Alternatively, maybe the warning is a minor spec smell in the original context — could be satisfied by adding an explicit assertion that plans array is non-empty first.
- **Feasibility:** Trivial test edit if needed. Low value, purely defensive.

### p7-W1: Test platform header with real SessionService.login()
- **Type:** Test change (strengthening)
- **Approach:** Add a test case that does `await TestBed.inject(SessionService).login(...)` (which writes to localStorage and sets signal) rather than calling `seedSession()` helper directly, then creates component and verifies nav renders correctly. Also keeps existing tests that use `setInput('role')` seam (which tests input-based reactivity). The warning says "login reactivity proven only via the `role` input seam, not a real `SessionService.login()` (logout is real)" — logout is already tested with real service (line ~115-119). So add a parallel test using real login.
- **Feasibility:** Easy. SessionService is available; login works with demo credentials per its spec.
- **Tradeoff:** More integration-style test (uses real service path) vs seam-based unit test. Both valid; strengthens confidence.

### p7-S1: Add platform paths to TARGET_PATHS
- **Type:** Code change (test config)
- **Approach:** Add `'/plataforma'`, `'/plataforma/login'` to TARGET_PATHS. Also consider if we need other platform paths? But the warning lists exactly those two. Note: scanning `/plataforma` without auth will redirect to `/plataforma/login` due to authGuard — so we must seed session before navigating to `/plataforma` in the a11y test. Otherwise we’ll scan login page again. Same issue applies generally.

## A11y risk assessment (critical)

**Will adding platform paths pass, or reveal real violations?**

### `/plataforma/login`
- **Structure:** Has `<h1>Ingresar</h1>` (line ~18 login.page.ts), section wrapper, form with labels associated via `for`/`id` (email/password inputs have ids `login-email`, `login-password` and labels `for` them). Error uses `role="alert"`. Demo notice text present.
- **Likely passes:** Has page heading (satisfies `page-has-heading-one`), form controls properly labeled (`label` rule), no images without alt, links have names, no obvious nested interactive, no positive tabindex. Landmark: main comes from app shell (`app.html` has `<main id="main">`) — the page content is inside router-outlet inside main; axe scans document including app shell. App shell provides main landmark; page itself is a routed component — should be fine.
- **Potential concerns:** Duplicate ids? Each id is scoped to login page; no other elements with same ids on this route. Also region rule — content should be in regions/landmarks; having a `<section>` is fine.
- **Verdict:** **Likely PASS** with current ruleset.

### `/plataforma/registro`
- **Structure:** Has `<h1>Crear cuenta</h1>` (line ~49 registro.page.ts). Fieldset with legend "Me registro como" containing radio group (lines ~83-107). Radio inputs have `name="registro-role"`, `value` attributes, `required`, and labels wrap the input+text. Each radio option is in its own label with proper structure.
- **Radio group a11y:** Using fieldset/legend is good. Each radio has name and is associated; labels wrap inputs (implicit labeling) — works. Also has `required` on inputs.
- **Likely passes:** All rules — label rule applies to inputs (radios have labels). `list` rule applies to ul/li? No ul in the template shown; radios are in divs with labels. Not a list structure, so list rule shouldn’t trigger. Heading present.
- **Verdict:** **Likely PASS**.

### `/plataforma` (feed, behind authGuard)
- **Critical constraint:** As reasoned, without session authGuard redirects to `/plataforma/login`. So scanning `/plataforma` unauthenticated = scans login. To scan the actual feed page, we must have an authenticated session when navigating to `/plataforma`.
- **Feed structure:** Has `<h1>Novedades</h1>` (line ~21 feed.page.ts). For company role, shows composer form with textarea labeled (label "Publicar novedad" for `feed-post-content`, textarea has id). Lists posts in `<ul class="mt-6 space-y-4">` with `<li data-testid="feed-post">` (line ~58-66). For non-company roles, no composer. Loading/empty states show paragraphs. No images. Platform header is separate (rendered by app shell when on platform routes).
- **Potential issues:** 
  - The posts are in a `<ul>` — good for list semantics. Each post is an `<li>`. That satisfies `list` rule if properly structured.
  - Heading exists.
  - Composer form: textarea has id `feed-post-content` and label `for` it? Looking at feed.page.ts: label has `for="feed-post-content"` (line ~29-31) and textarea has `id="feed-post-content"` (line ~33). Yes, associated. Button is type=submit with text.
  - Platform header (platform-header.component.ts) renders `<nav aria-label="Navegación de la plataforma">` when nav items exist (nav().length > 0). For authenticated users with roles, nav items exist (worker/company/admin get nav from platformNavFor). So nav landmark will be present. That’s fine.
- **Verdict:** **Likely PASS** if session is seeded. Main landmark exists in app shell; h1 present; proper labeling; list semantics OK.

### A11y risk summary
- **Overall risk: LOW**. Platform pages follow similar patterns to marketing pages (headings, labels, proper structure). No obvious axe violations visible from code inspection.
- **Main complication:** `/plataforma` requires authentication due to authGuard. The a11y test must seed a session before navigating to `/plataforma`. Also SessionService reads from localStorage at construction time — so seeding localStorage before `TestBed.createComponent(App)` or before router navigation? Because SessionService is `providedIn: 'root'`, it’s instantiated when first injected. Also in the a11y test setup (line ~72-86 in app.a11y.spec.ts), they create component, detectChanges, inject router — SessionService would be instantiated when injected by anything that needs it; but in the current setup, no SessionService injected yet. So seeding localStorage in `beforeEach` before creating component is fine? Because SessionService reads on construction (`session = signal(readStoredSession())` at line ~66). So if we set localStorage before `TestBed.createComponent(App)`, the service will read the seeded value on first instantiation.
- **Recommendation:** If adding `/plataforma` to TARGET_PATHS, update the a11y test to seed a demo session (e.g., worker/company session) in `beforeEach` so that navigating to `/plataforma` doesn’t redirect to login. Alternatively, handle per-path — but easier to seed once. Also login/registro don’t need auth.

## Session-seeding recipe for a11y/header tests

### For app.a11y.spec.ts
- **Goal:** Be able to scan `/plataforma` (feed) without redirecting to login. Also login/registro scan fine without auth.
- **Approach 1 (simple, global):** In `beforeEach`, seed a session in localStorage before creating component. Use SESSION_STORAGE_KEY from SessionService. Example:
  ```ts
  import { SESSION_STORAGE_KEY } from './core/platform/auth/session.service';
  // ...
  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      token: 'mock-token',
      user: { userId: 'worker-1', email: 'demo@test', role: 'worker' }
    }));
    // ... rest
  });
  ```
- **Approach 2 (path-aware):** When navigating to paths that need auth, seed; but easier to seed globally. Worker session is fine (feed works for any authenticated role; company gets composer but composer doesn’t break a11y scanning).
- **Notes:** SessionService reads at construction time. Seeding before `TestBed.createComponent(App)` ensures service sees it on instantiation.
- **Cleanup:** Keep existing `afterEach` cleanup of fixture; also consider clearing localStorage in afterEach if not already done (not specified, but good practice).

### For platform-header.component.spec.ts (p7-W1)
- **Current seeding:** Uses helper `seedSession(role)` that sets localStorage directly (line ~14-21 in platform-header spec). This is fine.
- **To test with real SessionService.login():** 
  ```ts
  it('renders company nav after real login without role input', async () => {
    const session = TestBed.inject(SessionService);
    await session.login('norte@demo.test', 'demo1234'); // company role
    expect(navLabels(create())).toEqual(['Novedades', 'Vacantes', 'Mi empresa']);
  });
  ```
- **Credentials:** From session.service.spec.ts, `norte@demo.test`/`demo1234` logs in as company; `lucia@demo.test`/`demo1234` logs in as worker. Also register flow exists.
- **Note:** After login, SessionService persists to localStorage and updates signal; component reads via `session.role()` computed. So this tests the real integration path.

### General notes
- localStorage is available in jsdom test environment.
- SessionService expects HttpClient providers? Looking at session.service.ts, it injects `AUTH_GATEWAY` (line ~65) and calls auth.login/register/logout/me. Also session.service.spec.ts provides `provideHttpClient()` and `provideHttpClientTesting()`. So for platform-header tests that don’t call login via service but only seed localStorage, they don’t need HttpClient providers? Let us look: platform-header spec does `provideRouter([])` only (line ~53). And it uses SessionService which injects AUTH_GATEWAY — but if we only read session state (role/computed from signal), and don’t call methods that use auth gateway? The service injects auth gateway in constructor; that’s fine even if not used. Also in the spec that does real login, we’d need HttpClient providers. But easier to follow existing test setup patterns.

## Options/Tradeoffs

| Option | Pros | Cons | Complexity |
|---|---|---|---|
| **Minimal closure (doc-only + tiny fixes)**: Do p7-W2/p7-S2 as doc notes if any; for code, only add platform paths to a11y spec and maybe the header CTA binding fix. Skip the "real login" test addition if not strictly necessary. | Smallest scope, low risk, addresses stated warnings directly. | Misses strengthening opportunity (p7-W1) and the header spec guard minor issue (p6-S2). | Low |
| **Balanced (recommended)**: Add `/plataforma/registro` to TARGET_PATHS; bind header CTA to `site.promo.ctaPath`; add platform paths (`/plataforma`, `/plataforma/login`) to TARGET_PATHS with session seeding; add a test using real `SessionService.login()` in platform-header spec; add non-empty guard in header promo plans spec. | Fixes all warnings, improves maintainability (drift prevention), strengthens test coverage with real integration path, low a11y risk. | Slightly larger scope (still small). Need to handle a11y test session seeding carefully. | Low-Med |
| **Maximal (overreach)**: Also refactor other things, change how guard works, etc. | Unnecessary. | Violates "close warnings carried by p6/p7" constraint; scope creep. | High |

**Recommendation:** Balanced approach — addresses each warning concretely with minimal, correct fixes.

## Risks

- **A11y test session seeding:** If we seed session globally in app.a11y.spec.ts, it affects all navigations. But login/registro routes are open regardless of session state (authGuard only protects children that aren’t login/registro). So seeding won’t break scanning login/registro. Also good because it lets us scan `/plataforma`.
- **Header CTA binding:** Changing template to use `site.promo.ctaPath` is safe since component already has access to `site` (used throughout). Also spec still expects same href value.
- **Platform-header real login test:** Requires HttpClient providers? SessionService.login() uses auth gateway which uses HttpClient (per ports/in-memory adapter). Looking at how SessionService works with in-memory adapter - the auth gateway is injected; in tests, they might need proper providers. But SessionService spec provides HttpClient + HttpTestingController. Platform-header spec currently only has `provideRouter([])`. Adding a test that calls `session.login()` will need HttpClient providers. So either add providers to the spec’s TestBed setup, or use the seeding approach (which is simpler and already used). The warning says "not a real `SessionService.login()`" — meaning the test path doesn’t exercise the login method; using seedSession() is fine functionally. Adding a test with real login is nice but requires setup changes.
- **Strict TDD:** All changes are test modifications or small template/content binding changes. No production logic changes. Tests still need to pass.
- **No production code behavior changes:** Only template binding improvement (non-breaking), test config additions.

## Open Questions

1. **p6-S2 "non-empty guard"** — Is the current `expect(rows).toHaveLength(site.promo.plans.length)` sufficient? Or do they want an explicit `expect(site.promo.plans.length).toBeGreaterThan(0)` assertion before the loop? The warning as stated is a bit ambiguous, but adding the explicit non-empty check is harmless.
2. **p7-W1 scope** — Does "not a real SessionService.login()" require modifying existing tests or just adding one? The warning is pointing out the gap; adding a complementary test case is cleaner than changing existing behavior.
3. **Adding `/plataforma` to a11y TARGET_PATHS** — This will make the a11y scan also cover the feed page when authenticated. That’s good. Is there any reason not to? Also we should consider if other platform child routes (trabajos, perfil) need scanning? The warnings only mention `/plataforma` and `/plataforma/login` for p7-S1; p6-W1 mentions `/plataforma/registro`. So stick to exactly what warnings call out.

## Next Recommended

**Proceed to propose/spec/tasks as appropriate for this change.** The closure is well-defined and small. Recommended actions in order:
1. **Fix p6-S1 (header CTA binding):** Template change to use `site.promo.ctaPath` — improves correctness.
2. **Add platform paths to a11y spec (p6-W1, p7-S1):** Update TARGET_PATHS and add session seeding in beforeEach.
3. **Strengthen header promo spec (p6-S2):** Add explicit non-empty guard.
4. **Add real login test in platform-header spec (p7-W1):** Add test using SessionService.login() with proper providers.
5. **Run tests:** `bunx ng test --watch=false` to verify.
6. **Commit by work unit** per project standards.

All changes are low-risk and directly address the carried warnings. A11y pages look structurally sound based on inspection.
