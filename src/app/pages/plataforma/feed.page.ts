import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Platform feed (S3 wires the real timeline). This slice ships the shell route only:
 * no data, no HTTP, one `<h1>` so the release matrix holds.
 */
@Component({
  selector: 'app-platform-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Novedades</h1>
      <p class="mt-3 text-ink-600">
        Modo demo: acá va a vivir el feed de obras y novedades de la plataforma.
      </p>
    </section>
  `
})
export class PlatformFeedPage {}
