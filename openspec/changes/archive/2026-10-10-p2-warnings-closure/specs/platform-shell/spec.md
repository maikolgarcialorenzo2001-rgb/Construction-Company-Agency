# Delta for platform-shell

## MODIFIED Requirements

### Requirement: Platform subtree excluded from prerender

The platform subtree MUST be client-rendered. The prerender derivation MUST exclude any browser path equal to or nested under `plataforma`, so `bunx ng build` emits no platform HTML. The build gate MUST run an automated scan of the built client output (robust to both `dist/browser` and `dist/<project>/browser`) that fails when any `*plataforma*` artifact is present.

(Previously: exclusion was verified only by a server-route spec plus a manual `find dist -iname '*plataforma*'`; there was no automated gate scan.)

#### Scenario: No platform server route

- GIVEN the server route table
- WHEN the prerendered entries are inspected
- THEN no path equals `plataforma` or starts with `plataforma/`

#### Scenario: No platform HTML is emitted

- GIVEN `bunx ng build`
- WHEN `dist/browser` is scanned
- THEN no `plataforma` directory or `index.html` exists

#### Scenario: Leak scan fails the gate

- GIVEN a built client output containing a `plataforma` artifact
- WHEN the gate scan runs
- THEN it exits non-zero and names the offending artifact

#### Scenario: Gate wires the leak scan

- GIVEN `bun run gate`
- WHEN it runs after `bunx ng build`
- THEN the leak scan executes and passes on a clean build

## Acceptance Criteria

| # | Criterion | Proven by |
|---|---|---|
| 1 | `*plataforma*` anywhere under the built client output fails the scan | `bunx ng build` then `bun scripts/verify-prerender.ts` (seeded leak) |
| 2 | Clean build passes the scan | `bun run gate` |
| 3 | Scan resolves `dist/browser` and `dist/<project>/browser` | `bun run gate` |
