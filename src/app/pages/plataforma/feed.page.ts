import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import type { Role } from '../../core/platform/domain';
import { FeedStore } from '../../core/platform/store/feed.store';

/**
 * Platform feed page. It renders the timeline from `FeedStore` — signals only,
 * zoneless: the page never calls `ApplicationRef`/`detectChanges` on itself;
 * every state change arrives through a `.set()` in the store.
 *
 * The composer is gated by `role` (S3 seam). S5 supplies the authenticated
 * session role; an anonymous visitor leaves it `null`, so no one can publish
 * without a company session.
 */
@Component({
  selector: 'app-platform-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Novedades</h1>

      @if (role() === 'company') {
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
            @for (post of store.posts(); track post.id) {
              <li data-testid="feed-post" class="rounded-xl border border-ink-900/10 p-4">
                <p class="text-ink-900">{{ post.content }}</p>
                <p class="mt-2 text-sm text-ink-600">{{ post.authorId }}</p>
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

  /** Authenticated role; `null` is an anonymous visitor (S5 wires the session). */
  readonly role = input<Role | null>(null);

  protected readonly draft = signal('');

  constructor() {
    void this.store.load();
  }

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async publish(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const content = this.draft().trim();
    if (!content) {
      return;
    }
    await this.store.create(content);
    this.draft.set('');
    // The textarea is an uncontrolled field typed by the user: clearing the
    // signal alone would not repaint it (Angular's tracked value never changed),
    // so reset the form element to leave the composer empty after publishing.
    form.reset();
  }
}
