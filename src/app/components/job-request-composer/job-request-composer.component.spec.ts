import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  JobRequestComposerComponent,
  type JobRequestDraft
} from './job-request-composer.component';

/** jsdom has no `URL.createObjectURL`; the stub mirrors the clipboard/IO precedents. */
const globalUrl = URL as unknown as { createObjectURL?: (file: File) => string };

let fixture: ComponentFixture<JobRequestComposerComponent>;
let emitted: JobRequestDraft[];

const elementOf = (): HTMLElement => fixture.nativeElement as HTMLElement;

const controlOf = (id: string): HTMLElement =>
  elementOf().querySelector(`#${id}`) as HTMLElement;

const submit = async (): Promise<void> => {
  const form = elementOf().querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
};

/** Valid values for the four required Plantilla 2 fields. */
const fillRequireds = (): void => {
  const controls = fixture.componentInstance.form.controls;
  controls.position.setValue('Electricista matriculado');
  controls.availability.setValue('Tiempo completo');
  controls.modality.setValue('Presencial');
  controls.experience.setValue('3 a 5 años');
};

const attachPhotos = (count: number): void => {
  const input = elementOf().querySelector('#job-request-photos') as HTMLInputElement;
  const files = Array.from({ length: count }, (_, index) =>
    new File(['x'], `foto-${index + 1}.webp`, { type: 'image/webp' })
  );
  Object.defineProperty(input, 'files', { value: files });
  input.dispatchEvent(new Event('change'));
  // Zoneless: the signal update only paints after an explicit change-detection pass.
  fixture.detectChanges();
};

describe('JobRequestComposerComponent', () => {
  beforeEach(() => {
    globalUrl.createObjectURL = (file: File) => `blob:job-request/${file.name}`;
    TestBed.configureTestingModule({ imports: [JobRequestComposerComponent] });
    fixture = TestBed.createComponent(JobRequestComposerComponent);
    emitted = [];
    fixture.componentInstance.publish.subscribe((draft) => emitted.push(draft));
    fixture.detectChanges();
  });

  afterEach(() => {
    delete globalUrl.createObjectURL;
  });

  it('requires the four Plantilla 2 fields, keeps texto libre/fotos optional and exposes no zona field', () => {
    const { form } = fixture.componentInstance;
    const element = elementOf();

    for (const name of ['position', 'availability', 'modality', 'experience'] as const) {
      expect(form.controls[name].hasError('required'), `${name} required`).toBe(true);
    }
    expect(form.valid).toBe(false);
    expect(form.controls.freeText.valid).toBe(true);

    // The 4 requireds alone satisfy form validity: the Q1=a composite rule is
    // enforced at submit, not by the group.
    fillRequireds();
    expect(form.valid).toBe(true);

    // Plantilla 2 vocabulary: no "zona" control, no "zona" label anywhere.
    expect(Object.keys(form.controls)).not.toContain('zona');
    expect(element.textContent ?? '').not.toMatch(/zona/i);

    // es-AR labels for the four required fields.
    for (const [id, label] of [
      ['job-request-position', 'Puesto/rubro'],
      ['job-request-availability', 'Disponibilidad/jornada'],
      ['job-request-modality', 'Modalidad'],
      ['job-request-experience', 'Experiencia']
    ] as const) {
      expect(
        element.querySelector(`label[for="${id}"]`)?.textContent?.trim(),
        `label for ${id}`
      ).toContain(label);
    }
  });

  it('rejects a structured-only submission: no draft emitted, composite alert announced', async () => {
    fillRequireds();

    await submit();

    expect(emitted).toHaveLength(0);
    const alert = elementOf().querySelector('[data-testid="job-request-composite-error"]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent?.trim()).toBeTruthy();
    // The worker is sent to the first thing they can fix: the free text.
    expect(document.activeElement).toBe(controlOf('job-request-free-text'));
  });

  it('publishes with free text only: payload, trimmed content, no attachments', async () => {
    fillRequireds();
    fixture.componentInstance.form.controls.freeText.setValue('  Busco obra estable.  ');

    await submit();

    expect(emitted).toEqual([
      {
        payload: {
          position: 'Electricista matriculado',
          availability: 'Tiempo completo',
          modality: 'Presencial',
          experience: '3 a 5 años'
        },
        content: 'Busco obra estable.',
        attachments: []
      }
    ]);
    expect(
      elementOf().querySelector('[data-testid="job-request-composite-error"]')?.textContent?.trim()
    ).toBe('');
    // The form resets after a successful publish.
    expect(fixture.componentInstance.form.controls.position.value).toBe('');
  });

  it('publishes with photos only, capping the selection at ten previews', async () => {
    fillRequireds();
    attachPhotos(12);

    // The cap is visible in the preview grid before publishing…
    expect(
      elementOf().querySelectorAll('[data-testid="job-request-photo-preview"]')
    ).toHaveLength(10);

    await submit();

    expect(emitted).toHaveLength(1);
    const [draft] = emitted;
    expect(draft.content).toBe('');
    expect(draft.attachments).toHaveLength(10);
    for (const attachment of draft.attachments) {
      expect(attachment.startsWith('blob:job-request/')).toBe(true);
    }
    expect(draft.payload.position).toBe('Electricista matriculado');
    // …and the preview grid clears with the form after publishing.
    expect(
      elementOf().querySelectorAll('[data-testid="job-request-photo-preview"]')
    ).toHaveLength(0);
  });

  it('marks every control touched and focuses the first invalid on an invalid submit', async () => {
    await submit();

    const { form } = fixture.componentInstance;
    for (const name of ['position', 'availability', 'modality', 'experience'] as const) {
      expect(form.controls[name].touched, `${name} touched`).toBe(true);
    }

    const alert = elementOf().querySelector('#job-request-position-error');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent?.trim()).toBeTruthy();
    expect(document.activeElement).toBe(controlOf('job-request-position'));
  });
});
