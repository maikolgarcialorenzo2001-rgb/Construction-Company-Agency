import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { AnalyticsService } from './core/analytics/analytics.service';
import { SeoService } from './core/seo/seo.service';
import { environment } from './environments/environment';
import { ENVIRONMENT } from './environments/environment.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Attaches to the prerendered DOM instead of re-rendering it, preserving the
    // per-route head through boot (Req 2). No HTTP is issued at platform bootstrap:
    // platform data comes from in-memory mock gateways, not the network. The HTTP
    // transfer cache stays enabled (provideClientHydration default) for any future
    // HTTP-backed page.
    provideClientHydration(),
    provideHttpClient(),
    provideRouter(
      routes,
      // Binds `:slug` route params straight to component input() signals.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    // Subscribes before the initial navigation completes, so the first head rewrite
    // is not missed.
    provideAppInitializer(() => inject(SeoService).start()),
    // Runs right after SEO: the tag installs only if a real GA4 id and consent are both
    // present, and the `page_view` listener needs the router subscription in place.
    provideAppInitializer(() => inject(AnalyticsService).init()),
    { provide: ENVIRONMENT, useValue: environment }
  ]
};
