import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';

import {
  CompanyComposerComponent,
  type CompanyPostDraft
} from '../../components/company-composer/company-composer.component';
import {
  JobRequestComposerComponent,
  type JobRequestDraft
} from '../../components/job-request-composer/job-request-composer.component';
import { PostJobRequestComponent } from '../../components/post-job-request/post-job-request.component';
import { PostVacancyComponent } from '../../components/post-vacancy/post-vacancy.component';
import { resolveVacancyOpenings } from '../../components/post-vacancy/vacancy-openings';
import { PostTemplateComponent } from '../../components/post-template/post-template.component';
import { SessionService } from '../../core/platform/auth/session.service';
import type { JobOpening, Role } from '../../core/platform/domain';
import { COMPANY_PROFILE } from '../../core/platform/mocks/fixtures';
import { toPostView, isRenderablePostView } from '../../core/platform/mocks/post-views';
import { CommentsStore } from '../../core/platform/store/comments.store';
import { EngagementStore } from '../../core/platform/store/engagement.store';
import { FeedStore } from '../../core/platform/store/feed.store';
import { JobsStore } from '../../core/platform/store/jobs.store';

/**
 * Platform feed page. It renders the timeline from `FeedStore` — signals only,
 * zoneless: the page never calls `ApplicationRef`/`detectChanges` on itself;
 * every state change arrives through a `.set()` in the store.
 *
 * Each post renders through the shared `PostTemplateComponent` fed by the
 * demo-only view-model (design D2/D4): `views = computed(map(toPostView))`
 * denormalizes the author, so the template never sees a raw `authorId`, and the
 * session's user id flows in as `viewerId` for the engagement controls.
 *
 * Each post carries an inline comment thread from the per-post `CommentsStore`
 * (design D7 — the thread stays page-side in the `li`, leaving `[postExtra]`
 * free for the kind projection): the view reads `comments.state()[view.id]`
 * directly — never a per-post `computed` inside the `@for`. An `effect` calls
 * the guarded `load(postId)` once per rendered post, and the constructor
 * triggers the guarded one-shot `EngagementStore.load()`.
 *
 * The structured job-request card (p15 WU2, design D8) is projected into the
 * template's always-present `[postExtra]` slot only when
 * `kind === 'job-request' && jobRequest`; free text stays in `[postBody]`, so
 * the shell (`PostTemplateComponent`) is never edited for a new kind.
 *
 * The vacancy promo card (p16 WU3, design D5/D6) follows the same projection
 * rule: `kind === 'vacancy'` resolves its reference-only `jobIds` against
 * `JobsStore.openings()` — hydrated once by an idle-guarded effect, since the
 * store's own `load()` is unguarded — and the card hides entirely when nothing
 * resolves, so the timeline never paints an empty card or a hydration flash.
 *
 * The post composer is role-differentiated (p15 WU3, design D4/D5): `worker`
 * gets the reactive `JobRequestComposerComponent` (Q1=a composite rule),
 * `company` gets the extracted `CompanyComposerComponent` (p16 WU4b) with its
 * two exclusive modes — a plain post or a vacancy promo — and `admin`/anonymous
 * see no composer at all. The per-post comment composer is gated to any
 * authenticated role (`effectiveRole() !== null`), so a worker or admin can
 * comment while an anonymous visitor sees neither control.
 */
