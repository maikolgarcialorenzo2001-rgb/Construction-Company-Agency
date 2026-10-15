import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ENGAGEMENT_GATEWAY } from '../api/ports';
import type { EngagementGateway, EngagementState } from '../api/ports';
import { EngagementStore } from './engagement.store';

/**
 * Zoneless paint harness (same contract as `feed.store.spec.ts`): the template
 * only repaints because the store writes its signal via `.set()`. The buttons
 * read the selectors in the binding, exactly like the post template will.
 */
@Component({
  selector: 'app-engagement-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      data-testid="like"
      [attr.aria-pressed]="store.isLiked(viewerId, 'post-1')"
      (click)="onLike()"
    >
      Me gusta
    </button>
    <span data-testid="following">{{ store.isFollowing(viewerId, 'company-2') }}</span>
    <span data-testid="saved">{{ store.isSaved(viewerId, 'post-1') }}</span>
  `
})
class EngagementHarness {
  readonly store = inject(EngagementStore);
  viewerId: string | null = 'worker-1';

  onLike(): void {
    void this.store.toggleLike(this.viewerId ?? '', 'post-1');
  }
}

/** Minimal adapter driven by an in-memory state, so tests control every read. */
const adapterWith = (initial: EngagementState = {}): EngagementGateway => {
  let state = initial;
  const flip = (
    viewerId: string,
    set: 'following' | 'liked' | 'saved',
    id: string
  ): EngagementState => {
    const snapshot = state[viewerId] ?? { following: [], liked: [], saved: [] };
    const ids = snapshot[set];
    state = {
      ...state,
      [viewerId]: {
        ...snapshot,
        [set]: ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
      }
    };
    return state;
  };
  return {
    load: async () => state,
    toggleFollow: async (viewerId, authorId) => flip(viewerId, 'following', authorId),
    toggleLike: async (viewerId, postId) => flip(viewerId, 'liked', postId),
    toggleSave: async (viewerId, postId) => flip(viewerId, 'saved', postId)
  };
};

describe('EngagementStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('guards load so repeated calls read the gateway once, then paints the state', async () => {
    let loadCalls = 0;
    const seeded: EngagementState = {
      'worker-1': { following: ['company-2'], liked: ['post-1'], saved: [] }
    };
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, {
      useValue: {
        ...adapterWith(seeded),
        load: async () => {
          loadCalls++;
          return seeded;
        }
      }
    });

    const store = TestBed.inject(EngagementStore);
    await store.load();
    await store.load();

    expect(loadCalls).toBe(1);
    expect(store.isFollowing('worker-1', 'company-2')).toBe(true);
    expect(store.isLiked('worker-1', 'post-1')).toBe(true);
  });

  it('flips the selector in the same tick the toggle resolves', async () => {
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: adapterWith() });
    const store = TestBed.inject(EngagementStore);
    await store.load();

    expect(store.isLiked('worker-1', 'post-1')).toBe(false);

    await store.toggleLike('worker-1', 'post-1');

    expect(store.isLiked('worker-1', 'post-1')).toBe(true);
    await store.toggleLike('worker-1', 'post-1');
    expect(store.isLiked('worker-1', 'post-1')).toBe(false);
  });

  it('reads a null viewer as not engaged on every selector', async () => {
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, {
      useValue: adapterWith({ 'worker-1': { following: [], liked: ['post-1'], saved: [] } })
    });
    const store = TestBed.inject(EngagementStore);
    await store.load();

    expect(store.isFollowing(null, 'company-2')).toBe(false);
    expect(store.isLiked(null, 'post-1')).toBe(false);
    expect(store.isSaved(null, 'post-1')).toBe(false);
  });

  it('routes follow, like and save through the gateway so the adapter owns persistence', async () => {
    const calls: string[] = [];
    const adapter = adapterWith();
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, {
      useValue: {
        load: adapter.load,
        toggleFollow: (viewerId: string, authorId: string) => {
          calls.push(`follow:${authorId}`);
          return adapter.toggleFollow(viewerId, authorId);
        },
        toggleLike: (viewerId: string, postId: string) => {
          calls.push(`like:${postId}`);
          return adapter.toggleLike(viewerId, postId);
        },
        toggleSave: (viewerId: string, postId: string) => {
          calls.push(`save:${postId}`);
          return adapter.toggleSave(viewerId, postId);
        }
      }
    });
    const store = TestBed.inject(EngagementStore);
    await store.load();

    await store.toggleFollow('worker-1', 'company-2');
    await store.toggleLike('worker-1', 'post-9');
    await store.toggleSave('worker-1', 'post-3');

    expect(calls).toEqual(['follow:company-2', 'like:post-9', 'save:post-3']);
    expect(store.isFollowing('worker-1', 'company-2')).toBe(true);
    expect(store.isLiked('worker-1', 'post-9')).toBe(true);
    expect(store.isSaved('worker-1', 'post-3')).toBe(true);
  });

  it('repaints the zoneless view after a toggle lands in a signal', async () => {
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: adapterWith() });
    const store = TestBed.inject(EngagementStore);
    await store.load();

    const fixture = TestBed.createComponent(EngagementHarness);
    fixture.detectChanges();

    const like = fixture.nativeElement.querySelector('[data-testid="like"]') as HTMLButtonElement;
    expect(like.getAttribute('aria-pressed')).toBe('false');

    like.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.isLiked('worker-1', 'post-1')).toBe(true);
    expect(like.getAttribute('aria-pressed')).toBe('true');
  });
});
