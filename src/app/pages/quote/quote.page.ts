import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { Option } from '../../../content/content.types';
import { BUDGET_OPTIONS, JOB_TYPE_OPTIONS, STAGE_OPTIONS } from '../../../content/quote-options';
import { site } from '../../../content/site';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  LEAD_MAIL_SUBJECT,
  buildLeadMessage,
  buildMailtoUrl,
  buildTelHref,
  buildWhatsAppUrl,
  toWaDigits,
  type LeadFields
} from '../../core/lead/lead-links';
import { m2Range } from '../../core/lead/validators';

/** Slug → display label, or `undefined` when the slug is not in the option array. */
const labelOf = <T extends string>(
  options: readonly Option<T>[],
  value: string
): string | undefined => options.find((option) => option.value === value)?.label;

/** The eight controls the form owns, in the order they appear on the page. */
export type QuoteFieldName =
  | 'workType'
  | 'location'
  | 'areaM2'
  | 'budget'
  | 'stage'
  | 'comment'
  | 'consent'
  | 'website';

/** One es-AR message per required field, so the visitor is told what to fix, not just that. */
const REQUIRED_ERRORS: Partial<Record<QuoteFieldName, string>> = {
  workType: 'Elegí el tipo de trabajo.',
  location: 'Contanos dónde está la obra.',
  areaM2: 'Ingresá la superficie en m².',
  consent: 'Necesitamos tu autorización para poder responderte.'
};

const MIN_LENGTH_ERROR = 'Sumá un poco más de detalle: mínimo 4 caracteres.';
const RANGE_ERROR = 'Ingresá una superficie entre 1 y 10000 m².';

/**
 * The lead-capture page. There is NO backend: a valid submit composes a prefilled
 * `wa.me` deep link and opens it, so the visitor keeps the chat and the owner keeps
 * the lead. The form therefore never talks to the network — no `HttpClient`, no
 * `fetch`, no hidden POST — and the honeypot is the only bot defence there is.
 *
 * Errors live in always-rendered `role="alert"` paragraphs: a live region must exist
 * before it carries text, otherwise the announcement of the first error is dropped.
 */
@Component({
  selector: 'app-quote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './quote.page.html'
})
export class QuotePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly analytics = inject(AnalyticsService);

  /**
   * Values are the kebab-case slugs from `quote-options.ts`; the labels are resolved
   * from those same arrays at submit time, so the `<select>` and the WhatsApp message
   * can never disagree about what the visitor chose.
   */
  readonly form = this.fb.group({
    workType: ['', Validators.required],
    location: ['', [Validators.required, Validators.minLength(4)]],
    areaM2: this.fb.control<number | string>('', [Validators.required, m2Range(1, 10000)]),
    budget: [''],
    stage: [''],
    comment: [''],
    consent: [false, Validators.requiredTrue],
    website: ['']
  });

  /** Flips exactly once, and only after the handoff actually happened. */
  readonly sent = signal(false);

  protected readonly jobTypeOptions = JOB_TYPE_OPTIONS;
  protected readonly budgetOptions = BUDGET_OPTIONS;
  protected readonly stageOptions = STAGE_OPTIONS;

  protected readonly phoneDisplay = site.nap.phoneDisplay;
  protected readonly email = site.nap.email;

  /** The message that opened WhatsApp, kept so the fallback links carry the same body. */
  private readonly message = signal('');

  /** Phone and mail fallbacks, both from the NAP single source. */
  protected readonly telHref = computed(() => buildTelHref(toWaDigits(site.nap.phoneE164)));

  protected readonly mailHref = computed(() =>
    buildMailtoUrl(site.nap.email, LEAD_MAIL_SUBJECT, this.message())
  );

  /**
   * Empty string means "say nothing". The message only surfaces once the control has
   * been touched, so the form never scolds a visitor who is still typing.
   */
  protected errorText(name: QuoteFieldName): string {
    const control = this.form.controls[name];

    if (control.valid || !(control.touched || control.dirty)) {
      return '';
    }

    const errors = control.errors;

    if (errors?.['required'] || errors?.['requiredTrue']) {
      return REQUIRED_ERRORS[name] ?? '';
    }

    if (errors?.['minlength']) {
      return MIN_LENGTH_ERROR;
    }

    if (errors?.['m2Range']) {
      return RANGE_ERROR;
    }

    return '';
  }

  /**
   * The honeypot is checked before anything else: a bot gets a plain no-op — no opened
   * link, no touched controls, no error text — because a visible reaction is a signal
   * it can learn from. Only then does validation get to speak.
   *
   * A valid submit never touches the network: it composes the prefilled `wa.me` deep
   * link, opens it in a new tab and flips `sent`, and that is the whole handoff.
   */
  protected submit(event?: Event): void {
    event?.preventDefault();

    if (this.form.controls.website.value.trim() !== '') {
      return;
    }

    const fields = this.toLeadFields();

    if (this.form.invalid || fields === null) {
      this.reject();
      return;
    }

    const message = buildLeadMessage(fields);

    window.open(buildWhatsAppUrl(toWaDigits(site.nap.phoneE164), message), '_blank');

    // PII-free by construction: the enum labels, the area and nothing else. The
    // location and the free comment stay on the visitor's device.
    this.analytics.track('generate_lead', {
      work_type: fields.workTypeLabel,
      area_m2: fields.areaM2,
      budget: fields.budgetLabel ?? '',
      stage: fields.stageLabel ?? ''
    });

    this.message.set(message);
    this.sent.set(true);
  }

  /**
   * Maps the stored slugs back to the labels the visitor read on the page, so the
   * `<select>` and the message can never disagree. `null` means the required work type
   * is not a known slug, which is treated exactly like an invalid form.
   */
  private toLeadFields(): LeadFields | null {
    const { workType, location, areaM2, budget, stage, comment } = this.form.getRawValue();
    const workTypeLabel = labelOf(JOB_TYPE_OPTIONS, workType);

    if (!workTypeLabel) {
      return null;
    }

    return {
      workTypeLabel,
      location: location.trim(),
      areaM2: Number(areaM2),
      budgetLabel: labelOf(BUDGET_OPTIONS, budget),
      stageLabel: labelOf(STAGE_OPTIONS, stage),
      comment: comment.trim()
    };
  }

  /** Show every error at once and park the keyboard on the first thing to fix. */
  private reject(): void {
    this.form.markAllAsTouched();

    const firstInvalid = (Object.keys(this.form.controls) as QuoteFieldName[]).find(
      (name) => this.form.controls[name].invalid
    );

    if (firstInvalid) {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[formcontrolname="${firstInvalid}"]`)
        ?.focus();
    }
  }
}
