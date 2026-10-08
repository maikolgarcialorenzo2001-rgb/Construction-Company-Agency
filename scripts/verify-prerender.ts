/**
 * Post-build prerender verification for the static SSR output (Req 3/6/8–13 gate).
 *
 * Runs the expected route set derived from `src/content` (never a hardcoded count),
 * walks `dist/browser`, and asserts per-page head invariants: exactly one of each SEO
 * meta, `og:image` matching the site config, absolute canonical on the prod origin,
 * parseable JSON-LD with an absolute same-origin `url`, per-slug title distinctness,
 * and `title == og:title` on every page. Also asserts the CSR fallback exists, no
 * `localhost` anywhere under `dist/`, and (Req 5) no root `server.ts` with
 * `@angular/ssr` as the only SSR-related dependency.
 *
 * Run with Bun (runs TS natively): `bun scripts/verify-prerender.ts`.
 * Exit code is non-zero on ANY failure, with one line per failed assertion.
 * `VERIFY_PRERENDER_DIST` overrides the browser output root (used to prove the
 * failure path against a missing directory).
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { services } from '../src/content/services';
import { projects } from '../src/content/projects';
import { site } from '../src/content/site';
import { environment } from '../src/app/environments/environment.prod';

/** The six static browser routes plus home (the wildcard is never prerendered). */
const STATIC_PATHS = ['', 'servicios', 'proyectos', 'proceso', 'testimonios', 'nosotros', 'presupuesto'];

/** The prod origin every absolute URL must start with (never localhost). */
const SITE_URL = environment.siteUrl.trim();

/** Browser output root; override only for failure-path proof runs. */
const resolveDistRoot = (): string => {
  const direct = join('dist', 'browser');
  if (existsSync(direct)) return direct;
  // Angular 22 with SSR emits dist/<project>/browser — adapt instead of assuming.
  const distDir = join('dist');
  if (existsSync(distDir)) {
    for (const entry of readdirSync(distDir)) {
      const candidate = join(distDir, entry, 'browser');
      if (existsSync(candidate)) return candidate;
    }
  }
  return direct; // existence check below reports the missing root clearly
};
const DIST_ROOT = process.env.VERIFY_PRERENDER_DIST ?? resolveDistRoot();

const REPO_ROOT = process.cwd();

const failures: string[] = [];

const fail = (label: string, message: string): void => {
  failures.push(`✗ ${label}: ${message}`);
};

const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countOccurrences = (text: string, needle: string): number => {
  const re = new RegExp(escapeRe(needle), 'gi');
  return (text.match(re) ?? []).length;
};

const attr = (tag: string, key: string): string | undefined => {
  const match = tag.match(new RegExp(`\\b${key}=["']([^"']*)["']`, 'i'));
  return match?.[1];
};

