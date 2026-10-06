# quote-lead-capture Specification

## Context

The only revenue path in v1, and there is NO backend. A form that POSTs anywhere loses leads silently. So submit builds a prefilled WhatsApp message and opens it: the visitor keeps their chat, the owner keeps the lead. Photos ride inside that message instead of a file input, so the photo lever survives with zero infrastructure.

**No file input. No server POST. Ever.**

## Requirements

Tags: **[B]** = behavior contract (unit-testable) · **[C]** = content data (type-checked, ships as data).

### Requirement: 1. [B] Field set

`/presupuesto` MUST expose exactly these fields:

| Field | Control | Required |
|---|---|---|
| Tipo de trabajo | select | yes |
| Ubicación | text | yes |
| Superficie (m²) | numeric | yes |
| Presupuesto estimado | select | no |
| Etapa | select | no |
| Comentario | textarea | no |
| Consentimiento | checkbox | yes |
| (honeypot) | hidden text | n/a |

It MUST NOT render a file input, file picker, or any image-upload affordance.

#### Scenario: No photo upload control

- GIVEN `/presupuesto` rendered
- WHEN the DOM is inspected
- THEN no `input[type=file]` and no upload/drag-drop affordance exists

### Requirement: 2. [B] Validation blocks submit

Required fields MUST be validated. An invalid submit MUST NOT open any link and MUST show an inline error associated with the offending field, announced accessibly.

#### Scenario: Missing required fields

- GIVEN the form submitted with required fields empty
- WHEN validation runs
- THEN no new tab opens
- AND each invalid field exposes an error associated with it

#### Scenario: Invalid m²

- GIVEN "Superficie" holds a non-numeric or non-positive value
- WHEN the form is submitted
- THEN submit is blocked with an error on that field

### Requirement: 3. [B] Honeypot silences bots silently

A filled honeypot MUST abort submit with NO link opened, NO success state, NO visible error — the bot learns nothing.

#### Scenario: Honeypot filled

- GIVEN the honeypot contains a value
- WHEN the form is submitted
- THEN no link opens and no success state renders

### Requirement: 4. [B] Consent is mandatory

An unchecked consent box MUST block submit exactly like an invalid required field.

#### Scenario: Consent withheld

- GIVEN required fields valid but consent unchecked
- WHEN the form is submitted
- THEN no link opens and an error is shown on the consent control

### Requirement: 5. [B] Submit resolves to a prefilled WhatsApp deep link

On valid submit the app MUST build `https://wa.me/{E.164-digits}?text={urlencoded}` and open it in a new tab, using the NAP single source for the number. The message MUST carry a `Label: value` line per filled field, MUST percent-encode reserved characters, MUST end with the photo invitation line `Te adjunto algunas fotos del proyecto por acá para que puedas verlo.`, and MUST NOT emit lines for untouched optional fields.

#### Scenario: Happy path

- GIVEN required fields valid, consent checked, honeypot empty
- WHEN the form is submitted
- THEN `https://wa.me/{digits}?text=...` opens in a new tab
- AND the message holds a line per filled field
- AND it ends with the photo invitation line

#### Scenario: Optional fields omitted

- GIVEN only required fields are filled
- WHEN the message is built
- THEN no line and no empty `Label:` exists for untouched optional fields

#### Scenario: Encoding is safe

- GIVEN a comment with spaces, newlines, `&`, `?`, and accents
- WHEN the message is built
- THEN the href percent-encodes them and remains a valid URL

### Requirement: 6. [B] Success state offers a visible phone fallback

After opening WhatsApp, a success state MUST render with a visible `tel:` fallback to the NAP phone — the WhatsApp tab can be dismissed or blocked.

#### Scenario: Fallback reachable

- GIVEN a valid submit opened WhatsApp
- WHEN the success state renders
- THEN a `tel:` action matching the NAP phone is visible

### Requirement: 7. [B] mailto fallback carries the same payload

The success state MUST offer a `mailto:` fallback whose body is the SAME message text.

#### Scenario: Same payload via email

- GIVEN a valid submit built a WhatsApp message
- WHEN the mailto href is inspected
- THEN its body equals that message text

### Requirement: 8. [B] Zero network traffic

The quote flow MUST NOT issue any HTTP request, and MUST NOT transmit field values to any endpoint.

#### Scenario: No request is fired

- GIVEN a valid submit
- WHEN the HTTP layer is spied on
- THEN zero requests are issued

## Out of Scope

- Server-side handling, email delivery, CRM/Sheets integration, throttling beyond the honeypot.
- File upload, compression, upload progress, SMS.

## Acceptance Criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | No `input[type=file]`; exact field set present | `bunx ng test --watch=false` |
| 2 | Invalid submit opens nothing + accessible errors | `bunx ng test --watch=false` |
| 3 | Honeypot-filled submit opens nothing, silently | `bunx ng test --watch=false` |
| 4 | `wa.me` href exact; photo invitation line; safe encoding | `bunx ng test --watch=false` |
| 5 | Success state has `tel:` and `mailto:` with the same body | `bunx ng test --watch=false` |
| 6 | Zero HTTP requests on submit | `bunx ng test --watch=false` |
| 7 | No sticky mobile CTA on `/presupuesto` | `bunx ng test --watch=false` |
