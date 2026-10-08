import { DOCUMENT } from '@angular/common';
import { ENVIRONMENT } from '../../environments/environment.token';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { site } from '../../../content/site';
import { routes } from '../../app.routes';
import { buildJsonLd } from './json-ld';
import { SeoService, type SeoRouteData } from './seo.service';

/**
 * The document is rewritten at runtime, so every assertion reads the live head through
 * the same `DOCUMENT` token the service uses. The jsdom head survives TestBed resets,
 * hence the per-test cleanup.
 */

const routeSeo = (path: string): SeoRouteData => {
  const route = routes.find((candidate) => candidate.path === path);
  expect(route, `route "${path}" must exist`).toBeDefined();
  const seo = route?.data?.['seo'] as SeoRouteData | undefined;
  expect(seo, `route "${path}" must declare data.seo`).toBeDefined();
  return seo as SeoRouteData;
};

describe('SeoService', () => {
  let seo: SeoService;
  let doc: Document;
  let harness: RouterTestingHarness;

  const metaContent = (attribute: 'name' | 'property', key: string): string | null =>
    doc.querySelector(`meta[${attribute}="${key}"]`)?.getAttribute('content') ?? null;

  const canonicalHref = (): string | null =>
    doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

  /** Occurrence count of a head selector — guards Req 8 ("once each"). */
  const count = (selector: string): number => doc.querySelectorAll(selector).length;

  const jsonLdScripts = (): HTMLScriptElement[] =>
    Array.from(doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));

  const goto = async (url: string): Promise<void> => {
    await harness.navigateByUrl(url);
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: ENVIRONMENT,
          useValue: { production: false, siteUrl: "", apiUrl: "http://localhost:3000", gaMeasurementId: "" }
        }
      ]
    });

    seo = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);
    doc.head
      .querySelectorAll(
        'title, meta[name="description"], meta[name="robots"], meta[name="twitter:card"], ' +
          'meta[property^="og:"], link[rel="canonical"], script[type="application/ld+json"]'
      )
      .forEach((node) => node.remove());

    seo.start();
    harness = await RouterTestingHarness.create();
  });

  it('declares a distinct, non-empty title and description on every route', () => {
    const perRoute = routes.map((route) => route.data?.['seo'] as SeoRouteData | undefined);

    for (const seo of perRoute) {
      expect(seo, 'every route must declare data.seo').toBeDefined();
      expect(typeof seo?.title).toBe('string');
      expect(seo?.title?.trim().length).toBeGreaterThan(0);
      expect(typeof seo?.description).toBe('string');
      expect(seo?.description?.trim().length).toBeGreaterThan(0);
      expect(typeof seo?.indexable).toBe('boolean');
    }

    expect(new Set(perRoute.map((seo) => seo?.title)).size).toBe(routes.length);
  });

  it('applies the route-declared title, description and og tags on navigation', async () => {
    await goto('/');
    expect(doc.title).toBe(routeSeo('').title);
    expect(metaContent('name', 'description')).toBe(routeSeo('').description);
    expect(metaContent('property', 'og:title')).toBe(routeSeo('').title);
    expect(metaContent('property', 'og:description')).toBe(routeSeo('').description);

    const homeTitle = doc.title;

    await goto('/proceso');
    expect(doc.title).toBe(routeSeo('proceso').title);
    expect(metaContent('name', 'description')).toBe(routeSeo('proceso').description);
    expect(metaContent('property', 'og:title')).toBe(routeSeo('proceso').title);
    expect(metaContent('property', 'og:description')).toBe(routeSeo('proceso').description);
    expect(doc.title).not.toBe(homeTitle);
  });

  it('points the canonical link at the current url, navigation by navigation', async () => {
    await goto('/servicios');
    expect(canonicalHref()).toBe(new URL('/servicios', doc.location.origin).href);

    await goto('/nosotros');
    expect(canonicalHref()).toBe(new URL('/nosotros', doc.location.origin).href);
  });

  it('marks indexable routes index,follow and the wildcard route noindex,nofollow', async () => {
    await goto('/proceso');
    expect(metaContent('name', 'robots')).toBe('index,follow');

    await goto('/pagina-que-no-existe');
    expect(metaContent('name', 'robots')).toBe('noindex,nofollow');

    await goto('/presupuesto');
    expect(metaContent('name', 'robots')).toBe('index,follow');
  });

  it('keeps exactly one json-ld script across three navigations, rewritten in place', async () => {
    await goto('/servicios');
    expect(jsonLdScripts()).toHaveLength(1);
    const script = jsonLdScripts()[0];

    await goto('/pagina-que-no-existe');
    await goto('/presupuesto');

    expect(jsonLdScripts()).toHaveLength(1);
    expect(jsonLdScripts()[0], 'the script node must be rewritten, not re-created').toBe(script);

    const payload = JSON.parse(script.textContent ?? '') as unknown;
    expect(payload).toEqual(buildJsonLd(site, new URL('/presupuesto', doc.location.origin).href));
    expect((payload as Record<string, unknown>)['@type']).toContain('HomeAndConstructionBusiness');
  });

  it('lets a caller override the title and description for the current route', async () => {
    await goto('/nosotros');
    const title = 'Obra gris sin sorpresas | Constructora Ejemplo';
    const description = 'Cerramos el frente de obra por escrito antes de empezar.';

    seo.override({ title, description });

    expect(doc.title).toBe(title);
    expect(metaContent('name', 'description')).toBe(description);
    expect(metaContent('property', 'og:title')).toBe(title);
    expect(metaContent('property', 'og:description')).toBe(description);
    expect(jsonLdScripts()).toHaveLength(1);

    await goto('/proceso');
    expect(doc.title).toBe(routeSeo('proceso').title);
    expect(metaContent('name', 'description')).toBe(routeSeo('proceso').description);
  });

  it('writes og:image, og:url and twitter:card exactly once, rewritten per navigation', async () => {
    await goto('/');
    expect(count('meta[property="og:image"]')).toBe(1);
    expect(count('meta[property="og:url"]')).toBe(1);
    expect(count('meta[name="twitter:card"]')).toBe(1);
    expect(metaContent('property', 'og:image')).toBe(site.ogImage.src);
    expect(metaContent('property', 'og:url')).toBe(new URL('/', doc.location.origin).href);
    expect(metaContent('name', 'twitter:card')).toBe('summary_large_image');

    await goto('/servicios');
    expect(count('meta[property="og:image"]')).toBe(1);
    expect(count('meta[property="og:url"]')).toBe(1);
    expect(count('meta[name="twitter:card"]')).toBe(1);
    expect(metaContent('property', 'og:url')).toBe(new URL('/servicios', doc.location.origin).href);
    expect(metaContent('property', 'og:image')).toBe(site.ogImage.src);
  });

  it('keeps a single set of og/twitter tags when enriching a document that already ships the static ones', async () => {
    // Simulate hydration over the static head shipped by src/index.html.
    const seed = (attribute: 'name' | 'property', key: string, value: string): void => {
      const meta = doc.createElement('meta');
      meta.setAttribute(attribute, key);
      meta.setAttribute('content', value);
      doc.head.appendChild(meta);
    };
    seed('property', 'og:title', 'Obras, reformas y ampliaciones | Constructora Ejemplo');
    seed('property', 'og:image', 'https://images.example.com/og-cover.webp');
    seed('name', 'twitter:card', 'summary');

    await goto('/');
    await goto('/proceso');
    await goto('/servicios');

    expect(count('meta[property="og:title"]')).toBe(1);
    expect(count('meta[property="og:description"]')).toBe(1);
    expect(count('meta[property="og:image"]')).toBe(1);
    expect(count('meta[property="og:url"]')).toBe(1);
    expect(count('meta[name="twitter:card"]')).toBe(1);
    expect(count('link[rel="canonical"]')).toBe(1);

    // The seeded nodes are rewritten in place, not shadowed by new ones.
    expect(metaContent('property', 'og:image')).toBe(site.ogImage.src);
    expect(metaContent('name', 'twitter:card')).toBe('summary_large_image');
    expect(metaContent('property', 'og:url')).toBe(new URL('/servicios', doc.location.origin).href);
    expect(metaContent('property', 'og:title')).toBe(doc.title);
  });
});

describe('SeoService with a production SITE_URL', () => {
  const PRODUCTION_SITE_URL = 'https://constructora-ejemplo.com.ar';

  let doc: Document;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: ENVIRONMENT,
          useValue: {
            production: true,
            siteUrl: PRODUCTION_SITE_URL,
            apiUrl: 'https://api.example.com',
            gaMeasurementId: ''
          }
        }
      ]
    });

    TestBed.inject(SeoService).start();
    doc = TestBed.inject(DOCUMENT);
    doc.head
      .querySelectorAll(
        'title, meta[name="description"], meta[name="robots"], meta[name="twitter:card"], ' +
          'meta[property^="og:"], link[rel="canonical"], script[type="application/ld+json"]'
      )
      .forEach((node) => node.remove());

    harness = await RouterTestingHarness.create();
  });

  it('builds an absolute canonical and og:url on the SITE_URL origin, never on localhost', async () => {
    await harness.navigateByUrl('/servicios');

    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
    expect(canonical).toBe(`${PRODUCTION_SITE_URL}/servicios`);
    expect(canonical).not.toContain('localhost');

    const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '';
    expect(ogUrl).toBe(`${PRODUCTION_SITE_URL}/servicios`);
    expect(ogUrl).not.toContain('localhost');
  });
});
