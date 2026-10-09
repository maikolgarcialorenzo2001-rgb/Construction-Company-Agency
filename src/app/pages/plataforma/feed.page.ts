import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FeedStore } from '../../core/platform/store/feed.store';

/**
 * Platform feed page. It renders the timeline from `FeedStore` — signals only,
 * zoneless: the page never calls `ApplicationRef`/`detectChanges` on itself;
 * every state change arrives through a `.set()` in the store.
 */
@Component({
  selector: 'app-platform-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Novedades</h1>

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

  constructor() {
    void this.store.load();
  }
}
