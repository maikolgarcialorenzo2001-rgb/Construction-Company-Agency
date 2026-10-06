import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { AnalyticsService } from './core/analytics/analytics.service';
import { SeoService } from './core/seo/seo.service';
import { environment } from './environments/environment';
import { ENVIRONMENT } from './environments/environment.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
