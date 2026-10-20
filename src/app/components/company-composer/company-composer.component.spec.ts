import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { JobOpening } from '../../core/platform/domain';
import {
  CompanyComposerComponent,
  type CompanyPostDraft
} from './company-composer.component';

/** jsdom has no `URL.createObjectURL`; the stub mirrors the p15 composer precedent. */
const globalUrl = URL as unknown as { createObjectURL?: (file: File) => string };

let fixture: ComponentFixture<CompanyComposerComponent>;
let emitted: CompanyPostDraft[];

const elementOf = (): HTMLElement => fixture.nativeElement as HTMLElement;

const controlOf = (id: string): HTMLElement =>
  elementOf().querySelector(`#${id}`) as HTMLElement;

const submitForm = async (selector: string): Promise<void> => {
  const form = elementOf().querySelector(selector) as HTMLFormElement;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
};

/** The fixture job mix (design D8 / task 4.2): own-open, own-closed and other-company. */
const job = (
  id: string,
  companyId: string,
  status: JobOpening['status'],
  title: string
): JobOpening => ({
  id,
  companyId,
  status,
  title,
  description: '',
  createdAt: '2026-10-08T14:00:00.000Z'
});

const OPENINGS: JobOpening[] = [
  job('job-1', 'company-1', 'open', 'Albañil con experiencia para obra en Vicente López'),
  job('job-2', 'company-1', 'open', 'Electricista matriculado para locales comerciales'),
  job('job-3', 'company-1', 'closed', 'Director de obra para multifamiliar en Rosario'),
  job('job-4', 'company-2', 'open', 'Plomero con experiencia para edificio en La Plata'),
  job('job-6', 'company-1', 'open', 'Herrero para estructura metálica en Tigre')
];

const typeInto = (id: string, value: string): void => {
  const control = elementOf().querySelector(`#${id}`) as HTMLTextAreaElement;
  control.value = value;
  control.dispatchEvent(new Event('input'));
  fixture.detectChanges();
};

const attachPhotos = (count: number): void => {
  const input = elementOf().querySelector('#company-composer-photos') as HTMLInputElement;
  const files = Array.from({ length: count }, (_, index) =>
    new File(['x'], `foto-${index + 1}.webp`, { type: 'image/webp' })
  );
  Object.defineProperty(input, 'files', { value: files });
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
};

const checkVacancy = (jobId: string): void => {
  const checkbox = elementOf().querySelector(
    `#company-composer-job-${jobId}`
  ) as HTMLInputElement;
  checkbox.click();
  fixture.detectChanges();
};

const toggleToVacancy = (): void => {
  const toggle = Array.from(elementOf().querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === 'Buscar trabajadores'
  ) as HTMLButtonElement;
  toggle.click();
  fixture.detectChanges();
};

/** company-1 hydrated with the fixture mix, toggled into vacancy mode. */
const givenVacancyMode = (): void => {
  fixture.componentRef.setInput('openings', OPENINGS);
  fixture.componentRef.setInput('authorId', 'company-1');
  toggleToVacancy();
};

