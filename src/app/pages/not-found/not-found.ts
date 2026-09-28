import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 404 page for unknown paths. Also rendered in place of a detail page whose slug
 * does not resolve, so it must stay importable as a component (`<app-not-found />`).
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">No encontramos esta página</h1>
      <p class="mt-4 text-ink-600">
        Puede que el enlace esté mal escrito o que la página ya no exista. Te dejo el inicio más
        abajo para que sigas navegando.
      </p>
      <a routerLink="/" class="btn-primary mt-8 inline-block">Ir al inicio</a>
    </section>
  `
})
export class NotFound {}
