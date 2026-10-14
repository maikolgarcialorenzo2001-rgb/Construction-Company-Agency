import { describe, expect, it } from 'vitest';

import { platformNavFor } from './nav';

const labelsFor = (role: 'worker' | 'company' | 'admin'): string[] =>
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

  it('gives admin its own item table, not the worker array', () => {
    expect(platformNavFor('admin')).not.toBe(platformNavFor('worker'));
    expect(labelsFor('admin')).toEqual(['Admin', 'Inicio', 'Novedades', 'Trabajos', 'Mi perfil']);
  });

  it('keeps the destination slugs invariant across worker and company', () => {
    for (const role of ['worker', 'company'] as const) {
      expect(platformNavFor(role).map((item) => item.slug)).toEqual([
        'inicio',
        'feed',
        'trabajos',
        'perfil'
      ]);
    }
  });

  it('leads the admin slugs with the admin destination', () => {
    expect(platformNavFor('admin').map((item) => item.slug)).toEqual([
      'admin',
      'inicio',
      'feed',
      'trabajos',
      'perfil'
    ]);
  });

  it('keeps the destination paths invariant across worker and company', () => {
    for (const role of ['worker', 'company'] as const) {
      expect(platformNavFor(role).map((item) => item.path)).toEqual([
        '/plataforma/inicio',
        '/plataforma',
        '/plataforma/trabajos',
        '/plataforma/perfil'
      ]);
    }
  });

  it('leads the admin paths with /plataforma/admin', () => {
    expect(platformNavFor('admin').map((item) => item.path)).toEqual([
      '/plataforma/admin',
      '/plataforma/inicio',
      '/plataforma',
      '/plataforma/trabajos',
      '/plataforma/perfil'
    ]);
  });
});
