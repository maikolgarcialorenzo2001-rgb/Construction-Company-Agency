import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

/** The marketing route table, in registration order. */
const MARKETING_ROUTE_TABLE = [
  { path: '', kind: 'home' },
  { path: 'servicios', kind: 'list' },
  { path: 'servicios/:slug', kind: 'detail' },
  { path: 'proyectos', kind: 'list' },
  { path: 'proyectos/:slug', kind: 'detail' },
  { path: 'proceso', kind: 'static' },
  { path: 'testimonios', kind: 'static' },
  { path: 'nosotros', kind: 'static' },
  { path: 'presupuesto', kind: 'static' }
] as const;

/** The six children of the single `plataforma` grouping route, in registration order. */
const PLATFORM_CHILD_PATHS = ['', 'trabajos', 'trabajos/:id', 'login', 'registro', 'perfil'] as const;

/** The es-AR route table, in registration order. `plataforma` sits before `**`. */
const ROUTE_TABLE = [
  ...MARKETING_ROUTE_TABLE,
  { path: 'plataforma', kind: 'platform' },
  { path: '**', kind: 'not-found' }
] as const;

const MARKETING_PATHS = MARKETING_ROUTE_TABLE.map((r) => r.path);

describe('app routes', () => {
  describe('route table', () => {
    it('registers exactly the declared top-level routes, plataforma before the wildcard', () => {
      expect(routes.map((r) => r.path)).toEqual(ROUTE_TABLE.map((r) => r.path));
    });

    it('lazy loads every leaf and groups the platform subtree into lazy children', () => {
      const eager = routes.filter((r) => typeof r.component === 'function');
      expect(eager.map((r) => r.path)).toEqual([]);

      for (const route of routes) {
        if (route.children) {
          for (const child of route.children) {
            expect(typeof child.loadComponent, `${route.path}/${child.path} must be lazy`).toBe(
              'function'
            );
          }
        } else {
          expect(typeof route.loadComponent, `${route.path} must be lazy`).toBe('function');
        }
      }
    });

    it('marks marketing routes indexable and the platform subtree plus wildcard noindex', () => {
      const marketing = routes.filter((r) => r.path !== 'plataforma' && r.path !== '**');
      for (const route of marketing) {
        expect(route.data?.['seo']?.indexable, `${route.path} must be indexable`).toBe(true);
      }

      const noindex = routes.filter((r) => r.data?.['seo']?.indexable === false);
      expect(noindex.map((r) => r.path)).toEqual(['plataforma', '**']);
    });

    it('registers the six platform children, each lazy and noindex', () => {
      const platform = routes.find((r) => r.path === 'plataforma');

      expect(platform, 'plataforma must be a top-level grouping route').toBeDefined();
      expect(platform?.children?.map((child) => child.path)).toEqual([...PLATFORM_CHILD_PATHS]);

      for (const child of platform?.children ?? []) {
        expect(child.data?.['seo']?.indexable, `${child.path} must be noindex`).toBe(false);
        expect(typeof child.loadComponent, `${child.path} must be lazy`).toBe('function');
      }
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
      ['/presupuesto', 'app-quote'],
      ['/plataforma', 'app-platform-feed'],
      ['/plataforma/trabajos', 'app-platform-jobs-list'],
      ['/plataforma/trabajos/7', 'app-platform-job-detail'],
      ['/plataforma/login', 'app-platform-login'],
      ['/plataforma/registro', 'app-platform-registro'],
      ['/plataforma/perfil', 'app-platform-perfil']
    ])('resolves %s to its lazy page component', async (url, selector) => {
      const element = await goto(url);
      expect(element.querySelector(selector), `${url} must render ${selector}`).toBeTruthy();
    });

    it('renders exactly one h1 per marketing page', async () => {
      for (const path of MARKETING_PATHS) {
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

    it('backtracks an unknown platform path to the 404 route, not a platform page', async () => {
      const element = await goto('/plataforma/desconocido');

      expect(element.querySelector('app-not-found')).toBeTruthy();
      expect(element.querySelector('app-platform-feed')).toBeNull();
    });

    it('leaves the router usable after a wildcard match', async () => {
      await goto('/no-existe');
      expect(TestBed.inject(Router).url).toBe('/no-existe');

      const element = await goto('/proceso');
      expect(element.querySelector('app-process')).toBeTruthy();
    });
  });
});
