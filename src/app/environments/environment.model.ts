export interface Environment {
  /** True when the bundle is built with optimizations and prod endpoints. */
  production: boolean;
  /** Base URL of the backend API, without a trailing slash. */
  apiUrl: string;
  /**
   * GA4 measurement id (`G-XXXXXXXXXX`). Empty means "no property yet": analytics
   * treats it as absent and stays completely silent until the client fills it in.
   */
  gaMeasurementId: string;
  /** Absolute site origin (e.g. https://example.com). Empty in development. */
  siteUrl: string;
}
