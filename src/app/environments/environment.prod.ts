import type { Environment } from './environment.model';

/**
 * Production variant. Swapped in for `environment.ts` by the `fileReplacements`
 * entry under the `production` build configuration.
 */
export const environment: Environment = {
  production: true,
  // PROVISIONAL: no backend exists yet. See environment.ts.
  apiUrl: 'https://api.example.com',
  // PROVISIONAL: no GA4 property yet. See environment.ts.
  gaMeasurementId: '',
  // PROVISIONAL: replace with the real public origin once confirmed (no localhost in prod).
  siteUrl: 'https://constructora-ejemplo.com.ar'
};
