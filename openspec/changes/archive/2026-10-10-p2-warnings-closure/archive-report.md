# Archive Report: p2-warnings-closure

Change `p2-warnings-closure` is complete and archived. Verify passed with **PASS WITH WARNINGS** (0 CRITICAL): the six carried follow-ups from `p2-platform-foundation` (W2–W7) are all closed on `main` across 6 work-unit commits, and the full gate is GREEN (exit 0, 493 tests / 56 files, 21 prerendered routes, `no plataforma leak`). The 4 modified capabilities were merged into their baselines and the new `delivery-evidence` capability is now the source of truth under `openspec/specs/`.

## Status at a glance

| Field | Value |
|---|---|
| Change | `p2-warnings-closure` (closes foundation follow-ups W2–W7: zero-HTTP bootstrap test + hydration comment, dist/platform-leak gate scan, DI swap tests for all 4 ports, admin role boundary in mock register, `applicantId` filtering, TDD evidence backfill) |
| Verify verdict | PASS WITH WARNINGS (0 CRITICAL) — `verify-report.md` + Engram #866, base `67cef06` → HEAD `6e05f10`, branch `main` |
| Work units | 6/6 complete (`b46cb25`, `7f6a81f`, `aaf9ea8`, `a62f636`, `00555ec`, `6e05f10`) |
| Tasks | 6/6 WUs complete, 0 incomplete (verify completeness table: 22 tasks) |
| Deltas | 5 capabilities · 4 modified (server-rendering, platform-shell, platform-identity, platform-jobs) + 1 new (delivery-evidence) |
| Final gate (verified by sdd-verify) | `bun run gate` exit 0 · Spectral 0 errors · `contract:check` no drift · lint clean · **56 files / 493 tests** · **21-route build** · `verify:prerender` PASS · no `plataforma` hits in dist |
| Contract | `contracts/openapi.yaml` untouched (`git diff contracts/` empty; no commit touched `contracts/`) |
| Engram #848 | **NOT mutated** (verified via `mem_get_observation(848)`; WU6 commit `6e05f10` changed only `apply-progress.md`) |
| Archive location | `openspec/changes/archive/2026-10-10-p2-warnings-closure/` |
| Artifact store | hybrid (Engram observations + `openspec/` files) |
| Remote state | local commits only — **not pushed**, no PR/issue created |

## Artifacts read (audit trail)

| Artifact | File | Engram observation |
|---|---|---|
| Explore | `explore.md` | #859 `sdd/p2-warnings-closure/explore` |
| Proposal | `proposal.md` | #860 `sdd/p2-warnings-closure/proposal` |
| Specs (5 deltas) | `specs/*/spec.md` | #862 `sdd/p2-warnings-closure/spec` |
| Design | `design.md` | #863 `sdd/p2-warnings-closure/design` |
| Tasks | `tasks.md` | #864 `sdd/p2-warnings-closure/tasks` |
| Apply progress | `apply-progress.md` | #865 `sdd/p2-warnings-closure/apply-progress` |
| Verify report | `verify-report.md` | #866 `sdd/p2-warnings-closure/verify-report` |
| Archive report | `openspec/changes/archive/2026-10-10-p2-warnings-closure/archive-report.md` | `sdd/p2-warnings-closure/archive-report` (this save) |

## Specs synced to source of truth

