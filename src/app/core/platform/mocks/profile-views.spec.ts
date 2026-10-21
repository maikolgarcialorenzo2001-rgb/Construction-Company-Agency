import { describe, expect, it } from 'vitest';

import type { CompanyProfile, WorkerProfile } from '../domain';
import { COMPANY_PROFILES, WORKER_PROFILES } from './fixtures';
import { AVATAR_COLOR_CLASSES, PROFILE_EXTRAS, profileViewFor } from './profile-views';

/**
 * The demo profile view-model mapper (p17, design D5/D6). It merges the frozen
 * contract profile with the demo-only display extras, so the template never sees a
 * raw `WorkerProfile`/`CompanyProfile` and the contract types stay untouched.
 */

/** A worker profile that is NOT in the extras registry (the fallback case). */
const UNSEEDED_WORKER: WorkerProfile = {
  userId: 'worker-99',
  role: 'worker',
  fullName: 'Ana',
  phone: '+54 9 11 9999-8888',
  location: 'La Plata, Buenos Aires',
  bio: 'Albañil con experiencia en obra seca.',
  skills: ['Albañilería'],
  createdAt: '2026-09-01T12:00:00.000Z'
};

/** A company profile that is NOT in the extras registry (the fallback case). */
const UNSEEDED_COMPANY: CompanyProfile = {
  companyId: 'company-99',
  role: 'company',
  name: 'Constructora Delta',
  description: 'Obra en general.',
  createdAt: '2026-09-01T12:00:00.000Z'
};

describe('profileViewFor', () => {
  it('maps a seeded worker into a display view', () => {
    const view = profileViewFor(WORKER_PROFILES[0]);

    expect(view.id).toBe('worker-1');
    expect(view.role).toBe('worker');
    expect(view.displayName).toBe('Lucía Fernández');
    expect(view.initials).toBe('LF');
  });

  it('maps a seeded company into a display view', () => {
    const view = profileViewFor(COMPANY_PROFILES[0]);

    expect(view.id).toBe('company-1');
    expect(view.role).toBe('company');
    expect(view.displayName).toBe('Constructora Norte SAC');
    expect(view.initials).toBe('CN');
  });

  it('derives a single initial from a single-word name', () => {
    const view = profileViewFor(UNSEEDED_WORKER);

    expect(view.initials).toBe('A');
  });

  it('picks a deterministic avatar color from the literal class pairs', () => {
    const view = profileViewFor(WORKER_PROFILES[0]);

    expect(AVATAR_COLOR_CLASSES).toContain(view.avatarColor);
    expect(profileViewFor(WORKER_PROFILES[0]).avatarColor).toBe(view.avatarColor);
    expect(profileViewFor(WORKER_PROFILES[0]).avatarColor).toBe(
      profileViewFor({ ...WORKER_PROFILES[0] }).avatarColor
    );
  });

  it('merges the seeded extras without mutating the contract profile', () => {
    const before = { ...WORKER_PROFILES[0] };
    const extras = PROFILE_EXTRAS['worker-1'];

    const view = profileViewFor(WORKER_PROFILES[0]);

    expect(view.sector).toBe(extras.sector);
    expect(view.verified).toBe(extras.verified);
    expect(view.whatsapp).toBe(extras.whatsapp);
    expect(view.followerCount).toBe(extras.followerCount);
    expect(view.followingCount).toBe(extras.followingCount);
    expect(WORKER_PROFILES[0]).toEqual(before);
  });

  it('falls back to the demo defaults for an id outside the registry', () => {
    const worker = profileViewFor(UNSEEDED_WORKER);

    expect(worker.sector).toBe('Demo');
    expect(worker.verified).toBe(false);
    expect(worker.followerCount).toBe(0);
    expect(worker.followingCount).toBe(0);
    expect(worker.whatsapp).toBe('+5491199998888');
  });

  it('falls back to an empty whatsapp when the fallback profile has no phone', () => {
    const company = profileViewFor(UNSEEDED_COMPANY);

    expect(company.sector).toBe('Demo');
    expect(company.verified).toBe(false);
    expect(company.followerCount).toBe(0);
    expect(company.followingCount).toBe(0);
    expect(company.whatsapp).toBe('');
  });

  it('is pure: the same profile always yields the same view', () => {
    expect(profileViewFor(WORKER_PROFILES[0])).toEqual(profileViewFor(WORKER_PROFILES[0]));
    expect(profileViewFor(COMPANY_PROFILES[0])).toEqual(profileViewFor(COMPANY_PROFILES[0]));
  });

  it('carries the contract fields the template renders', () => {
    const worker = profileViewFor(WORKER_PROFILES[0]);
    const company = profileViewFor(COMPANY_PROFILES[0]);

    expect(worker.bio).toBe(WORKER_PROFILES[0].bio);
    expect(worker.location).toBe(WORKER_PROFILES[0].location);
    expect(worker.phone).toBe(WORKER_PROFILES[0].phone);
    expect(worker.skills).toEqual(WORKER_PROFILES[0].skills);
    expect(worker.createdAt).toBe(WORKER_PROFILES[0].createdAt);

    expect(company.bio).toBe(COMPANY_PROFILES[0].description);
    expect(company.contactEmail).toBe(COMPANY_PROFILES[0].contactEmail);
    expect(company.website).toBe(COMPANY_PROFILES[0].website);
    expect(company.phone).toBe('');
    expect(company.skills).toEqual([]);
  });
});
