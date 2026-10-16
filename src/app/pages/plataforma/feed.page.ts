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

import { PostJobRequestComponent } from '../../components/post-job-request/post-job-request.component';
import { PostTemplateComponent } from '../../components/post-template/post-template.component';
import { SessionService } from '../../core/platform/auth/session.service';
import type { Role } from '../../core/platform/domain';
import { toPostView, isRenderablePostView } from '../../core/platform/mocks/post-views';
import { CommentsStore } from '../../core/platform/store/comments.store';
import { EngagementStore } from '../../core/platform/store/engagement.store';
import { FeedStore } from '../../core/platform/store/feed.store';

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
 * The post composer is gated to `company`; the per-post comment composer is
 * gated to any authenticated role (`effectiveRole() !== null`), so a worker or
 * admin can comment while an anonymous visitor sees neither control.
 */
@Component({
  selector: 'app-platform-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostTemplateComponent, PostJobRequestComponent],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Novedades</h1>

      @if (effectiveRole() === 'company') {
        <form
          data-testid="feed-composer"
          class="mt-6 rounded-xl border border-ink-900/10 p-4"
          (submit)="publish($event)"
        >
          <label for="feed-post-content" class="block text-sm font-medium text-ink-900"
            >Publicar novedad</label
          >
          <textarea
            id="feed-post-content"
            rows="3"
            [value]="draft()"
            (input)="onDraftInput($event)"
            placeholder="Contá el avance de obra, una búsqueda de personal, etc."
            class="mt-2 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          ></textarea>
          <button
            data-testid="feed-publish"
            type="submit"
            class="mt-3 rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
          >
            Publicar
          </button>
        </form>
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
  private readonly session = inject(SessionService);

  /** Authenticated role; `null` is an anonymous visitor. */
  readonly role = input<Role | null>(null);

  /** The session role, unless the explicit input overrides it (test/preview). */
  protected readonly effectiveRole = computed(() => this.role() ?? this.session.role());

  /** The engaged viewer: the session user id, or `null` when anonymous. */
  protected readonly viewerId = computed(() => this.session.currentUser()?.userId ?? null);

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

  protected readonly draft = signal('');

  constructor() {
    void this.store.load();
    // Guarded one-shot engagement hydration (design: "page ctor → store.load()").
    void this.engagement.load();
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

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async publish(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const content = this.draft().trim();
    // The composer has no image field, so the never-empty invariant (WU5)
    // reduces here to a non-blank text gate: no text and no images is rejected.
    if (!content) {
      return;
    }
    // Author-aware create (design D3): the session user owns the post; the
    // company-gated composer falls back to the demo company when no session is
    // seeded (tests/preview). Role differentiation (worker form) is WU3.
    const authorId = this.session.currentUser()?.userId ?? 'company-1';
    await this.store.create({ authorId, kind: 'standard', content });
    this.draft.set('');
    // The textarea is an uncontrolled field typed by the user: clearing the
    // signal alone would not repaint it (Angular's tracked value never changed),
    // so reset the form element to leave the composer empty after publishing.
    form.reset();
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
