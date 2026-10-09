import { computed, inject, Injectable, signal } from '@angular/core';

import { FEED_GATEWAY } from '../api/ports';
import type { Post } from '../domain';

/** Lifecycle of the timeline: idle → loading → ready | empty. */
export type FeedStatus = 'idle' | 'loading' | 'ready' | 'empty';

export interface FeedState {
  status: FeedStatus;
  posts: Post[];
}

/**
 * Zoneless feed store (design: "Store own signals; responses MUST land via
 * `.set()` so the zone paints"). Every gateway promise resolves into
 * `state.set(...)` — nothing else can move the view, so a missing `.set()` is
 * a visible bug rather than a silent one.
 */
@Injectable({ providedIn: 'root' })
export class FeedStore {
  private readonly gateway = inject(FEED_GATEWAY);

  readonly state = signal<FeedState>({ status: 'idle', posts: [] });

  readonly status = computed(() => this.state().status);
  readonly posts = computed(() => this.state().posts);

  async load(): Promise<void> {
    this.state.set({ status: 'loading', posts: [] });
    const page = await this.gateway.timeline();
    this.state.set({ status: page.items.length ? 'ready' : 'empty', posts: page.items });
  }
}
