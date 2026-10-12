import { inject, Injectable, signal } from '@angular/core';

import { COMMENTS_GATEWAY } from '../api/ports';
import type { Comment } from '../domain';

/** Lifecycle of one post's thread: idle → loading → ready | empty. */
export type CommentsStatus = 'idle' | 'loading' | 'ready' | 'empty';

export interface CommentsState {
  status: CommentsStatus;
  comments: Comment[];
}

/**
 * Zoneless, per-post comments store (design: "indexed by post"). State is a
 * `signal<Record<string, CommentsState>>` keyed by post id, so each thread
 * keeps its own status and the feed page reads `state()[post.id]` directly —
 * never a per-post `computed` inside the `@for`.
 *
 * `load` is guarded (no-op while `loading` or `ready`) so the feed's effect
 * cannot start re-load loops. `add` appends the gateway-created comment and
 * re-sorts the thread by `createdAt`.
 */
@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly gateway = inject(COMMENTS_GATEWAY);

  readonly state = signal<Record<string, CommentsState>>({});

  async load(postId: string): Promise<void> {
    const current = this.state()[postId];
    // Guard: avoid re-loading if already loading or ready (prevents effect loops).
    if (current?.status === 'loading' || current?.status === 'ready') return;
    this.state.update((s) => ({
      ...s,
      [postId]: { status: 'loading', comments: current?.comments ?? [] }
    }));
    try {
      const comments = await this.gateway.list(postId);
      const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      this.state.update((s) => ({
        ...s,
        [postId]: { status: sorted.length ? 'ready' : 'empty', comments: sorted }
      }));
    } catch {
      // Demo-only: keep the previous state (or fall back to empty); the spec
      // requires no error UI, and status 'empty' still allows a retry.
      this.state.update((s) => ({
        ...s,
        [postId]: {
          status: current && current.comments.length ? 'ready' : 'empty',
          comments: current?.comments ?? []
        }
      }));
    }
  }

  async add(postId: string, body: string): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) return;
    const created = await this.gateway.create({ postId, body: trimmed });
    this.state.update((s) => {
      const prev = s[postId] ?? { status: 'ready', comments: [] };
      const nextComments = [...prev.comments, created].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      return { ...s, [postId]: { status: 'ready', comments: nextComments } };
    });
  }
}