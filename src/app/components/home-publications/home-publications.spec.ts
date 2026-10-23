import { describe, expect, it } from 'vitest';

import type { PostKind, PostView } from '../../core/platform/domain';
import { mostRecentByKind } from './home-publications';

/** Builds a minimal render-ready post for the projection specs. */
const view = (
  id: string,
  kind: PostKind,
  createdAt: string,
  overrides: Partial<PostView> = {}
): PostView => ({
  id,
  kind,
  authorId: 'worker-1',
  authorName: 'Lucía Fernández',
  authorRole: 'worker',
  content: `Contenido de ${id}`,
  attachments: [],
  createdAt,
  ...overrides
});

/**
 * The home teaser projection (p17 slice 3): ONE publication per kind, the newest
 * of each, deterministic ties, newest-first overall. A kind with no publication
 * is simply absent — never an empty slot or a placeholder.
 */
describe('mostRecentByKind', () => {
  it('returns an empty list for an empty timeline', () => {
    expect(mostRecentByKind([])).toEqual([]);
  });

  it('returns one entry per kind present in the timeline', () => {
    const result = mostRecentByKind([
      view('post-1', 'standard', '2026-10-01T10:00:00.000Z'),
      view('post-2', 'job-request', '2026-10-02T10:00:00.000Z'),
      view('post-3', 'vacancy', '2026-10-03T10:00:00.000Z')
    ]);

    expect(result.map((entry) => entry.kind).sort()).toEqual([
      'job-request',
      'standard',
      'vacancy'
    ]);
    expect(result).toHaveLength(3);
  });

  it('keeps the newest publication of each kind', () => {
    const result = mostRecentByKind([
      view('post-old', 'standard', '2026-10-01T10:00:00.000Z'),
      view('post-new', 'standard', '2026-10-05T10:00:00.000Z'),
      view('post-mid', 'standard', '2026-10-03T10:00:00.000Z')
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('post-new');
  });

  it('breaks a createdAt tie on the id ascending', () => {
    const result = mostRecentByKind([
      view('post-b', 'standard', '2026-10-05T10:00:00.000Z'),
      view('post-a', 'standard', '2026-10-05T10:00:00.000Z')
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('post-a');
  });

  it('sorts the selected entries newest-first overall', () => {
    const result = mostRecentByKind([
      view('post-standard', 'standard', '2026-10-02T10:00:00.000Z'),
      view('post-vacancy', 'vacancy', '2026-10-03T10:00:00.000Z'),
      view('post-job-request', 'job-request', '2026-10-04T10:00:00.000Z')
    ]);

    expect(result.map((entry) => entry.id)).toEqual([
      'post-job-request',
      'post-vacancy',
      'post-standard'
    ]);
  });

  it('omits a kind with no publication instead of rendering an empty slot', () => {
    const result = mostRecentByKind([
      view('post-standard', 'standard', '2026-10-02T10:00:00.000Z'),
      view('post-job-request', 'job-request', '2026-10-04T10:00:00.000Z')
    ]);

    expect(result.map((entry) => entry.kind)).toEqual(['job-request', 'standard']);
    expect(result.some((entry) => entry.kind === 'vacancy')).toBe(false);
    expect(result.every((entry) => Boolean(entry.id))).toBe(true);
  });
});
