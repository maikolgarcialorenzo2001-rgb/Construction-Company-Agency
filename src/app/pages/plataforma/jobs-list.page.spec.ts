import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { JOBS_GATEWAY } from '../../core/platform/api/ports';
import type { JobOpening, Page } from '../../core/platform/domain';
import { JOBS } from '../../core/platform/mocks/fixtures';
import { PlatformJobsListPage } from './jobs-list.page';

/**
 * Zoneless page tests: the page fires `store.load()` on creation, so every
 * scenario drives `detectChanges` + `whenStable` exactly like the store harness.
 * Only a `.set()` in the store can paint the view.
 */
describe('PlatformJobsListPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('lists the openings resolved by the gateway', async () => {
    const fixture = TestBed.createComponent(PlatformJobsListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="job-card"]'
    );
    expect(cards).toHaveLength(JOBS.length);
    expect(cards[0].textContent).toContain('Albañil con experiencia');
    expect(cards[1].textContent).toContain('Electricista matriculado');
  });

  it('shows the loading state while the board is pending', async () => {
    let resolveList!: (page: Page<JobOpening>) => void;
    TestBed.overrideProvider(JOBS_GATEWAY, {
      useValue: {
        list: () =>
          new Promise<Page<JobOpening>>((resolve) => {
            resolveList = resolve;
          }),
        byId: async () => null
      }
    });

    const fixture = TestBed.createComponent(PlatformJobsListPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando trabajos');

    resolveList({ items: [JOBS[0]], meta: { page: 1, pageSize: 20, total: 1 } });
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="job-card"]'
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Albañil con experiencia');
  });

  it('shows the empty state when the gateway lists no openings', async () => {
    TestBed.overrideProvider(JOBS_GATEWAY, {
      useValue: {
        list: async (): Promise<Page<JobOpening>> => ({
          items: [],
          meta: { page: 1, pageSize: 20, total: 0 }
        }),
        byId: async () => null
      }
    });

    const fixture = TestBed.createComponent(PlatformJobsListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay trabajos publicados'
    );
  });
});
