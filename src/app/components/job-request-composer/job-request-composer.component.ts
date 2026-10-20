import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { JobRequestPayload } from '../../core/platform/domain';

/** What the worker composer hands to the page: structured fields + optional extras. */
export interface JobRequestDraft {
  readonly payload: JobRequestPayload;
  readonly content: string;
  readonly attachments: string[];
}

/** The four required Plantilla 2 fields, in the order the worker meets them. */
type RequiredFieldName = 'position' | 'availability' | 'modality' | 'experience';

interface RequiredField {
  readonly name: RequiredFieldName;
  readonly id: string;
  readonly label: string;
  readonly error: string;
}

/** Photos are capped (design D7): the preview grid never grows past this. */
const MAX_PHOTOS = 10;

/**
 * Worker "Solicitud de empleo" composer (design D5/D6, p15 WU3). A reactive
 * form (`NonNullableFormBuilder` + `Validators`) with the Q1=a composite rule
 * enforced at submit: the 4 requireds must be valid AND (free text OR ≥1 photo)
 * must be present — a structured-only submission is rejected and never reaches
 * the feed. Invalid submits mark everything touched, announce es-AR
 * `role="alert"` errors and park focus on the first invalid control
 * (quote.page precedent). Photos are capped object-URL previews (design D7),
 * session-scoped exactly like the in-memory gateway.
 */
@Component({
  selector: 'app-job-request-composer',
  templateUrl: './job-request-composer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]
})
export class JobRequestComposerComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly form = this.fb.group({
    position: ['', Validators.required],
    availability: ['', Validators.required],
    modality: ['', Validators.required],
    experience: ['', Validators.required],
    freeText: ['']
  });

  /** Object-URL previews of the attached photos, capped at `MAX_PHOTOS`. */
  protected readonly photos = signal<string[]>([]);

  /** Flips after a structured-only submit; drives the composite `role="alert"`. */
  protected readonly compositeRejected = signal(false);

  protected readonly requiredFields: readonly RequiredField[] = [
    {
      name: 'position',
      id: 'job-request-position',
      label: 'Puesto/rubro',
      error: 'Contá el puesto o rubro que buscás.'
    },
    {
      name: 'availability',
      id: 'job-request-availability',
      label: 'Disponibilidad/jornada',
      error: 'Indicá tu disponibilidad o jornada.'
    },
    {
      name: 'modality',
      id: 'job-request-modality',
      label: 'Modalidad',
      error: 'Elegí la modalidad.'
    },
    {
      name: 'experience',
      id: 'job-request-experience',
      label: 'Experiencia',
      error: 'Contanos tu experiencia.'
    }
  ];

  readonly publish = output<JobRequestDraft>();

  protected errorText(field: RequiredField): string {
    const control = this.form.controls[field.name];
    return control.valid || !(control.touched || control.dirty) ? '' : field.error;
  }

  protected onPhotoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const urls = Array.from(input.files ?? [])
      .slice(0, MAX_PHOTOS)
      .map((file) => URL.createObjectURL(file));
    this.photos.set(urls);
  }

  protected submit(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      this.compositeRejected.set(false);
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const { position, availability, modality, experience, freeText } = this.form.getRawValue();
    const content = freeText.trim();
    const attachments = this.photos();

    // Q1=a composite rule (design D6): structured-only submissions never publish.
    if (!content && attachments.length === 0) {
      this.compositeRejected.set(true);
      this.host.nativeElement.querySelector<HTMLElement>('#job-request-free-text')?.focus();
      return;
    }

    this.compositeRejected.set(false);
    this.publish.emit({
      payload: {
        position: position.trim(),
        availability: availability.trim(),
        modality: modality.trim(),
        experience: experience.trim()
      },
      content,
      attachments
    });
    this.form.reset();
    this.photos.set([]);
  }

  /** Park the keyboard on the first thing to fix (quote.page precedent). */
  private focusFirstInvalid(): void {
    const first = this.requiredFields.find((field) => this.form.controls[field.name].invalid);
    if (first) {
      this.host.nativeElement.querySelector<HTMLElement>(`#${first.id}`)?.focus();
    }
  }
}
