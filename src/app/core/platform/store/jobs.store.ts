import { computed, inject, Injectable, signal } from '@angular/core';

import { JOBS_GATEWAY } from '../api/ports';
import type { JobOpening } from '../domain';

/** Board lifecycle: idle → loading → ready | empty. */
export type JobsListStatus = 'idle' | 'loading' | 'ready' | 'empty';

/** Detail lifecycle: idle → loading → ready | not-found (unknown ids never throw). */
export type JobsSelectionStatus = 'idle' | 'loading' | 'ready' | 'not-found';

export interface JobsListState {
  status: JobsListStatus;
  openings: JobOpening[];
}

export interface JobsSelectionState {
  status: JobsSelectionStatus;
  opening: JobOpening | null;
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

  readonly list = signal<JobsListState>({ status: 'idle', openings: [] });
  readonly selection = signal<JobsSelectionState>({ status: 'idle', opening: null });

  readonly listStatus = computed(() => this.list().status);
  readonly openings = computed(() => this.list().openings);
  readonly selectionStatus = computed(() => this.selection().status);
  readonly selected = computed(() => this.selection().opening);

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
}
