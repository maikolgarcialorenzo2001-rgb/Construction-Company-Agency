import { describe, expect, it } from 'vitest';

import { applicationStatusLabel } from './application-status';

/** Pure label mapping — no mocks, no rendering: the function IS the behavior. */
describe('applicationStatusLabel', () => {
  it('maps every application status to its es-AR label', () => {
    expect(applicationStatusLabel('pending')).toBe('Pendiente');
    expect(applicationStatusLabel('accepted')).toBe('Aceptada');
    expect(applicationStatusLabel('rejected')).toBe('Rechazada');
    expect(applicationStatusLabel('withdrawn')).toBe('Retirada');
  });
});
