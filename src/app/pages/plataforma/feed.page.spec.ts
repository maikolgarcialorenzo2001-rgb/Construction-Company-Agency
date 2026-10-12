import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { COMMENTS_GATEWAY, FEED_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import type { Comment, Page, Post } from '../../core/platform/domain';
import { COMMENTS, FEED_POSTS } from '../../core/platform/mocks/fixtures';
import { PlatformFeedPage } from './feed.page';

/** Seeds a local mock session, as `SessionService` would after login. */
const seedSession = (role: 'worker' | 'company'): void =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'mock-token',
      user: { userId: role === 'company' ? 'company-1' : 'worker-1', email: 'demo@test', role }
    })
  );

/**
 * Zoneless page tests: every scenario drives `detectChanges` + `whenStable`
 * exactly like the store harness, because the page fires `load()` on creation
 * and only a `.set()` in the store can paint the view.
 */
describe('PlatformFeedPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders the timeline once the gateway resolves', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    expect(items).toHaveLength(FEED_POSTS.length);
    expect(items[0].textContent).toContain('Avance de obra en Villa Crespo');
    expect(items[1].textContent).toContain('Buscamos electricista matriculado');
  });

  it('shows the loading state while the timeline is pending', async () => {
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

    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando novedades');

    resolveTimeline({ items: [FEED_POSTS[0]], meta: { page: 1, pageSize: 20, total: 1 } });
    await fixture.whenStable();
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Avance de obra en Villa Crespo');
  });

  it('shows the empty state when the timeline has no posts', async () => {
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

    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay novedades todavía');
  });

  it('shows the composer only for the company role', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'company');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="feed-composer"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="feed-publish"]')).not.toBeNull();
  });

  it('hides the composer from a worker', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="feed-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="feed-publish"]')).toBeNull();
  });

  it('hides the composer from an anonymous visitor (no role)', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="feed-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="feed-publish"]')).toBeNull();
  });

  it('publishes a post to the top of the timeline as company', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'company');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textarea = element.querySelector(
      '[data-testid="feed-composer"] textarea'
    ) as HTMLTextAreaElement;
    textarea.value = 'Arrancamos la instalación de sanitarias en Palermo.';
    textarea.dispatchEvent(new Event('input'));

    (element.querySelector('[data-testid="feed-publish"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const items = element.querySelectorAll('[data-testid="feed-post"]');
    expect(items).toHaveLength(FEED_POSTS.length + 1);
    expect(items[0].textContent).toContain('Arrancamos la instalación de sanitarias en Palermo.');
    expect(textarea.value).toBe('');
  });

  it('does not publish an empty post', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'company');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textarea = element.querySelector(
      '[data-testid="feed-composer"] textarea'
    ) as HTMLTextAreaElement;
    textarea.value = '   ';
    textarea.dispatchEvent(new Event('input'));

    (element.querySelector('[data-testid="feed-publish"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelectorAll('[data-testid="feed-post"]')).toHaveLength(FEED_POSTS.length);
  });

  it('shows the composer from a company session without an explicit role input', async () => {
    seedSession('company');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="feed-composer"]')
    ).not.toBeNull();
  });

  it('hides the composer from a worker session without an explicit role input', async () => {
    seedSession('worker');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="feed-composer"]')
    ).toBeNull();
  });

  // --- Inline comment thread (WU3) -------------------------------------------

  it('renders an inline comment thread per post from the seeded fixtures', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    // The posts paint first, then the effect kicks the per-post comment loads;
    // their resolution needs one more flush before the threads paint.
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const posts = element.querySelectorAll('[data-testid="feed-post"]');
    expect(element.querySelectorAll('[data-testid="comment-thread"]')).toHaveLength(
      FEED_POSTS.length
    );

    // post-1 seeds 2 comments (worker + company), in createdAt order.
    const postOne = posts[0];
    expect(postOne.querySelectorAll('[data-testid="comment"]')).toHaveLength(2);
    expect(postOne.textContent).toContain('Buen punto, comparto la misma inquietud.');
    expect(postOne.textContent).toContain('Constructora Norte');
    expect(postOne.textContent).toContain('Te respondemos por interno para coordinar.');

    // post-2 seeds 0 comments: the empty state, not a bare list.
    const postTwo = posts[1];
    expect(postTwo.querySelectorAll('[data-testid="comment"]')).toHaveLength(0);
    expect(postTwo.querySelector('[data-testid="comment-empty"]')).not.toBeNull();

    // post-3 seeds 1 comment.
    const postThree = posts[2];
    expect(postThree.querySelectorAll('[data-testid="comment"]')).toHaveLength(1);
    expect(postThree.textContent).toContain('Gracias por el aviso.');
  });

  it('shows a loading state inside each thread while its comments are pending', async () => {
    const resolvers = new Map<string, (comments: Comment[]) => void>();
    TestBed.overrideProvider(COMMENTS_GATEWAY, {
      useValue: {
        list: (postId: string) =>
          new Promise<Comment[]>((resolve) => {
            resolvers.set(postId, resolve);
          }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[data-testid="comment-loading"]')).toHaveLength(
      FEED_POSTS.length
    );

    for (const post of FEED_POSTS) {
      resolvers.get(post.id)?.([...COMMENTS].filter((c) => c.postId === post.id));
    }
    await fixture.whenStable();
    fixture.detectChanges();

    const posts = element.querySelectorAll('[data-testid="feed-post"]');
    expect(posts[0].querySelectorAll('[data-testid="comment"]')).toHaveLength(2);
    expect(posts[1].querySelector('[data-testid="comment-empty"]')).not.toBeNull();
    expect(posts[2].querySelectorAll('[data-testid="comment"]')).toHaveLength(1);
  });

  it('shows a comment composer on every post for each authenticated role', async () => {
    for (const role of ['worker', 'company', 'admin'] as const) {
      const fixture = TestBed.createComponent(PlatformFeedPage);
      fixture.componentRef.setInput('role', role);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const composers = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="comment-composer"]'
      );
      expect(composers, `${role} comment composers`).toHaveLength(FEED_POSTS.length);
      fixture.destroy();
    }
  });

  it('hides the comment composer from an anonymous visitor', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[data-testid="comment-composer"]')).toHaveLength(0);
  });

  it('gives every composer a unique control id bound to a real label', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textareas = Array.from(
      element.querySelectorAll('[data-testid="comment-composer"] textarea')
    ) as HTMLTextAreaElement[];
    expect(textareas).toHaveLength(FEED_POSTS.length);

    const ids = textareas.map((textarea) => textarea.id);
    expect(ids).toEqual(FEED_POSTS.map((post) => `comment-content-${post.id}`));

    for (const textarea of textareas) {
      const label = element.querySelector(`label[for="${textarea.id}"]`);
      expect(label, `label bound to ${textarea.id}`).not.toBeNull();
    }
  });

  it('renders no duplicate element ids across the feed', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const ids = Array.from(element.querySelectorAll('[id]')).map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('comment-content-post-1');
  });

  it('marks each comment thread as a polite live region', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const threads = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="comment-thread"]')
    );
    expect(threads).toHaveLength(FEED_POSTS.length);

    for (const thread of threads) {
      expect(thread.getAttribute('aria-live'), 'thread live region').toBe('polite');
    }
  });

  it('appends a comment to the thread when an authenticated user submits a composer', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const form = element.querySelector('[data-testid="comment-composer"]') as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Coordinemos el lunes a las 8.';
    textarea.dispatchEvent(new Event('input'));

    (form.querySelector('[data-testid="comment-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const postOne = element.querySelector('[data-testid="feed-post"]') as HTMLElement;
    expect(postOne.querySelectorAll('[data-testid="comment"]')).toHaveLength(3);
    expect(postOne.textContent).toContain('Coordinemos el lunes a las 8.');
    expect(textarea.value).toBe('');
  });
});
