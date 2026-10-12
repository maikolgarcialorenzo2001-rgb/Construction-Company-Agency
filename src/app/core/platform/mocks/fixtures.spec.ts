import { describe, expect, it } from 'vitest';

import { APPLICATIONS, COMMENTS, FEED_POSTS, JOBS } from './fixtures';

/** The worker ids the seeded profiles/applications are allowed to reference. */
const WORKER_IDS = ['worker-1', 'worker-2', 'worker-3'];

const searchableLists = [FEED_POSTS, JOBS, APPLICATIONS, COMMENTS];

describe('core fixture datasets', () => {
  it('seeds the expanded demo dataset sizes', () => {
    expect(FEED_POSTS).toHaveLength(9);
    expect(JOBS).toHaveLength(7);
    expect(APPLICATIONS).toHaveLength(7);
    expect(COMMENTS).toHaveLength(12);
  });

  it('keeps every seeded list within the pagination page size', () => {
    for (const list of searchableLists) {
      expect(list.length).toBeLessThanOrEqual(20);
    }
  });

  it('flags every seeded entry as a placeholder', () => {
    for (const list of searchableLists) {
      expect(list.every((entry) => entry.isPlaceholder === true)).toBe(true);
    }
  });
});

describe('fixture referential integrity', () => {
  const postIds = new Set(FEED_POSTS.map((post) => post.id));
  const jobIds = new Set(JOBS.map((job) => job.id));

  it('attaches every comment to a seeded post', () => {
    for (const comment of COMMENTS) {
      expect(postIds.has(comment.postId), `${comment.id} → ${comment.postId}`).toBe(true);
    }
  });

  it('attaches every application to a seeded job and a known worker', () => {
    for (const application of APPLICATIONS) {
      expect(jobIds.has(application.jobId), `${application.id} → ${application.jobId}`).toBe(true);
      expect(WORKER_IDS).toContain(application.applicantId);
    }
  });

  it('orders each comment thread ascending by createdAt', () => {
    for (const postId of postIds) {
      const timestamps = COMMENTS.filter((comment) => comment.postId === postId).map(
        (comment) => comment.createdAt
      );
      expect(timestamps, `thread ${postId}`).toEqual([...timestamps].sort());
    }
  });
});

describe('sentinel comment threads', () => {
  const byPost = (postId: string) => COMMENTS.filter((comment) => comment.postId === postId);

  it('keeps post-1 with 2, post-3 with 1 and post-2 with 0 comments', () => {
    expect(byPost('post-1')).toHaveLength(2);
    expect(byPost('post-3')).toHaveLength(1);
    expect(byPost('post-2')).toHaveLength(0);
  });

  it('keeps comment-1/comment-2 as the post-1 thread, in order', () => {
    expect(byPost('post-1').map((comment) => comment.id)).toEqual(['comment-1', 'comment-2']);
  });

  it('shapes each entry like the domain Comment model', () => {
    const first = COMMENTS[0];

    expect(first.id).toBe('comment-1');
    expect(first.postId).toBe('post-1');
    expect(first.authorId).toBe('worker-1');
    expect(first.authorName).toBe('Demo Worker');
    expect(first.authorRole).toBe('worker');
    expect(first.body).toBe('Buen punto, comparto la misma inquietud.');
    expect(first.createdAt).toBe('2026-10-01T09:15:00.000Z');
  });

  it('keeps the post-1 thread sorted ascending by createdAt', () => {
    const thread = byPost('post-1');

    expect(thread.map((comment) => comment.createdAt)).toEqual([
      '2026-10-01T09:15:00.000Z',
      '2026-10-01T10:00:00.000Z'
    ]);
  });
});

describe('sentinel application shape (R1)', () => {
  const forJob = (jobId: string) => APPLICATIONS.filter((application) => application.jobId === jobId);

  it('keeps app-1 first for job-1 (accepted) and app-2 first for job-2 (pending)', () => {
    expect(APPLICATIONS[0].id).toBe('app-1');
    expect(APPLICATIONS[0].jobId).toBe('job-1');
    expect(APPLICATIONS[0].status).toBe('accepted');

    expect(APPLICATIONS[1].id).toBe('app-2');
    expect(APPLICATIONS[1].jobId).toBe('job-2');
    expect(APPLICATIONS[1].status).toBe('pending');
  });

  it('leaves job-3 with no application and job-1/job-2 with exactly one', () => {
    expect(forJob('job-3')).toHaveLength(0);
    expect(forJob('job-1')).toHaveLength(1);
    expect(forJob('job-2')).toHaveLength(1);
  });

  it('covers all four statuses with exactly one accepted and one pending', () => {
    const statuses = APPLICATIONS.map((application) => application.status);

    expect(statuses).toContain('accepted');
    expect(statuses).toContain('pending');
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('withdrawn');
    expect(statuses.filter((status) => status === 'accepted')).toHaveLength(1);
    expect(statuses.filter((status) => status === 'pending')).toHaveLength(1);
  });

  it('gives worker-1 exactly one application', () => {
    expect(APPLICATIONS.filter((application) => application.applicantId === 'worker-1')).toHaveLength(
      1
    );
  });
});
