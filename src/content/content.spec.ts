import { describe, expect, it, vi } from 'vitest';

import { site } from './site';
import { contentImages } from './lookup';

/**
 * Contract suite over the whole content graph. Slice S2 covers the shared rules
 * (image contract, slug integrity, import purity, placeholder report); S5-S7
 * extend it with collection-specific rules.
 */

/** Every module that may hold content. Imported lazily so the suite stays extensible. */
const CONTENT_MODULES = ['./site'] as const;

interface Slugged {
  readonly slug: string;
}

const expectUniqueSlugs = (label: string, entries: readonly Slugged[]): void => {
  const slugs = entries.map((entry) => entry.slug);
  expect(slugs, `${label} must not be empty`).not.toEqual([]);
  expect(slugs, `${label} has duplicated slugs`).toEqual([...new Set(slugs)]);
};

describe('content graph: image asset contract', () => {
  const images = contentImages({ site });

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
