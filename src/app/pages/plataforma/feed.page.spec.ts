import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ENGAGEMENT_STORAGE_KEY } from '../../core/platform/api/mock-engagement.gateway';
import type { EngagementState } from '../../core/platform/api/ports';
import { COMMENTS_GATEWAY, FEED_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import type { Comment, Page, Post } from '../../core/platform/domain';
import { COMMENTS, FEED_POSTS } from '../../core/platform/mocks/fixtures';
import { resetJobRequestRegistry } from '../../core/platform/mocks/job-request.registry';
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

/** The persisted engagement envelope (`{v:1, state}`), as the adapter writes it. */
const persistedEngagement = (): EngagementState => {
  const raw = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { state: EngagementState }).state : {};
};

/**
 * Zoneless page tests: every scenario drives `detectChanges` + `whenStable`
 * exactly like the store harness, because the page fires `load()` on creation
 * and only a `.set()` in the store can paint the view.
 */
describe('PlatformFeedPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
    // This spec now creates job-request posts (R1): reset re-seeds the registry.
    resetJobRequestRegistry();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
    resetJobRequestRegistry();
  });

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

  // --- Shared post template (WU4) --------------------------------------------

  it('renders each post through the shared PostTemplateComponent inside the feed-post li', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    expect(items).toHaveLength(FEED_POSTS.length);

    for (const item of items) {
      const templates = item.querySelectorAll('app-post-template');
      expect(templates, 'one template per feed-post').toHaveLength(1);
      expect(item.querySelector('[data-testid="post-header"]')).not.toBeNull();
      expect(item.querySelector('[data-testid="post-actions"]')).not.toBeNull();
      expect(item.querySelector('[data-testid="post-follow"]')?.textContent?.trim()).toBe('Seguir');
    }
  });

  it('shows the denormalized author name and role instead of the raw authorId', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const posts = element.querySelectorAll('[data-testid="feed-post"]');

    // post-1 is authored by company-1 → profile name + es-AR role label.
    expect(posts[0].textContent).toContain('Constructora Norte SAC');
    expect(posts[0].textContent).toContain('Empresa');

    // post-3 is authored by worker-1 → profile name + es-AR role label.
    expect(posts[2].textContent).toContain('Lucía Fernández');
    expect(posts[2].textContent).toContain('Trabajador');

    // No seeded author id may surface as text anywhere in the feed.
    for (const authorId of ['company-1', 'company-2', 'worker-1', 'worker-2', 'worker-3']) {
      expect(element.textContent ?? '').not.toContain(authorId);
    }
  });

  it('renders the media grid from the fixture attachments', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const posts = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );

    // post-6 seeds exactly 10 attachments: the full grid, no overflow hint.
    expect(posts[5].querySelectorAll('[data-testid="post-media"] img')).toHaveLength(10);
    expect(posts[5].querySelector('[data-testid="post-media-overflow"]')).toBeNull();

    // post-9 seeds 1 attachment: a single image.
    expect(posts[8].querySelectorAll('[data-testid="post-media"] img')).toHaveLength(1);

    // post-1 seeds none: the media block hides entirely.
    expect(posts[0].querySelector('[data-testid="post-media"]')).toBeNull();
  });

  // --- Never-empty invariant (WU5) -------------------------------------------

  it('never renders a card for a post with neither text nor image', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [
            {
              id: 'post-renderable',
              authorId: 'worker-1',
              content: 'Avance real con contenido visible.',
              attachments: ['https://cdn.example.test/posts/wu5/avance.webp'],
              createdAt: '2026-10-15T10:00:00.000Z'
            },
            {
              id: 'post-hollow',
              authorId: 'worker-1',
              content: '   ',
              createdAt: '2026-10-15T11:00:00.000Z'
            }
          ],
          meta: { page: 1, pageSize: 20, total: 2 }
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

    const posts = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    // The renderable post shows; the one with neither text nor image is
    // filtered out before any card (or comment thread) paints for it.
    expect(posts).toHaveLength(1);
    expect(posts[0].textContent).toContain('Avance real con contenido visible.');
  });

  it('wires the session viewer into the engagement controls', async () => {
    seedSession('worker');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const posts = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    const like = posts[0].querySelector('[data-testid="post-like"]') as HTMLButtonElement;
    expect(like.getAttribute('aria-pressed')).toBe('false');

    like.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(like.getAttribute('aria-pressed')).toBe('true');
    // The session viewer (worker-1) is the one recorded, end to end through
    // the store and the adapter's persistence.
    expect(persistedEngagement()['worker-1'].liked).toContain('post-1');
  });

  it('never engages an anonymous visitor', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const posts = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    (posts[0].querySelector('[data-testid="post-like"]') as HTMLButtonElement).click();
    (posts[0].querySelector('[data-testid="post-follow"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(posts[0].querySelector('[data-testid="post-like"]')?.getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(
      posts[0].querySelector('[data-testid="post-follow"]')?.getAttribute('aria-pressed')
    ).toBe('false');
    expect(persistedEngagement()).toEqual({});
  });

  // --- Composer gating & publishing ------------------------------------------

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

  // --- Job-request structured card projection (p15 WU2) ----------------------

  it('projects the job-request card into [postExtra] and keeps [postBody] free of structured fields', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const posts = Array.from(
      element.querySelectorAll('[data-testid="feed-post"]')
    ) as HTMLElement[];

    // Both seeded job-request posts (post-10, post-11 tail) render a card.
    const cards = element.querySelectorAll('[data-testid="post-job-request"]');
    expect(cards).toHaveLength(2);

    const jobRequestPost = posts[posts.length - 1]; // post-11
    const card = jobRequestPost.querySelector('[data-testid="post-job-request"]');
    const extra = jobRequestPost.querySelector('[data-testid="post-extra"]');
    expect(card).not.toBeNull();
    expect(extra?.contains(card as Node)).toBe(true);

    // The card owns the structured fields…
    expect(card?.textContent).toContain('Puesto/rubro');
    expect(card?.textContent).toContain('Herrero / estructuras metálicas');

    // …and the body slot keeps only the free text.
    const body = jobRequestPost.querySelector('[data-testid="post-body"]');
    expect(body).not.toBeNull();
    expect(body?.textContent).toContain('Ofrezco servicios de herrería');
    expect(body?.textContent).not.toContain('Puesto/rubro');
    expect(body?.textContent).not.toContain('Herrero / estructuras metálicas');
  });

  it('does not project a job-request card for standard posts', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const standardPost = element.querySelector('[data-testid="feed-post"]') as HTMLElement;

    // post-1 is standard: the always-present postExtra stays empty of cards and
    // the base template (body + actions) renders as before.
    expect(standardPost.querySelector('[data-testid="post-job-request"]')).toBeNull();
    expect(standardPost.querySelector('[data-testid="post-extra"]')).not.toBeNull();
    expect(standardPost.querySelector('[data-testid="post-body"]')?.textContent).toContain(
      'Avance de obra en Villa Crespo'
    );
    expect(standardPost.querySelector('[data-testid="post-actions"]')).not.toBeNull();
  });

  // --- Role-differentiated composer (p15 WU3) --------------------------------

  it('shows the solicitud form to a worker and withholds the company composer', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="job-request-composer"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="feed-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="feed-publish"]')).toBeNull();
  });

  it('keeps the textarea composer for a company and withholds the solicitud form', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'company');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="job-request-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="feed-composer"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="feed-publish"]')).not.toBeNull();
  });

  it('renders no post composer for an admin or an anonymous visitor', async () => {
    for (const role of ['admin', null] as const) {
      const fixture = TestBed.createComponent(PlatformFeedPage);
      if (role !== null) {
        fixture.componentRef.setInput('role', role);
      }
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(
        element.querySelector('[data-testid="job-request-composer"]'),
        `${role} solicitud form`
      ).toBeNull();
      expect(
        element.querySelector('[data-testid="feed-composer"]'),
        `${role} company composer`
      ).toBeNull();
      fixture.destroy();
    }
  });

  it('publishes a worker job-request end to end, authored by the session worker', async () => {
    seedSession('worker');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const composer = element.querySelector(
      '[data-testid="job-request-composer"]'
    ) as HTMLElement;
    const fill = (id: string, value: string): void => {
      const control = composer.querySelector(`#${id}`) as HTMLInputElement;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    fill('job-request-position', 'Herrero');
    fill('job-request-availability', 'Jornada completa');
    fill('job-request-modality', 'Presencial');
    fill('job-request-experience', '5 años');
    fill('job-request-free-text', 'Ofrezco mi servicio para obras industriales.');

    (composer.querySelector('[data-testid="job-request-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const items = element.querySelectorAll('[data-testid="feed-post"]');
    expect(items).toHaveLength(FEED_POSTS.length + 1);
    const first = items[0] as HTMLElement;
    // The structured card renders, so the demo registry holds the payload…
    expect(first.querySelector('[data-testid="post-job-request"]')).not.toBeNull();
    // …the free text rides the body slot…
    expect(first.querySelector('[data-testid="post-body"]')?.textContent).toContain(
      'Ofrezco mi servicio para obras industriales.'
    );
    // …and the author is the session worker (worker-1), denormalized by the mapper.
    expect(first.textContent).toContain('Lucía Fernández');
  });

  it('gives every worker composer control an explicit accessible name and a unique id', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const composer = element.querySelector(
      '[data-testid="job-request-composer"]'
    ) as HTMLElement;
    const controls = Array.from(composer.querySelectorAll('input, textarea, button'));
    // 4 required inputs + texto libre + fotos + submit.
    expect(controls).toHaveLength(7);

    const controlIds = controls.map((control) => control.id);
    expect(new Set(controlIds).size, 'unique control ids').toBe(controlIds.length);

    for (const control of controls) {
      const label = element.querySelector(`label[for="${control.id}"]`);
      const name = label?.textContent?.trim() || control.textContent?.trim();
      expect(name, `accessible name of #${control.id || control.tagName}`).toBeTruthy();
    }

    // Composer and per-post comment composers coexist: no id collision anywhere.
    const ids = Array.from(element.querySelectorAll('[id]')).map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('describes each worker control with its error live region and names the composer group', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const composer = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="job-request-composer"]'
    ) as HTMLElement;

    // D11: assistive tech announces the composer as the solicitud group.
    expect(composer.getAttribute('role')).toBe('group');
    expect(composer.getAttribute('aria-label')).toBe('Solicitud de empleo');

    // Every control points at a live `role="alert"` region that already exists
    // (quote.page precedent: the region must exist before it carries text).
    for (const id of [
      'job-request-position',
      'job-request-availability',
      'job-request-modality',
      'job-request-experience',
      'job-request-free-text',
      'job-request-photos'
    ]) {
      const control = composer.querySelector(`#${id}`);
      expect(control, `${id} control`).not.toBeNull();
      const describedBy = control?.getAttribute('aria-describedby');
      expect(describedBy, `${id} aria-describedby`).toBeTruthy();
      expect(
        composer.querySelector(`#${describedBy ?? ''}`)?.getAttribute('role'),
        `${id} live region role`
      ).toBe('alert');
    }
  });
});
