import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { FEED_GATEWAY } from '../api/ports';
import type { Page, Post } from '../domain';
import { FEED_POSTS } from '../mocks/fixtures';
import { FeedStore } from './feed.store';

/**
 * Zoneless paint harness: the template only ever updates because the store
 * writes signals via `.set()` — there is no zone.js to force change detection.
 * Every scenario drives `detectChanges` + `whenStable` exactly like the pages
 * will.
 */
@Component({
  selector: 'app-feed-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.status() === 'loading') {
      <p>Cargando novedades…</p>
    } @else if (store.status() === 'empty') {
      <p>No hay novedades todavía.</p>
    } @else if (store.status() === 'ready') {
      <ul>
        @for (post of store.posts(); track post.id) {
          <li>{{ post.content }}</li>
        }
      </ul>
    }
  `
})
class FeedHarness {
  readonly store = inject(FeedStore);
}

describe('FeedStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts idle and paints nothing before the first load', () => {
    const store = TestBed.inject(FeedStore);
    const fixture = TestBed.createComponent(FeedHarness);
    fixture.detectChanges();

    expect(store.status()).toBe('idle');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(0);
    expect(element.textContent?.trim()).toBe('');
  });

  it('lands the async timeline in a signal so the zoneless view paints', async () => {
    const store = TestBed.inject(FeedStore);
    const fixture = TestBed.createComponent(FeedHarness);
    fixture.detectChanges();

    await store.load();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.status()).toBe('ready');
    expect(store.posts()).toHaveLength(FEED_POSTS.length);

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(items).toHaveLength(FEED_POSTS.length);
    expect(items[0].textContent).toContain('Avance de obra en Villa Crespo');
  });

  it('shows the loading state while the gateway is still pending', async () => {
    let resolveTimeline!: (page: Page<Post>) => void;
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: () =>
          new Promise<Page<Post>>((resolve) => {
            resolveTimeline = resolve;
          }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(FeedStore);
    const fixture = TestBed.createComponent(FeedHarness);
    fixture.detectChanges();

    const pending = store.load();
    fixture.detectChanges();

    expect(store.status()).toBe('loading');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando novedades');

    resolveTimeline({ items: [FEED_POSTS[0]], meta: { page: 1, pageSize: 20, total: 1 } });
    await pending;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.status()).toBe('ready');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('li')).toHaveLength(1);
    expect(element.textContent).toContain('Avance de obra en Villa Crespo');
  });

  it('settles on the empty state when the timeline has no posts', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [],
          meta: { page: 1, pageSize: 20, total: 0 }
        }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const store = TestBed.inject(FeedStore);
    const fixture = TestBed.createComponent(FeedHarness);
    fixture.detectChanges();

    await store.load();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(store.status()).toBe('empty');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay novedades todavía');
  });

  it('prepends a created post to the timeline and clears the empty state', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [FEED_POSTS[0]],
          meta: { page: 1, pageSize: 20, total: 1 }
        }),
        create: async (input: { content: string }): Promise<Post> => ({
          id: 'post-new-1',
          authorId: 'company-1',
          content: input.content,
          createdAt: '2026-10-09T12:00:00.000Z'
        })
      }
    });

    const store = TestBed.inject(FeedStore);
    await store.load();
    expect(store.posts()).toHaveLength(1);

    await store.create('Arrancamos la instalación de sanitarias en Palermo.');

    expect(store.status()).toBe('ready');
    const posts = store.posts();
    expect(posts).toHaveLength(2);
    expect(posts[0].content).toBe('Arrancamos la instalación de sanitarias en Palermo.');
    expect(posts[0].id).toBe('post-new-1');
    expect(posts[1].id).toBe(FEED_POSTS[0].id);
  });

  it('promotes an empty timeline to ready when the first post is created', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [],
          meta: { page: 1, pageSize: 20, total: 0 }
        }),
        create: async (input: { content: string }): Promise<Post> => ({
          id: 'post-new-1',
          authorId: 'company-1',
          content: input.content,
          createdAt: '2026-10-09T12:00:00.000Z'
        })
      }
    });

    const store = TestBed.inject(FeedStore);
    await store.load();
    expect(store.status()).toBe('empty');

    await store.create('Primer aviso de la empresa.');

    expect(store.status()).toBe('ready');
    expect(store.posts()).toHaveLength(1);
    expect(store.posts()[0].content).toBe('Primer aviso de la empresa.');
  });
});
