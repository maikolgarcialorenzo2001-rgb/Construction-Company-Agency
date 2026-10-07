import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { appConfigServer } from './app/app.config.server';

/**
 * Server bootstrap used exclusively at build time by `outputMode: "static"`: the
 * builder prerenders every `RenderMode.Prerender` route by booting the app with the
 * shared config merged over the server config. The `BootstrapContext` argument is
 * required — without it Angular falls back to the browser bootstrap and fails with
 * NG0401.
 */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, { ...appConfig, ...appConfigServer }, context);

export default bootstrap;
