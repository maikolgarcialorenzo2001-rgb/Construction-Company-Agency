import { describe, expect, it } from 'vitest';

import { projects } from '../content/projects';
import { services } from '../content/services';
import { routes } from './app.routes';
import { prerenderStaticPaths, slugParams } from './app.server-routes.shared';

/** Every browser route path, in registration order. */
const BROWSER_PATHS = routes.map((route) => route.path as string);

describe('server route shared helpers', () => {
  describe('slugParams', () => {
    it('derives one { slug } param per entry from src/content/services', () => {
      expect(services.length).toBeGreaterThan(0);

      const params = slugParams(services);

      expect(params).toHaveLength(services.length);
      expect(params.map((param) => param['slug'])).toEqual(services.map((service) => service.slug));
    });

    it('derives one { slug } param per entry from src/content/projects', () => {
      expect(projects.length).toBeGreaterThan(0);

      const params = slugParams(projects);

      expect(params).toHaveLength(projects.length);
      expect(params.map((param) => param['slug'])).toEqual(projects.map((project) => project.slug));
    });

    it('maps any collection by its slug field (not a hardcoded content list)', () => {
      const params = slugParams([{ slug: 'obra-x' }, { slug: 'reforma-y' }]);

      expect(params).toEqual([{ slug: 'obra-x' }, { slug: 'reforma-y' }]);
    });
  });

  describe('prerenderStaticPaths', () => {
    it('keeps the non-param browser routes and drops the wildcard', () => {
      const paramPaths = BROWSER_PATHS.filter((path) => path.includes(':'));

      const staticPaths = prerenderStaticPaths(BROWSER_PATHS);

      // 7 static routes today, but never written as a literal: the count follows the
      // route table, so a new browser route passes without editing this spec.
      expect(staticPaths).toHaveLength(BROWSER_PATHS.length - paramPaths.length - 1);
      expect(staticPaths).toContain('');
      expect(staticPaths).toContain('servicios');
      expect(staticPaths).not.toContain('**');
      for (const path of staticPaths) {
        expect(path).not.toContain(':');
      }
    });

    it('filters any route list: params and wildcard out, plain paths kept', () => {
      expect(prerenderStaticPaths(['', 'a', 'a/:id', 'b/:slug/c', '**'])).toEqual(['', 'a']);
    });
  });
});
