import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';

/**
 * One row per reachable route: the perf/a11y contract the whole site must honour.
 * `priority` is the number of `fetchpriority="high"` images the route is allowed: the
 * single LCP image where a hero exists, none where the page has no above-the-fold photo.
 * `cta` says whether the shared CTA block closes the page; the quote page owns its own
 * form, so it is the only route that ends without one. Every other route closes with it,
 * the wildcard route included.
 */
interface RouteContract {
  readonly path: string;
  readonly priority: number;
  readonly cta: boolean;
}

const ROUTE_CONTRACTS: readonly RouteContract[] = [
  { path: '/', priority: 1, cta: true },
  { path: '/servicios', priority: 0, cta: true },
  { path: '/servicios/reformas-integrales', priority: 1, cta: true },
  { path: '/proyectos', priority: 0, cta: true },
  { path: '/proyectos/casa-timber-pilar', priority: 1, cta: true },
  { path: '/proceso', priority: 0, cta: true },
  { path: '/testimonios', priority: 0, cta: true },
  { path: '/nosotros', priority: 0, cta: true },
  { path: '/presupuesto', priority: 0, cta: false },
  { path: '/pagina-que-no-existe', priority: 0, cta: true }
];

describe('release matrix', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      // `withComponentInputBinding` is how a detail page receives its `:slug`, exactly
      // as the real app config does.
      providers: [provideRouter(routes, withComponentInputBinding())]
    });

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    router = TestBed.inject(Router);
  });

  /** Navigates the real shell (chrome + routed page) and flushes the render pass. */
  const goto = async (path: string): Promise<HTMLElement> => {
    await router.navigateByUrl(path);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const main = (element: HTMLElement): HTMLElement => {
    const node = element.querySelector('main');
    expect(node, 'the shell must render <main>').not.toBeNull();
    return node as HTMLElement;
  };

  it('starts the shell with the skip link, the first thing a keyboard user meets', async () => {
    for (const { path } of ROUTE_CONTRACTS) {
      const element = await goto(path);
      const first = element.firstElementChild;

      expect(first?.tagName.toLowerCase(), `${path} must start with the skip link`).toBe('a');
      expect(first?.classList.contains('skip-link'), `${path} skip link class`).toBe(true);
      expect(first?.getAttribute('href'), `${path} skip link target`).toBe('#main');
    }
  });

  it('gives every route exactly one h1, inside the routed content', async () => {
    for (const { path } of ROUTE_CONTRACTS) {
      const element = await goto(path);
      const headings = main(element).querySelectorAll('h1');

      expect(headings, `${path} h1 count`).toHaveLength(1);
      expect(headings[0].textContent?.trim(), `${path} h1 text`).toBeTruthy();
    }
  });

  it('promotes at most the single LCP image per route, never two', async () => {
    for (const { path, priority } of ROUTE_CONTRACTS) {
      const element = await goto(path);
      const promoted = main(element).querySelectorAll('img[fetchpriority="high"]');

      expect(promoted, `${path} priority images`).toHaveLength(priority);
    }
  });

  it('loads every non-priority image lazily', async () => {
    for (const { path } of ROUTE_CONTRACTS) {
      const element = await goto(path);
      const images = Array.from(main(element).querySelectorAll('img'));

      for (const image of images) {
        if (image.getAttribute('fetchpriority') === 'high') {
          continue;
        }
        expect(image.getAttribute('loading'), `${path} lazy image ${image.getAttribute('src')}`).toBe(
          'lazy'
        );
      }
    }
  });

  it('closes every page with the CTA block, except the pages that must not have one', async () => {
    for (const { path, cta } of ROUTE_CONTRACTS) {
      const element = await goto(path);
      const content = main(element);
      const block = content.querySelector('app-cta-block');

      if (!cta) {
        expect(block, `${path} must not carry a CTA block`).toBeNull();
        continue;
      }

      expect(block, `${path} must end with the CTA block`).not.toBeNull();
      const anchor = block as Element;

      // Nothing may follow the block in document order except its own descendants.
      const trailing = Array.from(content.querySelectorAll('*')).filter(
        (node) =>
          !anchor.contains(node) &&
          !!(anchor.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
      );

      expect(trailing, `${path} content after the CTA block`).toEqual([]);
    }
  });
});