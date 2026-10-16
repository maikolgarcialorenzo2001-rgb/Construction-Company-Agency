import type { JobRequestPayload } from '../domain';
import { JOB_REQUEST_SEEDS } from './fixtures';

/**
 * Demo-only registry of structured job-request payloads, keyed by `postId`
 * (design D1). The contract `Post` has no room for a structured payload, so the
 * worker job-request carries it out-of-band: `MockFeedGateway.create` records it
 * here and `toPostView` derives `kind`/`jobRequest` from a lookup. Purely
 * in-memory and session-scoped, exactly like the mock gateway itself.
 *
 * `resetJobRequestRegistry()` re-seeds from `JOB_REQUEST_SEEDS` so specs that
 * create job-request posts stay isolated (R1).
 */
const snapshot = (): Map<string, JobRequestPayload> => {
  const state = new Map<string, JobRequestPayload>();
  for (const seed of JOB_REQUEST_SEEDS) {
    state.set(seed.id, {
      position: seed.payload.position,
      availability: seed.payload.availability,
      modality: seed.payload.modality,
      experience: seed.payload.experience
    });
  }
  return state;
};

let registry: Map<string, JobRequestPayload> = snapshot();

/** Resolves the structured payload for a post, or `undefined` for a standard post. */
export const getJobRequest = (postId: string): JobRequestPayload | undefined =>
  registry.get(postId);

/** Records a structured payload for a newly created job-request post. */
export const recordJobRequest = (postId: string, payload: JobRequestPayload): void => {
  registry.set(postId, {
    position: payload.position,
    availability: payload.availability,
    modality: payload.modality,
    experience: payload.experience
  });
};

/** Restores the seeded state so tests never leak job-request posts into each other. */
export const resetJobRequestRegistry = (): void => {
  registry = snapshot();
};
