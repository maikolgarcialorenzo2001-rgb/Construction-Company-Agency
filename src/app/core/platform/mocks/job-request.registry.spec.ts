import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { JOB_REQUEST_SEEDS } from './fixtures';
import {
  getJobRequest,
  recordJobRequest,
  resetJobRequestRegistry
} from './job-request.registry';

describe('job-request registry (demo-only)', () => {
  beforeEach(() => resetJobRequestRegistry());
  afterEach(() => resetJobRequestRegistry());

  it('is seeded from JOB_REQUEST_SEEDS and resolves by post id', () => {
    for (const seed of JOB_REQUEST_SEEDS) {
      expect(getJobRequest(seed.id)).toEqual({
        position: seed.payload.position,
        availability: seed.payload.availability,
        modality: seed.payload.modality,
        experience: seed.payload.experience
      });
    }
  });

  it('records payloads for new posts and reset restores the seeded state', () => {
    const newId = 'post-new-registry-test';
    const payload = {
      position: 'Electricista',
      availability: 'Inmediata',
      modality: 'Presencial',
      experience: '3 a 5 años'
    };

    recordJobRequest(newId, payload);
    expect(getJobRequest(newId)).toEqual(payload);

    resetJobRequestRegistry();
    expect(getJobRequest(newId)).toBeUndefined();
    for (const seed of JOB_REQUEST_SEEDS) {
      expect(getJobRequest(seed.id)).toBeDefined();
    }
  });

  it('resolves undefined for a post that has no structured payload', () => {
    expect(getJobRequest('post-1')).toBeUndefined();
  });
});
