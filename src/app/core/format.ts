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
