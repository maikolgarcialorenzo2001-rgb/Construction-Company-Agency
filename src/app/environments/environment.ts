import type { Environment } from './environment.model';

/**
 * Default environment. Doubles as the production baseline so a build that forgets
 * the `production` fileReplacement still points at production endpoints.
 */
export const environment: Environment = {
  production: true,
  // PROVISIONAL: no backend exists yet. example.com is reserved by RFC 2606,
  // so it can never resolve to a real host by accident. Replace once an API is defined.
  apiUrl: 'https://api.example.com'
};
