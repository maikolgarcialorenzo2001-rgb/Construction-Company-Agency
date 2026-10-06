import { describe, expect, it } from 'vitest';

import { site } from '../../../content/site';
import { buildJsonLd } from './json-ld';

/**
 * The JSON-LD payload is a WHITELIST projection of the content, never a copy of it:
 * the site payload carries internal markers (`isPlaceholder`, credentials, the display
 * phone) that must not reach the machine-readable layer.
 */

const PAGE_URL = 'https://constructora-ejemplo.com.ar/servicios';
const graph = buildJsonLd(site, PAGE_URL);

describe('buildJsonLd', () => {
  it('round-trips through JSON: the payload is plain, parseable JSON', () => {
    const serialized = JSON.stringify(graph);
    expect(typeof serialized).toBe('string');
    expect(JSON.parse(serialized)).toEqual(graph);
  });

  it('exposes exactly the whitelisted fields, built field by field (no site spread)', () => {
    expect(Object.keys(graph).sort()).toEqual([
      '@context',
      '@type',
      'address',
      'areaServed',
      'description',
      'email',
      'image',
      'logo',
      'name',
      'openingHoursSpecification',
      'sameAs',
      'telephone',
      'url'
    ]);
  });

  it('never leaks internal markers into the serialized payload', () => {
    const serialized = JSON.stringify(graph);

    expect(serialized).not.toContain('isPlaceholder');
    expect(serialized).not.toContain(site.credentials.cuit);
    expect(serialized).not.toContain(site.nap.phoneDisplay);
  });

  it('declares the schema.org context and the HomeAndConstructionBusiness type', () => {
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@type']).toContain('HomeAndConstructionBusiness');
    expect(graph['@type']).toContain('GeneralContractor');
  });

  it('uses the NAP phone exactly as the single source declares it', () => {
    expect(graph.telephone).toBe(site.nap.phoneE164);
    expect(graph.telephone).toBe('5491100000000');
    expect(graph.email).toBe(site.nap.email);
  });

  it('builds the PostalAddress from the NAP, field by field', () => {
    expect(graph.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: site.nap.streetAddress,
      addressLocality: site.nap.locality,
      addressRegion: site.nap.region,
      postalCode: site.nap.postalCode,
      addressCountry: site.nap.country
    });
  });

  it('links the Google Business Profile through sameAs', () => {
    expect(graph.sameAs).toEqual([site.googleBusinessProfileUrl]);
  });

  it('serves every declared area and nothing else', () => {
    expect(graph.areaServed).toHaveLength(site.areasServed.length);
    expect(graph.areaServed.map((area) => area.name)).toEqual(
      site.areasServed.map((area) => area.name)
    );
  });

  it('derives one openingHoursSpecification per declared row, in machine-readable days', () => {
    expect(graph.openingHoursSpecification).toHaveLength(site.hours.length);

    graph.openingHoursSpecification.forEach((specification, index) => {
      const declared = site.hours[index];
      expect(specification['@type']).toBe('OpeningHoursSpecification');
      expect(specification.opens).toBe(declared.opens);
      expect(specification.closes).toBe(declared.closes);
      expect(specification.description).toBe(declared.days);
      expect(specification.dayOfWeek?.length).toBeGreaterThan(0);
      for (const day of specification.dayOfWeek ?? []) {
        expect([
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ]).toContain(day);
      }
    });
  });

  it('carries the business name, story, logo, image and the canonical url', () => {
    expect(graph.name).toBe(site.nap.name);
    expect(graph.description).toBe(site.story);
    expect(graph.logo).toBe(site.logo.src);
    expect(graph.image).toContain(site.ogImage.src);
    expect(graph.url).toBe(PAGE_URL);
  });
});
