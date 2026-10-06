import type { ValidatorFn } from '@angular/forms';

/**
 * Surface-area window for the quote form, expressed in square metres. The bounds are
 * inclusive and the validator is finite-only: a text input dressed as `type="number"`
 * still hands back `''`, `null` or a non-numeric string, and none of those may reach
 * the WhatsApp message as a plausible-looking figure.
 *
 * Emptiness is deliberately NOT an error here: `required` owns the "missing" case, so a
 * blank field reports one message instead of stacking `required` on top of `m2Range`.
 * The error key is the factory name, which lets the template map it to a single es-AR
 * message without inspecting payloads.
 */
export const m2Range = (min: number, max: number): ValidatorFn => (control) => {
  const raw: unknown = control.value;

  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  const value = typeof raw === 'number' ? raw : Number(raw);

  if (!Number.isFinite(value) || value < min || value > max) {
    return { m2Range: { min, max, actual: raw } };
  }

  return null;
};
