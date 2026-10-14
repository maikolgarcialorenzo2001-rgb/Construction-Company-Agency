# platform-preview Specification

## Purpose

Public, hostable preview mode: a top-level, prerenderable `/previa` showcase rendered synchronously from fixtures, plus a client-only role switcher that enters the live platform as any of the 6 demo accounts without registering. Fictional data; no backend, no contract change.

## Requirements

### Requirement: Public prerenderable preview route

`/previa` MUST be a top-level browser route, sibling of `plataforma` and outside the `/plataforma` subtree, so the prerender derivation auto-includes it. It MUST be reachable without a session (no `canActivate`, `canActivateChild`, or `resolve`) and MUST declare `data.seo.indexable === false`. `/previa/:role` MUST resolve for `worker`, `company`, and `admin`.

#### Scenario: Preview is reachable anonymously

- GIVEN no active session
- WHEN `/previa` is navigated to
- THEN the showcase renders without redirect

#### Scenario: Preview is top-level, not platform

- GIVEN the browser route table
- WHEN top-level paths are inspected
- THEN `previa` is present before the wildcard
- AND `isWithinPrefix('previa', 'plataforma')` is false

#### Scenario: Preview opts out of indexing

- GIVEN the route table
- WHEN `/previa` and `/previa/:role` are inspected
- THEN each carries `indexable: false`

#### Scenario: Unknown role falls back deterministically

- GIVEN `/previa/inventado`
- WHEN the route resolves
- THEN the default preview view renders
- AND no error is thrown and no blank page is shown

### Requirement: Synchronous fixture snapshot

The preview MUST render synchronously from `fixtures.ts` exports (`FEED_POSTS`, `COMMENTS`, `JOBS`, `APPLICATIONS`, `WORKER_PROFILES`, `COMPANY_PROFILES`, `DEMO_ACCOUNTS`, `paginate`). The prerender path MUST NOT await any store or async gateway, and MUST NOT use `Date.now()` or random values, so first render is deterministic and hydration-stable. The prerendered HTML MUST contain showcase content, never an empty shell.

#### Scenario: Prerendered HTML is non-empty

- GIVEN a completed `bunx ng build`
- WHEN the `/previa` prerendered HTML is read
- THEN it contains feed, jobs, and profile showcase content from the fixtures
- AND it does not consist only of a loading or empty placeholder

#### Scenario: First render is deterministic and hydration-stable

- GIVEN the preview renders twice with the same fixtures
- WHEN the two DOM trees are compared
- THEN they are identical
- AND no `Date.now()` or random-derived value appears in the markup

### Requirement: Role variant content

`/previa/:role` MUST render role-specific sections: `worker` (applications from `APPLICATIONS` + `JOBS`), `company` (vacancies filtered by `companyId`), `admin` (directory from `DEMO_ACCOUNTS`, never a password value). `/previa` without a role MUST render a defined default (feed + jobs + one worker and one company profile). The role MUST come from the route segment so per-role HTML works with JavaScript disabled.

#### Scenario: Per-role sections render

- GIVEN the fixtures
- WHEN `/previa/worker`, `/previa/company`, and `/previa/admin` render
- THEN each shows its role-specific section
- AND `/previa/admin` never renders a password value

#### Scenario: Role view works without JavaScript

- GIVEN the static build output
- WHEN `/previa/company` HTML is read with JS disabled
- THEN the company role content is present in the served HTML

### Requirement: Client-only role switcher

A switcher on `/previa` MUST let a visitor enter the live platform as any of the 6 demo accounts by calling `SessionService.login(email, 'demo1234')`; it MUST NOT require registration and MUST NOT add accounts. The switcher MUST be client-only (it depends on session storage) and MUST stay inert during prerender. Its per-role links MUST be plain anchors to the prerendered `/previa/:role` pages. After hydration, entering an account MUST update `currentUser` and navigate to `/plataforma/inicio`. The switcher MUST NOT add any guard to `/previa` or `/plataforma`.

#### Scenario: Every demo account enters the platform

- GIVEN the switcher on `/previa`
- WHEN each of the 6 demo accounts is chosen
- THEN `login` is called with that account's email and `demo1234`
- AND `currentUser` resolves to that account's `userId` and role

#### Scenario: No registration is required

- GIVEN the switcher renders
- WHEN an account is chosen
- THEN no `register` call is issued
- AND no new account is created

#### Scenario: Switcher links are prerendered anchors

- GIVEN the `/previa` HTML
- WHEN the role links are inspected
- THEN they are `<a>` links to `/previa/worker`, `/previa/company`, and `/previa/admin`

### Requirement: Preview noindex partition and prerender contracts

The top-level noindex route set MUST be exactly `['plataforma', 'previa', '**']`. `app.routes.spec.ts` MUST be updated to this exact top-level table and partition. `scripts/verify-prerender.ts` MUST NOT add `/previa` to its JSON-LD-checked `STATIC_PATHS` (NOINDEX emits no JSON-LD), and the `previa` build artifact path MUST NOT contain `plataforma`, so the platform leak scan stays green and the build gate passes.

#### Scenario: Noindex partition includes the preview

- GIVEN the route table
- WHEN routes with `indexable === false` are collected
- THEN the top-level paths equal `['plataforma', 'previa', '**']`

#### Scenario: Verify script keeps the preview out of JSON-LD checks

- GIVEN `scripts/verify-prerender.ts`
- WHEN its `STATIC_PATHS` are read
- THEN `previa` is absent
- AND the platform leak scan still runs and reports no leak
