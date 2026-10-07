import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

import { projects } from '../content/projects';
import { services } from '../content/services';
import { routes } from './app.routes';
import { prerenderStaticPaths, slugParams } from './app.server-routes.shared';

/**
 * Build-time prerender table for `outputMode: "static"` (Option B, no Node runtime).
 *
 * - Static entries are DERIVED from the browser route table (`app.routes.ts`) via
 *   `prerenderStaticPaths`, so a new page is prerendered the moment it lands there.
 * - Param entries enumerate `src/content` through `slugParams` — the count is never
 *   hardcoded (Req 1).
 * - `**` renders on the client only: it is never prerendered (Req 1) and it is what
 *   makes the build emit `index.csr.html`, the shell static hosts serve for unknown
 *   paths (Req 4).
 * - Param routes pin `fallback: PrerenderFallback.Client` because the default
 *   (`Server`) needs a runtime that a static deployment does not have (R5).
 */
const staticPrerenderRoutes: ServerRoute[] = prerenderStaticPaths(
  routes.map((route) => route.path as string)
).map((path) => ({ path, renderMode: RenderMode.Prerender }));

export const serverRoutes: ServerRoute[] = [
  ...staticPrerenderRoutes,
  {
    path: 'servicios/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: () => Promise.resolve(slugParams(services))
  },
  {
    path: 'proyectos/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: () => Promise.resolve(slugParams(projects))
  },
  { path: '**', renderMode: RenderMode.Client }
];
