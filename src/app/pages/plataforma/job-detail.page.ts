import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';

import type { Role } from '../../core/platform/domain';
import { applicationStatusLabel } from '../../core/platform/store/application-status';
import { JobsStore } from '../../core/platform/store/jobs.store';

/**
 * Platform job detail. `id` is bound from the `:id` route param by
 * `withComponentInputBinding`; an effect resolves the opening and the demo
 * worker's application through `JobsStore` whenever the param changes. Signals
 * only — every state change lands through a `.set()` in the store, so the
 * zoneless view paints.
 *
 * Unknown ids settle on a `not-found` state; the gateway never throws for a
 * missing opening, so this page shows a message instead of an error. The apply
 * form is gated by `role` (S5 supplies the session); an anonymous visitor or a
 * company sees the opening but cannot apply.
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

      @if (store.application(); as application) {
        <p data-testid="application-status" class="mt-6 text-ink-900">
          Estado de tu postulación:
          <strong>{{ applicationStatusLabel(application.status) }}</strong>
        </p>
      }

      @if (role() === 'worker' && store.applicationViewStatus() === 'none') {
        <form
          data-testid="apply-form"
          class="mt-6 rounded-xl border border-ink-900/10 p-4"
          (submit)="submitApplication($event)"
        >
          <label for="apply-message" class="block text-sm font-medium text-ink-900"
            >Mensaje (opcional)</label
          >
          <textarea
            id="apply-message"
            rows="3"
            [value]="draft()"
            (input)="onDraftInput($event)"
            placeholder="Contá por qué te interesa la búsqueda."
            class="mt-2 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          ></textarea>
          <button
            data-testid="apply-submit"
            type="submit"
            class="mt-3 rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
          >
            Postularme
          </button>
        </form>
      }
    </section>
  `
})
export class PlatformJobDetailPage {
  protected readonly store = inject(JobsStore);

  /** Bound from the `:id` route param by `withComponentInputBinding`. */
  readonly id = input<string>('');

  /** Authenticated role; `null` is an anonymous visitor (S5 wires the session). */
  readonly role = input<Role | null>(null);

  protected readonly applicationStatusLabel = applicationStatusLabel;
  protected readonly draft = signal('');

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        void this.store.select(id);
        void this.store.loadApplication(id);
      }
    });
  }

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async submitApplication(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const id = this.id();
    if (!id) {
      return;
    }
    const message = this.draft().trim();
    await this.store.apply(id, message || undefined);
    this.draft.set('');
    // The textarea is an uncontrolled field typed by the user: clearing the
    // signal alone would not repaint it, so reset the form element (see feed.page).
    form.reset();
  }
}
