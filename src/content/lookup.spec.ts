import { describe, expect, it } from 'vitest';

import type { ImageAsset, Project, Service, Testimonial } from './content.types';
import {
  contentImages,
  findProject,
  findService,
  findTestimonial,
  resolveProjectSlugs,
  resolveServiceSlugs
} from './lookup';

const image = (alt: string, width = 1200, height = 900): ImageAsset => ({
  src: `https://images.example.com/${alt}.webp`,
  alt,
  width,
  height
});

const services = [
  {
    slug: 'reformas',
    name: 'Reformas',
    summary: 's',
    includes: [],
    typicalDuration: '2 semanas',
    budgetRange: { min: 1, max: 2, currency: 'ARS' },
    image: image('reformas'),
    relatedProjectSlugs: ['casa-timber']
  },
  {
    slug: 'obra-nueva',
    name: 'Obra nueva',
    summary: 's',
    includes: [],
    typicalDuration: '6 meses',
    budgetRange: { min: 1, max: 2, currency: 'ARS' },
    image: image('obra-nueva'),
    relatedProjectSlugs: []
  }
] as const satisfies readonly Service[];

const projects = [
  {
    slug: 'casa-timber',
    title: 'Casa timber',
    brief: 'b',
    surfaceAreaM2: 180,
    duration: '8 meses',
    budgetRange: { min: 1, max: 2, currency: 'ARS' },
    location: 'Pilar',
    category: 'Obra nueva',
    testimonialSlug: 'casa-timber-opinion',
    relatedServiceSlugs: ['obra-nueva'],
    photos: [
      { kind: 'before', image: image('antes') },
      { kind: 'after', image: image('despues') },
      { kind: 'gallery', image: image('galeria'), caption: 'Galería' }
    ]
  },
  {
    slug: 'departamento-palermo',
    title: 'Depto Palermo',
    brief: 'b',
    surfaceAreaM2: 90,
    duration: '3 meses',
    budgetRange: { min: 1, max: 2, currency: 'ARS' },
    location: 'CABA',
    category: 'Reforma',
    testimonialSlug: 'depto-palermo-opinion',
    relatedServiceSlugs: ['reformas'],
    photos: [{ kind: 'after', image: image('depto') }]
  }
] as const satisfies readonly Project[];

const testimonials = [
  {
    slug: 'casa-timber-opinion',
    author: 'María Gómez',
    context: 'Pilar',
    rating: 5,
    text: 'Excelente'
  },
  {
    slug: 'depto-palermo-opinion',
    author: 'Juan Pérez',
    context: 'CABA',
    rating: 4,
    text: 'Muy bueno'
  }
] as const satisfies readonly Testimonial[];

describe('findService', () => {
  it('returns the entry whose slug matches', () => {
    expect(findService('obra-nueva', services)?.name).toBe('Obra nueva');
  });

  it('returns undefined for an unknown slug', () => {
    expect(findService('no-existe', services)).toBeUndefined();
  });

  it('matches the slug exactly, not by prefix', () => {
    expect(findService('reforma', services)).toBeUndefined();
  });

  it('returns undefined for an empty collection', () => {
    expect(findService('reformas', [])).toBeUndefined();
  });
});

describe('findProject', () => {
  it('returns the entry whose slug matches', () => {
    expect(findProject('casa-timber', projects)?.title).toBe('Casa timber');
  });

  it('returns undefined for an unknown slug', () => {
    expect(findProject('no-existe', projects)).toBeUndefined();
  });
});

describe('findTestimonial', () => {
  it('returns the review whose slug matches', () => {
    expect(findTestimonial('depto-palermo-opinion', testimonials)?.author).toBe('Juan Pérez');
  });

  it('returns undefined for an unknown slug', () => {
    expect(findTestimonial('no-existe', testimonials)).toBeUndefined();
  });
});

describe('resolveServiceSlugs', () => {
  it('resolves slugs in the requested order', () => {
    expect(resolveServiceSlugs(['obra-nueva', 'reformas'], services).map((s) => s.slug)).toEqual([
      'obra-nueva',
      'reformas'
    ]);
  });

  it('drops unknown slugs instead of returning them', () => {
    expect(resolveServiceSlugs(['reformas', 'no-existe'], services).map((s) => s.slug)).toEqual([
      'reformas'
    ]);
  });

  it('returns an empty array when nothing resolves', () => {
    expect(resolveServiceSlugs(['no-existe'], services)).toEqual([]);
  });

  it('returns an empty array for an empty slug list', () => {
    expect(resolveServiceSlugs([], services)).toEqual([]);
  });
});

describe('resolveProjectSlugs', () => {
  it('resolves slugs in the requested order', () => {
    expect(
      resolveProjectSlugs(['departamento-palermo', 'casa-timber'], projects).map((p) => p.slug)
    ).toEqual(['departamento-palermo', 'casa-timber']);
  });

  it('drops unknown slugs instead of returning them', () => {
    expect(resolveProjectSlugs(['no-existe'], projects)).toEqual([]);
  });
});

describe('contentImages', () => {
  it('walks a nested content graph and returns every image', () => {
    const graph = { nap: { logo: image('logo', 200, 200) }, projects, services };

    const alts = contentImages(graph).map((i) => i.alt);

    expect(alts).toContain('logo');
    expect(alts).toContain('reformas');
    expect(alts).toContain('antes');
    expect(alts).toContain('despues');
    expect(alts).toContain('galeria');
    expect(alts).toContain('depto');
  });

  it('returns each image once, without duplicates from repeated references', () => {
    const shared = image('compartida');
    const graph = { a: { image: shared }, b: { image: shared } };

    expect(contentImages(graph)).toEqual([shared]);
  });

  it('ignores look-alike objects that are not image assets', () => {
    const graph = {
      notAnImage: { src: 'x.webp', alt: 'algo' },
      nested: { deep: { image: image('real') } }
    };

    expect(contentImages(graph).map((i) => i.alt)).toEqual(['real']);
  });

  it('returns an empty array for a graph without images', () => {
    expect(contentImages({ story: 'texto', warranty: 'garantía' })).toEqual([]);
  });

  it('tolerates null and primitive nodes', () => {
    expect(
      contentImages({ a: null, b: 3, c: 'texto', d: [null, image('en-array')] }).map((i) => i.alt)
    ).toEqual(['en-array']);
  });
});
