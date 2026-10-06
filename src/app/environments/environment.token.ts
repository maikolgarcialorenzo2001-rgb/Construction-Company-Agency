import { InjectionToken } from '@angular/core';
import { environment } from './environment';
import type { Environment } from './environment.model';

/**
 * Defaults to `environment.ts` so a consumer (a component spec, a lazy route) can
 * inject it without repeating the provider; `app.config.ts` overrides the default with
 * the build's own environment.
 */
export const ENVIRONMENT = new InjectionToken<Environment>('ENVIRONMENT', {
  providedIn: 'root',
  factory: () => environment
});