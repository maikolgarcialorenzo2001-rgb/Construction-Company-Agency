import { computed, inject, Injectable, signal } from '@angular/core';

import { APPLICATIONS_GATEWAY } from '../api/ports';
import type { Application } from '../domain';

/** Lifecycle of "my applications": idle → loading → ready | empty. */
export type ApplicationsStatus = 'idle' | 'loading' | 'ready' | 'empty';

export interface ApplicationsState {
  status: ApplicationsStatus;
  applications: Application[];
}

/**
 * Zoneless applications store, scoped to one applicant at a time (design:
 * "new `ApplicationsStore`"). It mirrors `FeedStore`'s shape — one concern per
 * store, responses land via `.set()` so the zone paints — but the list is
 * always fetched through `APPLICATIONS_GATEWAY.list({ applicantId })` so a
 * caller can never see another worker's rows.
 *
 * `load` is guarded: re-loading the same applicant while already `loading` or
 * `ready` is a no-op, so the home's effect cannot start re-load loops.
 */
@Injectable({ providedIn: 'root' })
export class ApplicationsStore {
  private readonly gateway = inject(APPLICATIONS_GATEWAY);

  /** The applicant whose rows are currently loaded (guard key). */
  private readonly loadedApplicantId = signal<string | null>(null);

  readonly state = signal<ApplicationsState>({ status: 'idle', applications: [] });

  readonly status = computed(() => this.state().status);
  readonly applications = computed(() => this.state().applications);

  async load(applicantId: string): Promise<void> {
    const current = this.state();
    // Guard: no-op while the same applicant is loading or already loaded
    // (prevents effect re-load loops). `empty` stays retryable.
    if (
      this.loadedApplicantId() === applicantId &&
      (current.status === 'loading' || current.status === 'ready')
    ) {
      return;
    }
    this.loadedApplicantId.set(applicantId);
    this.state.set({ status: 'loading', applications: [] });
    const page = await this.gateway.list({ applicantId });
    this.state.set({
      status: page.items.length ? 'ready' : 'empty',
      applications: page.items
    });
  }
}
