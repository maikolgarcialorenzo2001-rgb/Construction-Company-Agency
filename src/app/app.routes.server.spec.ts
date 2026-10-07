import {
  PrerenderFallback,
  RenderMode,
  ServerRoute,
  ServerRoutePrerenderWithParams
} from '@angular/ssr';
import { describe, expect, it } from 'vitest';

import { projects } from '../content/projects';
import { services } from '../content/services';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

/** Every browser route path, in registration order. */
const BROWSER_PATHS = routes.map((route) => route.path as string);

/** Non-param, non-wildcard browser paths — the static prerender candidates. */
const STATIC_BROWSER_PATHS = BROWSER_PATHS.filter(
  (path) => path !== '**' && !path.includes(':')
);

/** Narrowing guard: only the prerender-with-params variant declares these members. */
const isPrerenderWithParams = (route: ServerRoute): route is ServerRoutePrerenderWithParams =>
  'getPrerenderParams' in route;

/** Expands a prerendered server route into the concrete paths it emits at build. */
const expandPrerenderPaths = async (route: ServerRoute): Promise<string[]> => {
  if (!route.path.includes(':')) {
    return [route.path];
  }

  expect(isPrerenderWithParams(route), `${route.path} must declare getPrerenderParams`).toBe(true);
  if (!isPrerenderWithParams(route)) {
    return [];
  }

  const params = await route.getPrerenderParams();
  return params.map((param) =>
    route.path.replace(/:(\w+)/g, (_match, name: string) => {
      expect(param[name], `${route.path} params must bind :${name}`).toBeTruthy();
      return param[name];
    })
  );
};

describe('app.routes.server', () => {
  const prerendered = (): ServerRoute[] =>
    serverRoutes.filter((route) => route.renderMode === RenderMode.Prerender);

  it('prerenders the full set derived from the route table and src/content (never a literal)', async () => {
    const expanded: string[] = [];
    for (const route of prerendered()) {
      expanded.push(...(await expandPrerenderPaths(route)));
    }

    // Content-derived expectation: static browser routes + services.length +
    // projects.length. A new slug in src/content changes this count with zero spec
    // edits (Req 1, Scenario: Enumeration guard).
    const expectedCount = STATIC_BROWSER_PATHS.length + services.length + projects.length;

    expect(expanded).toHaveLength(expectedCount);
    // Each public path is emitted exactly once — no overlapping route definitions.
    expect(new Set(expanded).size).toBe(expanded.length);
  });

  it('covers every non-param browser route exactly once', async () => {
    const expanded: string[] = [];
    for (const route of prerendered()) {
      expanded.push(...(await expandPrerenderPaths(route)));
    }

    for (const path of STATIC_BROWSER_PATHS) {
      expect(expanded, `${path} must be prerendered`).toContain(path);
    }
    expect(expanded).not.toContain('**');
  });

  it('never prerenders the wildcard: ** resolves to RenderMode.Client (Req 1, 4)', () => {
    const wildcard = serverRoutes.find((route) => route.path === '**');

    expect(wildcard).toBeDefined();
    expect(wildcard?.renderMode).toBe(RenderMode.Client);
    expect(prerendered().some((route) => route.path === '**')).toBe(false);
  });

  it('prerenders servicios/:slug over every service slug from src/content', async () => {
    const route = serverRoutes.find((candidate) => candidate.path === 'servicios/:slug');

    expect(route).toBeDefined();
    if (!route) {
      return;
    }

    expect(isPrerenderWithParams(route)).toBe(true);
    if (!isPrerenderWithParams(route)) {
      return;
    }

    expect(route.renderMode).toBe(RenderMode.Prerender);
    expect(route.fallback).toBe(PrerenderFallback.Client);

    const params = await route.getPrerenderParams();
    expect(params.map((param) => param['slug'])).toEqual(services.map((service) => service.slug));
  });

  it('prerenders proyectos/:slug over every project slug from src/content', async () => {
    const route = serverRoutes.find((candidate) => candidate.path === 'proyectos/:slug');

    expect(route).toBeDefined();
    if (!route) {
      return;
    }

    expect(isPrerenderWithParams(route)).toBe(true);
    if (!isPrerenderWithParams(route)) {
      return;
    }

    expect(route.renderMode).toBe(RenderMode.Prerender);
    expect(route.fallback).toBe(PrerenderFallback.Client);

    const params = await route.getPrerenderParams();
    expect(params.map((param) => param['slug'])).toEqual(projects.map((project) => project.slug));
  });

  it('uses PrerenderFallback.Client on every param route (R5: static host has no runtime)', () => {
    const paramRoutes = serverRoutes.filter((route) => route.path.includes(':'));

    expect(paramRoutes.length).toBeGreaterThan(0);
    for (const route of paramRoutes) {
      expect(isPrerenderWithParams(route), `${route.path} must be prerender-with-params`).toBe(
        true
      );
      if (isPrerenderWithParams(route)) {
        expect(route.fallback).toBe(PrerenderFallback.Client);
      }
    }
  });
});