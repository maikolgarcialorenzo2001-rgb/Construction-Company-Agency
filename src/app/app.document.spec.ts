import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const INDEX_HTML = readFileSync(join(process.cwd(), 'src', 'index.html'), 'utf8');

const tag = (name: string): string => {
  const match = new RegExp(`<${name}\\b[^>]*>`, 'i').exec(INDEX_HTML);
  expect(match, `index.html must contain a <${name}> tag`).not.toBeNull();
  return match![0];
};

const content = (name: string, attribute: string): string => {
  const match = new RegExp(`<meta\\b[^>]*\\b${attribute}="${name}"[^>]*>`, 'i').exec(INDEX_HTML);
  expect(match, `index.html must contain <meta ${attribute}="${name}">`).not.toBeNull();
  const value = /content="([^"]*)"/i.exec(match![0]);
  expect(value, `<meta ${attribute}="${name}"> must carry a non-empty content`).not.toBeNull();
  return value![1];
};

describe('shipped document (src/index.html)', () => {
  it('declares the es-AR document language', () => {
    expect(tag('html')).toMatch(/lang="es-AR"/);
  });

  it('ships a non-empty es-AR title and description', () => {
    const title = /<title>([^<]+)<\/title>/i.exec(INDEX_HTML)?.[1] ?? '';
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

    expect(ogTitle.trim().length).toBeGreaterThan(0);
    expect(ogDescription.trim().length).toBeGreaterThan(0);
    expect(ogType).toBe('website');
  });

  it('ships a theme-color and a mobile viewport with device-width', () => {
    expect(content('theme-color', 'name').trim().length).toBeGreaterThan(0);

    const viewport = content('viewport', 'name');
    expect(viewport).toContain('width=device-width');
  });
});
