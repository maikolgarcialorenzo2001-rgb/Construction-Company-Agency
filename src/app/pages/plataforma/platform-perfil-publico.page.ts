import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEsDate } from '../../core/format';
import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
import type { ProfileView } from '../../core/platform/domain';
import { profileViewFor } from '../../core/platform/mocks/profile-views';
import { roleLabel } from '../../core/platform/preview/preview-fixtures';

/** Profile lifecycle: loading → ready | not-found (unknown ids never throw). */
type ProfileStatus = 'loading' | 'ready' | 'not-found';

/**
 * The public profile at `/plataforma/perfil/:id` (p17, design D5): a read-only
 * showcase of a seeded worker or company, reachable WITHOUT a session.
 *
 * The id is bound from the `:id` route param by `withComponentInputBinding` and
 * resolved through `ProfilesGateway`: `worker(id)` first, then `company(id)` —
 * the two calls are exact (each returns `null` for the other side's ids), so no
 * new gateway method and no contract change are needed (D6).
 *
 * The template never sees a raw `WorkerProfile`/`CompanyProfile`: it reads the
 * demo-only `ProfileView` built by `profileViewFor`, which merges the frozen
 * contract profile with the seeded display extras (initials, color, sector,
 * verified flag, WhatsApp, follower/following counts).
 *
 * Zoneless: the resolution writes its own signals through `.set()`, so the view
 * paints without a `detectChanges()` call in the component.
 */
@Component({
  selector: 'app-platform-perfil-publico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './platform-perfil-publico.page.html'
})
export class PlatformPerfilPublicoPage {
  private readonly profiles = inject(PROFILES_GATEWAY);

  /** Bound from the `:id` route param by `withComponentInputBinding`. */
  readonly id = input<string>('');

  /** The resolution lifecycle of the profile. */
  protected readonly status = signal<ProfileStatus>('loading');

  /** The resolved demo view-model; `null` until the resolution settles. */
  protected readonly profile = signal<ProfileView | null>(null);

  /** The es-AR role label ("Trabajador" / "Empresa"). */
  protected readonly roleLabel = roleLabel;

  /** The es-AR long date ("15 de septiembre de 2026"). */
  protected readonly formatEsDate = formatEsDate;

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) {
        return;
      }
      // The resolution writes this page's own signals; tracking them here would
      // let a write re-trigger the effect, so the call runs untracked (the
      // `PlatformHomePage` precedent).
      untracked(() => void this.resolveProfile(id));
    });
  }

  private async resolveProfile(id: string): Promise<void> {
    this.status.set('loading');
    this.profile.set(null);

    const worker = await this.profiles.worker(id);
    const profile = worker ?? (await this.profiles.company(id));

    this.profile.set(profile ? profileViewFor(profile) : null);
    this.status.set(profile ? 'ready' : 'not-found');
  }
}
