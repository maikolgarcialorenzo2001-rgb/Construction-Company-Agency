import { describe, expect, it } from 'vitest';

import { site } from './site';

const nonEmpty = (value: string | undefined, label: string): void => {
  expect(typeof value, `${label} must be a string`).toBe('string');
  expect(value?.trim().length, `${label} must not be empty`).toBeGreaterThan(0);
};

describe('site content: NAP single source', () => {
  it('declares a complete, non-placeholder-flagged identity', () => {
    const { nap } = site;

    nonEmpty(nap.name, 'nap.name');
    nonEmpty(nap.streetAddress, 'nap.streetAddress');
    nonEmpty(nap.locality, 'nap.locality');
    nonEmpty(nap.region, 'nap.region');
    nonEmpty(nap.postalCode, 'nap.postalCode');
    nonEmpty(nap.email, 'nap.email');
    expect(nap.country).toBe('AR');
  });

  it('keeps the machine-readable phone digit-only and free of separators', () => {
    const { phoneE164 } = site.nap;

    expect(phoneE164).toMatch(/^\d{10,15}$/);
    expect(phoneE164).not.toContain('+');
    expect(phoneE164).not.toContain(' ');
    expect(phoneE164).not.toContain('-');
  });

  it('renders the same phone number in display and machine format', () => {
    const { phoneDisplay, phoneE164 } = site.nap;

    expect(phoneDisplay.startsWith('+')).toBe(true);
    expect(phoneDisplay.replace(/\D/g, '')).toBe(phoneE164);
  });

  it('flags the NAP as placeholder until the client data lands', () => {
    expect(site.nap.isPlaceholder).toBe(true);
  });

  it('exposes a deliverable email address', () => {
    expect(site.nap.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  });
});

describe('site content: trust payload', () => {
  it('declares opening hours with a day and an open/close pair', () => {
    expect(site.hours.length).toBeGreaterThan(0);

    for (const hours of site.hours) {
      nonEmpty(hours.days, 'hours.days');
      expect(hours.opens, `${hours.days} opens`).toMatch(/^\d{2}:\d{2}$/);
      expect(hours.closes, `${hours.days} closes`).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('declares the four verifiable credentials', () => {
    const { art, insurance, professionalRegistration, cuit } = site.credentials;

    nonEmpty(art, 'credentials.art');
    nonEmpty(insurance, 'credentials.insurance');
    nonEmpty(professionalRegistration, 'credentials.professionalRegistration');
    expect(cuit, 'credentials.cuit').toMatch(/^\d{2}-?\d{8}-?\d$/);
  });

  it('declares the warranty and the company story', () => {
    nonEmpty(site.warranty, 'site.warranty');
    expect(site.warranty.length, 'warranty copy must be a real sentence').toBeGreaterThan(20);
    nonEmpty(site.story, 'site.story');
    expect(site.story.length, 'story copy must be a real paragraph').toBeGreaterThan(80);
  });

  it('declares the served areas', () => {
    expect(site.areasServed.length).toBeGreaterThan(0);

    for (const area of site.areasServed) {
      nonEmpty(area.slug, 'area.slug');
      expect(area.slug, `${area.slug} must be kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      nonEmpty(area.name, 'area.name');
    }
  });

  it('links to an external Google Business Profile over https', () => {
    expect(site.googleBusinessProfileUrl).toMatch(/^https:\/\/\S+$/);
  });

  it('declares the logo and the Open Graph image as image assets', () => {
    for (const [label, asset] of [
      ['logo', site.logo],
      ['ogImage', site.ogImage]
    ] as const) {
      nonEmpty(asset.src, `${label}.src`);
      nonEmpty(asset.alt, `${label}.alt`);
      expect(asset.width, `${label}.width`).toBeGreaterThan(0);
      expect(asset.height, `${label}.height`).toBeGreaterThan(0);
    }
  });
});

describe('site content: navigation', () => {
  it('links every content section with a unique slug and an absolute path', () => {
    expect(site.nav.length).toBeGreaterThan(0);

    for (const item of site.nav) {
      nonEmpty(item.slug, 'nav.slug');
      nonEmpty(item.label, 'nav.label');
      expect(item.path, `${item.slug} must be an absolute router path`).toMatch(/^\/[a-z/-]*$/);
    }
  });

  it('has no duplicated nav slug or nav path', () => {
    expect(site.nav.map((i) => i.slug)).toEqual([...new Set(site.nav.map((i) => i.slug))]);
    expect(site.nav.map((i) => i.path)).toEqual([...new Set(site.nav.map((i) => i.path))]);
  });

  it('covers every top-level section route, excluding the quote CTA', () => {
    const paths = site.nav.map((i) => i.path);

    expect(paths).toEqual(
      expect.arrayContaining(['/servicios', '/proyectos', '/proceso', '/testimonios', '/nosotros'])
    );
    expect(paths).not.toContain('/presupuesto');
  });
});