| Domain | Action | Details |
|---|---|---|
| `server-rendering` | **Updated** | "Platform hydration without transfer cache" requirement replaced: now mandates the bootstrap test (`HttpTestingController`, zero pending) and the accurate `provideClientHydration()` comment; 2 scenarios added ("Zero-HTTP bootstrap is asserted by a test", "Hydration comment is accurate") → 3 scenarios; W2 archived annotation replaced with **CLOSED by this change** annotation. |
| `platform-shell` | **Updated** | "Platform subtree excluded from prerender" requirement replaced: now mandates the automated gate scan over `dist/browser` and `dist/<project>/browser`; 2 scenarios added ("Leak scan fails the gate", "Gate wires the leak scan") → 4 scenarios; W3 annotation replaced with **CLOSED by this change**. |
| `platform-identity` | **Updated** | "Role model" replaced (registration boundary MUST reject `admin` with a Spanish error, accept `worker`/`company`; `Role` enum + contract unchanged); 2 scenarios added ("Programmatic register rejects admin", "Worker and company register normally") → 4 scenarios; W5 annotation replaced with **CLOSED by this change**. "Auth and profiles gateway ports" replaced (each token MUST prove a DI swap); 1 scenario added ("Each auth and profiles token proves swappability") → 3 scenarios; W4 annotation replaced with **CLOSED by this change**. |
| `platform-jobs` | **Updated** | "Jobs gateway port and board" replaced (`JOBS_GATEWAY` MUST prove a DI swap); 1 scenario added ("Jobs port proves swappability") → 4 scenarios. "Applications flow" replaced (`list` MUST filter by `applicantId`, `ApplicationsFilter` accepts it, `APPLICATIONS_GATEWAY` swap proven, no contract change); 2 scenarios added ("Filter by applicant", "Applications port proves swappability") → 4 scenarios; W6 annotation replaced with **CLOSED by this change**. |
| `delivery-evidence` | **Created** | New baseline `openspec/specs/delivery-evidence/spec.md` (1 requirement / 2 scenarios): TDD cycle evidence table + #848 immutability. |

Modified capabilities preserved all unrelated baseline requirements and their surrounding sections; no destructive deletions occurred. Each stale warning annotation (UNTESTED/PARTIAL — W2…W6) was replaced by its **CLOSED by this change** counterpart, mirroring the `api-conformance` W1 precedent, and each requirement gained a "(Previously: …)" history note from its delta.

## Follow-ups closed

| Foundation follow-up | Closed by | Evidence |
|---|---|---|
| W2 — bootstrap HTTP not asserted + inaccurate hydration comment | WU1 `b46cb25` | `app.config.spec.ts` zero-HTTP bootstrap via `bootstrapPlatform()` + corrected comment; probe-re-proven (1 pending `GET /__probe__` fails the suite) |
| W3 — no automated platform-HTML gate step | WU2 `7f6a81f` | `verify-prerender.ts` `findPlatformArtifacts()` + `verify:prerender` wired into `gate`; seeded leak → exit 1 naming 2 hits; root-agnostic (`dist/browser` + `dist/<project>/browser`) |
| W4 — adapter swap proven only for Feed port | WU3 `aaf9ea8` | `ports.spec.ts` one `it` per port (auth/jobs/applications/profiles), `overrideProvider` + identity assert + sentinel use |
| W5 — registration role restriction is UI-only | WU4 `a62f636` | `admin` guard first in `MockAuthGateway.register` (`Rol no permitido para el registro`); session bubbles null; worker/company still register |
| W6 — no `applicantId` filter | WU5 `00555ec` | Additive `applicantId?: string` + AND predicate; TRIANGULATED AND semantics + empty page |
| W7 — TDD cycle evidence incomplete for 1.1–3.7 | WU6 `6e05f10` | `apply-progress.md` 22-row × 8-col backfill table (foundation 1.1–3.7); #848 not mutated |

## Carried forward (not silently dropped)

1. **(S5 from `p2-api-contract`)** `ajv@8.20.0` root pin is fragile — re-check `contract:lint` after any `bun add`/`bun update`.
2. **(SUGGESTION from `p2-platform-foundation`)** Stale `app.routes.ts:8-10` doc comment ("the wildcard route is the only noindex one" — every `/plataforma/**` is `NOINDEX` too).
3. **(SUGGESTION from `p2-platform-foundation`)** Nested platform titles not in the SEO uniqueness set.
4. **(WARNING 1 from this verify)** WU2 has no vitest unit test — `verify-prerender.ts` is a top-level side-effecting script, proven only by the seeded-leak probe + gate wiring (design-accepted). Regression safety depends on the gate staying wired.
5. **(WARNING 2 from this verify)** WU1/WU3 RED is characterization (probe/mutation-based), not strict test-first history — behaviors pre-existed; honestly disclosed and independently re-proven.
6. **(SUGGESTION 1 from this verify)** `applicantId` filter is additive and unused by the UI — wire it to the session once a real session provides the applicant id.
7. **(SUGGESTION 2 from this verify)** Add a documented single-file test invocation to speed strict-TDD RED/GREEN loops.

