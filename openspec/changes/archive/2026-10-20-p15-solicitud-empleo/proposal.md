# Proposal: p15-solicitud-empleo — Plantilla 2 (worker job-request)

## Intent

Only `company` can post today (plain-text composer); workers publish nothing and only `kind: 'standard'` exists. Plantilla 2 lets a worker publish a structured **"Solicitud de empleo"**, reusing the p14 template's reserved `[postExtra]` slot — the shell (and Plantilla 3) need no rewrite.

## Scope

### In Scope
- Widen demo-only `PostKind` to `'standard' | 'job-request'`; add optional `jobRequest` payload to `PostView`, projected only into `[postExtra]` (not `[postBody]`).
- Worker-gated composer: 4 requireds — *Puesto/rubro*, *Disponibilidad/jornada*, *Modalidad*, *Experiencia* — plus optional *Texto libre* and *Fotos 1–10*. No *zona*.
- Composite publish rule (**Q1=a**): 4 requireds **AND** (free text **OR** ≥1 photo). `isRenderablePostView` UNTOUCHED — structured fields never count as body.
- Role-differentiated composer: `worker` → form, `company` → existing textarea. Admin: recommend no composer — flagged for design.
- New `JobRequestCardComponent` via `[postExtra]`; author-aware `MockFeedGateway.create`; seed 2–3 posts; demo-only payload registry.

### Out of Scope
- Editing `contracts/openapi.yaml` / `Post` / `FeedPostInput` / `contract-conformance.ts`, or `PostTemplateComponent` internals.
- Relation with `JobsStore`/`ApplicationsStore` (this post does **not** apply to a `Job`); Plantilla 3 boundary flagged only.
- Real backend/media upload; contact/apply flow.

## Capabilities

### New Capabilities
- `platform-job-request`: job-request kind + demo payload registry, worker solicitud composer (fields, composite validation, photos), and the structured card rendered through `[postExtra]`.

### Modified Capabilities
- `platform-feed`: "Company-gated composer" becomes **role-differentiated** — worker solicitud, company textarea, admin none.

## Approach

Adopt exploration **Approach 1 (projected kind card)** — the extension point p14 reserved (D7). Structured data lives in `[postExtra]` only; `toPostView` derives `kind`/payload from a demo-only `postId → JobRequestPayload` registry (out of `contract-conformance.ts`, reset between tests). Composer uses `ReactiveFormsModule` (quote.page precedent); the company generator stays signal-based. Gateway `create` takes the session author id, not hardcoded `company-1`.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `domain/models.ts` | Modified | Widen `PostKind`; add `jobRequest?` |
| `mocks/post-views.ts` | Modified | Derive `kind`/payload; predicate unchanged |
| `mocks/fixtures.ts` + registry | New | Seed posts; demo kind registry |
| `api/mock-feed.gateway.ts` | Modified | Author-aware `create` |
| `store/feed.store.ts` | Modified | Carry attachments + payload |
| `pages/plataforma/feed.page.ts` | Modified | Differential composer + projection |
| `components/post-job-request/` | New | Structured solicitud card |

## Risks

| Risk | L | Mitigation |
|---|---|---|
| Feed filters structured-only posts | High | Q1=a composite rule |
| Kind-registry leaks across tests (R1) | Med | Deterministic seeds + reset |
| a11y `label` rule on new inputs (Q5) | Med | Label + accessible name |
| `/plataforma` images:`11` breaks (Q5) | Med | Decide preview vs URL fields; update gate |
| Budget >400 lines (R2) | High | 3 chained PR slices |
| `angular.json` mod committed (R3) | Low | Never stage it |

## Rollback Plan

Additive: revert the feed-integration commit → composer returns to company-only, card/registry unreferenced. Registry is in-memory; no persisted state. Contract and `[postBody]` never touched.

## Dependencies

None external. Reuses `SessionService`, template `[postExtra]`, quote.page's `ReactiveFormsModule`. Contract stays frozen.

## Success Criteria

- [ ] Worker publishes a solicitud (4 requireds + text or ≥1 photo); structured-only rejected.
- [ ] `company` → textarea, `worker` → form, admin decision in design.
- [ ] Job-request posts render via `[postExtra]`; `[postBody]`/`isRenderablePostView` untouched.
- [ ] Test, build, lint, a11y, release-matrix pass.
- [ ] 500–800 lines → chained PRs per budget.
