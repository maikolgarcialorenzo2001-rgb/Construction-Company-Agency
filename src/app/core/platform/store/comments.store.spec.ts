import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { COMMENTS_GATEWAY } from '../api/ports';
import type { Comment } from '../domain';
import { COMMENTS } from '../mocks/fixtures';
import { CommentsStore, type CommentsState } from './comments.store';

/**
 * Zoneless paint harness (same contract as `feed.store.spec.ts`): a single
 * fixed-post computed — never one per post inside a view `@for`. Every
 * scenario drives `detectChanges` + `whenStable` exactly like the feed page
 * will against `CommentsStore.state()[post.id]`.
 */
@Component({
  selector: 'app-comments-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (postState()?.status === 'loading') {
      <p>Cargando comentarios…</p>
    } @else if (postState()?.status === 'empty') {
      <p>Sin comentarios todavía.</p>
    } @else if (postState()?.status === 'ready') {
      <ul>
        @for (comment of postState()?.comments ?? []; track comment.id) {
          <li>{{ comment.body }}</li>
        }
      </ul>
    }
  `
})
class CommentsHarness {
  readonly store = inject(CommentsStore);
  postId = 'post-1';
  readonly postState = computed<CommentsState | undefined>(() => this.store.state()[this.postId]);
}

describe('CommentsStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts idle and paints nothing for an unvisited post', () => {
    const store = TestBed.inject(CommentsStore);
    const fixture = TestBed.createComponent(CommentsHarness);
    fixture.detectChanges();

    expect(store.state()['post-1']).toBeUndefined();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(0);
    expect(element.textContent?.trim()).toBe('');
  });

  it('lands the loaded thread in a signal so the zoneless view paints, loading then ready', async () => {
    const store = TestBed.inject(CommentsStore);
    const fixture = TestBed.createComponent(CommentsHarness);
    fixture.detectChanges();

    const pending = store.load('post-1');
    fixture.detectChanges();

    expect(store.state()['post-1']?.status).toBe('loading');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando comentarios');

    await pending;
    await fixture.whenStable();
    fixture.detectChanges();

    const state = store.state()['post-1'];
    expect(state?.status).toBe('ready');
    expect(state?.comments.map((comment) => comment.id)).toEqual(['comment-1', 'comment-2']);

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Buen punto, comparto la misma inquietud.');
  });

  it('settles on the empty state for a post without comments', async () => {
    const store = TestBed.inject(CommentsStore);
    const fixture = TestBed.createComponent(CommentsHarness);
    fixture.componentInstance.postId = 'post-2';
    fixture.detectChanges();

    await store.load('post-2');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.state()['post-2']?.status).toBe('empty');
    expect(store.state()['post-2']?.comments).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Sin comentarios todavía.'
    );
  });

  it('guards repeated loads so the gateway is called once per post', async () => {
    let listCalls = 0;
    TestBed.overrideProvider(COMMENTS_GATEWAY, {
      useValue: {
        list: async (postId: string): Promise<Comment[]> => {
          listCalls++;
          return COMMENTS.filter((comment) => comment.postId === postId);
        },
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(CommentsStore);

    const first = store.load('post-1');
    const second = store.load('post-1'); // already loading → guarded
    await Promise.all([first, second]);
    const third = store.load('post-1'); // already ready → guarded
    await third;

    expect(listCalls).toBe(1);
    expect(store.state()['post-1']?.status).toBe('ready');
    expect(store.state()['post-1']?.comments).toHaveLength(2);
  });

  it('appends a created comment, re-sorts chronologically and stays ready', async () => {
    TestBed.overrideProvider(COMMENTS_GATEWAY, {
      useValue: {
        list: async (): Promise<Comment[]> => [COMMENTS[0], COMMENTS[1]],
        create: async (input: { postId: string; body: string }): Promise<Comment> => ({
          id: 'comment-new-1',
          postId: input.postId,
          authorId: 'worker-1',
          authorName: 'Demo Worker',
          authorRole: 'worker',
          body: input.body,
          // Earlier than the seeded comments: sorting must put it first.
          createdAt: '2025-09-30T08:00:00.000Z'
        })
      }
    });

    const store = TestBed.inject(CommentsStore);
    await store.load('post-1');

    await store.add('post-1', 'Comentario nuevo con fecha anterior');

    const state = store.state()['post-1'];
    expect(state?.status).toBe('ready');
    expect(state?.comments.map((comment) => comment.id)).toEqual([
      'comment-new-1',
      'comment-1',
      'comment-2'
    ]);
    expect(state?.comments[0].body).toBe('Comentario nuevo con fecha anterior');
  });

  it('ignores whitespace-only submissions without calling the gateway', async () => {
    let createCalls = 0;
    TestBed.overrideProvider(COMMENTS_GATEWAY, {
      useValue: {
        list: async (): Promise<Comment[]> => [COMMENTS[0]],
        create: async (): Promise<Comment> => {
          createCalls++;
          throw new Error('should not be reached');
        }
      }
    });

    const store = TestBed.inject(CommentsStore);
    await store.load('post-1');

    await store.add('post-1', '   ');

    expect(createCalls).toBe(0);
    expect(store.state()['post-1']?.status).toBe('ready');
    expect(store.state()['post-1']?.comments).toHaveLength(1);
  });

  it('keeps the previous state when a load fails and allows a retry', async () => {
    let fail = true;
    TestBed.overrideProvider(COMMENTS_GATEWAY, {
      useValue: {
        list: async (postId: string): Promise<Comment[]> => {
          if (fail) {
            fail = false;
            throw new Error('red de mentira');
          }
          return COMMENTS.filter((comment) => comment.postId === postId);
        },
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(CommentsStore);
    const fixture = TestBed.createComponent(CommentsHarness);
    fixture.detectChanges();

    await store.load('post-1');

    expect(store.state()['post-1']?.status).toBe('empty');
    expect(store.state()['post-1']?.comments).toEqual([]);

    // Status 'empty' is not guarded, so a retry is allowed and succeeds.
    await store.load('post-1');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.state()['post-1']?.status).toBe('ready');
    expect(store.state()['post-1']?.comments.map((comment) => comment.id)).toEqual([
      'comment-1',
      'comment-2'
    ]);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('li')).toHaveLength(2);
  });
});