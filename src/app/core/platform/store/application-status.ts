import type { ApplicationStatus } from '../domain';

/**
 * es-AR labels for an application status. Pure and dependency-free so the
 * mapping is unit-tested directly (no mocks, no rendering); the page only
 * formats what the gateway returned.
 */
const LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada'
};

export const applicationStatusLabel = (status: ApplicationStatus): string => LABELS[status];
