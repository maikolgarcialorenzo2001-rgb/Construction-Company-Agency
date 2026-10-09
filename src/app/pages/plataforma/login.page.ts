import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Platform login (S5 adds the mock session). Shell route only: no HTTP, one `<h1>`.
 */
@Component({
  selector: 'app-platform-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Ingresar</h1>
      <p class="mt-3 text-ink-600">Modo demo: el acceso se habilita en la próxima etapa.</p>
    </section>
  `
})
export class PlatformLoginPage {}
