import type { EngagementGateway, EngagementSnapshot, EngagementState } from './ports';

/** `localStorage` key of the persisted demo engagement. Exported for tests. */
export const ENGAGEMENT_STORAGE_KEY = 'constructora.platform.engagement';

/** Version of the stored envelope; a bump invalidates older blobs. */
const ENVELOPE_VERSION = 1;

interface EngagementEnvelope {
  v: number;
  state: EngagementState;
}

/**
 * A fresh object every time — never a shared const: `toggle` writes into the
 * state it reads, and a module-level `{}` would leak one viewer's snapshot
 * into every later "empty" read.
 */
const emptyState = (): EngagementState => ({});

const emptySnapshot = (): EngagementSnapshot => ({ following: [], liked: [], saved: [] });

/** `localStorage` is undefined during SSR/prerender; the port stays callable. */
const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Accepts only string arrays; anything else collapses to an empty snapshot. */
const toSnapshot = (value: unknown): EngagementSnapshot => {
  if (typeof value !== 'object' || value === null) {
    return emptySnapshot();
  }
  const candidate = value as Partial<Record<keyof EngagementSnapshot, unknown>>;
  const ids = (list: unknown): string[] =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  return {
    following: ids(candidate.following),
    liked: ids(candidate.liked),
    saved: ids(candidate.saved)
  };
};

/** Reads the envelope defensively: absent, corrupt or foreign → empty state. */
const readState = (): EngagementState => {
  const store = storage();
  if (!store) {
    return emptyState();
  }
  try {
    const raw = store.getItem(ENGAGEMENT_STORAGE_KEY);
    if (!raw) {
      return emptyState();
    }
    const envelope = JSON.parse(raw) as Partial<EngagementEnvelope> | null;
    if (envelope?.v !== ENVELOPE_VERSION || typeof envelope.state !== 'object' || !envelope.state) {
      return emptyState();
    }
    const state: EngagementState = {};
    for (const [viewerId, snapshot] of Object.entries(envelope.state)) {
      state[viewerId] = toSnapshot(snapshot);
    }
    return state;
  } catch {
    return emptyState();
  }
};

const writeState = (state: EngagementState): void => {
  const store = storage();
  if (!store) {
    return;
  }
  const envelope: EngagementEnvelope = { v: ENVELOPE_VERSION, state };
  store.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(envelope));
};

const toggleInSet = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];

/**
 * localStorage-backed `EngagementGateway` (design D3): each `toggle*` flips one
 * id in one set, persists the whole state and resolves the FULL
 * `EngagementState`, so the store never touches storage itself and a future
 * HTTP swap stays provider-only.
 *
 * The blob is demo-only; a reload re-hydrates through a fresh `load()`. Reads
 * and writes are best-effort: SSR and corrupt input degrade to `{}` without
 * ever throwing.
 */
export class MockEngagementGateway implements EngagementGateway {
  async load(): Promise<EngagementState> {
    return { ...readState() };
  }

  async toggleFollow(viewerId: string, authorId: string): Promise<EngagementState> {
    return this.toggle(viewerId, 'following', authorId);
  }

  async toggleLike(viewerId: string, postId: string): Promise<EngagementState> {
    return this.toggle(viewerId, 'liked', postId);
  }

  async toggleSave(viewerId: string, postId: string): Promise<EngagementState> {
    return this.toggle(viewerId, 'saved', postId);
  }

  private toggle(
    viewerId: string,
    set: keyof EngagementSnapshot,
    id: string
  ): Promise<EngagementState> {
    const state = readState();
    const snapshot = state[viewerId] ?? emptySnapshot();
    state[viewerId] = { ...snapshot, [set]: toggleInSet(snapshot[set], id) };
    writeState(state);
    return Promise.resolve({ ...state });
  }
}
