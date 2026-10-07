import type { Environment } from './environment.model';

/**
 * Default environment. Doubles as the production baseline so a build that forgets
 * the `production` fileReplacement still points at production endpoints.
 */
export const environment: Environment = {
  production: true,
  // PROVISIONAL: no backend exists yet. example.com is reserved by RFC 2606,
  // so it can never resolve to a real host by accident. Replace once an API is defined.
  apiUrl: 'https://api.example.com',
  // PROVISIONAL: no GA4 property yet, so the analytics gate stays closed and gtag.js
  // is never loaded. Replace with the client's `G-XXXXXXXXXX` before launch.
  gaMeasurementId: '',
  // PROVISIONAL: replace with the real public origin once confirmed (no localhost in prod).
  siteUrl: 'https://constructora-ejemplo.com.ar'
};
