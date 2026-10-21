import type { MoneyRange } from '../../content/content.types';

/**
 * es-AR number and duration formatting, as pure functions.
 *
 * `Intl` is deliberately avoided: its output follows the host locale, so a template
 * using it cannot be asserted and a page would read differently on a machine set to
 * `en-US`. es-AR groups thousands with a dot and separates decimals with a comma.
 */

const CURRENCY_LABEL: Record<MoneyRange['currency'], string> = { ARS: 'ARS', USD: 'USD' };

/** Groups the integer part in threes with a dot and keeps one decimal with a comma. */
const formatNumber = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0;
  const [whole, fraction] = Math.abs(safe).toString().split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = safe < 0 ? '-' : '';

  return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped},${fraction}`;
};

/**
 * A money range as one readable line: `ARS 45.000.000 – ARS 78.000.000 (nota)`.
 * An equal pair collapses to a single figure, and a non-positive lower bound renders as
 * a floor (`desde ARS 5.000.000`) instead of advertising a zero-cost build.
 */
export const formatMoneyRange = (range: MoneyRange): string => {
  const label = CURRENCY_LABEL[range.currency];
  const note = range.note === undefined ? '' : ` (${range.note})`;
  const hasFloor = Number.isFinite(range.min) && range.min > 0;
  const top = `${label} ${formatNumber(range.max)}`;

  if (!hasFloor) {
    return `desde ${top}${note}`;
  }

  const bottom = `${label} ${formatNumber(range.min)}`;

  return range.min === range.max ? `${bottom}${note}` : `${bottom} – ${top}${note}`;
};

/** A surface in square metres, rounded to the nearest whole metre. */
export const formatArea = (surfaceAreaM2: number): string =>
  `${formatNumber(Math.round(surfaceAreaM2))} m²`;

/**
 * A duration in the es-AR reading form. Content authors naturally write `2-3 meses`, so a
 * hyphen or en-dash between two numbers is expanded to `2 a 3 meses` and repeated
 * whitespace is collapsed. A blank duration returns `''` so a template can guard it.
 */
export const formatDuration = (duration: string): string =>
  duration
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(\d+)\s*[-–—]\s*(\d+)/, '$1 a $2');

/** The es-AR month names, in order. A fixed table keeps the output host-independent. */
const ES_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
] as const;

/** The leading `YYYY-MM-DD` of an ISO timestamp. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * A calendar date as an es-AR long date: `15 de septiembre de 2026`.
 *
 * The ISO calendar day is read as-is (never converted through the host time
 * zone) so the result is identical on every machine. A blank or invalid input
 * returns `''` — never `Invalid Date` — so a template can guard it.
 */
export const formatEsDate = (iso: string): string => {
  const match = ISO_DATE.exec(iso.trim());
  if (!match) {
    return '';
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) {
    return '';
  }

  // Round-trip through UTC to reject a day the calendar does not have (e.g. 30/02).
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return '';
  }

  return `${day} de ${ES_MONTHS[month - 1]} de ${year}`;
};
