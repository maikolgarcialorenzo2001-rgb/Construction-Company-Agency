import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { JOBS_GATEWAY } from '../../core/platform/api/ports';
import type { JobOpening } from '../../core/platform/domain';
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
});
