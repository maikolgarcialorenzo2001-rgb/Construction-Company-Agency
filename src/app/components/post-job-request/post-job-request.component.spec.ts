import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { JobRequestPayload } from '../../core/platform/domain';
import { PostJobRequestComponent } from './post-job-request.component';

const payload: JobRequestPayload = {
  position: 'Electricista matriculado',
  availability: 'Tiempo completo',
  modality: 'Presencial',
  experience: '3 a 5 años'
};

/** Reads the visible text of a card field by its data-testid. */
const fieldText = (element: HTMLElement, testId: string): string | undefined =>
  element.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

describe('PostJobRequestComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PostJobRequestComponent] });
  });

  it('renders the structured payload under es-AR labels', () => {
    const fixture = TestBed.createComponent(PostJobRequestComponent);
    fixture.componentRef.setInput('payload', payload);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="post-job-request"]')).not.toBeNull();

    // es-AR display labels (Plantilla 2 vocabulary).
    expect(fieldText(element, 'job-request-position-label')).toBe('Puesto/rubro');
    expect(fieldText(element, 'job-request-availability-label')).toBe('Disponibilidad/jornada');
    expect(fieldText(element, 'job-request-modality-label')).toBe('Modalidad');
    expect(fieldText(element, 'job-request-experience-label')).toBe('Experiencia');

    // Values come from the input payload.
    expect(fieldText(element, 'job-request-position')).toBe('Electricista matriculado');
    expect(fieldText(element, 'job-request-availability')).toBe('Tiempo completo');
    expect(fieldText(element, 'job-request-modality')).toBe('Presencial');
    expect(fieldText(element, 'job-request-experience')).toBe('3 a 5 años');
  });

  it('reflects a different payload so the values are never hardcoded', () => {
    const fixture = TestBed.createComponent(PostJobRequestComponent);
    fixture.componentRef.setInput('payload', {
      position: 'Albañil',
      availability: 'Medio tiempo',
      modality: 'Remoto',
      experience: '1 a 2 años'
    } satisfies JobRequestPayload);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(fieldText(element, 'job-request-position')).toBe('Albañil');
    expect(fieldText(element, 'job-request-modality')).toBe('Remoto');
    expect(fieldText(element, 'job-request-experience')).toBe('1 a 2 años');
  });

  it('exposes the card as a named group for assistive tech', () => {
    const fixture = TestBed.createComponent(PostJobRequestComponent);
    fixture.componentRef.setInput('payload', payload);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const group = element.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Solicitud de empleo');
  });
});
