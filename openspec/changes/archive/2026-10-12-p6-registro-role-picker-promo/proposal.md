# Proposal: p6-registro-role-picker-promo

## Intent / Why

Polish the existing `/plataforma` mock auth UX for a presentable static preview and add a light marketing touch: (1) present role selection as a described, accessible single-choice chooser so workers and companies understand what each option means, (2) leave login functionally unchanged, (3) surface a trial→paid promo in the marketing header advertising "7 días de uso gratis, después planes de pago" with placeholder plan content and a clear CTA to registration.

## Scope

**In scope**
- Replace the plain `<select data-testid="registro-role">` on `/plataforma/registro` with a described, card/radio-style single-choice chooser.
- Keep only self-service roles: `worker`, `company` (never offer `admin`).
- Preserve the `data-testid="registro-role"` semantics (moved onto the group) so functional tests can target the control.
- Add a promo banner strip **inside `HeaderComponent`** (marketing header only; not rendered on `/plataforma/**`).
- Promo strip is static and **non-dismissible**, no images (to satisfy prerender + header image budget).
- Promo copy lives in the typed content model as `site.promo` with `isPlaceholder: true`. Include minimal placeholder `plans` (2–3 entries, also `isPlaceholder`) in `site.promo` for future editing.
- Promo CTA links to `/plataforma/registro` (exactly one `a[href="/plataforma"]` remains as the platform entry in the header).
- Spec deltas for `platform-identity` (role UX with titles+descriptions), `content-model` (add `promo` to `Site`), and `site-shell-navigation` (header promo strip + registration CTA context).

**Out of scope**
- Contract changes: `Role` enum and `contracts/openapi.yaml` remain unchanged. No moderation/4th role.
- Login: no functional changes.
- Backend: mock auth only (already in place).
- Dismissible promo, images, analytics, A/B testing, locale beyond es-AR for UI strings.

## Locked Decisions (encode as defaults)

- **Role picker UI**: Native radio cards in `<fieldset>` + `<legend>`. `data-testid="registro-role"` is preserved on the group (not on each `<input>`). Roving keyboard and semantics are native (zero custom JS). 
- **Role data shape**: Extend the local `SELF_SERVICE_ROLES` to `{ value, title, description }` (es-AR). Titles and descriptions stay **local to the page** (platform UI copy), not in the marketing content graph.
- **Promo placement**: Render the strip **inside `HeaderComponent`** (within the header landmark). Do not add a sibling element to `app.html`. This avoids axe `region` landmark violation and preserves the exact shell-order test `app.spec.ts` (`['a','app-header','main','app-footer','app-sticky-cta']`).
- **Promo behavior**: Static, **non-dismissible**. No images. Prerender-safe with no `localStorage`/hydration hooks needed. 
- **Promo destination**: CTA points to **`/plataforma/registro`**. The header retains **exactly one** `a[href="/plataforma"]` (platform entry) as asserted by `header.component.spec.ts`.
- **Promo content source**: Typed in `src/content/site.ts` + `src/content/content.types.ts` as `site.promo`. Field flags: `isPlaceholder: true` (and each placeholder plan entry marked `isPlaceholder: true`). 
- **Plans teaser**: Include minimal placeholder `plans` data set (2–3 entries, `name`, `price`/`note`, `isPlaceholder`) in `site.promo` so the strip can render a compact plan teaser now and content can be edited later without a structural change.
- **Self-service constraint**: Only `worker` and `company` offered; `admin` remains non-offered. Contract untouched.

## Affected Areas

