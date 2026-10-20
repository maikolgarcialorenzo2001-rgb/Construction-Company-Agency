import { describe, expect, it } from 'vitest';

import { jobStatusLabel } from './job-status';

/** Pure label mapping — no mocks, no rendering: the function IS the behavior. */
describe('jobStatusLabel', () => {
  it('maps an open job to its es-AR label', () => {
    expect(jobStatusLabel('open')).toBe('Abierta');
  });

  it('maps a closed job to its es-AR label', () => {
    expect(jobStatusLabel('closed')).toBe('Cerrada');
  });
});
