import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Platform jobs board (S4 wires the openings and applications). Shell route only: no
 * data, no HTTP, one `<h1>`.
 */
@Component({
  selector: 'app-platform-jobs-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Trabajos</h1>
      <p class="mt-3 text-ink-600">
        Modo demo: acá vas a ver las búsquedas abiertas y postularte.
      </p>
    </section>
  `
})
export class PlatformJobsListPage {}
