/**
 * Lead-link builders. Pure functions, no DI and no DOM: the quote form composes a
 * prefilled WhatsApp deep link, an email fallback and a `tel:` action from the NAP,
 * and every one of those URLs is asserted here instead of in a browser.
 */

/** First line of every outbound lead message. */
export const LEAD_GREETING = 'Hola, te escribo desde la web para pedir un presupuesto.';

/** Last line of every outbound lead message: the visitor is asked for photos. */
export const LEAD_PHOTO_INVITE =
  'Te adjunto algunas fotos del proyecto por acá para que puedas verlo.';

/** Subject used by the email fallback. */
export const LEAD_MAIL_SUBJECT = 'Presupuesto desde la web';

/**
 * The visitor's answers, already resolved to display labels. The quote form maps its
 * option values through `quote-options.ts`, so the `<select>` and the message label
 * can never disagree.
 */
export interface LeadFields {
  readonly workTypeLabel: string;
  readonly location: string;
  readonly areaM2: number;
  readonly budgetLabel?: string;
  readonly stageLabel?: string;
  readonly comment?: string;
}

/** Bare digits for `wa.me` and `tel:`. Strips `+`, spaces, dashes and spaces. */
export const toWaDigits = (phoneE164: string): string => phoneE164.replace(/\D/g, '');

/**
 * Builds the lead message with a fixed line order: greeting, then the required
 * answers, then the optional ones the visitor actually filled in, then the photo
 * invitation. Blank optionals are omitted instead of sent as empty lines.
 */
export const buildLeadMessage = (fields: LeadFields): string => {
  const optional = [
    fields.budgetLabel?.trim() ? `Presupuesto estimado: ${fields.budgetLabel.trim()}` : '',
    fields.stageLabel?.trim() ? `Etapa: ${fields.stageLabel.trim()}` : '',
    fields.comment?.trim() ? `Comentario: ${fields.comment.trim()}` : ''
  ].filter((line) => line !== '');

  return [
    LEAD_GREETING,
    `Tipo de trabajo: ${fields.workTypeLabel}`,
    `Ubicación: ${fields.location}`,
    `Superficie (m²): ${fields.areaM2}`,
    ...optional,
    LEAD_PHOTO_INVITE
  ].join('\n');
};

/**
 * `wa.me` deep link. `encodeURIComponent` is enough: it encodes `&`, `?`, `#`,
 * spaces, newlines and accents, which are exactly the characters that would break
 * the query string.
 */
export const buildWhatsAppUrl = (digits: string, message: string): string =>
  `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

/** Email fallback carrying the same body as the WhatsApp message. */
export const buildMailtoUrl = (email: string, subject: string, body: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** `tel:` href. Exactly one plus sign, whatever the input formatting was. */
export const buildTelHref = (digits: string): string => `tel:+${digits}`;
