import { describe, expect, it } from 'vitest';

import {
  APPLICATIONS,
  COMMENTS,
  COMPANY_PROFILES,
  DEMO_ACCOUNTS,
  FEED_POSTS,
  JOB_REQUEST_SEEDS,
  JOBS,
  WORKER_PROFILES
} from './fixtures';
import { FALLBACK_AUTHOR_NAME, isRenderablePostView, toPostView } from './post-views';

/** The worker ids the seeded profiles/applications are allowed to reference. */
const WORKER_IDS = ['worker-1', 'worker-2', 'worker-3'];

const searchableLists = [FEED_POSTS, JOBS, APPLICATIONS, COMMENTS];

describe('core fixture datasets', () => {
  it('seeds the expanded demo dataset sizes', () => {
    expect(FEED_POSTS).toHaveLength(11);
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

describe('profile and account fixtures', () => {
  it('seeds three worker profiles and two company profiles, keyed by id', () => {
    expect(WORKER_PROFILES.map((profile) => profile.userId)).toEqual([
      'worker-1',
      'worker-2',
      'worker-3'
    ]);
    expect(COMPANY_PROFILES.map((profile) => profile.companyId)).toEqual(['company-1', 'company-2']);
  });

  it('flags every seeded profile as a placeholder', () => {
    expect(WORKER_PROFILES.every((profile) => profile.isPlaceholder === true)).toBe(true);
    expect(COMPANY_PROFILES.every((profile) => profile.isPlaceholder === true)).toBe(true);
  });

  it('varies worker skills across the seeded profiles', () => {
    const allSkills = WORKER_PROFILES.flatMap((profile) => profile.skills ?? []);

    expect(new Set(allSkills).size).toBeGreaterThan(WORKER_PROFILES.length);
  });

  it('seeds six demo accounts, all with the shared demo password', () => {
    expect(DEMO_ACCOUNTS.map((account) => account.userId)).toEqual([
      'worker-1',
      'company-1',
      'worker-2',
      'worker-3',
      'company-2',
      'admin-1'
    ]);
    expect(DEMO_ACCOUNTS.every((account) => account.password === 'demo1234')).toBe(true);
    expect(DEMO_ACCOUNTS.every((account) => account.isPlaceholder === true)).toBe(true);
  });

  it('seeds exactly one admin demo account for the platform area', () => {
    const admins = DEMO_ACCOUNTS.filter((account) => account.role === 'admin');

    expect(admins).toHaveLength(1);
    expect(admins[0].userId).toBe('admin-1');
    expect(admins[0].email).toBe('admin@demo.test');
    expect(admins[0].password).toBe('demo1234');
  });

  it('gives every seeded profile a matching demo account', () => {
    const accountIds = new Set(DEMO_ACCOUNTS.map((account) => account.userId));
    const profileIds = [
      ...WORKER_PROFILES.map((profile) => profile.userId),
      ...COMPANY_PROFILES.map((profile) => profile.companyId)
    ];

    expect(profileIds.every((id) => accountIds.has(id))).toBe(true);
  });
});

describe('fixture media URLs (p14)', () => {
  it('uses absolute https attachment URLs for all attachments', () => {
    for (const post of FEED_POSTS) {
      for (const url of post.attachments ?? []) {
        expect(url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('covers attachment counts spanning 1 through 10', () => {
    const counts = FEED_POSTS.map((post) => (post.attachments ?? []).length).filter((c) => c > 0);
    expect(counts.length).toBeGreaterThan(0);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    expect(min).toBe(1);
    expect(max).toBe(10);
    expect(max).toBeGreaterThanOrEqual(min);
  });
});

describe('job-request seed fixtures (p15 WU1)', () => {
  const seedPosts = FEED_POSTS.filter((post) => JOB_REQUEST_SEEDS.some((s) => s.id === post.id));

  it('seeds at least two job-request posts at the feed tail with a matching registry seed', () => {
    expect(JOB_REQUEST_SEEDS.length).toBeGreaterThanOrEqual(2);
    expect(seedPosts.map((post) => post.id)).toEqual(JOB_REQUEST_SEEDS.map((seed) => seed.id));
    // The text-only seeds are appended, never inserted: the last posts are job-requests.
    expect(FEED_POSTS.slice(-JOB_REQUEST_SEEDS.length).map((post) => post.id)).toEqual(
      JOB_REQUEST_SEEDS.map((seed) => seed.id)
    );
  });

  it('keeps every job-request seed text-only so the /plataforma image budget stays at 11', () => {
    for (const post of seedPosts) {
      expect(post.attachments ?? [], `${post.id} must carry no attachments`).toEqual([]);
      expect(post.content.trim().length, `${post.id} must carry visible text`).toBeGreaterThan(0);
    }
  });

  it('keeps every job-request seed renderable and author-resolvable', () => {
    for (const post of seedPosts) {
      const view = toPostView(post);
      expect(isRenderablePostView(view), `${post.id} must be renderable`).toBe(true);
      expect(view.authorName, `${post.id} must resolve its author`).not.toBe(FALLBACK_AUTHOR_NAME);
      expect(view.authorRole).toBe('worker');
    }
  });

  it('exposes a structured payload for each seeded job-request post', () => {
    for (const seed of JOB_REQUEST_SEEDS) {
      expect(seed.payload.position.length).toBeGreaterThan(0);
      expect(seed.payload.availability.length).toBeGreaterThan(0);
      expect(seed.payload.modality.length).toBeGreaterThan(0);
      expect(seed.payload.experience.length).toBeGreaterThan(0);
    }
  });
});
