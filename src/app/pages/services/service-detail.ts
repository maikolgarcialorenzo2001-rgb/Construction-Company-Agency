import { Component, input } from '@angular/core';

/** Placeholder page: replaced by S5 (resolves `:slug` into a `Service`). */
@Component({
  selector: 'app-service-detail',
  template: `
    <section class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Servicio</h1>
      <p class="mt-4 text-ink-600">Contenido en preparación.</p>
    </section>
  `
})
export class ServiceDetail {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();
}
