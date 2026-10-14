import { computed, inject, Injectable, signal } from '@angular/core';

import { ADMIN_GATEWAY } from '../api/ports';
import type { DirectoryUser, Role } from '../domain';

/** Directory lifecycle: idle → loading → ready | empty. */
export type AdminListStatus = 'idle' | 'loading' | 'ready' | 'empty';

/** Role facet of the directory filter: one concrete role, or 'all' (unfiltered). */
export type RoleFilter = Role | 'all';

/** Per-role counts over the *filtered* directory (design D7) plus its total. */
export interface RoleCounts {
  worker: number;
  company: number;
  admin: number;
  total: number;
}

/**
 * Zoneless admin directory store (design D6), mirroring `JobsStore` conventions:
 * the gateway response lands via `.set()` in a signal so the view paints without
 * zones. `state`, `filteredUsers` and `counts` are derived signals, so selecting
 * a role re-derives all three — a filter that matches no account settles on
 * `empty` (spec: "Empty filter result"). Counts are computed over the filtered
 * list per D7, so unselected roles report 0.
 */
@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly gateway = inject(ADMIN_GATEWAY);

  /** Load lifecycle. Mutated only by `load()`, which guards every transition. */
  private readonly phase = signal<'idle' | 'loading' | 'loaded'>('idle');

  /** The full directory as returned by the port. */
  readonly users = signal<DirectoryUser[]>([]);

  /** The active role facet; pages bind it directly (same convention as `JobsStore.list`). */
  readonly roleFilter = signal<RoleFilter>('all');

  /** The directory rows matching the active filter ('all' keeps every row). */
  readonly filteredUsers = computed(() => {
    const filter = this.roleFilter();
    const users = this.users();
    return filter === 'all' ? users : users.filter((user) => user.role === filter);
  });

  /** idle → loading → ready | empty. `empty` also covers a filter with no matches. */
  readonly state = computed<AdminListStatus>(() => {
    if (this.phase() === 'idle') return 'idle';
    if (this.phase() === 'loading') return 'loading';
    return this.filteredUsers().length ? 'ready' : 'empty';
  });

  readonly counts = computed<RoleCounts>(() => {
    const counts: RoleCounts = { worker: 0, company: 0, admin: 0, total: 0 };
    for (const user of this.filteredUsers()) {
      counts[user.role] += 1;
      counts.total += 1;
    }
    return counts;
  });

  /** Guarded and idempotent: a no-op while loading and once loaded. */
  async load(): Promise<void> {
    if (this.phase() !== 'idle') return;
    this.phase.set('loading');
    this.users.set(await this.gateway.listUsers());
    this.phase.set('loaded');
  }
}
