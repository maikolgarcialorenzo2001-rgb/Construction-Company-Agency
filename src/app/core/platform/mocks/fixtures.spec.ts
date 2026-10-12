import { describe, expect, it } from 'vitest';

import { COMMENTS } from './fixtures';

describe('comment fixtures', () => {
  it('seeds post-1 with 2, post-3 with 1 and post-2 with 0 comments', () => {
    const byPost = (postId: string) => COMMENTS.filter((comment) => comment.postId === postId);

    expect(byPost('post-1')).toHaveLength(2);
    expect(byPost('post-3')).toHaveLength(1);
    expect(byPost('post-2')).toHaveLength(0);
  });

  it('flags every seeded comment as a placeholder', () => {
    expect(COMMENTS.length).toBeGreaterThan(0);
    expect(COMMENTS.every((comment) => comment.isPlaceholder === true)).toBe(true);
  });

  it('shapes each entry like the domain Comment model', () => {
    const first = COMMENTS[0];

    expect(first.id).toBe('comment-1');
    expect(first.postId).toBe('post-1');
    expect(first.authorId).toBe('worker-1');
    expect(first.authorName).toBe('Demo Worker');
    expect(first.authorRole).toBe('worker');
    expect(first.body).toBe('Buen punto, comparto la misma inquietud.');
    expect(first.createdAt).toBe('2025-10-01T09:15:00.000Z');
  });

  it('keeps each thread sorted ascending by createdAt', () => {
    const thread = COMMENTS.filter((comment) => comment.postId === 'post-1');

    expect(thread.map((comment) => comment.createdAt)).toEqual([
      '2025-10-01T09:15:00.000Z',
      '2025-10-01T10:00:00.000Z'
    ]);
  });
});