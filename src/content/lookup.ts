import type { ImageAsset, Project, Service, Testimonial } from './content.types';

/**
 * Pure lookups over the content collections.
 *
 * The collection is always an argument: these helpers own no data, so they can be
 * unit-tested in isolation and the data modules stay free of import cycles. A page
 * calls `findService(slug, SERVICES)`.
 */

const findBySlug = <T extends { readonly slug: string }>(
  slug: string,
  collection: readonly T[]
): T | undefined => collection.find((entry) => entry.slug === slug);

export const findService = (slug: string, services: readonly Service[]): Service | undefined =>
  findBySlug(slug, services);

export const findProject = (slug: string, projects: readonly Project[]): Project | undefined =>
  findBySlug(slug, projects);

export const findTestimonial = (
  slug: string,
  testimonials: readonly Testimonial[]
): Testimonial | undefined => findBySlug(slug, testimonials);

/** Resolves slugs in the requested order, dropping the ones that do not exist. */
export const resolveServiceSlugs = (
  slugs: readonly string[],
  services: readonly Service[]
): readonly Service[] =>
  slugs
    .map((slug) => findService(slug, services))
    .filter((service): service is Service => service !== undefined);

export const resolveProjectSlugs = (
  slugs: readonly string[],
  projects: readonly Project[]
): readonly Project[] =>
  slugs
    .map((slug) => findProject(slug, projects))
    .filter((project): project is Project => project !== undefined);

const isImageAsset = (node: unknown): node is ImageAsset => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  const candidate = node as Partial<ImageAsset>;
  return (
    typeof candidate.src === 'string' &&
    typeof candidate.alt === 'string' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number'
  );
};

/**
 * Walks any content node (including deeply nested project photos) and returns every
 * `ImageAsset` it contains, de-duplicated by identity. Used by the image contract test.
 */
export const contentImages = (node: unknown): readonly ImageAsset[] => {
  const found: ImageAsset[] = [];

  const walk = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }

    if (typeof current !== 'object' || current === null) {
      return;
    }

    if (isImageAsset(current) && !found.includes(current)) {
      found.push(current);
    }

    Object.values(current).forEach(walk);
  };

  walk(node);

  return found;
};
