import type { NavItem } from '../../../content/content.types';

/**
 * Platform chrome navigation. Deliberately separate from `site.nav`: the marketing nav
 * stays marketing-only (a `content-model` concern), while the platform header owns its
 * own destinations. `path` is absolute, matching the `routerLink` contract.
 */
export const platformNav: readonly NavItem[] = [
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Trabajos', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi perfil', path: '/plataforma/perfil' }
] as const;
