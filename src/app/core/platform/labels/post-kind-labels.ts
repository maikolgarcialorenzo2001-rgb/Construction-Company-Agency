/**
 * The es-AR labels of a publication kind (p17 slice 3), in ONE home: the public
 * profile grid and the home publications section read the SAME badge copy from
 * this module, so the two surfaces can never drift apart.
 *
 * No Angular imports, no side effects: trivially testable and usable from a
 * `computed()`.
 */
import type { PostKind } from '../domain';

/**
 * The label of a publication kind, shared by the profile grid and the home
 * teasers. The switch is exhaustive on the `PostKind` union: every kind the
 * feed can project has exactly one es-AR badge.
 */
export const postKindLabel = (kind: PostKind): string => {
  switch (kind) {
    case 'standard':
      return 'Publicación';
    case 'job-request':
      return 'Búsqueda laboral';
    case 'vacancy':
      return 'Vacante';
  }
};
