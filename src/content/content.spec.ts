import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { projects } from './projects';
import { services } from './services';
import { site } from './site';
import { contentImages, findProject, findService } from './lookup';

/**
 * Contract suite over the whole content graph. Slice S2 covers the shared rules
 * (image contract, slug integrity, import purity, placeholder report); S5-S7
 * extend it with collection-specific rules.
 */

/** Every module that may hold content. Imported lazily so the suite stays extensible. */
const CONTENT_MODULES = ['./site', './services', './projects'] as const;

interface Slugged {
  readonly slug: string;
}

const expectUniqueSlugs = (label: string, entries: readonly Slugged[]): void => {
  const slugs = entries.map((entry) => entry.slug);
  expect(slugs, `${label} must not be empty`).not.toEqual([]);
  expect(slugs, `${label} has duplicated slugs`).toEqual([...new Set(slugs)]);
};

const nonEmpty = (value: string, label: string): void => {
  expect(typeof value, `${label} must be a string`).toBe('string');
  expect(value.trim().length, `${label} must not be empty`).toBeGreaterThan(0);
};

describe('content graph: image asset contract', () => {
  const images = contentImages({ site, services, projects });

  it('finds image assets in the graph', () => {
    expect(images.length).toBeGreaterThan(0);
  });

  it('never leaves alt text empty', () => {
    for (const asset of images) {
      expect(asset.alt.trim(), `alt is empty for ${asset.src}`).not.toBe('');
    }
  });

  it('never declares a zero or negative dimension', () => {
    for (const asset of images) {
      expect(asset.width, `width must be positive for ${asset.src}`).toBeGreaterThan(0);
      expect(asset.height, `height must be positive for ${asset.src}`).toBeGreaterThan(0);
    }
  });

  it('references images by absolute external URL (no binaries in the repository)', () => {
    for (const asset of images) {
      expect(asset.src, `image src must be absolute: ${asset.src}`).toMatch(/^https:\/\//);
    }
  });
});

describe('content graph: slug integrity', () => {
  it('keeps every slug unique within its collection', () => {
    expectUniqueSlugs('site.nav', site.nav);
    expectUniqueSlugs('services', services);
    expectUniqueSlugs('projects', projects);
  });

  it('keeps every content slug kebab-case so it can be a router segment', () => {
    for (const service of services) {
      expect(service.slug, `${service.slug} must be kebab-case`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/
      );
    }

    for (const project of projects) {
      expect(project.slug, `${project.slug} must be kebab-case`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/
      );
    }
  });
});

describe('content graph: services catalog (T5.6)', () => {
  it('holds between 5 and 7 services, the range the spec allows', () => {
    expect(services.length).toBeGreaterThanOrEqual(5);
    expect(services.length).toBeLessThanOrEqual(7);
  });

  it('gives every service a complete payload', () => {
    for (const service of services) {
      nonEmpty(service.slug, `${service.slug}.slug`);
      nonEmpty(service.name, `${service.slug}.name`);
      nonEmpty(service.summary, `${service.slug}.summary`);
      nonEmpty(service.typicalDuration, `${service.slug}.typicalDuration`);
      expect(service.includes.length, `${service.slug} must list what it includes`).toBeGreaterThan(
        0
      );

      for (const item of service.includes) {
        nonEmpty(item, `${service.slug}.includes entry`);
      }
    }
  });

  it('anchors every service with a plausible, ordered money range', () => {
    for (const service of services) {
      const { min, max, currency } = service.budgetRange;

      expect(currency, `${service.slug} must declare its currency`).toMatch(/^(ARS|USD)$/);
      expect(min, `${service.slug}.budgetRange.min must be positive`).toBeGreaterThan(0);
      expect(max, `${service.slug}.budgetRange.max must cover min`).toBeGreaterThanOrEqual(min);
    }
  });

  it('points every service at at least one related project', () => {
    for (const service of services) {
      expect(
        service.relatedProjectSlugs.length,
        `${service.slug} must reference a project to prove it does the work`
      ).toBeGreaterThan(0);
    }
  });

  it('flags every catalog entry as placeholder until real client data lands', () => {
    for (const service of services) {
      expect(service.isPlaceholder, `${service.slug} must be flagged as placeholder`).toBe(true);
    }
  });
});

describe('content graph: projects showcase (T6.6)', () => {
  it('holds a real showcase, not a single sample entry', () => {
    expect(projects.length).toBeGreaterThanOrEqual(3);
  });

  it('gives every project a complete evidence payload', () => {
    for (const project of projects) {
      nonEmpty(project.slug, `${project.slug}.slug`);
      nonEmpty(project.title, `${project.slug}.title`);
      nonEmpty(project.brief, `${project.slug}.brief`);
      nonEmpty(project.duration, `${project.slug}.duration`);
      nonEmpty(project.location, `${project.slug}.location`);
      nonEmpty(project.category, `${project.slug}.category`);
      nonEmpty(project.testimonialSlug, `${project.slug}.testimonialSlug`);

      expect(
        project.surfaceAreaM2,
        `${project.slug}.surfaceAreaM2 must be a real surface`
      ).toBeGreaterThan(0);
      expect(
        project.budgetRange.min,
        `${project.slug}.budgetRange.min must be positive`
      ).toBeGreaterThan(0);
      expect(
        project.budgetRange.max,
        `${project.slug}.budgetRange.max must cover min`
      ).toBeGreaterThanOrEqual(project.budgetRange.min);
    }
  });

  it('ships between 8 and 15 photos per project, as the spec demands', () => {
    for (const project of projects) {
      expect(
        project.photos.length,
        `${project.slug} must show a full photo set`
      ).toBeGreaterThanOrEqual(8);
      expect(
        project.photos.length,
        `${project.slug} must not turn into a wall of images`
      ).toBeLessThanOrEqual(15);
    }
  });

  it('proves the change with at least one before and one after photo', () => {
    for (const project of projects) {
      const kinds = project.photos.map((photo) => photo.kind);

      expect(kinds, `${project.slug} needs a before photo`).toContain('before');
      expect(kinds, `${project.slug} needs an after photo`).toContain('after');
    }
  });

  it('keeps the finished work as photos[0], the hero every card and detail shows', () => {
    for (const project of projects) {
      expect(project.photos[0].kind, `${project.slug} hero must show the finished work`).toBe(
        'after'
      );
    }
  });

  it('points every project at at least one related service', () => {
    for (const project of projects) {
      expect(
        project.relatedServiceSlugs.length,
        `${project.slug} must link back to the services that did the work`
      ).toBeGreaterThan(0);
    }
  });

  it('flags every project as placeholder until real client data lands', () => {
    for (const project of projects) {
      expect(project.isPlaceholder, `${project.slug} must be flagged as placeholder`).toBe(true);
    }
  });
});

describe('content graph: cross-collection integrity (T6.6)', () => {
  it('resolves every relatedServiceSlugs entry to a real service', () => {
    const dangling: string[] = [];

    for (const project of projects) {
      for (const slug of project.relatedServiceSlugs) {
        if (findService(slug, services) === undefined) {
          dangling.push(`${project.slug} -> service "${slug}"`);
        }
      }
    }

    expect(dangling, `dangling service references:\n${dangling.join('\n')}`).toEqual([]);
  });

  it('resolves every relatedProjectSlugs entry to a real project', () => {
    const dangling: string[] = [];

    for (const service of services) {
      for (const slug of service.relatedProjectSlugs) {
        if (findProject(slug, projects) === undefined) {
          dangling.push(`${service.slug} -> project "${slug}"`);
        }
      }
    }

    expect(dangling, `dangling project references:\n${dangling.join('\n')}`).toEqual([]);
  });

  it('keeps every service reachable from at least one project', () => {
    const referenced = new Set(projects.flatMap((project) => project.relatedServiceSlugs));
    const unreachable = services
      .filter((service) => !referenced.has(service.slug))
      .map((service) => service.slug);

    expect(
      unreachable,
      `services no project points back to: ${unreachable.join(', ')}`
    ).toEqual([]);
  });
});

describe('content graph: NAP single source', () => {
  const sourceFiles = (): { file: string; source: string }[] => {
    const root = join(process.cwd(), 'src');
    const files: { file: string; source: string }[] = [];

    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(path);
        } else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
          files.push({
            file: relative(root, path).split(sep).join('/'),
            source: readFileSync(path, 'utf8')
          });
        }
      }
    };

    walk(root);

    return files;
  };

  it('declares the NAP values in a single module', () => {
    const { nap } = site;
    const literals = new Set([nap.phoneE164, nap.phoneDisplay.replace(/\D/g, ''), nap.email]);
    const offenders: string[] = [];

    for (const { file, source } of sourceFiles()) {
      // The NAP module declares its own values; everything else must read them.
      if (file === 'content/site.ts') {
        continue;
      }
      for (const literal of literals) {
        if (source.includes(literal)) {
          offenders.push(`${file} repeats the NAP literal "${literal}"`);
        }
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('content graph: import purity', () => {
  it('performs no network call when a content module is imported', async () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', xhrSpy);

    try {
      vi.resetModules();
      for (const modulePath of CONTENT_MODULES) {
        await import(/* @vite-ignore */ modulePath);
      }
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchSpy, 'content modules must not fetch at import time').not.toHaveBeenCalled();
    expect(xhrSpy, 'content modules must not open an XHR at import time').not.toHaveBeenCalled();
  });
});

describe('content graph: placeholder release gate', () => {
  it('flags every non-client entry so a single search finds them', () => {
    const flags = collectPlaceholderFlags(site);

    expect(flags.length, 'the site payload must be flagged as placeholder').toBeGreaterThan(0);
    expect(flags).toContain('nap');
  });

  it('reports placeholders without failing the suite', () => {
    const flags = collectPlaceholderFlags(site);

    // Release gate, not a build gate: the owner replaces these before going live.
    console.info(
      `[release-gate] replace ${flags.length} placeholder entries before launch: ${flags.join(', ')}`
    );

    expect(Array.isArray(flags)).toBe(true);
  });
});

/** Paths of every `isPlaceholder: true` marker inside the given node, in walk order. */
function collectPlaceholderFlags(node: unknown, path: string[] = []): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((entry, index) => collectPlaceholderFlags(entry, [...path, String(index)]));
  }

  if (typeof node !== 'object' || node === null) {
    return [];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    const childPath = [...path, key];
    return key === 'isPlaceholder' && value === true
      ? [childPath.slice(0, -1).join('.')]
      : collectPlaceholderFlags(value, childPath);
  });
}
