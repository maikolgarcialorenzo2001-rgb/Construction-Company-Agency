import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ENGAGEMENT_STORAGE_KEY, MockEngagementGateway } from './mock-engagement.gateway';
import { ENGAGEMENT_GATEWAY } from './ports';

type StoredBlob = { v: number; state: Record<string, unknown> } | null;

/** Seeds the demo blob, mirroring the `SessionService` spec helpers. */
const seedBlob = (state: Record<string, unknown>, v = 1): void => {
  localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify({ v, state }));
};

const readBlob = (): StoredBlob =>
  JSON.parse(localStorage.getItem(ENGAGEMENT_STORAGE_KEY) ?? 'null') as StoredBlob;

/**
 * Strict-mode RED for WU2 task 2.3: the adapter must persist follow/like/save
 * under a `{v:1}` envelope, degrade to `{}` on corrupt input or missing
 * storage, and never throw. Every case seeds its own starting blob so the
 * specs do not depend on execution order.
 */
describe('MockEngagementGateway', () => {
  beforeEach(() => {
    // The token is `providedIn: 'root'` and caches one adapter per file, so
    // reset the injector: every case gets a fresh instance.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // Restore the real binding FIRST: the SSR case leaves `localStorage`
    // stubbed to `undefined`, which `removeItem` below would trip over.
    vi.unstubAllGlobals();
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
  });

  it('adds a follow edge to the viewer snapshot and persists the envelope', async () => {
    const gateway = new MockEngagementGateway();

    const state = await gateway.toggleFollow('worker-1', 'company-2');

    expect(state).toEqual({
      'worker-1': { following: ['company-2'], liked: [], saved: [] }
    });
    expect(readBlob()).toEqual({
      v: 1,
      state: { 'worker-1': { following: ['company-2'], liked: [], saved: [] } }
    });
  });

  it('removes the edge when the same author is toggled twice', async () => {
    const gateway = new MockEngagementGateway();

    const followed = await gateway.toggleFollow('worker-1', 'company-2');
    const unfollowed = await gateway.toggleFollow('worker-1', 'company-2');

    expect(followed['worker-1']?.following).toEqual(['company-2']);
    expect(unfollowed['worker-1']?.following).toEqual([]);
    expect((await gateway.load())['worker-1']?.following).toEqual([]);
  });

  it('keys like and save by viewer and post, independently of each other', async () => {
    const gateway = new MockEngagementGateway();

    await gateway.toggleLike('worker-1', 'post-1');
    await gateway.toggleLike('worker-1', 'post-2');
    const saved = await gateway.toggleSave('worker-1', 'post-2');

    expect(saved['worker-1']?.liked).toEqual(['post-1', 'post-2']);
    expect(saved['worker-1']?.saved).toEqual(['post-2']);

    const unliked = await gateway.toggleLike('worker-1', 'post-1');
    expect(unliked['worker-1']?.liked).toEqual(['post-2']);
    expect(unliked['worker-1']?.saved).toEqual(['post-2']);
  });

  it('keeps each viewer snapshot isolated from the others', async () => {
    const gateway = new MockEngagementGateway();

    await gateway.toggleFollow('worker-1', 'company-2');
    const state = await gateway.toggleLike('company-2', 'post-1');

    expect(state['worker-1']).toEqual({ following: ['company-2'], liked: [], saved: [] });
    expect(state['company-2']).toEqual({ following: [], liked: ['post-1'], saved: [] });
  });

  it('re-hydrates a stored follow edge through a fresh instance, like a reload', async () => {
    seedBlob({ 'worker-1': { following: ['company-2'], liked: [], saved: [] } });

    const reloaded = await new MockEngagementGateway().load();

    expect(reloaded['worker-1']?.following).toEqual(['company-2']);
  });

  it('returns an empty state when the stored JSON is corrupt', async () => {
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, 'not-json{');

    const state = await new MockEngagementGateway().load();

    expect(state).toEqual({});
  });

  it('starts empty and keeps toggling without a throw when storage is absent (SSR)', async () => {
    vi.stubGlobal('localStorage', undefined);
    const gateway = new MockEngagementGateway();

    // No storage at all: reads degrade to `{}` and writes are no-ops, so a
    // toggle still resolves (the store can land it) but nothing persists.
    expect(await gateway.load()).toEqual({});
    const toggled = await gateway.toggleLike('worker-1', 'post-1');
    expect(toggled['worker-1']?.liked).toEqual(['post-1']);
    expect(await gateway.load()).toEqual({});
  });

  it('returns an empty state when the stored version is not the current one', async () => {
    seedBlob({ 'worker-1': { following: [], liked: ['post-1'], saved: [] } }, 2);

    const state = await new MockEngagementGateway().load();

    expect(state).toEqual({});
  });

  it('collapses a malformed snapshot into an empty one instead of throwing', async () => {
    seedBlob({ 'worker-1': { following: 'nope', liked: [1, 'post-1'], saved: null } });

    const state = await new MockEngagementGateway().load();

    expect(state['worker-1']).toEqual({ following: [], liked: ['post-1'], saved: [] });
  });

  it('drops a stored envelope whose state is missing or not an object', async () => {
    seedBlob(undefined as unknown as Record<string, unknown>);
    expect(await new MockEngagementGateway().load()).toEqual({});

    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify({ v: 1 }));
    expect(await new MockEngagementGateway().load()).toEqual({});

    seedBlob(42 as unknown as Record<string, unknown>);
    expect(await new MockEngagementGateway().load()).toEqual({});
  });

  it('resolves ENGAGEMENT_GATEWAY to the localStorage-backed adapter by default', async () => {
    const engagement = TestBed.inject(ENGAGEMENT_GATEWAY);

    expect(engagement).toBeInstanceOf(MockEngagementGateway);

    const state = await engagement.toggleSave('worker-1', 'post-1');

    expect(state['worker-1']?.saved).toEqual(['post-1']);
    expect(readBlob()?.state).toEqual(state);
  });
});
