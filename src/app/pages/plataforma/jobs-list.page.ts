import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { JobsStore } from '../../core/platform/store/jobs.store';

/**
 * Platform jobs board. It renders the openings from `JobsStore` — signals only,
 * zoneless: every state change arrives through a `.set()` in the store, so the
 * board never calls `detectChanges` on itself. Each card links to the detail
 * route so the board is navigable.
 */
@Component({
  selector: 'app-platform-jobs-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Trabajos</h1>

      @switch (store.listStatus()) {
        @case ('loading') {
          <p class="mt-6 text-ink-600">Cargando trabajos…</p>
        }
        @case ('empty') {
          <p class="mt-6 text-ink-600">No hay trabajos publicados.</p>
        }
        @case ('ready') {
          <ul class="mt-6 space-y-4">
            @for (job of store.openings(); track job.id) {
              <li data-testid="job-card" class="rounded-xl border border-ink-900/10 p-4">
                <a
                  [routerLink]="['/plataforma/trabajos', job.id]"
                  class="font-medium text-ink-900 underline-offset-4 hover:underline"
                  >{{ job.title }}</a
                >
                @if (job.location) {
                  <p class="mt-1 text-sm text-ink-600">{{ job.location }}</p>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
  `
})
export class PlatformJobsListPage {
  protected readonly store = inject(JobsStore);

  constructor() {
    void this.store.load();
  }
}
