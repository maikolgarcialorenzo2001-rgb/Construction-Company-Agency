import type { JobOpening, VacancyPayload } from '../../core/platform/domain';

/**
 * Resolves a reference-only `VacancyPayload` against the openings the page
 * already loaded (design D5): one lookup map, payload order preserved, ids
 * without a matching opening skipped. Pure — the card stays presentational and
 * receives only render-ready `JobOpening[]`; the page owns hydration and the
 * hide-on-empty gate (D6).
 */
export const resolveVacancyOpenings = (
  payload: VacancyPayload,
  openings: JobOpening[]
): JobOpening[] => {
  const byId = new Map(openings.map((opening) => [opening.id, opening]));

  return payload.jobIds
    .map((id) => byId.get(id))
    .filter((opening): opening is JobOpening => opening !== undefined);
};
