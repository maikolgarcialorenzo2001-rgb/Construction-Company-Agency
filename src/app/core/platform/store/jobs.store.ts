import { computed, inject, Injectable, signal } from '@angular/core';

import { APPLICATIONS_GATEWAY, JOBS_GATEWAY } from '../api/ports';
import type { Application, ApplicationInput, JobOpening } from '../domain';

/** Board lifecycle: idle → loading → ready | empty. */
export type JobsListStatus = 'idle' | 'loading' | 'ready' | 'empty';

/** Detail lifecycle: idle → loading → ready | not-found (unknown ids never throw). */
export type JobsSelectionStatus = 'idle' | 'loading' | 'ready' | 'not-found';

/** Application lifecycle: idle → loading → ready | none (no application for the job). */
export type ApplicationViewStatus = 'idle' | 'loading' | 'ready' | 'none';

export interface JobsListState {
  status: JobsListStatus;
  openings: JobOpening[];
}

export interface JobsSelectionState {
  status: JobsSelectionStatus;
  opening: JobOpening | null;
}

export interface ApplicationViewState {
  status: ApplicationViewStatus;
  application: Application | null;
}

/**
 * Zoneless jobs store: the board list and the detail selection are two
 * independent signals, so `/plataforma/trabajos` and `/plataforma/trabajos/:id`
 * can paint without waiting for each other. Every gateway response lands via
 * `.set()` (see `feed.store.ts` for the rationale).
 */
@Injectable({ providedIn: 'root' })
export class JobsStore {
  private readonly gateway = inject(JOBS_GATEWAY);
  private readonly applications = inject(APPLICATIONS_GATEWAY);

  readonly list = signal<JobsListState>({ status: 'idle', openings: [] });
  readonly selection = signal<JobsSelectionState>({ status: 'idle', opening: null });
  readonly applicationState = signal<ApplicationViewState>({ status: 'idle', application: null });

  readonly listStatus = computed(() => this.list().status);
  readonly openings = computed(() => this.list().openings);
  readonly selectionStatus = computed(() => this.selection().status);
  readonly selected = computed(() => this.selection().opening);
  readonly applicationViewStatus = computed(() => this.applicationState().status);
  readonly application = computed(() => this.applicationState().application);

  async load(): Promise<void> {
    this.list.set({ status: 'loading', openings: [] });
    const page = await this.gateway.list();
    this.list.set({
      status: page.items.length ? 'ready' : 'empty',
      openings: page.items
    });
  }

  async select(id: string): Promise<void> {
    this.selection.set({ status: 'loading', opening: null });
    const opening = await this.gateway.byId(id);
    this.selection.set(
      opening ? { status: 'ready', opening } : { status: 'not-found', opening: null }
    );
  }

  /**
   * Resolves the demo worker's application for a job. The gateway filter is by
   * `jobId` only (the mock has no session), so the first match is this job's
   * application; `none` means the worker has not applied yet.
   */
  async loadApplication(jobId: string): Promise<void> {
    this.applicationState.set({ status: 'loading', application: null });
    const page = await this.applications.list({ jobId });
    const application = page.items[0] ?? null;
    this.applicationState.set(
      application ? { status: 'ready', application } : { status: 'none', application: null }
    );
  }

  /** Creates an `Application` through the port and surfaces the returned status. */
  async apply(jobId: string, message?: string): Promise<Application> {
    const input: ApplicationInput = message ? { jobId, message } : { jobId };
    const application = await this.applications.create(input);
    this.applicationState.set({ status: 'ready', application });
    return application;
  }
}