describe('CompanyComposerComponent', () => {
  beforeEach(() => {
    globalUrl.createObjectURL = (file: File) => `blob:company-composer/${file.name}`;
    TestBed.configureTestingModule({ imports: [CompanyComposerComponent] });
    fixture = TestBed.createComponent(CompanyComposerComponent);
    emitted = [];
    fixture.componentInstance.publish.subscribe((draft) => emitted.push(draft));
    fixture.detectChanges();
  });

  afterEach(() => {
    delete globalUrl.createObjectURL;
  });

  it('defaults to normal mode with the byte-compatible textarea and an accessible toggle', () => {
    const element = elementOf();

    // Byte-compatible with the pre-p16 company textarea (WU4a task 4.1).
    const form = element.querySelector('[data-testid="feed-composer"]');
    expect(form).not.toBeNull();
    const textarea = element.querySelector('#feed-post-content') as HTMLTextAreaElement;
    expect(textarea.getAttribute('rows')).toBe('3');
    expect(textarea.getAttribute('placeholder')).toBe(
      'Contá el avance de obra, una búsqueda de personal, etc.'
    );
    expect(element.querySelector('label[for="feed-post-content"]')?.textContent?.trim()).toBe(
      'Publicar novedad'
    );
    const publish = element.querySelector('[data-testid="feed-publish"]');
    expect(publish?.textContent?.trim()).toBe('Publicar');

    // Vacancy mode is absent until toggled; the toggle itself is accessible.
    expect(element.querySelector('[data-testid="vacancy-composer"]')).toBeNull();
    const toggle = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Buscar trabajadores'
    );
    expect(toggle).toBeDefined();
    expect(toggle?.getAttribute('type')).toBe('button');
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');
  });

  it('publishes a standard draft from normal mode, rejecting blank text', async () => {
    typeInto('feed-post-content', '  Arranque de losa de techo en Villa Urquiza.  ');

    await submitForm('[data-testid="feed-composer"]');

    expect(emitted).toEqual([
      { jobIds: [], content: 'Arranque de losa de techo en Villa Urquiza.', attachments: [] }
    ]);
    // The uncontrolled textarea clears with the form after publishing.
    expect((elementOf().querySelector('#feed-post-content') as HTMLTextAreaElement).value).toBe(
      ''
    );

    // Blank and whitespace-only submits never emit (never-empty predicate parity).
    typeInto('feed-post-content', '   ');
    await submitForm('[data-testid="feed-composer"]');
    expect(emitted).toHaveLength(1);
  });

  it('offers only the company own open vacancies in the scoped picker', () => {
    givenVacancyMode();

    const element = elementOf();
    const group = element.querySelector('[data-testid="vacancy-composer"]');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Buscar trabajadores');
    expect(
      Array.from(element.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Buscar trabajadores'
      )?.getAttribute('aria-pressed')
    ).toBe('true');

    // Design D8: only own + open jobs reach the picker (job-1, job-2, job-6).
    const options = Array.from(
      element.querySelectorAll<HTMLInputElement>('[data-testid="vacancy-option"]')
    );
    expect(options.map((option) => option.id)).toEqual([
      'company-composer-job-job-1',
      'company-composer-job-job-2',
      'company-composer-job-job-6'
    ]);
    // Every checkbox carries an explicit accessible name (a11y D11).
    for (const option of options) {
      expect(element.querySelector(`label[for="${option.id}"]`)?.textContent?.trim()).toBeTruthy();
    }
    const text = element.textContent ?? '';
    expect(text).not.toContain('Director de obra'); // own but closed
    expect(text).not.toContain('Plomero'); // open but another company
  });

  it('rejects a submission with no vacancy selected: no draft, alert announced, focus on the picker', async () => {
    givenVacancyMode();
    // Text alone cannot compensate: at least one vacancy is mandatory.
    typeInto('company-composer-vacancy-text', 'Busco albañiles.');

    await submitForm('[data-testid="vacancy-composer"]');

    expect(emitted).toHaveLength(0);
    const alert = elementOf().querySelector('[data-testid="company-composer-composite-error"]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent?.trim()).toBeTruthy();
    expect(document.activeElement).toBe(controlOf('company-composer-job-job-1'));
  });

  it('rejects vacancies with no text and no photos, parking focus on the text', async () => {
    givenVacancyMode();
    checkVacancy('job-2');

    await submitForm('[data-testid="vacancy-composer"]');

    expect(emitted).toHaveLength(0);
    expect(document.activeElement).toBe(controlOf('company-composer-vacancy-text'));
  });

  it('publishes a vacancy draft with text only, preserving the selection order', async () => {
    givenVacancyMode();
    checkVacancy('job-6');
    checkVacancy('job-1');
    typeInto('company-composer-vacancy-text', '  Busco albañiles y herreros para obra propia.  ');

    await submitForm('[data-testid="vacancy-composer"]');

    expect(emitted).toEqual([
      {
        jobIds: ['job-6', 'job-1'],
        content: 'Busco albañiles y herreros para obra propia.',
        attachments: []
      }
    ]);
    expect(
      elementOf().querySelector('[data-testid="company-composer-composite-error"]')?.textContent?.trim()
    ).toBe('');
    // The selection clears after a successful publish.
    expect(elementOf().querySelector<HTMLInputElement>('#company-composer-job-job-6')?.checked).toBe(
      false
    );
  });

  it('publishes with photos only, capping the selection at ten', async () => {
    givenVacancyMode();
    checkVacancy('job-1');
    attachPhotos(12);

    await submitForm('[data-testid="vacancy-composer"]');

    expect(emitted).toHaveLength(1);
    const [draft] = emitted;
    expect(draft.jobIds).toEqual(['job-1']);
    expect(draft.content).toBe('');
    expect(draft.attachments).toHaveLength(10);
    for (const attachment of draft.attachments) {
      expect(attachment.startsWith('blob:company-composer/')).toBe(true);
    }
  });
});
