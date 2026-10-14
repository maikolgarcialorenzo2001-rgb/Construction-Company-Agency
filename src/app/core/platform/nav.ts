import type { NavItem } from '../../../content/content.types';
import type { Role } from './domain';

/**
 * Platform chrome navigation. Deliberately separate from `site.nav`: the marketing nav
 * stays marketing-only (a `content-model` concern), while the platform header owns its
 * own destinations. `path` is absolute, matching the `routerLink` contract.
 */

/** Worker destinations. `admin` reuses this exact table (same array reference). */
const WORKER_NAV: readonly NavItem[] = [
  { slug: 'inicio', label: 'Inicio', path: '/plataforma/inicio' },
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Trabajos', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi perfil', path: '/plataforma/perfil' }
];

/** Company destinations: same slugs as `WORKER_NAV`, only the two labels change. */
const COMPANY_NAV: readonly NavItem[] = [
  { slug: 'inicio', label: 'Inicio', path: '/plataforma/inicio' },
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Vacantes', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi empresa', path: '/plataforma/perfil' }
];

/**
 * Admin destinations: the worker items plus a **leading** `Admin` item. It is its
 * own literal table on purpose (design D9 / R4): the spec forbids admin sharing the
 * `worker` navigation table, so admin never references `WORKER_NAV`.
 */
const ADMIN_NAV: readonly NavItem[] = [
  { slug: 'admin', label: 'Admin', path: '/plataforma/admin' },
  { slug: 'inicio', label: 'Inicio', path: '/plataforma/inicio' },
  { slug: 'feed', label: 'Novedades', path: '/plataforma' },
  { slug: 'trabajos', label: 'Trabajos', path: '/plataforma/trabajos' },
  { slug: 'perfil', label: 'Mi perfil', path: '/plataforma/perfil' }
];

/**
 * Exhaustive role table: a future 4th `Role` becomes a compile error here, not a
 * silent runtime gap.
 */
const PLATFORM_NAV_BY_ROLE: Record<Role, readonly NavItem[]> = {
  worker: WORKER_NAV,
  company: COMPANY_NAV,
  admin: ADMIN_NAV
};

/**
 * The role→items rule plus the no-session rule in one pure function: `null` (anonymous)
 * yields an empty set, so the header can gate its `<nav>` landmark on emptiness without
 * a second source of truth.
 */
export const platformNavFor = (role: Role | null): readonly NavItem[] =>
  role === null ? [] : PLATFORM_NAV_BY_ROLE[role];
