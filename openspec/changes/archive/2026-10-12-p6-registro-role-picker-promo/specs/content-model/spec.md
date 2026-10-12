# Delta for content-model

## ADDED Requirements

### Requirement: 6. [C] Typed promo teaser

`Site` MUST carry a typed `promo` field describing the trial→paid offer. `promo` MUST include the es-AR promotional copy for the offer (7 días de uso gratis, después planes de pago), a CTA label, and an absolute CTA `path` of `/plataforma/registro`. `promo` MAY include a `plans` array of placeholder plan entries; when present it MUST hold 2–3 entries, each carrying a `name`, a price/note, and `isPlaceholder: true`. `promo` itself MUST set `isPlaceholder: true`.

Placeholder promo content MUST NOT fail the build, lint, or tests. It MUST remain discoverable by the existing placeholder release gate that walks `site` (a single search locates every flagged entry).

#### Scenario: Promo shape is typed and placeholder-flagged

- GIVEN the `site` content module
- WHEN `site.promo` is inspected
- THEN it exposes the promotional copy, a CTA label, and the CTA path `/plataforma/registro`
- AND `site.promo.isPlaceholder` is `true`

#### Scenario: Placeholder plans are flagged

- GIVEN `site.promo.plans`
- WHEN its entries are inspected
- THEN it holds 2–3 entries
- AND each entry has `isPlaceholder: true`

#### Scenario: Placeholder gate still passes

- GIVEN the content-graph placeholder gate
- WHEN the suite runs with `site.promo` added
- THEN it still passes because `site` carries at least one `isPlaceholder: true` flag
