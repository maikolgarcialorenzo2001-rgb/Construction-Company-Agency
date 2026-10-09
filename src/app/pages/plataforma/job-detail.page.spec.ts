import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { APPLICATIONS_GATEWAY, JOBS_GATEWAY } from '../../core/platform/api/ports';
import type { Application, ApplicationInput, JobOpening } from '../../core/platform/domain';
import { JOBS } from '../../core/platform/mocks/fixtures';
import { PlatformJobDetailPage } from './job-detail.page';

/**
 * Zoneless detail tests: `id` is bound from the `:id` route param by
 * `withComponentInputBinding`, so tests set it via `setInput` and drive
 * `detectChanges` + `whenStable` to let the store settle and paint.
 */
describe('PlatformJobDetailPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('resolves the opening bound by the route id', async () => {
    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[1].id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(JOBS[1].title);
    expect(text).toContain(JOBS[1].description);
    expect(text).toContain('Villa Crespo, CABA');
  });

  it('shows the loading state while the opening is pending', async () => {
    let resolveById!: (job: JobOpening | null) => void;
    TestBed.overrideProvider(JOBS_GATEWAY, {
      useValue: {
        list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
        byId: () =>
          new Promise<JobOpening | null>((resolve) => {
            resolveById = resolve;
          })
      }
    });

    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[0].id);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando el trabajo');

    resolveById(JOBS[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(JOBS[0].title);
  });

  it('shows a not-found state for an unknown id, without error', async () => {
    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', 'job-que-no-existe');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No encontramos ese trabajo'
    );
  });

  it('shows the status of an existing application from the gateway', async () => {
    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[0].id); // job-1 → seeded `accepted`
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const status = element.querySelector('[data-testid="application-status"]');
    expect(status?.textContent).toContain('Aceptada');
    expect(element.querySelector('[data-testid="apply-form"]')).toBeNull();
  });

  it('shows a different existing status, from the gateway', async () => {
    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[1].id); // job-2 → seeded `pending`
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="application-status"]')?.textContent).toContain(
      'Pendiente'
    );
  });

  it('lets a worker apply and shows the resulting status', async () => {
    const created: ApplicationInput[] = [];
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
        create: async (input: ApplicationInput): Promise<Application> => {
          created.push(input);
          return {
            id: 'app-test',
            jobId: input.jobId,
            applicantId: 'worker-1',
            message: input.message,
            status: 'pending',
            createdAt: '2026-10-06T00:00:00.000Z'
          };
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[0].id);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textarea = element.querySelector(
      '[data-testid="apply-form"] textarea'
    ) as HTMLTextAreaElement;
    textarea.value = 'Tengo experiencia en obra';
    textarea.dispatchEvent(new Event('input'));

    (element.querySelector('[data-testid="apply-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(created).toEqual([{ jobId: JOBS[0].id, message: 'Tengo experiencia en obra' }]);
    expect(element.querySelector('[data-testid="application-status"]')?.textContent).toContain(
      'Pendiente'
    );
    expect(element.querySelector('[data-testid="apply-form"]')).toBeNull();
  });

  it('hides the apply form from a company user', async () => {
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[0].id);
    fixture.componentRef.setInput('role', 'company');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="apply-form"]')).toBeNull();
  });

  it('hides the apply form from an anonymous visitor', async () => {
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformJobDetailPage);
    fixture.componentRef.setInput('id', JOBS[0].id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="apply-form"]')).toBeNull();
  });
});
