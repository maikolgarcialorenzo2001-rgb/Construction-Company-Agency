import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';

/**
 * The shared user icon (design D8): ONE anchor that points at the signed-in
 * visitor's own public profile, or at the login when the host provides that
 * target for an anonymous visitor.
 *
 * The session awareness lives INSIDE the component, so neither host needs the
 * `SessionService`: the marketing header always passes an `anonymousHref` (the
 * anchor always exists → the prerendered node count never changes), while the
 * platform header passes none and renders NOTHING for an anonymous visitor
 * (the platform subtree is client-only, so there is no server DOM to match).
 *
 * The icon inherits the host's text color (`stroke="currentColor"`), so the
 * same component reads on the light marketing header and on the dark platform
 * chrome. The SVG is decorative: the accessible name lives on the anchor.
 */
@Component({
  selector: 'app-user-icon-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (href(); as target) {
      <a
        [routerLink]="target"
        [attr.aria-label]="label()"
        class="inline-flex items-center justify-center rounded-md p-1 transition hover:opacity-80"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
          />
        </svg>
      </a>
    }
  `
})
export class UserIconLinkComponent {
  /** Where an anonymous visitor goes; `null` renders no anchor at all. */
  readonly anonymousHref = input<string | null>(null);

  private readonly session = inject(SessionService);

  /** The signed-in user, or `null` for an anonymous visitor. */
  protected readonly user = computed(() => this.session.currentUser());

  /** The anchor target: the own profile when signed in, else the host's target. */
  protected readonly href = computed(() => {
    const user = this.user();
    return user ? `/plataforma/perfil/${user.userId}` : this.anonymousHref();
  });

  /** The accessible name of the anchor. */
  protected readonly label = computed(() => (this.user() ? 'Ver mi perfil' : 'Iniciar sesión'));
}
