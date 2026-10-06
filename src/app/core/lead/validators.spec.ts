import { FormControl, type ValidatorFn } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { m2Range } from './validators';

/** The production window of the quote form: 1 m² to 10000 m². */
const validate = (value: unknown): ReturnType<ValidatorFn> => m2Range(1, 10000)(new FormControl(value));

describe('m2Range', () => {
  it('accepts every surface inside the inclusive 1–10000 window', () => {
    expect(validate(1)).toBeNull();
    expect(validate(45)).toBeNull();
    expect(validate(10000)).toBeNull();
  });

  it('accepts a numeric string, because a number input can hand back text', () => {
    expect(validate('85')).toBeNull();
  });

  it('rejects a surface below the minimum, zero included', () => {
    expect(validate(0)).toEqual({ m2Range: { min: 1, max: 10000, actual: 0 } });
    expect(validate(-12)).toEqual({ m2Range: { min: 1, max: 10000, actual: -12 } });
  });

  it('rejects a surface above the maximum', () => {
    expect(validate(10001)).toEqual({ m2Range: { min: 1, max: 10000, actual: 10001 } });
    expect(validate(50000)).toHaveProperty('m2Range');
  });

  it('rejects values that are not a finite number at all', () => {
    expect(validate('obra')).toEqual({ m2Range: { min: 1, max: 10000, actual: 'obra' } });
    expect(validate(NaN)).toHaveProperty('m2Range');
    expect(validate(Infinity)).toHaveProperty('m2Range');
  });

  it('leaves emptiness to the required validator, so the errors never stack', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
    expect(validate(undefined)).toBeNull();
  });

  it('is a plain ValidatorFn: null when valid, the m2Range key when not', () => {
    expect(m2Range(1, 10000)).toBeTypeOf('function');
    expect(validate(2000)).toBeNull();
    expect(validate(0)).not.toBeNull();
  });
});
