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

import { PostVacancyComponent } from '../../components/post-vacancy/post-vacancy.component';
import { formatEsDate } from '../../core/format';
import { buildTelHref, toWaDigits } from '../../core/lead/lead-links';
import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
import { SessionService } from '../../core/platform/auth/session.service';
import type { PostView, ProfileView } from '../../core/platform/domain';
import { isRenderablePostView, toPostView } from '../../core/platform/mocks/post-views';
import { profileViewFor, sectorLabel, verifiedLabel } from '../../core/platform/mocks/profile-views';
import { roleLabel } from '../../core/platform/preview/preview-fixtures';
import { EngagementStore } from '../../core/platform/store/engagement.store';
import { FeedStore } from '../../core/platform/store/feed.store';
import { JobsStore } from '../../core/platform/store/jobs.store';

/** Profile lifecycle: loading → ready | not-found (unknown ids never throw). */
type ProfileStatus = 'loading' | 'ready' | 'not-found';

/** The es-AR label of a publication kind: the badge of a grid tile. */
const KIND_LABELS: Record<PostView['kind'], string> = {
  'job-request': 'Búsqueda laboral',
  vacancy: 'Vacante',
  standard: 'Publicación'
};

/** How many characters of a publication the grid tile shows. */
const PREVIEW_LENGTH = 180;

/**
 * The excerpt of a publication: the leading text, cut at a word boundary so a
 * tile never ends mid-word. The text is flattened (the seeded posts carry
 * line breaks) and a truncated excerpt ends with an ellipsis.
 */
const excerpt = (content: string): string => {
  const text = content.trim().replace(/\s+/g, ' ');
  if (text.length <= PREVIEW_LENGTH) {
    return text;
  }

  const cut = text.slice(0, PREVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

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
 * verified flag, WhatsApp, follower/following counts). The badge copy follows
 * the role: a company is "Verificada" and states its "Rubro", a worker is
 * "Verificado" and states their "Oficio".
 *
 * Zoneless: the resolution writes its own signals through `.set()`, so the view
 * paints without a `detectChanges()` call in the component.
 */
@Component({
  selector: 'app-platform-perfil-publico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PostVacancyComponent],
  templateUrl: './platform-perfil-publico.page.html'
})
export class PlatformPerfilPublicoPage {
  private readonly profiles = inject(PROFILES_GATEWAY);
  private readonly feed = inject(FeedStore);
  private readonly jobs = inject(JobsStore);
  private readonly session = inject(SessionService);
  private readonly engagement = inject(EngagementStore);

  /** Bound from the `:id` route param by `withComponentInputBinding`. */
  readonly id = input<string>('');

  /** The resolution lifecycle of the profile. */
  protected readonly status = signal<ProfileStatus>('loading');

  /** The resolved demo view-model; `null` until the resolution settles. */
  protected readonly profile = signal<ProfileView | null>(null);

  /** The es-AR role label ("Trabajador" / "Empresa"). */
  protected readonly roleLabel = roleLabel;

  /** The es-AR label of the verified badge ("Verificada" / "Verificado"). */
  protected readonly verifiedLabel = verifiedLabel;

  /** The es-AR line that names the sector ("Rubro: …" / "Oficio: …"). */
  protected readonly sectorLabel = sectorLabel;

  /** The es-AR long date ("15 de septiembre de 2026"). */
  protected readonly formatEsDate = formatEsDate;

  /** The es-AR label of a publication kind. */
  protected readonly kindLabel = (kind: PostView['kind']): string => KIND_LABELS[kind];

  /** The excerpt of a publication, for a grid tile. */
  protected readonly excerpt = excerpt;

  /** The signed-in viewer, or `null` for an anonymous visitor. */
  protected readonly viewer = computed(() => this.session.currentUser());

  /** True when the viewer IS the profile: nobody follows themselves. */
  protected readonly isOwner = computed(() => this.viewer()?.userId === this.id());

  /** Whether the viewer already follows the profile. */
  protected readonly following = computed(() =>
    this.engagement.isFollowing(this.viewer()?.userId ?? null, this.id())
  );

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
   * The vacancies of the company, filtered client-side by `companyId`: the jobs
   * contract has no per-company query, so the board is filtered here (design D3).
   *
   * EVERY opening is listed, open or closed: the card renders the live status of
   * each one, so a closed vacancy is never hidden from the company profile.
   */
  protected readonly vacancies = computed(() =>
    this.jobs.openings().filter((opening) => opening.companyId === this.id())
  );

  /** How many publications the profile authored. */
  protected readonly publicationCount = computed(() => this.publications().length);

  /** How many vacancies the company has OPEN (the "Vacantes abiertas" stat). */
  protected readonly openVacanciesCount = computed(
    () => this.vacancies().filter((opening) => opening.status === 'open').length
  );

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
        // The persisted follow state decides the label of the follow button.
        void this.engagement.load();
      });
    });
  }

  /** Toggles the follow of the profile. An anonymous visitor never reaches it. */
  protected onFollow(): void {
    const viewerId = this.viewer()?.userId;
    if (viewerId) {
      void this.engagement.toggleFollow(viewerId, this.id());
    }
  }

  /**
   * Resolves the profile of an id: `worker(id)` first, then `company(id)`.
   *
   * The resolution is ASYNCHRONOUS and the id can change while it awaits, so
   * the result is dropped when the id moved on: a slow resolution must never
   * overwrite the profile of a newer id (the effect re-resolves on every change).
   */
  private async resolveProfile(id: string): Promise<void> {
    this.status.set('loading');
    this.profile.set(null);

    const worker = await this.profiles.worker(id);
    const profile = worker ?? (await this.profiles.company(id));

    // The id may have changed while this resolution awaited: a newer id owns the
    // page now, so the stale result is dropped instead of overwriting it.
    if (this.id() !== id) {
      return;
    }

    this.profile.set(profile ? profileViewFor(profile) : null);
    this.status.set(profile ? 'ready' : 'not-found');
  }
}
