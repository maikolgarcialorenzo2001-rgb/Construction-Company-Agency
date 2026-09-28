import { describe, expect, it } from 'vitest';

import { BUDGET_OPTIONS, JOB_TYPE_OPTIONS, STAGE_OPTIONS } from './quote-options';

const ALL_GROUPS = [
  ['JOB_TYPE_OPTIONS', JOB_TYPE_OPTIONS],
  ['BUDGET_OPTIONS', BUDGET_OPTIONS],
  ['STAGE_OPTIONS', STAGE_OPTIONS]
] as const;

describe('quote options', () => {
  it.each(ALL_GROUPS)('%s offers at least one choice', (_label, options) => {
    expect(options.length).toBeGreaterThan(0);
  });

  it.each(ALL_GROUPS)('%s never repeats a value', (_label, options) => {
    const values = options.map((o) => o.value);
    expect(values).toEqual([...new Set(values)]);
  });

  it.each(ALL_GROUPS)('%s never repeats a label', (_label, options) => {
    const labels = options.map((o) => o.label);
    expect(labels).toEqual([...new Set(labels)]);
  });

  it.each(ALL_GROUPS)(
    '%s declares a non-empty es-AR label and a kebab-case value',
    (_label, options) => {
      for (const option of options) {
        expect(option.label.trim(), `${option.value} needs a label`).not.toBe('');
        expect(option.value, `${option.label} needs a kebab-case value`).toMatch(
          /^[a-z0-9]+(-[a-z0-9]+)*$/
        );
      }
    }
  );

  it('covers every job type the schema allows', () => {
    expect(JOB_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      'reforma',
      'obra-nueva',
      'ampliacion',
      'reparacion',
      'comercial',
      'otro'
    ]);
  });

  it('offers "no sé todavía" for the budget and "todavía no sé" for the stage', () => {
    expect(BUDGET_OPTIONS[0]?.value).toBe('sin-definir');
    expect(BUDGET_OPTIONS[0]?.label).toBe('Todavía no lo definí');
    expect(STAGE_OPTIONS[0]?.value).toBe('idea');
  });

  it('orders the budget brackets from cheapest to most expensive', () => {
    const values = BUDGET_OPTIONS.map((o) => o.value);
    expect(values.indexOf('hasta-3m')).toBeLessThan(values.indexOf('3m-8m'));
    expect(values.indexOf('3m-8m')).toBeLessThan(values.indexOf('8m-15m'));
    expect(values.indexOf('8m-15m')).toBeLessThan(values.indexOf('mas-15m'));
  });
});
