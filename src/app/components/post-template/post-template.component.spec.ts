import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ENGAGEMENT_GATEWAY } from '../../core/platform/api/ports';
import type { EngagementGateway, EngagementState } from '../../core/platform/api/ports';
import type { PostView } from '../../core/platform/domain';
import { EngagementStore } from '../../core/platform/store/engagement.store';
import { PostTemplateComponent } from './post-template.component';

/** A render-ready post: a worker author, one attachment, standard content. */
const postView = (overrides: Partial<PostView> = {}): PostView => ({
  id: 'post-1',
  kind: 'standard',
  authorId: 'company-2',
  authorName: 'Lucía Fernández',
  authorRole: 'worker',
  content: 'Avance de obra: terminamos la losa del primer piso.',
  attachments: ['https://cdn.example.test/posts/post-1/losa.webp'],
  createdAt: '2026-10-01T15:00:00.000Z',
  ...overrides
});

/** N absolute attachment URLs, the way the fixtures span 1–10 (spec R2). */
const attachmentsOf = (count: number): string[] =>
  Array.from(
    { length: count },
    (_, index) => `https://cdn.example.test/posts/fixed/img-${index}.webp`
  );

/**
 * In-memory adapter (same contract as `engagement.store.spec.ts`): the adapter
 * owns the flip, so a template click must reach it to change any state.
 */
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

/**
 * Adapter that records every toggle call, so tests can prove the viewer + target
 * routing (and that a null viewer routes nothing) without re-wiring spies.
 */
const spyAdapter = (): { gateway: EngagementGateway; calls: string[] } => {
  const calls: string[] = [];
  const adapter = adapterWith();
  return {
    calls,
    gateway: {
      load: adapter.load,
      toggleFollow: (viewerId: string, authorId: string) => {
        calls.push(`follow:${viewerId}:${authorId}`);
        return adapter.toggleFollow(viewerId, authorId);
      },
      toggleLike: (viewerId: string, postId: string) => {
        calls.push(`like:${viewerId}:${postId}`);
        return adapter.toggleLike(viewerId, postId);
      },
      toggleSave: (viewerId: string, postId: string) => {
        calls.push(`save:${viewerId}:${postId}`);
        return adapter.toggleSave(viewerId, postId);
      }
    }
  };
};

/** jsdom ships no clipboard (design risk table): every share test installs one. */
const stubClipboard = (implementation?: () => Promise<void>): ReturnType<typeof vi.fn> => {
  const writeText = vi.fn(implementation ?? (async (): Promise<void> => undefined));
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true
  });
  return writeText;
};

