import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { FEED_GATEWAY } from '../../core/platform/api/ports';
import type { Page, Post } from '../../core/platform/domain';
import { FEED_POSTS } from '../../core/platform/mocks/fixtures';
import { PlatformFeedPage } from './feed.page';

/**
 * Zoneless page tests: every scenario drives `detectChanges` + `whenStable`
 * exactly like the store harness, because the page fires `load()` on creation
 * and only a `.set()` in the store can paint the view.
 */
describe('PlatformFeedPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
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
});
