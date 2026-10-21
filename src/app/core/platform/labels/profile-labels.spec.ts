import { describe, expect, it } from 'vitest';

import { roleLabel, sectorLabel, verifiedLabel } from './profile-labels';

/**
 * The shared identity labels (p17 review D4): the three pure helpers live in
 * ONE module, so the preview directory, the client switcher and the public
 * profile can never drift apart. The specs pin the exact es-AR copy.
 */
describe('profile labels', () => {
  /**
   * Reaches PAST the type on purpose: the admin role is out of the helpers'
   * contract, and this proves the RUNTIME guard — the helpers must never
   * answer with the other role's wording.
   */
  const outOfContractRole = (): Parameters<typeof verifiedLabel>[0] =>
    'admin' as unknown as Parameters<typeof verifiedLabel>[0];

  describe('roleLabel', () => {
    it('labels every role in es-AR', () => {
      expect(roleLabel('worker')).toBe('Trabajador');
      expect(roleLabel('company')).toBe('Empresa');
      expect(roleLabel('admin')).toBe('Administración');
    });
  });

  describe('verifiedLabel', () => {
    it('labels a verified company Verificada and a verified worker Verificado', () => {
      expect(verifiedLabel('company')).toBe('Verificada');
      expect(verifiedLabel('worker')).toBe('Verificado');
    });
  });

  describe('sectorLabel', () => {
    it('names the sector Rubro for a company and Oficio for a worker', () => {
      expect(sectorLabel('company', 'Construcción')).toBe('Rubro: Construcción');
      expect(sectorLabel('worker', 'Electricidad')).toBe('Oficio: Electricidad');
    });
  });

  describe('a role outside the public-profile contract', () => {
    it('never answers with the other role’s wording', () => {
      // An admin is not a worker and not a company: the helpers must say
      // NOTHING rather than fall into the worker branch.
      expect(verifiedLabel(outOfContractRole())).toBeUndefined();
      expect(sectorLabel(outOfContractRole(), 'Electricidad')).toBeUndefined();
    });
  });
});
