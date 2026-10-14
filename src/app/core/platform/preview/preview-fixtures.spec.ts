import { describe, expect, it } from 'vitest';

import type { PreviewRole } from './preview-fixtures';
import {
  PREVIEW_ROLES,
  previewRoleParams,
  previewViewModelFor,
  resolvePreviewRole
} from './preview-fixtures';
import {
  APPLICATIONS,
  COMPANY_PROFILES,
  DEMO_ACCOUNTS,
  FEED_POSTS,
  JOBS,
  WORKER_PROFILES
} from '../mocks/fixtures';

/**
 * Strict-mode RED for p13 WU1: `preview-fixtures.ts` does not exist yet, so every
 * scenario below fails to resolve the module. The spec pins the pure, synchronous
 * selector that `/previa` renders from (design D4/D5/D6/D7/D9): shared role list,
 * deterministic resolver, fixture-backed view model and a password-free directory.
 */
describe('preview fixtures selector', () => {
  describe('shared role list and resolver', () => {
    it('declares the shared preview roles in worker, company, admin order', () => {
      expect([...PREVIEW_ROLES]).toEqual(['worker', 'company', 'admin']);
    });

    it('resolves each known role segment to itself', () => {
      expect(resolvePreviewRole('worker')).toBe('worker');
      expect(resolvePreviewRole('company')).toBe('company');
      expect(resolvePreviewRole('admin')).toBe('admin');
    });

    it('resolves unknown, empty and missing segments to null', () => {
      expect(resolvePreviewRole('inventado')).toBeNull();
      expect(resolvePreviewRole('')).toBeNull();
      expect(resolvePreviewRole(null)).toBeNull();
      expect(resolvePreviewRole(undefined)).toBeNull();
    });

    it('enumerates one prerender param object per preview role', () => {
      expect(previewRoleParams()).toEqual([
        { role: 'worker' },
        { role: 'company' },
        { role: 'admin' }
      ]);
    });
  });

  describe('previewViewModelFor', () => {
    it('maps the default view to the feed, the open jobs and the first worker and company profiles', () => {
      const vm = previewViewModelFor(null);

      expect(vm.role).toBeNull();
      expect(vm.feed).toEqual(FEED_POSTS);
      expect(vm.jobs).toEqual(JOBS.filter((job) => job.status === 'open'));
      // Non-trivial: the default section must never be an empty shell (Req: prerendered HTML is non-empty).
      expect(vm.jobs.length).toBeGreaterThan(0);
      expect(vm.worker).toEqual(WORKER_PROFILES[0]);
      expect(vm.company).toEqual(COMPANY_PROFILES[0]);
    });

    it('joins every application to its job with the job title as its label', () => {
      const vm = previewViewModelFor('worker');

      expect(vm.applications).toHaveLength(APPLICATIONS.length);

      const first = vm.applications[0];
      const firstJob = JOBS.find((job) => job.id === APPLICATIONS[0]?.jobId) ?? null;
      expect(first?.application).toEqual(APPLICATIONS[0]);
      expect(first?.job).toEqual(firstJob);
      expect(first?.label).toBe(firstJob?.title ?? 'Vacante no disponible');
    });

    it('filters the company vacancies by the first company profile, never another company', () => {
      const vm = previewViewModelFor('company');
      const companyId = COMPANY_PROFILES[0].companyId;

      expect(vm.role).toBe('company');
      expect(vm.vacancies.length).toBeGreaterThan(0);
      for (const vacancy of vm.vacancies) {
        expect(vacancy.companyId).toBe(companyId);
      }
    });

    it('maps the admin directory from the demo accounts without their passwords', () => {
      const vm = previewViewModelFor('admin');

      expect(vm.role).toBe('admin');
      expect(vm.directory).toEqual(
        DEMO_ACCOUNTS.map(({ userId, email, role }) => ({ userId, email, role }))
      );
      for (const row of vm.directory) {
        expect(Object.keys(row)).not.toContain('password');
        expect(row).not.toHaveProperty('password');
      }
    });

    it('is deterministic: two calls with the same role deep-equal', () => {
      const roles: readonly (PreviewRole | null)[] = [null, ...PREVIEW_ROLES];

      for (const role of roles) {
        expect(previewViewModelFor(role)).toEqual(previewViewModelFor(role));
      }
    });
  });
});
