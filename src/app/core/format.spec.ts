import { describe, expect, it } from 'vitest';

import type { MoneyRange } from '../../content/content.types';
import { formatArea, formatDuration, formatMoneyRange } from './format';

/**
 * Formatting is pure so it is deterministic under test: `Intl` in a template would
 * follow the host locale and the test would prove nothing. es-AR groups thousands with
 * a dot and separates decimals with a comma.
 */

const ars = (min: number, max: number, note?: string): MoneyRange => ({
  min,
  max,
  currency: 'ARS',
  ...(note === undefined ? {} : { note })
});

describe('formatMoneyRange', () => {
  it('renders a bounded range with both ends in the declared currency', () => {
    expect(formatMoneyRange(ars(45000000, 78000000))).toBe('ARS 45.000.000 – ARS 78.000.000');
  });

  it('collapses an equal-ended range into a single figure', () => {
    expect(formatMoneyRange(ars(12000000, 12000000))).toBe('ARS 12.000.000');
  });

  it('keeps the currency visible on a USD range', () => {
    expect(formatMoneyRange({ min: 38000, max: 55000, currency: 'USD' })).toBe(
      'USD 38.000 – USD 55.000'
    );
  });

  it('renders a non-positive lower bound as a floor instead of an absurd range', () => {
    expect(formatMoneyRange(ars(0, 5000000))).toBe('desde ARS 5.000.000');
  });

  it('appends the reference note so the figure never reads as a firm quote', () => {
    expect(formatMoneyRange(ars(3000000, 4500000, 'valores de referencia'))).toBe(
      'ARS 3.000.000 – ARS 4.500.000 (valores de referencia)'
    );
  });
});

describe('formatArea', () => {
  it('renders square metres with the es-AR thousands separator', () => {
    expect(formatArea(1234)).toBe('1.234 m²');
  });

  it('renders a surface under one thousand without a separator', () => {
    expect(formatArea(96)).toBe('96 m²');
  });

  it('rounds a fractional surface to the nearest square metre', () => {
    expect(formatArea(210.4)).toBe('210 m²');
  });
});

describe('formatDuration', () => {
  it('returns a single-value duration untouched', () => {
    expect(formatDuration('9 meses')).toBe('9 meses');
  });

  it('expands a hyphenated range into the es-AR "a" form', () => {
    expect(formatDuration('2-3 meses')).toBe('2 a 3 meses');
  });

  it('expands an en-dash range and collapses repeated whitespace', () => {
    expect(formatDuration('  4 – 6   semanas ')).toBe('4 a 6 semanas');
  });

  it('returns an empty string for a blank duration so a template can guard it', () => {
    expect(formatDuration('   ')).toBe('');
  });
});
