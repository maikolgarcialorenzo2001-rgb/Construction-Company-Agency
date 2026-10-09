import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';

import { JobsStore } from '../../core/platform/store/jobs.store';

/**
 * Platform job detail. `id` is bound from the `:id` route param by
 * `withComponentInputBinding`; an effect resolves the opening through
 * `JobsStore` whenever the param changes. Signals only — every state change
 * lands through a `.set()` in the store, so the zoneless view paints.
 *
 * Unknown ids settle on a `not-found` state; the gateway never throws for a
 * missing opening, so this page shows a message instead of an error.
 */
@Component({
  selector: 'app-platform-job-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      @switch (store.selectionStatus()) {
        @case ('loading') {
          <p class="text-ink-600">Cargando el trabajo…</p>
        }
        @case ('not-found') {
          <h1 class="text-section font-semibold text-ink-900">No encontramos ese trabajo</h1>
          <p class="mt-3 text-ink-600">
            Puede que la búsqueda se haya cerrado o que el enlace esté mal.
          </p>
        }
        @case ('ready') {
          @if (store.selected(); as job) {
            <h1 class="text-section font-semibold text-ink-900">{{ job.title }}</h1>
            @if (job.location) {
              <p class="mt-2 text-ink-600">{{ job.location }}</p>
            }
            <p class="mt-4 text-ink-900">{{ job.description }}</p>
          }
        }
      }
    </section>
  `
})
export class PlatformJobDetailPage {
  protected readonly store = inject(JobsStore);

  /** Bound from the `:id` route param by `withComponentInputBinding`. */
  readonly id = input<string>('');

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        void this.store.select(id);
      }
    });
  }
}
