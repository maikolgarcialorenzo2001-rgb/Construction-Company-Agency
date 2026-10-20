import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { formatMoneyRange } from '../../core/format';
import type { JobOpening } from '../../core/platform/domain';
import { PostVacancyComponent } from './post-vacancy.component';

const opening = (overrides: Partial<JobOpening> & Pick<JobOpening, 'id' | 'title'>): JobOpening => ({
  companyId: 'company-1',
  description: 'Descripción de prueba',
  status: 'open',
  createdAt: '2026-10-01T10:00:00.000Z',
  ...overrides
});

/** Reads the visible text of a card field by its data-testid. */
const fieldText = (element: HTMLElement, testId: string): string | undefined =>
  element.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

describe('PostVacancyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PostVacancyComponent], providers: [provideRouter([])] });
  });

  const render = async (openings: JobOpening[]): Promise<HTMLElement> => {
    const fixture: ComponentFixture<PostVacancyComponent> = TestBed.createComponent(
      PostVacancyComponent
    );
    fixture.componentRef.setInput('openings', openings);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('renders one entry per promoted job with title, location, budget and Abierta', async () => {
    const element = await render([
      opening({
        id: 'job-1',
        title: 'Albañil con experiencia para obra en Vicente López',
        location: 'Vicente López, GBA Norte',
        budget: 380000
      }),
      opening({
        id: 'job-2',
        title: 'Electricista matriculado para locales comerciales',
        location: 'Villa Crespo, CABA',
        budget: 250000
      }),
      opening({
        id: 'job-6',
        title: 'Herrero para estructura metálica en Tigre',
        location: 'Tigre, GBA Norte',
        budget: 320000
      })
    ]);

    const entries = element.querySelectorAll('[data-testid="vacancy-entry"]');
    expect(entries).toHaveLength(3);

    expect(fieldText(element, 'vacancy-title')).toBe(
      'Albañil con experiencia para obra en Vicente López'
    );
    expect(fieldText(element, 'vacancy-location')).toBe('Vicente López, GBA Norte');
    expect(fieldText(element, 'vacancy-budget')).toBe(formatMoneyRange({
      min: 380000,
      max: 380000,
      currency: 'ARS'
    }));
    expect(fieldText(element, 'vacancy-status')).toBe('Estado: Abierta');

    // Every entry links to its own job route via "Postularse".
    const links = element.querySelectorAll<HTMLAnchorElement>(
      '[data-testid="vacancy-apply"][href]'
    );
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe('/plataforma/trabajos/job-1');
    expect(links[0].textContent?.trim()).toBe('Postularse');
    expect(links[1].getAttribute('href')).toBe('/plataforma/trabajos/job-2');
    expect(links[2].getAttribute('href')).toBe('/plataforma/trabajos/job-6');
  });

  it('shows Cerrada for a closed job and keeps its Postularse link rendered', async () => {
    const element = await render([
      opening({
        id: 'job-3',
        title: 'Director de obra para multifamiliar en Rosario',
        location: 'Rosario, Santa Fe',
        status: 'closed'
      })
    ]);

    expect(fieldText(element, 'vacancy-status')).toBe('Estado: Cerrada');

    const link = element.querySelector<HTMLAnchorElement>('[data-testid="vacancy-apply"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/plataforma/trabajos/job-3');
    expect(link?.textContent?.trim()).toBe('Postularse');
  });

  it('omits the location and budget rows when the opening carries neither', async () => {
    const element = await render([opening({ id: 'job-3', title: 'Director de obra' })]);

    expect(fieldText(element, 'vacancy-title')).toBe('Director de obra');
    expect(element.querySelector('[data-testid="vacancy-location"]')).toBeNull();
    expect(element.querySelector('[data-testid="vacancy-budget"]')).toBeNull();
    // Status and link still render — the minimum entry contract.
    expect(fieldText(element, 'vacancy-status')).toBe('Estado: Abierta');
    expect(element.querySelector('[data-testid="vacancy-apply"]')).not.toBeNull();
  });

  it('exposes the card as a named group with uniquely named apply links', async () => {
    const element = await render([
      opening({ id: 'job-1', title: 'Albañil con experiencia para obra en Vicente López' }),
      opening({ id: 'job-2', title: 'Electricista matriculado para locales comerciales' })
    ]);

    const group = element.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Vacante');

    // Explicit, distinct accessible names so the links are never ambiguous.
    const links = element.querySelectorAll<HTMLAnchorElement>('[data-testid="vacancy-apply"]');
    expect(links[0].getAttribute('aria-label')).toBe(
      'Postularse a Albañil con experiencia para obra en Vicente López'
    );
    expect(links[1].getAttribute('aria-label')).toBe(
      'Postularse a Electricista matriculado para locales comerciales'
    );
  });
});