- `src/app/pages/plataforma/registro.page.ts` — replace `<select>` with described radio cards; extend role const to `{ value, title, description }`; update handlers to read radio group value.
- `src/app/pages/plataforma/registro.page.spec.ts` — **rewrite** role assertions and register flow for radio cards (tests currently depend on `<select>/<option>` and casting to `HTMLSelectElement`). Must be RED-first under strict TDD.
- `src/app/components/layout/header.component.ts` / `.html` / `.spec.ts` — inject/consume `site.promo` (or just read `site`), render promo strip inside the header; add/update tests as needed (e.g. assert promo text/CTA presence and CTA href `/plataforma/registro`).
- `src/content/site.ts` + `src/content/content.types.ts` — add typed `promo` field to `Site`. Define `PromoPlan`/`Promo` types with `isPlaceholder: true` flags.
- `src/content/site.spec.ts` and `src/content/content.spec.ts` — ensure promo shape is valid and placeholder assertions still hold (content graph placeholder gate must continue to cover modules with placeholders).
- `src/styles.css` — optional `@utility` for promo strip/radio card if Tailwind classes become verbose (avoid framework creep).

## Affected Capabilities/Specs

- **`platform-identity`**: Update UX requirement to state each role shows a title + description (es-AR); registration still offers only `worker`/`company`; `admin` never offered. Programmatic guard remains as-is.
- **`content-model`**: Add `promo` to `Site` schema (typed), including optional `plans` array with `isPlaceholder` flags; content remains in `src/content/` and follows placeholder convention.
- **`site-shell-navigation`**: Clarify header includes a promo strip inside the header landmark, CTA to `/plataforma/registro`, and header still exposes exactly one platform entry to `/plataforma`.

## Risks

- **Strict TDD surface breakage**: `registro.page.spec.ts` has two brittle assertions depending on `<select>/<option>` (`optionValues()` + casting to `HTMLSelectElement`). These must be rewritten in the same change task set (RED first). 
- **A11y landmark**: Incorrect placement (outside header in `app.html`) trips axe `region` rule on all 10 scanned marketing paths. Mitigate by rendering inside `HeaderComponent`.
- **Shell-order exactness**: Adding top-level sibling breaks `app.spec.ts` child order. Mitigate by in-header placement.
- **Header test exactness**: `header.component.spec.ts` asserts exactly one `a[href="/plataforma"]`. Promo CTA must be `/plataforma/registro` (different href). 
- **Prerender/hydration**: Dismissible strip needs `localStorage` → client/server mismatch on static prerender. Keep static and non-dismissible. No images (release-matrix counts images only inside `<main>`).
- **Placeholder gate**: Adding `promo` to `site` keeps `site` flagged (`nap.isPlaceholder` exists). If promo were introduced as a new module, it must be added to `CONTENT_MODULES`/`CONTENT_GRAPH`; since it's a field on `Site`, existing gate still walks `site` and will find `promo.isPlaceholder`.
- **Contract discipline**: Any temptation to add a 4th role or change `contracts/openapi.yaml` is out of scope (would require separate SDD contract change).

## Rollback

Trivial: revert commits touching the affected files (UI, header, content types/site). No schema/migration or contract rollback needed.

## Open Decisions (defaults applied)

- **Plans teaser**: Render compactly in the strip (name + short note/price). Plans are placeholder data; UI should not assume they are final.
- **Dismissible**: **No** (SSR/hydration risk, extra test surface). 
- **Role descriptions**: Authored in es-AR by implementer (local to registro page). Suggested drafts: `worker` — "Acceso para ofrecer servicios y postularse a trabajos"; `company` — "Acceso para publicar proyectos y contratar profesionales". Final strings can be refined in spec/tasks if needed, but defaults are fine.
- **Spec deltas scope**: Include all three (`platform-identity`, `content-model`, `site-shell-navigation`) as listed.

## Next Recommended Step

Proceed to **sdd-spec** to write delta specs reflecting these decisions, then **sdd-tasks** to break into reviewable work units (including the required test rewrites for registro). Implement under strict TDD (RED → GREEN → REFACTOR) with `bunx ng test --watch=false`.

---

**Engram save (required)**: topic_key `sdd/p6-registro-role-picker-promo/proposal`, capture_prompt `false`, project `construction-company-agency`, scope `project`.  
**Artifact**: `openspec/changes/p6-registro-role-picker-promo/proposal.md` (this file) — written in English per standards.