import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../../core/platform/auth/session.service';
import type { Role } from '../../../core/platform/domain';
import { platformNavFor } from '../../../core/platform/nav';

/**
 * The platform chrome. It is the platform's own header landmark with its own
 * navigation, plus a visible "Modo demo" pill that keeps the mock data honest. The
 * marketing `app-header` is NOT rendered on platform routes.
 *
 * The nav is role-aware: the effective role is the explicit `role` input (a
 * preview/test seam) or, when absent, the live `SessionService` role. Anonymous
 * visitors map to an empty set, so the `<nav>` landmark is not rendered at all.
 */
@Component({
  selector: 'app-platform-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-ink-900/10 bg-ink-900 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a routerLink="/" class="text-lg font-semibold tracking-tight">Constructora Ejemplo</a>

        @if (nav().length) {
          <nav aria-label="Navegación de la plataforma">
            <ul class="flex items-center gap-6">
              @for (item of nav(); track item.slug) {
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
        }

        <span
          class="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          >Modo demo</span
        >
      </div>
    </header>
  `
})
export class PlatformHeaderComponent {
  private readonly session = inject(SessionService);

  /** Authenticated role; `null` is an anonymous visitor. */
  readonly role = input<Role | null>(null);

  /** The session role, unless the explicit input overrides it (test/preview). */
  protected readonly effectiveRole = computed(() => this.role() ?? this.session.role());

  /** Role-aware destinations. Empty for anonymous → the `<nav>` is gated out. */
  protected readonly nav = computed(() => platformNavFor(this.effectiveRole()));
}
