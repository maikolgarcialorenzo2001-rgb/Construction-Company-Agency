import { describe, expect, it } from 'vitest';

import type { JobOpening, VacancyPayload } from '../../core/platform/domain';
import { resolveVacancyOpenings } from './vacancy-openings';

const opening = (id: string, title: string): JobOpening => ({
  id,
  companyId: 'company-1',
  title,
  description: 'Descripción de prueba',
  status: 'open',
  createdAt: '2026-10-01T10:00:00.000Z'
});

const job1 = opening('job-1', 'Albañil con experiencia');
const job2 = opening('job-2', 'Electricista matriculado');
const job4 = opening('job-4', 'Plomero con experiencia');

/** Pure resolution — no mocks, no rendering: the function IS the behavior. */
describe('resolveVacancyOpenings', () => {
  it('resolves every id of the payload to its opening, in payload order', () => {
    const payload: VacancyPayload = { jobIds: ['job-2', 'job-1'] };

    expect(resolveVacancyOpenings(payload, [job1, job2])).toEqual([job2, job1]);
  });

  it('skips ids absent from the openings and keeps the resolvable ones', () => {
    const payload: VacancyPayload = { jobIds: ['job-9', 'job-1', 'job-404'] };

    expect(resolveVacancyOpenings(payload, [job1, job2, job4])).toEqual([job1]);
  });

  it('returns an empty list when no id resolves', () => {
    const payload: VacancyPayload = { jobIds: ['job-9', 'job-404'] };

    expect(resolveVacancyOpenings(payload, [job1, job2])).toEqual([]);
  });
});
