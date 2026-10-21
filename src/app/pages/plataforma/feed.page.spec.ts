import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ENGAGEMENT_STORAGE_KEY } from '../../core/platform/api/mock-engagement.gateway';
import type { EngagementState } from '../../core/platform/api/ports';
import { COMMENTS_GATEWAY, FEED_GATEWAY, JOBS_GATEWAY } from '../../core/platform/api/ports';
import type { CreatePostDraft } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import type { Comment, JobOpening, Page, Post } from '../../core/platform/domain';
import { COMMENTS, FEED_POSTS, JOBS } from '../../core/platform/mocks/fixtures';
import { resetJobRequestRegistry } from '../../core/platform/mocks/job-request.registry';
import {
  getVacancy,
  recordVacancy,
  resetVacancyRegistry
} from '../../core/platform/mocks/vacancy.registry';
import { FeedStore } from '../../core/platform/store/feed.store';
import { JobsStore } from '../../core/platform/store/jobs.store';
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
 * Seeds a company session for a SPECIFIC company. The picker and the created
 * post must follow the session author, never a hardcoded id (design D3).
 */
const seedCompanySession = (companyId: string): void =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'mock-token',
      user: { userId: companyId, email: 'demo@test', role: 'company' }
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
    // Vacancy posts resolve through their own registry (p16 R1/D11).
    resetVacancyRegistry();
    // The projected vacancy card carries "Postularse" routerLinks, so the page
    // now needs a router in the TestBed (same minimal setup as the card spec).
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
    resetJobRequestRegistry();
    resetVacancyRegistry();
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

  // --- Vacancy card projection + guarded hydration (p16 WU3) ------------------

  /**
   * Vacancy hydration is a TWO-hop async chain: the feed timeline resolves,
   * then the effect fires the one-shot `JobsStore.load()`, whose openings must
   * settle before the cards can paint — so the zoneless dance needs one extra
   * `whenStable` round compared with the plain feed tests above.
   */
  const settleVacancyFeed = async (fixture: ComponentFixture<PlatformFeedPage>): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Overrides the timeline with a single company vacancy post. */
  const overrideVacancyTimeline = (post: Post): void => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [post],
          meta: { page: 1, pageSize: 20, total: 1 }
        }),
        create: async () => {
          throw new Error('not under test');
        }
      }
    });
  };

  it('projects the vacancy card into [postExtra] and keeps [postBody] free of vacancy fields', async () => {
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    const posts = Array.from(
      element.querySelectorAll('[data-testid="feed-post"]')
    ) as HTMLElement[];

    // Both seeded vacancy posts (post-12, post-13) resolve their jobIds live.
    expect(element.querySelectorAll('[data-testid="post-vacancy"]')).toHaveLength(2);

    const vacancyPost = posts[9]; // post-12
    const card = vacancyPost.querySelector('[data-testid="post-vacancy"]');
    const extra = vacancyPost.querySelector('[data-testid="post-extra"]');
    expect(card).not.toBeNull();
    expect(extra?.contains(card as Node)).toBe(true);

    // The card owns the structured job data, one entry per resolved job id.
    expect(card?.textContent).toContain('Albañil con experiencia para obra en Vicente López');
    expect(card?.textContent).toContain('Electricista matriculado para locales comerciales');
    expect(card?.querySelectorAll('[data-testid="vacancy-entry"]')).toHaveLength(2);

    // …and the body slot keeps only the free text (never vacancy fields).
    const body = vacancyPost.querySelector('[data-testid="post-body"]');
    expect(body?.textContent).toContain('Buscamos albañil para obra en Vicente López');
    expect(body?.textContent).not.toContain('Albañil con experiencia para obra en Vicente López');

    // The base template renders untouched around the projection.
    expect(vacancyPost.querySelector('[data-testid="post-header"]')).not.toBeNull();
    expect(vacancyPost.querySelector('[data-testid="post-actions"]')).not.toBeNull();

    // Neighbors unaffected: standard posts carry no card, job-request cards stay at 2.
    expect(posts[0].querySelector('[data-testid="post-vacancy"]')).toBeNull();
    expect(element.querySelectorAll('[data-testid="post-job-request"]')).toHaveLength(2);

    // D11 a11y: the projected card is a labelled group with one distinctly
    // named apply link per entry (same contract WU2 locked for the card).
    expect(card?.getAttribute('role')).toBe('group');
    expect(card?.getAttribute('aria-label')).toBe('Vacante');
    const applyNames = Array.from(card?.querySelectorAll('[data-testid="vacancy-apply"]') ?? []).map(
      (link) => link.getAttribute('aria-label')
    );
    expect(applyNames).toEqual([
      'Postularse a Albañil con experiencia para obra en Vicente López',
      'Postularse a Electricista matriculado para locales comerciales'
    ]);
  });

  it('hides the vacancy card when none of its referenced jobs resolve (D6)', async () => {
    recordVacancy('post-all-missing', { jobIds: ['job-ghost-1', 'job-ghost-2'] });
    overrideVacancyTimeline({
      id: 'post-all-missing',
      authorId: 'company-1',
      content: 'Publicamos dos búsquedas cuyos puestos ya no están activos.',
      createdAt: '2026-10-16T10:00:00.000Z'
    });

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const post = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="feed-post"]'
    ) as HTMLElement;
    // The post itself is renderable (text) so it paints — but the card hides:
    // no empty card and no hydration flash while the openings never resolve.
    expect(post.textContent).toContain('Publicamos dos búsquedas cuyos puestos ya no están activos.');
    expect(post.querySelector('[data-testid="post-vacancy"]')).toBeNull();
    expect(post.querySelector('[data-testid="post-extra"]')).not.toBeNull();
  });

  it('renders only the resolvable entries when some referenced jobs are missing', async () => {
    recordVacancy('post-partial', { jobIds: ['job-ghost', 'job-1'] });
    overrideVacancyTimeline({
      id: 'post-partial',
      authorId: 'company-1',
      content: 'Buscamos albañil; el segundo puesto se dio de baja.',
      createdAt: '2026-10-16T11:00:00.000Z'
    });

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="post-vacancy"]'
    );
    // Payload order kept, missing id skipped: only the resolvable job paints.
    expect(card).not.toBeNull();
    expect(card?.querySelectorAll('[data-testid="vacancy-entry"]')).toHaveLength(1);
    expect(card?.textContent).toContain('Albañil con experiencia para obra en Vicente López');
  });

  it('loads the jobs board exactly once for a timeline with several vacancy posts', async () => {
    const jobs = TestBed.inject(JobsStore);
    const load = vi.spyOn(jobs, 'load');

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);
    // Further render passes must not re-trigger hydration (one-shot guard).
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The default timeline carries 2 vacancy posts: a single load serves both.
    expect(load).toHaveBeenCalledTimes(1);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="post-vacancy"]')
    ).toHaveLength(2);
  });

  it('loads the jobs board exactly once for a company session (picker + timeline triggers)', async () => {
    // WU4b: the company session adds a SECOND trigger to the hydration guard
    // (the picker needs the openings even without a vacancy post). Both
    // triggers must collapse into ONE load — the idle guard owns that.
    seedSession('company');
    const jobs = TestBed.inject(JobsStore);
    const load = vi.spyOn(jobs, 'load');

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('hydrates the openings for a company session even without vacancy posts', async () => {
    // A timeline with NO vacancy post: only the picker trigger can hydrate.
    // The kind lives in the registry, not in the contract `Post`, so the
    // seeded vacancy ids are the ones to drop.
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: FEED_POSTS.filter((post) => post.id !== 'post-12' && post.id !== 'post-13'),
          meta: { page: 1, pageSize: 20, total: FEED_POSTS.length }
        }),
        create: async (draft: CreatePostDraft): Promise<Post> => ({
          id: 'post-new-1',
          authorId: draft.authorId,
          content: draft.content,
          attachments: draft.attachments,
          createdAt: '2026-01-01T00:00:00Z'
        })
      }
    });
    seedSession('company');
    const jobs = TestBed.inject(JobsStore);
    const load = vi.spyOn(jobs, 'load');

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    expect(load).toHaveBeenCalledTimes(1);
    expect(jobs.openings().length).toBeGreaterThan(0);
  });

  it('renders a job closed after seeding as Cerrada with its link still present (live resolve)', async () => {
    TestBed.overrideProvider(JOBS_GATEWAY, {
      useValue: {
        list: async (): Promise<Page<JobOpening>> => ({
          items: JOBS.map((job) =>
            job.id === 'job-1' ? { ...job, status: 'closed' as const } : job
          ),
          meta: { page: 1, pageSize: 20, total: JOBS.length }
        }),
        byId: async (id: string): Promise<JobOpening | null> =>
          JOBS.find((job) => job.id === id) ?? null
      }
    });

    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const posts = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="feed-post"]'
    );
    const card = (posts[9] as HTMLElement).querySelector('[data-testid="post-vacancy"]'); // post-12

    // The card shows LIVE data: job-1 flipped to closed after seeding renders
    // "Cerrada" while job-2 stays "Abierta" — nothing was copied at seed time.
    const statuses = Array.from(card?.querySelectorAll('[data-testid="vacancy-status"]') ?? []);
    expect(statuses.map((node) => node.textContent?.trim())).toEqual([
      'Estado: Cerrada',
      'Estado: Abierta'
    ]);

    // The label informs; the "Postularse" link stays rendered for the closed job.
    const links = card?.querySelectorAll('[data-testid="vacancy-apply"]');
    expect(links).toHaveLength(2);
    expect(links?.[0]?.getAttribute('aria-label')).toBe(
      'Postularse a Albañil con experiencia para obra en Vicente López'
    );
    expect(links?.[0]?.getAttribute('href')).toBe('/plataforma/trabajos/job-1');
  });

  // --- Company composer wiring (p16 WU4b) -------------------------------------

  /** Toggles the company composer into the "Buscar trabajadores" mode. */
  const toggleVacancyMode = (element: HTMLElement): void => {
    const toggle = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Buscar trabajadores'
    ) as HTMLButtonElement;
    toggle.click();
  };

  /** Picks one vacancy in the scoped picker. */
  const pickVacancy = (element: HTMLElement, jobId: string): void => {
    (element.querySelector(`#company-composer-job-${jobId}`) as HTMLInputElement).click();
  };

  /** Writes the optional promo text of the vacancy mode. */
  const typeVacancyText = (element: HTMLElement, value: string): void => {
    const textarea = element.querySelector('#company-composer-vacancy-text') as HTMLTextAreaElement;
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
  };

  /** Enters vacancy mode and lets the hydrated picker paint. */
  const enterVacancyMode = async (fixture: ComponentFixture<PlatformFeedPage>): Promise<HTMLElement> => {
    const element = fixture.nativeElement as HTMLElement;
    // The extracted composer must be mounted before its mode toggle exists.
    expect(element.querySelector('app-company-composer'), 'company composer').not.toBeNull();
    toggleVacancyMode(element);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return element;
  };

  it('publishes a company vacancy post with the picked job ids and the session author', async () => {
    seedSession('company');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    // WU4b: the page hosts the extracted composer, not the inline textarea.
    expect(element.querySelector('app-company-composer')).not.toBeNull();

    await enterVacancyMode(fixture);
    pickVacancy(element, 'job-1');
    typeVacancyText(element, 'Buscamos albañiles para la obra de Vicente López.');
    fixture.detectChanges();

    (element.querySelector('[data-testid="vacancy-publish"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    // The new post is a VACANCY post: the promo card projects its job…
    const posts = element.querySelectorAll('[data-testid="feed-post"]');
    expect(posts).toHaveLength(FEED_POSTS.length + 1);
    const created = posts[0] as HTMLElement;
    const card = created.querySelector('[data-testid="post-vacancy"]');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('Albañil con experiencia para obra en Vicente López');
    // …and the free text rides the body slot.
    expect(created.querySelector('[data-testid="post-body"]')?.textContent).toContain(
      'Buscamos albañiles para la obra de Vicente López'
    );

    // The demo registry holds exactly the picked job ids…
    const store = TestBed.inject(FeedStore);
    const post = store.posts()[0];
    expect(getVacancy(post.id)?.jobIds).toEqual(['job-1']);

    // …and the author is the session company, never a hardcoded id.
    expect(post.authorId).toBe('company-1');
    expect(created.textContent).toContain('Constructora Norte SAC');
  });

  it('scopes the picker to the company own open vacancies in the real feed', async () => {
    seedSession('company');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = await enterVacancyMode(fixture);

    // Design D8: only own + open jobs reach the picker (job-1, job-2, job-6).
    const options = Array.from(
      element.querySelectorAll<HTMLInputElement>('[data-testid="vacancy-option"]')
    );
    expect(options.map((option) => option.id)).toEqual([
      'company-composer-job-job-1',
      'company-composer-job-job-2',
      'company-composer-job-job-6'
    ]);
    // Scoped to the picker: the TIMELINE may legitimately mention any job.
    const picker = element.querySelector('[data-testid="vacancy-picker-group"]');
    const text = picker?.textContent ?? '';
    expect(text).not.toContain('Director de obra'); // own but closed
    expect(text).not.toContain('Plomero'); // open but another company
  });

  it('scopes the picker and the post author to the session company, never a hardcoded one', async () => {
    seedCompanySession('company-2');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = await enterVacancyMode(fixture);

    // The picker follows the SESSION company (company-2 owns job-4 and job-5).
    const options = Array.from(
      element.querySelectorAll<HTMLInputElement>('[data-testid="vacancy-option"]')
    );
    expect(options.map((option) => option.id)).toEqual([
      'company-composer-job-job-4',
      'company-composer-job-job-5'
    ]);

    pickVacancy(element, 'job-4');
    typeVacancyText(element, 'Abrimos dos búsquedas para la planta de Quilmes.');
    fixture.detectChanges();
    (element.querySelector('[data-testid="vacancy-publish"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const store = TestBed.inject(FeedStore);
    const post = store.posts()[0];
    expect(post.authorId).toBe('company-2');
    expect(getVacancy(post.id)?.jobIds).toEqual(['job-4']);
    // The denormalized author is the session company, not the demo default.
    expect((element.querySelectorAll('[data-testid="feed-post"]')[0] as HTMLElement).textContent).toContain(
      'Grupo Delta Construcciones'
    );
  });

  it('publishes a company normal post without any vacancy payload', async () => {
    seedSession('company');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-company-composer')).not.toBeNull();

    const textarea = element.querySelector('#feed-post-content') as HTMLTextAreaElement;
    textarea.value = 'Arrancamos la instalación de sanitarias en Palermo.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (element.querySelector('[data-testid="feed-publish"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const store = TestBed.inject(FeedStore);
    const post = store.posts()[0];
    expect(post.content).toBe('Arrancamos la instalación de sanitarias en Palermo.');
    expect(post.authorId).toBe('company-1');
    // A standard post carries NO vacancy payload: the registry has no entry.
    expect(getVacancy(post.id)).toBeUndefined();
    // And no vacancy card is projected for it.
    const created = element.querySelectorAll('[data-testid="feed-post"]')[0] as HTMLElement;
    expect(created.querySelector('[data-testid="post-vacancy"]')).toBeNull();
  });

  it('keeps the worker path on the solicitud form and away from the company composer', async () => {
    seedSession('worker');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="job-request-composer"]')).not.toBeNull();
    expect(element.querySelector('app-company-composer')).toBeNull();
    expect(element.querySelector('[data-testid="feed-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="vacancy-composer"]')).toBeNull();
  });

  it('keeps the admin path free of any composer', async () => {
    seedSession('worker');
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token',
        user: { userId: 'admin-1', email: 'admin@demo.test', role: 'admin' }
      })
    );
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-company-composer')).toBeNull();
    expect(element.querySelector('[data-testid="feed-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="vacancy-composer"]')).toBeNull();
    expect(element.querySelector('[data-testid="job-request-composer"]')).toBeNull();
  });

  it('renders the company composer without duplicate element ids', async () => {
    seedSession('company');
    const fixture = TestBed.createComponent(PlatformFeedPage);
    await settleVacancyFeed(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-company-composer')).not.toBeNull();

    // The inline textarea form is gone: the composer owns `feed-post-content`
    // exactly once (F5 guard — no duplicate ids across the feed).
    const ids = Array.from(element.querySelectorAll('[id]')).map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('feed-post-content');
  });
});
