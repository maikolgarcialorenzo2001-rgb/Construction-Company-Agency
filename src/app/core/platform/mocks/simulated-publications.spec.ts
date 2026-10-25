import { describe, expect, it } from 'vitest';

import { resolveVacancyOpenings } from '../../../components/post-vacancy/vacancy-openings';
import { FEED_POSTS, JOB_REQUEST_SEEDS, JOBS, VACANCY_SEEDS } from './fixtures';
import { isRenderablePostView, toPostView } from './post-views';

/**
 * Simulated publications (p17 slice 1, decision-lock D10): three text-only
 * posts seeded one per kind so the demo timeline exercises the standard,
 * vacancy and job-request render paths without moving the `/` (7) or
 * `/plataforma` (11) image budgets. Strict-mode RED: the three ids do not
 * exist yet, so every scenario below fails to resolve them.
 */
describe('simulated publications (p17 D10)', () => {
  type SeededPost = (typeof FEED_POSTS)[number];

  const SIMULATED_IDS = ['post-14', 'post-15', 'post-16'] as const;

  const postById = (id: string): SeededPost => {
    const post = FEED_POSTS.find((candidate) => candidate.id === id);
    if (!post) {
      throw new Error(`missing simulated publication ${id}`);
    }
    return post;
  };

  const simulatedPosts = (): SeededPost[] => SIMULATED_IDS.map(postById);

  it('seeds three new placeholder posts, one per derived kind', () => {
    expect(FEED_POSTS).toHaveLength(16);

    const posts = simulatedPosts();
    expect(posts.every((post) => post.isPlaceholder === true)).toBe(true);

    const kinds = posts.map((post) => toPostView(post).kind).sort();
    expect(kinds).toEqual(['job-request', 'standard', 'vacancy']);
  });

  it('keeps every simulated publication text-only so the image budgets do not move', () => {
    for (const post of simulatedPosts()) {
      expect(post.attachments ?? [], `${post.id} must carry no attachments`).toEqual([]);
      expect(post.content.trim().length, `${post.id} must carry visible text`).toBeGreaterThan(0);
    }

    // The `/plataforma` route pins 11 images: post-6 carries 10, post-9 carries 1.
    const attachmentTotal = FEED_POSTS.reduce(
      (total, post) => total + (post.attachments ?? []).length,
      0
    );
    expect(attachmentTotal).toBe(11);
  });

  it('dates the simulated publications as the three newest posts', () => {
    const posts = simulatedPosts();

    expect(posts.map((post) => post.id)).toEqual(['post-14', 'post-15', 'post-16']);
    expect(posts.map((post) => post.createdAt)).toEqual([
      '2026-10-19T14:30:00.000Z',
      '2026-10-20T11:00:00.000Z',
      '2026-10-21T09:15:00.000Z'
    ]);

    const newestFirst = [...FEED_POSTS]
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 3)
      .map((post) => post.id);
    expect(newestFirst).toEqual(['post-16', 'post-15', 'post-14']);
  });

  it('places the simulated posts between the anchors D10 locks', () => {
    const indexOf = (id: string): number => FEED_POSTS.findIndex((post) => post.id === id);

    expect(indexOf('post-14')).toBe(indexOf('post-9') + 1);
    expect(indexOf('post-15')).toBe(indexOf('post-13') + 1);
    expect(FEED_POSTS[FEED_POSTS.length - 1].id).toBe('post-16');
  });

  it('assigns each simulated publication to the author D10 locks', () => {
    const byId = new Map(simulatedPosts().map((post) => [post.id, toPostView(post)]));

    expect(byId.get('post-14')).toMatchObject({
      authorId: 'worker-3',
      authorName: 'Sofía Ruiz',
      authorRole: 'worker'
    });
    expect(byId.get('post-15')).toMatchObject({
      authorId: 'company-1',
      authorName: 'Constructora Norte SAC',
      authorRole: 'company'
    });
    expect(byId.get('post-16')).toMatchObject({
      authorId: 'worker-1',
      authorName: 'Lucía Fernández',
      authorRole: 'worker'
    });
  });

  it('derives the standard kind for the worker publication', () => {
    const view = toPostView(postById('post-14'));

    expect(view.kind).toBe('standard');
    expect(view).not.toHaveProperty('jobRequest');
    expect(view).not.toHaveProperty('vacancy');
  });

  it('derives the vacancy kind and resolves job-6 (open) and job-3 (closed) live', () => {
    const post = postById('post-15');
    const view = toPostView(post);

    expect(view.kind).toBe('vacancy');
    expect(view.vacancy).toEqual({ jobIds: ['job-6', 'job-3'] });
    expect(VACANCY_SEEDS.find((seed) => seed.id === post.id)?.payload).toEqual({
      jobIds: ['job-6', 'job-3']
    });

    const resolved = resolveVacancyOpenings(view.vacancy ?? { jobIds: [] }, [...JOBS]);
    expect(resolved.map((job) => job.id)).toEqual(['job-6', 'job-3']);
    expect(resolved.map((job) => job.status)).toEqual(['open', 'closed']);
    expect(resolved.every((job) => job.companyId === post.authorId)).toBe(true);
  });

  it('derives the job-request kind and carries the electricista payload', () => {
    const post = postById('post-16');
    const view = toPostView(post);
    const seed = JOB_REQUEST_SEEDS.find((candidate) => candidate.id === post.id);

    expect(view.kind).toBe('job-request');
    expect(seed, 'post-16 must be registered as a job-request seed').toBeDefined();
    expect(view.jobRequest).toEqual(seed?.payload);
    expect(view.jobRequest?.position.toLowerCase()).toContain('electricista');
    expect(JOB_REQUEST_SEEDS.map((candidate) => candidate.id)).toEqual([
      'post-10',
      'post-11',
      'post-16'
    ]);
  });

  it('keeps every simulated publication renderable despite having no media', () => {
    for (const post of simulatedPosts()) {
      const view = toPostView(post);

      expect(view.attachments, `${post.id} must stay image-less`).toEqual([]);
      expect(isRenderablePostView(view), `${post.id} must render from its text`).toBe(true);
    }
  });
});
