import { describe, expect, it } from 'vitest';

import type { Post } from '../domain';
import { FEED_POSTS } from './fixtures';
import { toPostView } from './post-views';

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
