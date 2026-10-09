import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { JOBS_GATEWAY } from '../api/ports';
import type { JobOpening, Page } from '../domain';
import { JOBS } from '../mocks/fixtures';
import { JobsStore } from './jobs.store';

/** Zoneless paint harness (see `feed.store.spec.ts` for the rationale). */
@Component({
  selector: 'app-jobs-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.listStatus() === 'loading') {
      <p>Cargando obras…</p>
    } @else if (store.listStatus() === 'empty') {
      <p>No hay obras publicadas.</p>
    } @else if (store.listStatus() === 'ready') {
      <ul>
        @for (job of store.openings(); track job.id) {
          <li>{{ job.title }}</li>
        }
      </ul>
    }

    @if (store.selectionStatus() === 'loading') {
      <p>Cargando obra…</p>
    } @else if (store.selectionStatus() === 'ready') {
      <h2>{{ store.selected()?.title }}</h2>
    } @else if (store.selectionStatus() === 'not-found') {
      <p>La obra no existe.</p>
    }
  `
})
class JobsHarness {
  readonly store = inject(JobsStore);
}

describe('JobsStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('lands the async listing in a signal so the zoneless board paints', async () => {
    const store = TestBed.inject(JobsStore);
    const fixture = TestBed.createComponent(JobsHarness);
    fixture.detectChanges();

    await store.load();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.listStatus()).toBe('ready');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(items).toHaveLength(JOBS.length);
    expect(items[0].textContent).toContain('Albañil con experiencia');
  });

  it('resolves one opening into the selection signal and paints its detail', async () => {
    const store = TestBed.inject(JobsStore);
    const fixture = TestBed.createComponent(JobsHarness);
    fixture.detectChanges();

    await store.select(JOBS[1].id);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.selectionStatus()).toBe('ready');
    expect(store.selected()?.title).toBe(JOBS[1].title);
    expect((fixture.nativeElement as HTMLElement).querySelector('h2')?.textContent).toContain(
      'Electricista matriculado'
    );
  });

  it('settles on a not-found state for an unknown id, without throwing', async () => {
    const store = TestBed.inject(JobsStore);
    const fixture = TestBed.createComponent(JobsHarness);
    fixture.detectChanges();

    await expect(store.select('job-que-no-existe')).resolves.toBeUndefined();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.selectionStatus()).toBe('not-found');
    expect(store.selected()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('La obra no existe');
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

    const store = TestBed.inject(JobsStore);
    const fixture = TestBed.createComponent(JobsHarness);
    fixture.detectChanges();

    await store.load();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.listStatus()).toBe('empty');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay obras publicadas'
    );
  });
});
