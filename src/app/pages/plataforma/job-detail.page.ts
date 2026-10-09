import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Platform job detail (S4 resolves the opening and the apply flow). Shell route only:
 * the `:id` binding is declared so `withComponentInputBinding` has a target.
 */
@Component({
  selector: 'app-platform-job-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Detalle del trabajo</h1>
      <p class="mt-3 text-ink-600">
        Modo demo: acá va el detalle de la búsqueda y el formulario de postulación.
      </p>
    </section>
  `
})
export class PlatformJobDetailPage {
  /** Bound from the `:id` route param by `withComponentInputBinding`. */
  readonly id = input<string>('');
}
