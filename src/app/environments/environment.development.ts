import type { Environment } from './environment.model';

/**
 * Development variant. Swapped in for `environment.ts` by the `fileReplacements`
 * entry under the `development` build configuration, which is what `ng serve`
 * uses by default.
 */
export const environment: Environment = {
  production: false,
  // PROVISIONAL: no backend exists yet. Localhost is used so a dev build can never
  // resolve to a real host. Replace once an API is defined.
  apiUrl: 'http://localhost:3000',
  // Empty on purpose: a dev build must never talk to a real GA4 property.
  gaMeasurementId: '',
  siteUrl: ''
};
