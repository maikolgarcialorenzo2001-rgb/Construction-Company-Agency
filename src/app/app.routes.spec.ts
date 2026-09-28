import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

/** The es-AR route table, in registration order. `**` MUST stay last. */
const ROUTE_TABLE = [
  { path: '', kind: 'home' },
  { path: 'servicios', kind: 'list' },
  { path: 'servicios/:slug', kind: 'detail' },
  { path: 'proyectos', kind: 'list' },
  { path: 'proyectos/:slug', kind: 'detail' },
  { path: 'proceso', kind: 'static' },
  { path: 'testimonios', kind: 'static' },
  { path: 'nosotros', kind: 'static' },
  { path: 'presupuesto', kind: 'static' },
  { path: '**', kind: 'not-found' }
] as const;

const INDEXABLE_PATHS = ROUTE_TABLE.filter((r) => r.kind !== 'not-found').map((r) => r.path);

describe('app routes', () => {
  describe('route table', () => {
    it('registers exactly the ten declared top-level routes, wildcard last', () => {
      expect(routes.map((r) => r.path)).toEqual(ROUTE_TABLE.map((r) => r.path));
    });

    it('lazy loads every route component (no eager component references)', () => {
      const eager = routes.filter((r) => typeof r.component === 'function');
      expect(eager.map((r) => r.path)).toEqual([]);

      for (const route of routes) {
        expect(typeof route.loadComponent).toBe('function');
      }
    });

    it('marks every content route indexable and the wildcard route noindex', () => {
      for (const route of routes) {
        const seo = route.data?.['seo'] as { indexable?: boolean } | undefined;
        expect(seo).toBeDefined();

        if (route.path === '**') {
          expect(seo?.indexable).toBe(false);
        } else {
          expect(seo?.indexable).toBe(true);
        }
      }

      const noindex = routes.filter((r) => r.data?.['seo']?.indexable === false);
      expect(noindex.map((r) => r.path)).toEqual(['**']);
    });

    it('guards no route: navigation is reachable without auth or data resolvers', () => {
      for (const route of routes) {
        expect(route.canActivate).toBeUndefined();
        expect(route.canActivateChild).toBeUndefined();
        expect(route.resolve).toBeUndefined();
      }
    });

    it('binds the home route to a full path match', () => {
      const home = routes.find((r) => r.path === '');
      expect(home?.pathMatch).toBe('full');
    });
  });

  describe('navigation', () => {
    let harness: RouterTestingHarness;

    const goto = async (url: string): Promise<HTMLElement> => {
      await harness.navigateByUrl(url);
      // Zoneless: the outlet activates during the render pass, not on navigation alone.
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(
        harness.routeNativeElement,
        `the router outlet must be activated for ${url}`
      ).not.toBeNull();
      // The activated component is inserted as a sibling of <router-outlet>, so query
      // from the harness root element.
      return harness.fixture.nativeElement as HTMLElement;
    };

    beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      harness = await RouterTestingHarness.create();
    });

    it.each([
      ['/', 'app-home'],
      ['/servicios', 'app-services-list'],
      ['/servicios/reformas', 'app-service-detail'],
      ['/proyectos', 'app-projects-list'],
      ['/proyectos/casa-timber', 'app-project-detail'],
      ['/proceso', 'app-process'],
      ['/testimonios', 'app-testimonials'],
      ['/nosotros', 'app-about'],
      ['/presupuesto', 'app-quote']
    ])('resolves %s to its lazy page component', async (url, selector) => {
      const element = await goto(url);
      expect(element.querySelector(selector), `${url} must render ${selector}`).toBeTruthy();
    });

    it('renders exactly one h1 per page', async () => {
      for (const path of INDEXABLE_PATHS) {
        const element = await goto(path === '' ? '/' : `/${path.replace(':slug', 'reformas')}`);
        const headings = element.querySelectorAll('h1');
        expect(headings.length, `route ${path || '/'} must render one h1`).toBe(1);
        expect(headings[0].textContent?.trim().length).toBeGreaterThan(0);
      }
    });

    it('renders the 404 component for an unknown path', async () => {
      const element = await goto('/no-existe');

      expect(element.querySelector('app-not-found')).toBeTruthy();
      expect(element.querySelectorAll('h1').length).toBe(1);
    });

    it('leaves the router usable after a wildcard match', async () => {
      await goto('/no-existe');
      expect(TestBed.inject(Router).url).toBe('/no-existe');

      const element = await goto('/proceso');
      expect(element.querySelector('app-process')).toBeTruthy();
    });
  });
});
