import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const INDEX_HTML = readFileSync(join(process.cwd(), 'src', 'index.html'), 'utf8');

const tag = (name: string): string => {
  const re = new RegExp('<' + name + '[^>]*>', 'i');
  const match = INDEX_HTML.match(re);
  if (!match) {
    throw new Error(`index.html must contain a <${name}> tag`);
  }
  return match[0];
};

const content = (name: string, attribute: string): string => {
  const re = new RegExp('<meta[^>]*' + attribute + '="' + name + '"[^>]*>', 'i');
  const match = INDEX_HTML.match(re);
  if (!match) {
    throw new Error(`index.html must contain <meta ${attribute}="${name}">`);
  }
  const val = match[0].match(/content="([^"]*)"/i);
  if (!val) {
    throw new Error(`<meta ${attribute}="${name}"> must carry a non-empty content`);
  }
  return val[1];
};

describe('shipped document (src/index.html)', () => {
  it('declares the es-AR document language', () => {
    expect(tag('html')).toMatch(/lang="es-AR"/);
  });

  it('ships a non-empty es-AR title and description', () => {
    const titleMatch = INDEX_HTML.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    expect(title.trim().length).toBeGreaterThan(0);
    expect(title.toLowerCase()).not.toContain('constructioncompanyagency');
    const description = content('description', 'name');
    expect(description.trim().length).toBeGreaterThan(0);
    expect(description).toContain('?');
  });

  it('ships Open Graph fallback metadata', () => {
    const ogTitle = content('og:title', 'property');
    const ogDescription = content('og:description', 'property');
    const ogType = content('og:type', 'property');
    const ogImage = content('og:image', 'property');
    expect(ogTitle.trim().length).toBeGreaterThan(0);
    expect(ogDescription.trim().length).toBeGreaterThan(0);
    expect(ogType).toBe('website');
    expect(ogImage.trim().length).toBeGreaterThan(0);
  });

  it('ships a theme-color and a mobile viewport with device-width', () => {
    expect(content('theme-color', 'name').trim().length).toBeGreaterThan(0);
    const viewport = content('viewport', 'name');
    expect(viewport).toContain('width=device-width');
  });
});