/** Host projecting both extension slots over the standard shell (spec R4). */
@Component({
  imports: [PostTemplateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-post-template [post]="post" [viewerId]="'worker-1'">
      <p postBody data-testid="projected-body">Cuerpo de tipo 2</p>
      <div postExtra data-testid="projected-extra">Extra de tipo 3</div>
    </app-post-template>
  `
})
class ProjectionHost {
  readonly post: PostView = postView({ content: 'Contenido estándar que no debe verse' });
}

/** Structural view of a `ComponentFixture`: enough for the query + flush helpers. */
interface Harness {
  readonly nativeElement: unknown;
  whenStable(): Promise<void>;
  detectChanges(): void;
}

describe('PostTemplateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PostTemplateComponent, ProjectionHost],
      providers: [{ provide: ENGAGEMENT_GATEWAY, useValue: adapterWith() }]
    });
  });

  const rootOf = (fixture: Harness): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = async (
    post: PostView,
    viewerId: string | null = 'worker-1'
  ): Promise<Harness> => {
    const fixture = TestBed.createComponent(PostTemplateComponent);
    fixture.componentRef.setInput('post', post);
    fixture.componentRef.setInput('viewerId', viewerId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const q = (fixture: Harness, testid: string): HTMLElement | null =>
    rootOf(fixture).querySelector(`[data-testid="${testid}"]`);

  const click = (fixture: Harness, testid: string): void =>
    (q(fixture, testid) as HTMLButtonElement).click();

  const settle = async (fixture: Harness): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  describe('header', () => {
    it('greets with the author name and es-AR role, never the raw authorId', async () => {
      const fixture = await render(postView());
      const header = q(fixture, 'post-header');

      expect(header?.textContent).toContain('Lucía Fernández');
      expect(header?.textContent).toContain('Trabajador');
      expect(rootOf(fixture).textContent).not.toContain('company-2');
    });

    it('labels a company author as Empresa, not Trabajador', async () => {
      const fixture = await render(
        postView({ authorRole: 'company', authorName: 'Construcciones RA' })
      );
      const header = q(fixture, 'post-header');

      expect(header?.textContent).toContain('Construcciones RA');
      expect(header?.textContent).toContain('Empresa');
      expect(header?.textContent).not.toContain('Trabajador');
    });

    it('follows through the store: aria-pressed flips, the name labels the button, the edge lands', async () => {
      const { gateway, calls } = spyAdapter();
      TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: gateway });
      const store = TestBed.inject(EngagementStore);
      const fixture = await render(postView());
      const follow = q(fixture, 'post-follow') as HTMLButtonElement;

      expect(follow.getAttribute('aria-pressed')).toBe('false');
      expect(follow.textContent?.trim()).toBe('Seguir');
      expect(follow.getAttribute('aria-label')).toContain('Lucía Fernández');

      follow.click();
      await settle(fixture);

      expect(calls).toEqual(['follow:worker-1:company-2']);
      expect(store.isFollowing('worker-1', 'company-2')).toBe(true);
      expect(follow.getAttribute('aria-pressed')).toBe('true');
      expect(follow.textContent?.trim()).toBe('Siguiendo');
    });

    it('renders an already-stored edge as engaged on first paint, before any click', async () => {
      TestBed.overrideProvider(ENGAGEMENT_GATEWAY, {
        useValue: adapterWith({
          'worker-1': { following: ['company-2'], liked: ['post-1'], saved: ['post-1'] }
        })
      });
      const store = TestBed.inject(EngagementStore);
      await store.load();
      const fixture = await render(postView());

      expect(q(fixture, 'post-follow')?.getAttribute('aria-pressed')).toBe('true');
      expect(q(fixture, 'post-follow')?.textContent?.trim()).toBe('Siguiendo');
      expect(q(fixture, 'post-like')?.getAttribute('aria-pressed')).toBe('true');
      expect(q(fixture, 'post-save')?.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('media grid', () => {
    it('clamps to ten images with alt text and reports the overflow as +2 on a 12-URL post', async () => {
      const fixture = await render(postView({ attachments: attachmentsOf(12) }));
      const images = Array.from(rootOf(fixture).querySelectorAll('[data-testid="post-media"] img'));

      expect(images).toHaveLength(10);
      expect(q(fixture, 'post-media-overflow')?.textContent?.trim()).toBe('+2');
      for (const image of images) {
        expect(image.getAttribute('alt')?.trim()).not.toBe('');
        expect(image.getAttribute('loading')).toBe('lazy');
      }
    });

    it('renders a single image with no overflow indicator', async () => {
      const fixture = await render(postView({ attachments: attachmentsOf(1) }));

      const image = rootOf(fixture).querySelector('[data-testid="post-media"] img');
      expect(image).not.toBeNull();
      expect(image?.getAttribute('alt')).toBe('Imagen de la publicación');
      expect(q(fixture, 'post-media-overflow')).toBeNull();
    });

    it('reports the exact excess: +1 on 11 URLs and none on exactly 10', async () => {
      const eleven = await render(postView({ attachments: attachmentsOf(11) }));
      expect(q(eleven, 'post-media-overflow')?.textContent?.trim()).toBe('+1');
      expect(
        rootOf(eleven).querySelectorAll('[data-testid="post-media"] img')
      ).toHaveLength(10);

      const ten = await render(postView({ attachments: attachmentsOf(10) }));
      expect(rootOf(ten).querySelectorAll('[data-testid="post-media"] img')).toHaveLength(10);
      expect(q(ten, 'post-media-overflow')).toBeNull();
    });

    it('hides the media block entirely when the post carries no attachments', async () => {
      const fixture = await render(postView({ attachments: [] }));

      expect(q(fixture, 'post-media')).toBeNull();
      expect(q(fixture, 'post-media-overflow')).toBeNull();
    });

    it('shows an es-AR placeholder instead of a broken image when the URL is missing', async () => {
      const fixture = await render(postView({ attachments: [''] }));

      expect(rootOf(fixture).querySelectorAll('img')).toHaveLength(0);
      expect(q(fixture, 'post-media-placeholder')?.textContent?.trim()).toBe(
        'Imagen no disponible'
      );
    });

    it('mixes images and placeholders per entry, keeping the valid URLs', async () => {
      const fixture = await render(
        postView({
          attachments: ['https://cdn.example.test/posts/post-1/a.webp', '']
        })
      );

      expect(
        rootOf(fixture).querySelectorAll('[data-testid="post-media"] img')
      ).toHaveLength(1);
      expect(q(fixture, 'post-media-placeholder')).not.toBeNull();
    });
  });

  describe('actions', () => {
    it('renders the three es-AR action labels', async () => {
      const fixture = await render(postView());

      expect(q(fixture, 'post-like')?.textContent?.trim()).toBe('Me gusta');
      expect(q(fixture, 'post-share')?.textContent?.trim()).toBe('Reenviar');
      expect(q(fixture, 'post-save')?.textContent?.trim()).toBe('Guardar');
    });

    it('like records viewer + post through the store and flips aria-pressed', async () => {
      const { gateway, calls } = spyAdapter();
      TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: gateway });
      const store = TestBed.inject(EngagementStore);
      const fixture = await render(postView());
      const like = q(fixture, 'post-like') as HTMLButtonElement;
      expect(like.getAttribute('aria-pressed')).toBe('false');

      like.click();
      await settle(fixture);

      expect(calls).toEqual(['like:worker-1:post-1']);
      expect(store.isLiked('worker-1', 'post-1')).toBe(true);
      expect(like.getAttribute('aria-pressed')).toBe('true');
    });

    it('save records viewer + post through the store and flips aria-pressed', async () => {
      const { gateway, calls } = spyAdapter();
      TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: gateway });
      const store = TestBed.inject(EngagementStore);
      const fixture = await render(postView());
      const save = q(fixture, 'post-save') as HTMLButtonElement;
      expect(save.getAttribute('aria-pressed')).toBe('false');

      save.click();
      await settle(fixture);

      expect(calls).toEqual(['save:worker-1:post-1']);
      expect(store.isSaved('worker-1', 'post-1')).toBe(true);
      expect(save.getAttribute('aria-pressed')).toBe('true');
    });

    it('share copies the permalink with es-AR feedback and creates no engagement record', async () => {
      const writeText = stubClipboard();
      const store = TestBed.inject(EngagementStore);
      await store.load();
      const fixture = await render(postView());
      const stateBefore = store.state();

      click(fixture, 'post-share');
      await settle(fixture);

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/plataforma'));
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('post-1'));
      expect(q(fixture, 'post-share-feedback')?.textContent).toContain('Enlace copiado');
      expect(store.state()).toEqual(stateBefore);
      expect(store.isLiked('worker-1', 'post-1')).toBe(false);
      expect(store.isSaved('worker-1', 'post-1')).toBe(false);
      expect(store.isFollowing('worker-1', 'company-2')).toBe(false);
    });

    it('reports an es-AR clipboard error and still leaves the store untouched', async () => {
      stubClipboard(async () => {
        throw new Error('denied');
      });
      const store = TestBed.inject(EngagementStore);
      await store.load();
      const fixture = await render(postView());
      const stateBefore = store.state();

      click(fixture, 'post-share');
      await settle(fixture);

      expect(q(fixture, 'post-share-feedback')?.textContent).toContain(
        'No se pudo copiar el enlace'
      );
      expect(store.state()).toEqual(stateBefore);
    });

    it('never engages a null viewer: no gateway call leaves every toggle at false', async () => {
      const { gateway, calls } = spyAdapter();
      TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: gateway });
      const store = TestBed.inject(EngagementStore);
      const fixture = await render(postView(), null);

      click(fixture, 'post-follow');
      click(fixture, 'post-like');
      click(fixture, 'post-save');
      await settle(fixture);

      expect(calls).toEqual([]);
      expect(store.isFollowing(null, 'company-2')).toBe(false);
      expect(q(fixture, 'post-follow')?.getAttribute('aria-pressed')).toBe('false');
      expect(q(fixture, 'post-like')?.getAttribute('aria-pressed')).toBe('false');
      expect(q(fixture, 'post-save')?.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('slots and repaint', () => {
    it('renders the standard body when nothing is projected', async () => {
      const fixture = await render(postView());

      expect(q(fixture, 'post-body')?.textContent).toContain(
        'Avance de obra: terminamos la losa del primer piso.'
      );
    });

    it('projects [postBody]/[postExtra] over an intact shell and hides the standard body', async () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const root = rootOf(fixture);

      expect(root.querySelector('[data-testid="projected-body"]')?.textContent).toContain(
        'Cuerpo de tipo 2'
      );
      expect(root.querySelector('[data-testid="projected-extra"]')?.textContent).toContain(
        'Extra de tipo 3'
      );
      expect(root.textContent).not.toContain('Contenido estándar que no debe verse');
      expect(root.textContent).toContain('Lucía Fernández');
      expect(root.querySelector('[data-testid="post-media"] img')).not.toBeNull();
      expect(root.querySelector('[data-testid="post-follow"]')).not.toBeNull();
      expect(root.querySelector('[data-testid="post-like"]')).not.toBeNull();
      expect(root.querySelector('[data-testid="post-share"]')).not.toBeNull();
      expect(root.querySelector('[data-testid="post-save"]')).not.toBeNull();
    });

    it('shows a new aria-pressed after the store sets its signal (zoneless repaint)', async () => {
      const store = TestBed.inject(EngagementStore);
      const fixture = await render(postView());
      const like = q(fixture, 'post-like') as HTMLButtonElement;
      expect(like.getAttribute('aria-pressed')).toBe('false');

      await store.toggleLike('worker-1', 'post-1');
      await settle(fixture);

      expect(store.isLiked('worker-1', 'post-1')).toBe(true);
      expect(like.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
