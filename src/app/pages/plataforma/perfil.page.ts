import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Platform profile (S5 adds the guard and the profile round-trip). Shell route only:
 * no HTTP, one `<h1>`.
 */
@Component({
  selector: 'app-platform-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Mi perfil</h1>
      <p class="mt-3 text-ink-600">
        Modo demo: acá vas a poder completar tu perfil de trabajador o de empresa.
      </p>
    </section>
  `
})
export class PlatformPerfilPage {}