@Component({
  selector: 'app-platform-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PostTemplateComponent,
    PostJobRequestComponent,
    PostVacancyComponent,
    JobRequestComposerComponent,
    CompanyComposerComponent
  ],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Novedades</h1>

      @if (effectiveRole() === 'worker') {
        <app-job-request-composer (publish)="publishJobRequest($event)" />
      }

      @if (effectiveRole() === 'company') {
        <app-company-composer
          [openings]="jobs.openings()"
          [authorId]="companyAuthorId()"
          (publish)="publishCompany($event)"
        />
      }

      @switch (store.status()) {
        @case ('loading') {
          <p class="mt-6 text-ink-600">Cargando novedades…</p>
        }
        @case ('empty') {
          <p class="mt-6 text-ink-600">No hay novedades todavía.</p>
        }
        @case ('ready') {
          <ul class="mt-6 space-y-4">
            @for (view of views(); track view.id) {
              <li data-testid="feed-post">
                <app-post-template [post]="view" [viewerId]="viewerId()">
                  @if (view.kind === 'job-request' && view.jobRequest; as jobRequest) {
                    <app-post-job-request postExtra [payload]="jobRequest" />
                  }
                  @if (view.kind === 'vacancy' && vacancyOpeningsById().get(view.id); as openings) {
                    <app-post-vacancy postExtra [openings]="openings" />
                  }
                </app-post-template>

                <div class="mt-3 rounded-xl border border-ink-900/10 p-4">
                  <p class="text-sm font-medium text-ink-900">Comentarios</p>

                  @let thread = comments.state()[view.id];

                  <ul
                    data-testid="comment-thread"
                    aria-live="polite"
                    class="mt-2 space-y-2"
                  >
                    @if (thread?.status === 'loading') {
                      <li data-testid="comment-loading" class="text-sm text-ink-600">
                        Cargando comentarios…
                      </li>
                    } @else if (!thread || thread.status === 'empty' || !thread.comments.length) {
                      <li data-testid="comment-empty" class="text-sm text-ink-600">
                        Todavía no hay comentarios.
                      </li>
                    } @else {
                      @for (comment of thread.comments; track comment.id) {
                        <li data-testid="comment" class="rounded-lg bg-ink-900/5 p-2">
                          <p class="text-sm text-ink-900">{{ comment.body }}</p>
                          <p class="mt-1 text-xs text-ink-600">{{ comment.authorName }}</p>
                        </li>
                      }
                    }
                  </ul>

                  @if (effectiveRole() !== null) {
                    <form
                      data-testid="comment-composer"
                      class="mt-3"
                      (submit)="postComment($event, view.id)"
                    >
                      <label
                        [attr.for]="'comment-content-' + view.id"
                        class="block text-sm font-medium text-ink-900"
                        >Escribir un comentario</label
                      >
                      <textarea
                        [attr.id]="'comment-content-' + view.id"
                        name="body"
                        rows="2"
                        required
                        placeholder="Sumá tu comentario…"
                        class="mt-2 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                      ></textarea>
                      <button
                        data-testid="comment-submit"
                        type="submit"
                        class="mt-2 rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
                      >
                        Comentar
                      </button>
                    </form>
                  }
                </div>
              </li>
            }
          </ul>
        }
      }
    </section>
  `
})
export class PlatformFeedPage {
  protected readonly store = inject(FeedStore);
  protected readonly comments = inject(CommentsStore);
  protected readonly engagement = inject(EngagementStore);
  protected readonly jobs = inject(JobsStore);
  private readonly session = inject(SessionService);

  /** Authenticated role; `null` is an anonymous visitor. */
  readonly role = input<Role | null>(null);

  /** The session role, unless the explicit input overrides it (test/preview). */
  protected readonly effectiveRole = computed(() => this.role() ?? this.session.role());

  /** The engaged viewer: the session user id, or `null` when anonymous. */
  protected readonly viewerId = computed(() => this.session.currentUser()?.userId ?? null);

  /**
   * The author the company composer publishes under (design D3): the SESSION
   * user owns the post — never a hardcoded id. The demo company is only the
   * fallback for a session-less preview, so the picker scope and the created
   * post always agree on the same author.
   */
  protected readonly companyAuthorId = computed(
    () => this.session.currentUser()?.userId ?? COMPANY_PROFILE.companyId
  );

  /**
   * Denormalized view-models (design D2): the template never sees a raw
   * `authorId`. The list is filtered by the never-empty invariant (WU5) so a
   * post with neither text nor image can never paint an empty card.
   */
  protected readonly views = computed(() =>
    this.store.posts()
      .map(toPostView)
      .filter(isRenderablePostView)
  );

  /**
   * `postId → resolved openings` for every vacancy view (p16 D5/D6): the
   * reference-only `jobIds` are resolved here against the live `JobsStore`
   * openings, payload order preserved, missing ids skipped (pure
   * `resolveVacancyOpenings`). Views whose resolution comes back empty never
   * enter the map, so the template hides the card entirely — no empty card,
   * no hydration flash. The map recomputes for free when the openings arrive.
   */
  protected readonly vacancyOpeningsById = computed(() => {
    const openings = this.jobs.openings();
    const byId = new Map<string, JobOpening[]>();
    for (const view of this.views()) {
      if (view.kind === 'vacancy' && view.vacancy) {
        const resolved = resolveVacancyOpenings(view.vacancy, openings);
        if (resolved.length > 0) {
          byId.set(view.id, resolved);
        }
      }
    }
    return byId;
  });

  constructor() {
    void this.store.load();
    // Guarded one-shot engagement hydration (design: "page ctor → store.load()").
    void this.engagement.load();
    // One-shot guarded jobs hydration (p16 D5): `JobsStore.load()` is UNGUARDED
    // (the jobs board page owns its own load), so the feed fires it only while
    // the list is `idle` AND a vacancy view needs openings — a single load for
    // N vacancy posts. `load()` flips `list` to `loading` synchronously before
    // its first await, so any later effect run (new vacancy post arriving)
    // sees a non-idle status and never double-loads. `listStatus` is read
    // untracked for the same reason the comment loop is: `load` writes the
    // list signal, and tracking it would let the load write re-trigger this
    // effect and spin.
    effect(() => {
      const hasVacancy = this.views().some((view) => view.kind === 'vacancy');
      // WU4b: the company composer picker needs the openings even when the
      // timeline carries no vacancy post yet — a company session always hydrates.
      const needsPicker = this.effectiveRole() === 'company';
      untracked(() => {
        if ((hasVacancy || needsPicker) && this.jobs.listStatus() === 'idle') {
          void this.jobs.load();
        }
      });
    });
    // Load each thread once posts arrive. The loop deliberately tracks only
    // `store.posts()`: `comments.load` reads and writes `comments.state`, so
    // running it inside `untracked` keeps those reads out of this effect's
    // dependencies — otherwise the `load` write would re-trigger the effect and
    // spin (an `empty` thread is intentionally retryable, so the store guard
    // alone cannot break the cycle). `load` stays guarded against loading/ready.
    effect(() => {
      const posts = this.store.posts();
      untracked(() => {
        for (const post of posts) {
          void this.comments.load(post.id);
        }
      });
    });
  }

  /**
   * Company path (p16 WU4b, design D4/D8): the extracted composer owns the
   * validation and the mode, so the draft arrives already valid — the page
   * only maps it to the feed store. `jobIds.length > 0` means the company
   * promoted specific vacancies (a `vacancy` post carrying the picked job
   * ids); an empty list means a plain `standard` post with NO vacancy payload.
   */
  protected async publishCompany(draft: CompanyPostDraft): Promise<void> {
    const authorId = this.companyAuthorId();
    if (draft.jobIds.length > 0) {
      await this.store.create({
        authorId,
        kind: 'vacancy',
        content: draft.content,
        attachments: draft.attachments.length > 0 ? draft.attachments : undefined,
        vacancy: { jobIds: draft.jobIds }
      });
      return;
    }
    await this.store.create({
      authorId,
      kind: 'standard',
      content: draft.content,
      attachments: draft.attachments.length > 0 ? draft.attachments : undefined
    });
  }

  /**
   * Worker path (design D5/D6): the composer enforces the Q1=a composite rule
   * before emitting, so the draft already holds a valid payload plus text or
   * photos. The session worker authors the post; the demo fallback is the
   * seeded worker (the company path falls back to the seeded company).
   */
  protected async publishJobRequest(draft: JobRequestDraft): Promise<void> {
    const authorId = this.session.currentUser()?.userId ?? 'worker-1';
    await this.store.create({
      authorId,
      kind: 'job-request',
      content: draft.content,
      attachments: draft.attachments.length > 0 ? draft.attachments : undefined,
      jobRequest: draft.payload
    });
  }

  protected async postComment(event: Event, postId: string): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const body = textarea.value.trim();
    if (!body) {
      return;
    }
    await this.comments.add(postId, body);
    // Same uncontrolled-field reason as `publish`: reset the element, not a signal.
    form.reset();
  }
}
