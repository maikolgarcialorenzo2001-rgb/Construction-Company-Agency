import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Server-side providers: the shared `appConfig` (so initializers, SEO and hydration
 * run through the same code path on the server) plus static prerender routing. Merged
 * config is consumed by `main.server.ts` during `bunx ng build` — there is no server
 * runtime (Option B).
 */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))]
};

export const appConfigServer = mergeApplicationConfig(appConfig, serverConfig);
