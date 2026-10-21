import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatEsDate } from '../../core/format';
import { buildTelHref, toWaDigits } from '../../core/lead/lead-links';
import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
import type { ProfileView } from '../../core/platform/domain';
import { isRenderablePostView, toPostView } from '../../core/platform/mocks/post-views';
import { profileViewFor } from '../../core/platform/mocks/profile-views';
import { roleLabel } from '../../core/platform/preview/preview-fixtures';
import { FeedStore } from '../../core/platform/store/feed.store';
import { JobsStore } from '../../core/platform/store/jobs.store';

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
  private readonly feed = inject(FeedStore);
  private readonly jobs = inject(JobsStore);

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

  /**
   * The publications authored by the profile, projected with the shared feed
   * view-model (`toPostView` + `isRenderablePostView`, the `feed.page.ts`
   * projection) so the count and the grid can never drift apart.
   */
  protected readonly publications = computed(() =>
    this.feed
      .posts()
      .map(toPostView)
      .filter(isRenderablePostView)
      .filter((view) => view.authorId === this.id())
  );

  /**
   * The open vacancies of the company, filtered client-side by `companyId`:
   * the jobs contract has no per-company query, so the board is filtered here
   * (design D3).
   */
  protected readonly vacancies = computed(() =>
    this.jobs
      .openings()
      .filter((opening) => opening.companyId === this.id() && opening.status === 'open')
  );

  /** How many publications the profile authored. */
  protected readonly publicationCount = computed(() => this.publications().length);

  /** How many vacancies the company has open. */
  protected readonly openVacanciesCount = computed(() => this.vacancies().length);

  /** How many trades the worker lists. */
  protected readonly skillsCount = computed(() => this.profile()?.skills.length ?? 0);

  /** The bio heading: a company is described, a worker introduces themselves. */
  protected readonly bioHeading = computed(() =>
    this.profile()?.role === 'company' ? 'Sobre la empresa' : 'Sobre mí'
  );

  /** The `tel:` href of a phone number (plain anchor, not the site NAP link). */
  protected telHref(phone: string): string {
    return buildTelHref(toWaDigits(phone));
  }

  /** The `wa.me` deep link of a WhatsApp number (digits only). */
  protected whatsappHref(whatsapp: string): string {
    return `https://wa.me/${toWaDigits(whatsapp)}`;
  }

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) {
        return;
      }
      // The resolution writes this page's own signals; tracking them here would
      // let a write re-trigger the effect, so the call runs untracked (the
      // `PlatformHomePage` precedent).
      untracked(() => {
        void this.resolveProfile(id);
        // The publications and the vacancies live in the shared stores: the
        // same projections the feed and the jobs board read.
        void this.feed.load();
        void this.jobs.load();
      });
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
