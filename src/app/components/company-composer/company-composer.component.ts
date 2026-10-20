import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import type { JobOpening } from '../../core/platform/domain';

/**
 * What the company composer hands to the page: `jobIds: []` means a standard
 * post, 1..n means a vacancy promo (design "Interfaces / Contracts").
 */
export interface CompanyPostDraft {
  readonly jobIds: string[];
  readonly content: string;
  readonly attachments: string[];
}

/** Photos are capped exactly like the p15 composer (design D8). */
const MAX_PHOTOS = 10;

/**
 * Company composer (p16 WU4a, design D4/D8). Normal mode (default) reproduces
 * the pre-p16 signal-based textarea byte-compatibly — same testids, same
 * emit-on-input flow, same silent blank-text rejection — and emits a draft
 * with `jobIds: []` so the page keeps creating a `kind: 'standard'` post.
 * "Buscar trabajadores" mode adds a multi-select picker scoped to the
 * session company's own open vacancies (`status === 'open' &&
 * companyId === authorId`, pure filter over the `openings` input the page
 * hydrates in WU4b) plus optional text and photos. The composite rule
 * (≥1 vacancy AND (text OR photo)) rejects structured-only submits with an
 * es-AR `role="alert"` and parks focus on the first invalid control (p15
 * pattern, signal-mode adaptation: touched flags + composite alert).
 */
@Component({
  selector: 'app-company-composer',
  templateUrl: './company-composer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyComposerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** All openings; the page hydrates `JobsStore` and passes them in WU4b. */
  readonly openings = input<JobOpening[]>([]);

  /** The session company author id — the picker only offers their own jobs. */
  readonly authorId = input('');

  readonly publish = output<CompanyPostDraft>();

  protected readonly mode = signal<'normal' | 'vacancy'>('normal');
  protected readonly draft = signal('');

  protected readonly selectedIds = signal<string[]>([]);
  protected readonly vacancyText = signal('');
  protected readonly photos = signal<string[]>([]);

  /** Flips after a rejected vacancy submit; drives the composite `role="alert"`. */
  protected readonly compositeRejected = signal(false);
  protected readonly pickerTouched = signal(false);
  protected readonly textTouched = signal(false);

  /** Design D8 picker scope: the company's own openings that are still open. */
  protected readonly selectableJobs = computed(() =>
    this.openings().filter((job) => job.status === 'open' && job.companyId === this.authorId())
  );

  protected toggleMode(): void {
    this.mode.update((current) => (current === 'normal' ? 'vacancy' : 'normal'));
    this.compositeRejected.set(false);
  }

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected onVacancyTextInput(event: Event): void {
    this.vacancyText.set((event.target as HTMLTextAreaElement).value);
  }

  protected isSelected(jobId: string): boolean {
    return this.selectedIds().includes(jobId);
  }

  protected toggleJob(jobId: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(jobId) ? ids.filter((id) => id !== jobId) : [...ids, jobId]
    );
  }

  protected onPhotoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const urls = Array.from(input.files ?? [])
      .slice(0, MAX_PHOTOS)
      .map((file) => URL.createObjectURL(file));
    this.photos.set(urls);
  }

  protected submitNormal(event: Event): void {
    event.preventDefault();
    const content = this.draft().trim();
    // Never-empty parity with the pre-p16 textarea: blank text never publishes.
    if (!content) {
      return;
    }
    this.publish.emit({ jobIds: [], content, attachments: [] });
    this.draft.set('');
    // The textarea is uncontrolled: reset the element, not just the signal.
    (event.currentTarget as HTMLFormElement).reset();
  }

  protected submitVacancy(event: Event): void {
    event.preventDefault();
    const jobIds = this.selectedIds();
    const content = this.vacancyText().trim();
    const attachments = this.photos();

    // Composite rule (design D8): structured-only submissions never publish.
    if (jobIds.length === 0 || (!content && attachments.length === 0)) {
      this.pickerTouched.set(jobIds.length === 0);
      this.textTouched.set(jobIds.length > 0 && !content && attachments.length === 0);
      this.compositeRejected.set(true);
      this.focusFirstInvalid(jobIds.length);
      return;
    }

    this.compositeRejected.set(false);
    this.pickerTouched.set(false);
    this.textTouched.set(false);
    this.publish.emit({ jobIds, content, attachments });
    this.vacancyText.set('');
    this.photos.set([]);
    this.selectedIds.set([]);
    (event.currentTarget as HTMLFormElement).reset();
  }

  /** Park the keyboard on the first thing to fix (p15 quote.page precedent). */
  private focusFirstInvalid(selectedCount: number): void {
    if (selectedCount === 0) {
      this.host.nativeElement.querySelector<HTMLElement>('.company-composer-job')?.focus();
      return;
    }
    this.host.nativeElement.querySelector<HTMLElement>('#company-composer-vacancy-text')?.focus();
  }
}
