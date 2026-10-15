import { inject, Injectable, signal } from '@angular/core';

import { ENGAGEMENT_GATEWAY } from '../api/ports';
import type { EngagementSnapshot, EngagementState } from '../api/ports';

const emptySnapshot = (): EngagementSnapshot => ({ following: [], liked: [], saved: [] });

/**
 * Zoneless engagement store (design D3/D5): follow/like/save state lives in one
 * `signal<EngagementState>` and every mutation lands through `.set()` after the
 * gateway resolves — the adapter owns the flip and the persistence, the store
 * only mirrors the result. There is no optimistic update and no rollback path.
 *
 * `load` is guarded so the page's one-shot ctor call cannot spin (the demo
 * adapter is synchronous, so a repeated call would otherwise re-read storage on
 * every change-detection pass). Selectors read `state()` directly in template
 * bindings; a `null` viewer is never engaged.
 */
@Injectable({ providedIn: 'root' })
export class EngagementStore {
  private readonly gateway = inject(ENGAGEMENT_GATEWAY);

  readonly state = signal<EngagementState>({});

  private loaded = false;
  private loading: Promise<void> | null = null;

  /** One-shot read of the persisted engagement; safe to call repeatedly. */
  load(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }
    if (this.loading) {
      return this.loading;
    }
    this.loading = this.gateway.load().then((state) => {
      this.state.set(state);
      this.loaded = true;
      this.loading = null;
    });
    return this.loading;
  }

  isFollowing(viewerId: string | null, authorId: string): boolean {
    return this.has(viewerId, 'following', authorId);
  }

  isLiked(viewerId: string | null, postId: string): boolean {
    return this.has(viewerId, 'liked', postId);
  }

  isSaved(viewerId: string | null, postId: string): boolean {
    return this.has(viewerId, 'saved', postId);
  }

  async toggleFollow(viewerId: string, authorId: string): Promise<void> {
    this.state.set(await this.gateway.toggleFollow(viewerId, authorId));
  }

  async toggleLike(viewerId: string, postId: string): Promise<void> {
    this.state.set(await this.gateway.toggleLike(viewerId, postId));
  }

  async toggleSave(viewerId: string, postId: string): Promise<void> {
    this.state.set(await this.gateway.toggleSave(viewerId, postId));
  }

  private has(
    viewerId: string | null,
    set: keyof EngagementSnapshot,
    id: string
  ): boolean {
    if (!viewerId) {
      return false;
    }
    const snapshot = this.state()[viewerId] ?? emptySnapshot();
    return snapshot[set].includes(id);
  }
}
