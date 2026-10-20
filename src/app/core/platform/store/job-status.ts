import type { JobStatus } from '../domain';

/**
 * es-AR labels for a job opening status. Pure and dependency-free so the
 * mapping is unit-tested directly (no mocks, no rendering); the vacancy card
 * only formats what the store resolved. Mirrors `applicationStatusLabel`.
 */
const LABELS: Record<JobStatus, string> = {
  open: 'Abierta',
  closed: 'Cerrada'
};

export const jobStatusLabel = (status: JobStatus): string => LABELS[status];
