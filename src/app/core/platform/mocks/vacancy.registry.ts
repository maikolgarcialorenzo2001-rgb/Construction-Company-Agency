import type { VacancyPayload } from '../domain';
import { VACANCY_SEEDS } from './fixtures';

/**
 * Demo-only registry of structured vacancy payloads, keyed by `postId`
 * (design D1). The contract `Post` has no room for a structured payload, so the
 * company vacancy carries it out-of-band: `MockFeedGateway.create` records it
 * here and `toPostView` derives `kind`/`vacancy` from a lookup. Purely
 * in-memory and session-scoped, exactly like the mock gateway itself. The
 * payload is reference-only (`jobIds`) — job data is resolved live via
 * `JobsStore`, never copied here (spec: "MUST NOT copy job fields").
 *
 * `resetVacancyRegistry()` re-seeds from `VACANCY_SEEDS` so specs that
 * create vacancy posts stay isolated (R1/D11).
 */
const snapshot = (): Map<string, VacancyPayload> => {
  const state = new Map<string, VacancyPayload>();
  for (const seed of VACANCY_SEEDS) {
    state.set(seed.id, { jobIds: [...seed.payload.jobIds] });
  }
  return state;
};

let registry: Map<string, VacancyPayload> = snapshot();

/** Resolves the structured payload for a post, or `undefined` for a non-vacancy post. */
export const getVacancy = (postId: string): VacancyPayload | undefined =>
  registry.get(postId);

/** Records a structured payload for a newly created vacancy post. */
export const recordVacancy = (postId: string, payload: VacancyPayload): void => {
  registry.set(postId, { jobIds: [...payload.jobIds] });
};

/** Restores the seeded state so tests never leak vacancy posts into each other. */
export const resetVacancyRegistry = (): void => {
  registry = snapshot();
};
