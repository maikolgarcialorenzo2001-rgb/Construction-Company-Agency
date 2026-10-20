import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { VACANCY_SEEDS } from './fixtures';
import { getVacancy, recordVacancy, resetVacancyRegistry } from './vacancy.registry';

/**
 * p16 WU1 (design D1/D2): the demo-only vacancy registry mirrors the
 * job-request registry — a seeded `Map<postId, VacancyPayload>` the gateway
 * writes on create and `toPostView` reads for kind/payload derivation. Reset
 * re-seeds from `VACANCY_SEEDS` so specs that create vacancy posts stay
 * isolated (R1/D11).
 */
describe('vacancy registry (demo-only)', () => {
  beforeEach(() => resetVacancyRegistry());
  afterEach(() => resetVacancyRegistry());

  it('is seeded from VACANCY_SEEDS and resolves by post id', () => {
    for (const seed of VACANCY_SEEDS) {
      expect(getVacancy(seed.id)).toEqual({ jobIds: [...seed.payload.jobIds] });
    }
  });

  it('records payloads for new posts and reset restores the seeded state', () => {
    const newId = 'post-new-vacancy-test';
    const payload = { jobIds: ['job-1', 'job-6'] };

    recordVacancy(newId, payload);
    expect(getVacancy(newId)).toEqual(payload);

    resetVacancyRegistry();
    expect(getVacancy(newId)).toBeUndefined();
    for (const seed of VACANCY_SEEDS) {
      expect(getVacancy(seed.id)).toBeDefined();
    }
  });

  it('resolves undefined for a post that has no vacancy payload', () => {
    expect(getVacancy('post-1')).toBeUndefined();
  });
});
