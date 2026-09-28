export interface Environment {
  /** True when the bundle is built with optimizations and prod endpoints. */
  production: boolean;
  /** Base URL of the backend API, without a trailing slash. */
  apiUrl: string;
}
