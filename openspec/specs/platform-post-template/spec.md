# platform-post-template Specification

## Purpose

Base feed post template: header, 1–10 media grid, actions bar; future kinds extend via slots.

## Requirements

### Requirement: Header with denormalized author and follow toggle

Header MUST show author name + es-AR role label ("Trabajador"/"Empresa"), never raw `authorId`, plus a Follow button with `aria-pressed` and an accessible name naming the author.

#### Scenario: Header layout and follow a11y

- GIVEN `PostView` (name "Lucía Fernández", role 'worker'), viewer not following
- WHEN `post-follow` renders, then is clicked
- THEN name + "Trabajador" show, `authorId` absent, `aria-pressed` false→true, "Seguir"→"Siguiendo", edge stored

### Requirement: Media grid clamped to 1–10 images

Media MUST be a responsive CSS grid (no carousel), at most 10 images with alt text; excess URLs drop behind a `post-media-overflow` "+N" indicator; a missing/empty URL MUST show a labeled es-AR placeholder, not a broken `<img>`.

#### Scenario: Grid range and clamp

- GIVEN posts with 1 and 12 attachment URLs
- WHEN the template renders each
- THEN 1 and 10 images render respectively
- AND `post-media-overflow` reads "+2" on the second

#### Scenario: Missing media placeholder

- GIVEN an empty attachment entry
- WHEN the template renders
- THEN `post-media-placeholder` shows es-AR text; no broken `<img>` exists

### Requirement: Actions bar (like, share, save) in es-AR

Actions MUST render "Me gusta" (`post-like`), "Reenviar" (`post-share`), "Guardar" (`post-save`); like/save MUST be `aria-pressed` toggles writing to `EngagementStore`; share MUST copy the permalink to the clipboard with es-AR feedback and create no engagement record.

#### Scenario: Like/save toggle through the store

- GIVEN a rendered post
- WHEN `post-like` or `post-save` is clicked
- THEN `aria-pressed` flips to "true" and the store records viewer + post

#### Scenario: Share copies permalink only

- GIVEN a rendered post
- WHEN `post-share` is clicked
- THEN the clipboard holds the permalink, es-AR feedback shows, store unchanged

### Requirement: Projection slots for future kinds

Template MUST expose `[postBody]`/`[postExtra]` slots; without projection the standard body renders, so future `PostKind`s extend without shell edits.

#### Scenario: Projection keeps the shell

- GIVEN a host projecting `[postBody]`
- WHEN the template renders
- THEN the block shows; header, media, actions remain

### Requirement: Zoneless signal repaint

Engagement state MUST derive from signals; the template MUST NOT call manual change detection internally.

#### Scenario: Store change repaints

- GIVEN a rendered template
- WHEN the store `.set()`s a toggle signal
- THEN the DOM shows the new `aria-pressed` after the normal fixture tick

### Requirement: Demo-only view-model stays out of the contract

`PostView`/`PostKind` MUST stay out of `contract-conformance.ts`; `Post` and `contracts/openapi.yaml` MUST stay unchanged.

#### Scenario: Build green without conformance entries

- GIVEN the new demo-only types
- WHEN `bunx ng build` runs
- THEN conformance passes and `openapi.yaml` is untouched

### Requirement: Axe gate on /plataforma

Template controls MUST satisfy the gated axe rules on `/plataforma`: `button-name`, `nested-interactive`, `list`, `label`.

#### Scenario: Gate passes

- GIVEN a seeded session on `/plataforma`
- WHEN the a11y spec runs axe
- THEN no gated violation fires and every control has an accessible name

### Requirement: Posts are never empty; optional blocks are omitted, not left blank

A post SHALL carry text, an image, or both — never neither. The body paragraph MUST render only when `content` has visible text (whitespace counts as blank) and the media block MUST render only when at least one attachment exists, so a text-only post shows no media and an image-only post shows no empty text block; the feed MUST NOT render a card for a view with neither, and the composer MUST reject a submission with no text (its only input — it has no image field).

#### Scenario: Text-only post renders text and no media block

- GIVEN a post with non-blank content and no attachments
- WHEN the template renders
- THEN the body paragraph shows the content
- AND no `post-media` block exists

#### Scenario: Image-only post renders media and no text block

- GIVEN a post with blank content and one attachment
- WHEN the template renders
- THEN the media grid shows the image
- AND no `post-body` block renders (no empty paragraph)

#### Scenario: A post with neither text nor image is rejected and not rendered

- GIVEN a feed post with whitespace-only content and no attachments
- WHEN the feed renders the timeline
- THEN no `feed-post` card renders for that post
- AND the composer's blank-text publish is rejected by the never-empty gate

#### Scenario: A post with both renders both blocks

- GIVEN a post with non-blank content and attachments
- WHEN the template renders
- THEN the body paragraph and the media grid both render
