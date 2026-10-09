import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { platformNav } from '../../../core/platform/nav';

/**
 * The platform chrome. It is the platform's own header landmark with its own
 * navigation, plus a visible "Modo demo" pill that keeps the mock data honest. The
 * marketing `app-header` is NOT rendered on platform routes.
 */
@Component({
  selector: 'app-platform-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-ink-900/10 bg-ink-900 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a routerLink="/" class="text-lg font-semibold tracking-tight">Constructora Ejemplo</a>

        <nav aria-label="Navegación de la plataforma">
          <ul class="flex items-center gap-6">
            @for (item of nav; track item.slug) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="text-brand-300"
                  [routerLinkActiveOptions]="{ exact: item.path === '/plataforma' }"
                  ariaCurrentWhenActive="page"
                  class="font-medium text-white/80 hover:text-white"
                  >{{ item.label }}</a
                >
              </li>
            }
          </ul>
        </nav>

        <span
          class="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          >Modo demo</span
        >
      </div>
    </header>
  `
})
export class PlatformHeaderComponent {
  protected readonly nav = platformNav;
}
