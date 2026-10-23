import { describe, expect, it } from 'vitest';

import { postKindLabel } from './post-kind-labels';

/**
 * The shared publication-kind labels (p17 slice 3): the public profile grid and
 * the home publications section read the SAME es-AR badge copy from ONE module,
 * so the two surfaces can never drift apart.
 */
describe('post kind labels', () => {
  it('labels a standard post Publicación', () => {
    expect(postKindLabel('standard')).toBe('Publicación');
  });

  it('labels a worker job request Búsqueda laboral', () => {
    expect(postKindLabel('job-request')).toBe('Búsqueda laboral');
  });

  it('labels a company vacancy Vacante', () => {
    expect(postKindLabel('vacancy')).toBe('Vacante');
  });
});
