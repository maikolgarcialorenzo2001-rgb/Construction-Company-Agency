/**
 * The es-AR labels of the platform identity badges, in ONE home (p17 review D4):
 * `roleLabel` (the role badge), `verifiedLabel` (the verified badge) and
 * `sectorLabel` (the sector line) are pure, Angular-free functions, so they
 * live together and every page reads the SAME copy from the SAME module.
 *
 * No Angular imports, no side effects: trivially testable and usable from a
 * `computed()`.
 */
import type { ProfileRole, Role } from '../domain';

/**
 * es-AR label for a role, shared by the preview directory, the client switcher
 * and the public profile. Every role has a label, admin included.
 */
export const roleLabel = (role: Role): string =>
  role === 'worker' ? 'Trabajador' : role === 'company' ? 'Empresa' : 'Administración';

/**
 * The es-AR label of the verified badge, by role: a company is "Verificada" and
 * a worker "Verificado". The badge copy follows the grammatical gender of the
 * role, so the SAME badge never says "Verificado" to a company.
 *
 * The role is narrowed to the two PUBLIC-PROFILE roles: a public profile is a
 * worker or a company, never an admin. The branch is exhaustive on purpose —
 * a role outside the contract gets NO label instead of the worker's wording.
 */
export const verifiedLabel = (role: ProfileRole): string => {
  switch (role) {
    case 'company':
      return 'Verificada';
    case 'worker':
      return 'Verificado';
  }
};

/**
 * The es-AR line that names the sector of a profile: a company states its
 * "Rubro" and a worker their "Oficio". The seeded sector follows the label.
 *
 * Narrowed and exhaustive, exactly like `verifiedLabel`: a role outside the
 * public-profile contract gets NO line instead of the worker's wording.
 */
export const sectorLabel = (role: ProfileRole, sector: string): string => {
  switch (role) {
    case 'company':
      return `Rubro: ${sector}`;
    case 'worker':
      return `Oficio: ${sector}`;
  }
};