## Final gate result

`bun run gate` — **exit 0**:

| Stage | Result |
|---|---|
| Spectral (OpenAPI lint) | ✅ No error-severity results |
| `contract:check` (`openapi-typescript --check`) | ✅ no drift |
| ESLint | ✅ all files pass |
| `bunx ng test --watch=false` | ✅ **56 files / 493 tests passed** |
| `bunx ng build` | ✅ **21 routes prerendered** (7 static + 6 services + 8 projects) |
| `verify:prerender` | ✅ PASS · 21 routes · heads checked · CSR fallback ok · no localhost · `server.ts` absent · no `plataforma` leak |

Independent re-proof (sdd-verify destructive probes, all reverted): WU1 HTTP probe → 1 expected failure; WU2 seeded leak → exit 1 with 2 named hits + root-agnostic proof; WU3/WU4/WU5 removed-override/guard/predicate mutations → exactly 6 expected failures; `git diff contracts/` empty across all 6 commits; #848 intact. Tree left clean.

## Commits

| Commit | Work unit |
|---|---|
| `b46cb25` | WU1 `test(platform): assert zero-HTTP platform bootstrap and fix hydration comment (p2-warnings-closure)` |
| `7f6a81f` | WU2 `build(gate): fail build on plataforma artifact in client output (p2-warnings-closure)` |
| `aaf9ea8` | WU3 `test(platform): prove DI swap for auth, jobs, applications and profiles ports (p2-warnings-closure)` |
| `a62f636` | WU4 `fix(platform): reject admin role in mock register (p2-warnings-closure)` |
| `00555ec` | WU5 `feat(platform): filter mock applications by applicantId (p2-warnings-closure)` |
| `6e05f10` | WU6 `docs(sdd): backfill TDD cycle evidence for tasks 1.1–3.7 (p2-warnings-closure)` |
| this commit | `docs(openspec): archive p2-warnings-closure with verify annotations (p2-warnings-closure)` — spec sync (1 new + 4 updated capabilities), report, full change record incl. verify-report; folder moved to `archive/2026-10-10-p2-warnings-closure/` |

Conventional format, one archive commit, English, no AI attribution, openspec-only staging, nothing pushed.

## Disposition of HANDOFF.md

`HANDOFF.md` remains **untracked** — it is a session handoff note, not a change artifact, and is not part of the openspec tree. This archive does not commit or modify it. Recommended: the maintainer deletes it or rewrites it for the next session.

## Checklist

- [x] 4 modified capabilities merged into baselines, preserving unrelated requirements (server-rendering, platform-shell, platform-identity, platform-jobs)
- [x] New baseline created in `openspec/specs/` (delivery-evidence)
- [x] W2–W7 follow-ups closed and annotated on the main specs (**CLOSED by this change** on each modified requirement)
- [x] Change folder moved to `openspec/changes/archive/2026-10-10-p2-warnings-closure/` with all artifacts (explore, proposal, specs, design, tasks, apply-progress, verify-report)
- [x] Engram archive report saved as `sdd/p2-warnings-closure/archive-report` (`capture_prompt: false`, type `architecture`)
- [x] Commit stages `openspec/` only — no `src/`, no `contracts/`, no `HANDOFF.md`, no push, no PR
- [x] Working tree after commit: only intentional untracked file (`HANDOFF.md`) remains

SDD cycle complete: explore → proposal → spec → design → tasks → apply → verify → archive. The `p2-platform-foundation` warning backlog (W2–W7) is fully closed; the next SDD change starts from a green baseline with an automated platform-leak gate, provable DI swaps, a role-protected mock register, per-applicant filtering, and complete TDD evidence.