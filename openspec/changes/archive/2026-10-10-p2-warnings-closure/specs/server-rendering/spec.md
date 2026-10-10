# Delta for server-rendering

## MODIFIED Requirements

### Requirement: Platform hydration without transfer cache

Client-rendered platform pages MUST hydrate from their own browser output and MUST NOT depend on prerender transfer state. Bootstrapping the platform subtree MUST NOT require any HTTP. A bootstrap test MUST assert that bootstrapping/navigating `/plataforma/**` issues zero HTTP requests, proven with `HttpTestingController` (zero pending requests). The `provideClientHydration()` configuration comment in `app.config.ts` MUST accurately state that no HTTP is issued at platform bootstrap while the HTTP transfer cache remains enabled by default.

(Previously: zero-HTTP bootstrap was asserted without an automated test, and the in-code comment misleadingly read "Plain, no transfer cache".)

#### Scenario: Platform hydrates with zero HTTP

- GIVEN a client-rendered platform page
- WHEN the app boots
- THEN no HTTP request is issued during bootstrap
- AND the page renders after lazily loading its chunk

#### Scenario: Zero-HTTP bootstrap is asserted by a test

- GIVEN the platform app bootstrapped in a TestBed with `provideHttpClientTesting()`
- WHEN the platform subtree is bootstrapped/navigated (e.g. `/plataforma/login`)
- THEN no HTTP request is issued during bootstrap or navigation
- AND `HttpTestingController.verify()` passes with zero pending requests

#### Scenario: Hydration comment is accurate

- GIVEN the `provideClientHydration()` block in `app.config.ts`
- WHEN the comment is inspected
- THEN it states zero HTTP is issued at platform bootstrap
- AND it states the HTTP transfer cache remains enabled by default

## Acceptance Criteria

| # | Criterion | Proven by |
|---|---|---|
| 1 | Comment in `app.config.ts` states zero-HTTP bootstrap and transfer cache enabled by default | review + `bunx ng test --watch=false` |
| 2 | A bootstrap test navigates `/plataforma/**` and asserts zero pending requests | `bunx ng test --watch=false` |
