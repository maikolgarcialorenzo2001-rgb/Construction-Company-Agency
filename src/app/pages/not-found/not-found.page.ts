import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';

/**
 * 404 page for unknown paths. Also rendered in place of a detail page whose slug
 * does not resolve, so it must stay importable as a component (`<app-not-found />`).
 *
 * It closes with the shared CTA block: a dead end still has to offer a way to quote.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, CtaBlockComponent],
  template: `
    <section class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">No encontramos esta página</h1>
      <p class="mt-4 text-ink-600">
        Puede que el enlace esté mal escrito o que la página ya no exista. Te dejo el inicio más
        abajo para que sigas navegando.
      </p>
      <a routerLink="/" class="btn-primary mt-8 inline-block">Ir al inicio</a>

      <app-cta-block class="mt-16 block" [heading]="ctaHeading" [body]="ctaBody" />
    </section>
  `
})
export class NotFoundPage {
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';
}
