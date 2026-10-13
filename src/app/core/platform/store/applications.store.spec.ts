import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { APPLICATIONS_GATEWAY } from '../api/ports';
import type { ApplicationsFilter } from '../api/ports';
import type { Application, Page } from '../domain';
import { APPLICATIONS } from '../mocks/fixtures';
import { ApplicationsStore } from './applications.store';

/**
 * Zoneless paint harness: the template only ever updates because the store
 * writes signals via `.set()` — there is no zone.js to force change detection.
 * Every scenario drives `detectChanges` + `whenStable` exactly like the home
 * page will.
 */
@Component({
  selector: 'app-applications-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.status() === 'loading') {
      <p>Cargando postulaciones…</p>
    } @else if (store.status() === 'empty') {
      <p>Todavía no te postulaste a ninguna vacante.</p>
    } @else if (store.status() === 'ready') {
      <ul>
        @for (application of store.applications(); track application.id) {
          <li data-testid="application">{{ application.jobId }}</li>
        }
      </ul>
    }
  `
})
class ApplicationsHarness {
  readonly store = inject(ApplicationsStore);
}

const page = (items: Application[]): Page<Application> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length }
});

describe('ApplicationsStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts idle and paints nothing before the first load', () => {
    const store = TestBed.inject(ApplicationsStore);
    const fixture = TestBed.createComponent(ApplicationsHarness);
    fixture.detectChanges();

    expect(store.status()).toBe('idle');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(0);
    expect(element.textContent?.trim()).toBe('');
  });

  it('lands only the caller rows in a signal so the zoneless view paints', async () => {
    const store = TestBed.inject(ApplicationsStore);
    const fixture = TestBed.createComponent(ApplicationsHarness);
    fixture.detectChanges();

    await store.load('worker-2');
    await fixture.whenStable();
    fixture.detectChanges();

    const expected = APPLICATIONS.filter((application) => application.applicantId === 'worker-2');
    expect(expected.length).toBe(3);

    expect(store.status()).toBe('ready');
    expect(store.applications()).toHaveLength(expected.length);
    expect(store.applications().every((application) => application.applicantId === 'worker-2')).toBe(
      true
    );

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="application"]'
    );
    expect(items).toHaveLength(expected.length);
    expect(items[0].textContent).toContain('job-2');
  });

  it('scopes the gateway query to the requested applicantId', async () => {
    const filters: ApplicationsFilter[] = [];
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async (filter: ApplicationsFilter): Promise<Page<Application>> => {
          filters.push(filter);
          return page(APPLICATIONS.filter((a) => a.applicantId === filter.applicantId));
        },
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(ApplicationsStore);
    await store.load('worker-1');

    expect(filters).toEqual([{ applicantId: 'worker-1' }]);
    expect(store.applications()).toHaveLength(1);
    expect(store.applications()[0].applicantId).toBe('worker-1');
  });

  it('replaces the state object on every transition (never mutates in place)', async () => {
    const store = TestBed.inject(ApplicationsStore);
    const before = store.state();

    await store.load('worker-1');

    expect(store.state()).not.toBe(before);
    expect(store.state().status).toBe('ready');
  });

  it('settles on the empty state when the caller has no applications', async () => {
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async (): Promise<Page<Application>> => page([]),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(ApplicationsStore);
    const fixture = TestBed.createComponent(ApplicationsHarness);
    fixture.detectChanges();

    await store.load('worker-sin-postulaciones');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.status()).toBe('empty');
    expect(store.applications()).toHaveLength(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Todavía no te postulaste a ninguna vacante'
    );
  });

  it('shows the loading state while the gateway is still pending', async () => {
    let resolveList!: (result: Page<Application>) => void;
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: () =>
          new Promise<Page<Application>>((resolve) => {
            resolveList = resolve;
          }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(ApplicationsStore);
    const fixture = TestBed.createComponent(ApplicationsHarness);
    fixture.detectChanges();

    const pending = store.load('worker-1');
    fixture.detectChanges();

    expect(store.status()).toBe('loading');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando postulaciones');

    resolveList(page([APPLICATIONS[0]]));
    await pending;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.status()).toBe('ready');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="application"]')
    ).toHaveLength(1);
  });

  it('skips a re-load when the same applicant is already ready', async () => {
    let calls = 0;
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async (filter: ApplicationsFilter): Promise<Page<Application>> => {
          calls += 1;
          return page(APPLICATIONS.filter((a) => a.applicantId === filter.applicantId));
        },
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(ApplicationsStore);
    await store.load('worker-1');
    await store.load('worker-1');

    expect(calls).toBe(1);

    // Triangulate: a different applicant must trigger a fresh load.
    await store.load('worker-2');
    expect(calls).toBe(2);
    expect(store.applications().every((application) => application.applicantId === 'worker-2')).toBe(
      true
    );
  });
});
