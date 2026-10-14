import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

import { projects } from '../content/projects';
import { services } from '../content/services';
import { PLATFORM_PREFIX } from './core/platform/platform-paths';
import { previewRoleParams } from './core/platform/preview/preview-fixtures';
import { routes } from './app.routes';
import { prerenderStaticPaths, slugParams } from './app.server-routes.shared';

/**
 * Build-time prerender table for `outputMode: "static"` (Option B, no Node runtime).
 *
 * - Static entries are DERIVED from the browser route table (`app.routes.ts`) via
 *   `prerenderStaticPaths`, so a new page is prerendered the moment it lands there.
 * - The `plataforma` subtree is EXCLUDED by prefix (boundary-exact, so
 *   `plataformas-curso` survives) and resolved locally by an explicit
 *   `plataforma/**` Client entry: the build must emit no platform HTML.
 * - Param entries enumerate `src/content` through `slugParams` — the count is never
 *   hardcoded (Req 1). `previa/:role` mirrors the other param entries and enumerates the
 *   shared preview role list, so per-role preview HTML is emitted at build (Req 1, WU2).
 * - `**` renders on the client only: it is never prerendered (Req 1) and it is what
 *   makes the build emit `index.csr.html`, the shell static hosts serve for unknown
 *   paths (Req 4).
 * - Param routes pin `fallback: PrerenderFallback.Client` because the default
 *   (`Server`) needs a runtime that a static deployment does not have (R5).
 */
const staticPrerenderRoutes: ServerRoute[] = prerenderStaticPaths(
  routes.map((route) => route.path as string),
  [PLATFORM_PREFIX]
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
  {
    path: 'previa/:role',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: () => Promise.resolve([...previewRoleParams()])
  },
  { path: `${PLATFORM_PREFIX}/**`, renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client }
];
