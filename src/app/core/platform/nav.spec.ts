import { describe, expect, it } from 'vitest';

import { platformNavFor } from './nav';

/** The three roles the session can resolve. `null` is the anonymous visitor. */
const ROLES = ['worker', 'company', 'admin'] as const;

const labelsFor = (role: (typeof ROLES)[number]): string[] =>
  platformNavFor(role).map((item) => item.label);

/**
 * Pure mapping tests: `platformNavFor` owns the role→items rule AND the no-session
 * rule (`null → []`), so it is exercised without TestBed — same seam the header uses.
 */
describe('platformNavFor', () => {
  it('returns no items for an anonymous visitor', () => {
    expect(platformNavFor(null)).toEqual([]);
  });

  it('lists the worker work nav in order, led by Inicio', () => {
    expect(labelsFor('worker')).toEqual(['Inicio', 'Novedades', 'Trabajos', 'Mi perfil']);
  });

  it('relabels the company work nav but keeps Inicio and Novedades', () => {
    expect(labelsFor('company')).toEqual(['Inicio', 'Novedades', 'Vacantes', 'Mi empresa']);
  });

  it('shares the worker item set with admin (same array reference)', () => {
    expect(platformNavFor('admin')).toBe(platformNavFor('worker'));
  });

  it('keeps the destination slugs invariant across roles', () => {
    for (const role of ROLES) {
      expect(platformNavFor(role).map((item) => item.slug)).toEqual([
        'inicio',
        'feed',
        'trabajos',
        'perfil'
      ]);
    }
  });

  it('keeps the destination paths invariant across roles', () => {
    for (const role of ROLES) {
      expect(platformNavFor(role).map((item) => item.path)).toEqual([
        '/plataforma/inicio',
        '/plataforma',
        '/plataforma/trabajos',
        '/plataforma/perfil'
      ]);
    }
  });
});
