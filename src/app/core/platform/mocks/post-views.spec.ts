import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Post, PostView } from '../domain';
import { FEED_POSTS, JOB_REQUEST_SEEDS } from './fixtures';
import { resetJobRequestRegistry } from './job-request.registry';
import { isRenderablePostView, toPostView } from './post-views';

/**
 * Strict-mode RED for p14 WU1: `post-views.ts` does not exist yet, so every
 * scenario below fails to resolve the module. The spec pins the pure mapper
 * (design D1/D2): contract-shaped `Post` → demo-only `PostView` with a
 * denormalized author name/role resolved by profile key, never the raw id.
 */
describe('toPostView mapper (p14 WU1)', () => {
  const makePost = (overrides: Partial<Post> = {}): Post => ({
    id: 'post-x',
    authorId: 'worker-1',
    content: 'Contenido de prueba',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides
  });

  it("tags every view as the 'standard' kind", () => {
    expect(toPostView(makePost()).kind).toBe('standard');
  });

  it('denormalizes a worker author into a name + worker role, never the raw id', () => {
    const view = toPostView(makePost({ authorId: 'worker-1' }));

    expect(view.authorName).toBe('Lucía Fernández');
    expect(view.authorRole).toBe('worker');
    expect(view.authorName).not.toBe('worker-1');
  });

  it('denormalizes a company author through the company lookup path', () => {
    const view = toPostView(makePost({ authorId: 'company-2' }));

    expect(view.authorName).toBe('Grupo Delta Construcciones');
    expect(view.authorRole).toBe('company');
  });

  it('falls back to a labeled name when the author id has no fixture profile', () => {
    const view = toPostView(makePost({ authorId: 'ghost-99' }));

    expect(view.authorName).toBe('Perfil no disponible');
    expect(view.authorName).not.toBe('ghost-99');
    expect(view.authorRole).toBe('worker');
  });

  it('preserves the contract post fields and copies attachments verbatim', () => {
    const source = makePost({
      id: 'post-6',
      authorId: 'company-2',
      content: 'Buscamos pintores para una planta industrial',
      attachments: ['https://images.example.com/plataforma/planta-quilmes-01.webp'],
      createdAt: '2026-10-08T11:40:00.000Z'
    });

    expect(toPostView(source)).toEqual({
      id: 'post-6',
      kind: 'standard',
      authorId: 'company-2',
      authorName: 'Grupo Delta Construcciones',
      authorRole: 'company',
      content: 'Buscamos pintores para una planta industrial',
      attachments: ['https://images.example.com/plataforma/planta-quilmes-01.webp'],
      createdAt: '2026-10-08T11:40:00.000Z'
    });
  });

  it('defaults a post without attachments to an empty list', () => {
    const view = toPostView(makePost({ attachments: undefined }));

    expect(view.attachments).toEqual([]);
  });

  it('resolves every seeded feed fixture to a named, non-fallback author', () => {
    const views = FEED_POSTS.map(toPostView);

    expect(views).toHaveLength(FEED_POSTS.length);
    for (const view of views) {
      expect(view.authorName, view.id).not.toBe(view.authorId);
      expect(view.authorName, view.id).not.toBe('Perfil no disponible');
    }
  });
});

/**
 * Kind/payload derivation (p15 WU1, design D2). `toPostView` reads the demo
 * job-request registry: a hit tags the view `kind: 'job-request'` and carries
 * the payload; a miss stays `'standard'` and the `jobRequest` key is omitted so
 * the existing `toEqual` specs keep holding. The predicate stays untouched.
 */
describe('toPostView job-request derivation (p15 WU1)', () => {
  const makePost = (overrides: Partial<Post> = {}): Post => ({
    id: 'post-x',
    authorId: 'worker-1',
    content: 'Contenido de prueba',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides
  });

  const postById = (id: string): Post => {
    const post = FEED_POSTS.find((candidate) => candidate.id === id);
    if (!post) {
      throw new Error(`missing fixture ${id}`);
    }
    return post;
  };

  beforeEach(() => resetJobRequestRegistry());
  afterEach(() => resetJobRequestRegistry());

  it('derives kind job-request and the payload on a registry hit', () => {
    const seed = JOB_REQUEST_SEEDS[0];
    const view = toPostView(postById(seed.id));

    expect(view.kind).toBe('job-request');
    expect(view.jobRequest).toEqual(seed.payload);
  });

  it('omits the jobRequest key entirely on a registry miss', () => {
    const view = toPostView(makePost({ id: 'post-1' }));

    expect(view.kind).toBe('standard');
    expect(view).not.toHaveProperty('jobRequest');
  });

  it('keeps isRenderablePostView independent of the derived kind', () => {
    const view = toPostView(postById(JOB_REQUEST_SEEDS[0].id));

    expect(isRenderablePostView(view)).toBe(true);
  });
});

/**
 * Never-empty invariant (p14 WU5): a post is renderable only with text, an
 * image, or both — "neither" is invalid. Text-only and image-only are both
 * legitimate shapes (future PostKinds 2/3 will carry them). Strict-mode RED:
 * `isRenderablePostView` does not exist yet, so every scenario fails to
 * resolve the named export.
 */
describe('isRenderablePostView (p14 WU5)', () => {
  const view = (overrides: Partial<PostView> = {}): PostView => ({
    id: 'post-x',
    kind: 'standard',
    authorId: 'worker-1',
    authorName: 'Lucía Fernández',
    authorRole: 'worker',
    content: 'Contenido de prueba',
    attachments: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides
  });

  it('accepts a text-only view with no attachments', () => {
    expect(isRenderablePostView(view({ attachments: [] }))).toBe(true);
  });

  it('accepts an image-only view whose content is blank', () => {
    expect(
      isRenderablePostView(
        view({ content: '', attachments: ['https://cdn.example.test/posts/x/img.webp'] })
      )
    ).toBe(true);
  });

  it('accepts a view carrying both text and an image', () => {
    expect(
      isRenderablePostView(
        view({ attachments: ['https://cdn.example.test/posts/x/img.webp'] })
      )
    ).toBe(true);
  });

  it('rejects a view with neither text nor image', () => {
    expect(isRenderablePostView(view({ content: '', attachments: [] }))).toBe(false);
  });

  it('treats whitespace-only content and blank-only URL entries as empty', () => {
    expect(isRenderablePostView(view({ content: '  \n  ', attachments: [] }))).toBe(false);
    expect(isRenderablePostView(view({ content: '   ', attachments: [''] }))).toBe(false);
  });
});