const collectTags = (head: string, tagName: string): string[] => {
  const tags: string[] = [];
  const re = new RegExp(`<${tagName}\\s[^>]*>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(head)) !== null) tags.push(match[0]);
  return tags;
};

/** Absolute-origin check: starts with the prod siteUrl at a path boundary. */
const isProdOriginUrl = (value: string): boolean =>
  value.startsWith(SITE_URL) &&
  (value.length === SITE_URL.length ||
    value[SITE_URL.length] === '/' ||
    value[SITE_URL.length] === '?');

/** All distinct titles seen on parameterized pages (per-slug distinctness). */
const seenTitles = new Map<string, string>();

let headsChecked = 0;

/**
 * Assert the head invariants of one prerendered page.
 * @param route relative route ('', 'servicios', 'servicios/albanileria', ...)
 * @param html  full file content of the prerendered page
 */
function checkHead(route: string, html: string): void {
  headsChecked += 1;
  const label = route === '' ? 'home' : route;

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    fail(label, 'no <head> section found');
    return;
  }
  const head = headMatch[1];

  const metaTags = collectTags(head, 'meta');
  const linkTags = collectTags(head, 'link');

  // Exactly one of each required tag.
  const expectOne = (name: string): void => {
    const found = name === 'canonical'
      ? linkTags.filter((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical').length
      : metaTags.filter(
          (t) =>
            (attr(t, 'name') ?? '').toLowerCase() === name ||
            (attr(t, 'property') ?? '').toLowerCase() === name
        ).length;
    if (found !== 1) fail(label, `expected exactly one ${name}, found ${found}`);
  };

  expectOne('description');
  expectOne('robots');
  expectOne('canonical');
  expectOne('og:title');
  expectOne('og:description');
  expectOne('og:type');
  expectOne('og:image');
  expectOne('og:url');
  expectOne('twitter:card');

  const titleTagCount = countOccurrences(html, '<title');
  if (titleTagCount !== 1) fail(label, `expected exactly one <title>, found ${titleTagCount}`);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? '';
  if (!title) fail(label, 'empty <title>');

  const propOf = (property: string): string | undefined => {
    const tag = metaTags.find((t) => (attr(t, 'property') ?? '').toLowerCase() === property);
    return tag ? attr(tag, 'content') : undefined;
  };

  const canonicalTag = linkTags.find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : undefined;

  // Cross-field invariants.
  const ogImage = propOf('og:image');
  if (ogImage !== site.ogImage.src) fail(label, `og:image "${ogImage ?? ''}" !== site.ogImage.src "${site.ogImage.src}"`);
  if (!isProdOriginUrl(canonical ?? '')) fail(label, `canonical "${canonical ?? ''}" is not absolute on the prod origin (${SITE_URL})`);
  if ((canonical ?? '').includes('localhost')) fail(label, 'canonical points at localhost');

  const ogTitle = propOf('og:title');
  if (title !== ogTitle) fail(label, `title "${title}" !== og:title "${ogTitle ?? ''}"`);

  // JSON-LD: parses as JSON and exposes an absolute same-origin url.
  const ldMatch = head.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!ldMatch) {
    fail(label, 'no application/ld+json script found');
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(ldMatch[1].trim());
    } catch {
      fail(label, 'application/ld+json does not parse as JSON');
    }
    const url = (parsed as { url?: unknown })?.url;
    if (typeof url !== 'string' || !isProdOriginUrl(url)) {
      fail(label, `JSON-LD url "${String(url)}" is not an absolute same-origin URL`);
    }
  }

  // Per-slug title distinctness (parameterized pages only).
  const isSlugRoute = route.includes('/');
  if (isSlugRoute && title) {
    const prior = seenTitles.get(title);
    if (prior !== undefined) {
      fail(label, `duplicate <title> shared with ${prior}`);
      fail(prior, `duplicate <title> shared with ${label}`);
    } else {
      seenTitles.set(title, label);
    }
  }
}

/**
 * Recursively list every file under a directory (for the plain-text localhost sweep).
 */
function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

// ── 1. Expected route set is derived from content, never hardcoded. ──
const serviceRoutes = services.map((s) => `servicios/${s.slug}`);
const projectRoutes = projects.map((p) => `proyectos/${p.slug}`);
const expectedRoutes = [...STATIC_PATHS, ...serviceRoutes, ...projectRoutes];

// ── 2. Every expected route must have prerendered HTML in dist/browser. ──
if (!existsSync(DIST_ROOT)) {
  fail('dist', `browser output root missing: ${DIST_ROOT}`);
} else {
  for (const route of expectedRoutes) {
    const file = join(DIST_ROOT, route === '' ? 'index.html' : join(route, 'index.html'));
    const label = route === '' ? 'home' : route;
    if (!existsSync(file)) {
      fail(label, `prerendered HTML missing at ${relative(REPO_ROOT, file)}`);
      continue;
    }
    checkHead(route, readFileSync(file, 'utf8'));
  }

  // ── 3. CSR fallback exists with a non-empty og:image. ──
  const csrFile = join(DIST_ROOT, 'index.csr.html');
  if (!existsSync(csrFile)) {
    fail('index.csr.html', 'CSR fallback missing');
  } else {
    const csrHtml = readFileSync(csrFile, 'utf8');
    const csrOgImage = csrHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1];
    if (!csrOgImage) fail('index.csr.html', 'og:image missing or empty in CSR fallback');
  }
}

// ── 4. No localhost anywhere under dist/ (plain-text sweep). ──
const distDir = join('dist');
if (existsSync(distDir)) {
  for (const file of walkFiles(distDir)) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue; // binary asset — not plain text
    }
    if (text.includes('localhost')) {
      fail(relative(REPO_ROOT, file), 'contains "localhost"');
    }
  }
} else {
  fail('dist', 'dist/ directory missing for localhost sweep');
}

// ── 5. File inventory (Req 5): no root server.ts, @angular/ssr the only SSR dep. ──
if (existsSync(join(REPO_ROOT, 'server.ts'))) {
  fail('server.ts', 'root server runtime artifact present');
}
const packageJson = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const ssrDeps = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).filter((name) =>
  /ssr|nguniversal|express/i.test(name)
);
if (ssrDeps.join(',') !== '@angular/ssr') {
  fail('package.json', `expected @angular/ssr as the only SSR-related dep, found: ${ssrDeps.join(', ') || 'none'}`);
}

// ── Report. ──
if (failures.length > 0) {
  console.error(`verify-prerender: ${failures.length} assertion(s) failed\n`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(
  `PASS · routes verified: ${expectedRoutes.length} (${STATIC_PATHS.length} static + ${serviceRoutes.length} services + ${projectRoutes.length} projects) · heads checked: ${headsChecked} · CSR fallback ok · no localhost · server.ts absent · @angular/ssr only SSR dep`
);
process.exit(0);