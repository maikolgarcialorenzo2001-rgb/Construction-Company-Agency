import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import type {
  ApplicationsGateway,
  AuthGateway,
  CommentsGateway,
  EngagementGateway,
  FeedGateway,
  JobsGateway,
  ProfilesGateway
} from './ports';
import {
  APPLICATIONS_GATEWAY,
  AUTH_GATEWAY,
  COMMENTS_GATEWAY,
  ENGAGEMENT_GATEWAY,
  FEED_GATEWAY,
  JOBS_GATEWAY,
  PROFILES_GATEWAY
} from './ports';
import { MockCommentsGateway } from './mock-comments.gateway';
import { ENGAGEMENT_STORAGE_KEY, MockEngagementGateway } from './mock-engagement.gateway';

describe('gateway ports (DI tokens)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // The engagement adapter writes on toggle; keep the shared jsdom storage clean.
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
  });

  it('resolves every port to an adapter without extra providers', () => {
    const feed: FeedGateway = TestBed.inject(FEED_GATEWAY);
    expect(typeof feed.timeline).toBe('function');
    expect(typeof feed.create).toBe('function');

    const jobs = TestBed.inject(JOBS_GATEWAY);
    expect(typeof jobs.list).toBe('function');
    expect(typeof jobs.byId).toBe('function');

    const applications = TestBed.inject(APPLICATIONS_GATEWAY);
    expect(typeof applications.create).toBe('function');
    expect(typeof applications.list).toBe('function');

    const auth = TestBed.inject(AUTH_GATEWAY);
    expect(typeof auth.register).toBe('function');
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(typeof auth.me).toBe('function');

    const profiles = TestBed.inject(PROFILES_GATEWAY);
    expect(typeof profiles.worker).toBe('function');
    expect(typeof profiles.updateWorker).toBe('function');
    expect(typeof profiles.company).toBe('function');
    expect(typeof profiles.updateCompany).toBe('function');

    const comments = TestBed.inject(COMMENTS_GATEWAY);
    expect(typeof comments.list).toBe('function');
    expect(typeof comments.create).toBe('function');

    const engagement = TestBed.inject(ENGAGEMENT_GATEWAY);
    expect(typeof engagement.load).toBe('function');
    expect(typeof engagement.toggleFollow).toBe('function');
    expect(typeof engagement.toggleLike).toBe('function');
    expect(typeof engagement.toggleSave).toBe('function');
  });

  it('resolves the comments token to MockCommentsGateway by default', () => {
    const comments = TestBed.inject(COMMENTS_GATEWAY);

    expect(comments).toBeInstanceOf(MockCommentsGateway);
    expect(typeof comments.list).toBe('function');
    expect(typeof comments.create).toBe('function');
  });

  it('swaps to an alternative adapter with a provider change only', async () => {
    const custom: FeedGateway = {
      timeline: async () => ({
        items: [
          {
            id: 'custom-1',
            authorId: 'custom-author',
            content: 'Desde un adaptador alternativo',
            createdAt: '2026-10-01T10:00:00.000Z'
          }
        ],
        meta: { page: 1, pageSize: 20, total: 1 }
      }),
      create: async (input) => ({
        id: 'custom-created',
        authorId: 'custom-author',
        content: input.content,
        createdAt: '2026-10-01T10:00:00.000Z'
      })
    };

    TestBed.overrideProvider(FEED_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(FEED_GATEWAY);

    expect(injected).toBe(custom);
    const page = await injected.timeline();
    expect(page.items[0]?.id).toBe('custom-1');
    expect(page.items[0]?.content).toBe('Desde un adaptador alternativo');
  });

  it('swaps the auth adapter with a provider change only', async () => {
    const custom: AuthGateway = {
      register: async () => ({ userId: 'swap-user', token: 'swap-token' }),
      login: async () => ({ token: 'swap-token', role: 'worker' }),
      logout: async () => undefined,
      me: async () => ({ userId: 'swap-user', email: 'swap@demo.test', role: 'worker' })
    };

    TestBed.overrideProvider(AUTH_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(AUTH_GATEWAY);

    expect(injected).toBe(custom);
    expect((await injected.me()).userId).toBe('swap-user');
  });

  it('swaps the jobs adapter with a provider change only', async () => {
    const custom: JobsGateway = {
      list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
      byId: async () => null
    };

    TestBed.overrideProvider(JOBS_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(JOBS_GATEWAY);

    expect(injected).toBe(custom);
    expect(await injected.byId('x')).toBeNull();
  });

  it('swaps the applications adapter with a provider change only', async () => {
    const custom: ApplicationsGateway = {
      create: async (input) => ({
        id: 'swap-app',
        jobId: input.jobId,
        applicantId: 'swap-applicant',
        status: 'pending',
        createdAt: '2026-10-01T10:00:00.000Z'
      }),
      list: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } })
    };

    TestBed.overrideProvider(APPLICATIONS_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(APPLICATIONS_GATEWAY);

    expect(injected).toBe(custom);
    const page = await injected.list();
    expect(page.items).toEqual([]);
    expect(page.meta.total).toBe(0);
  });

  it('swaps the profiles adapter with a provider change only', async () => {
    const custom: ProfilesGateway = {
      worker: async () => ({
        userId: 'swap-user',
        role: 'worker',
        fullName: 'Swap',
        createdAt: '2026-10-01T10:00:00.000Z'
      }),
      updateWorker: async (userId) => ({
        userId,
        role: 'worker',
        fullName: 'Swap',
        createdAt: '2026-10-01T10:00:00.000Z'
      }),
      company: async () => null,
      updateCompany: async (companyId) => ({
        companyId,
        role: 'company',
        name: 'Swap',
        createdAt: '2026-10-01T10:00:00.000Z'
      })
    };

    TestBed.overrideProvider(PROFILES_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(PROFILES_GATEWAY);

    expect(injected).toBe(custom);
    expect((await injected.worker('any'))?.fullName).toBe('Swap');
  });

  it('resolves the engagement token to MockEngagementGateway by default', () => {
    const engagement = TestBed.inject(ENGAGEMENT_GATEWAY);

    expect(engagement).toBeInstanceOf(MockEngagementGateway);
  });

  it('gives the default engagement adapter the versioned storage envelope', async () => {
    const engagement = TestBed.inject(ENGAGEMENT_GATEWAY);

    await engagement.toggleFollow('worker-1', 'company-2');

    expect(await engagement.load()).toEqual({
      'worker-1': { following: ['company-2'], liked: [], saved: [] }
    });
    expect(JSON.parse(localStorage.getItem('constructora.platform.engagement') ?? 'null')).toEqual({
      v: 1,
      state: { 'worker-1': { following: ['company-2'], liked: [], saved: [] } }
    });
  });

  it('swaps the engagement adapter with a provider change only', async () => {
    const custom: EngagementGateway = {
      load: async () => ({
        'viewer-1': { following: ['author-1'], liked: ['post-1'], saved: [] }
      }),
      toggleFollow: async (viewerId, authorId) => ({
        [viewerId]: { following: [authorId], liked: [], saved: [] }
      }),
      toggleLike: async (viewerId, postId) => ({
        [viewerId]: { following: [], liked: [postId], saved: [] }
      }),
      toggleSave: async (viewerId, postId) => ({
        [viewerId]: { following: [], liked: [], saved: [postId] }
      })
    };

    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(ENGAGEMENT_GATEWAY);

    expect(injected).toBe(custom);
    expect(await injected.load()).toEqual({
      'viewer-1': { following: ['author-1'], liked: ['post-1'], saved: [] }
    });
    const afterLike = await injected.toggleLike('viewer-1', 'post-9');
    expect(afterLike['viewer-1']?.liked).toEqual(['post-9']);
  });

  it('swaps the comments adapter with a provider change only', async () => {
    const custom: CommentsGateway = {
      list: async (postId) => [
        {
          id: 'swap-comment',
          postId,
          authorId: 'worker-9',
          authorName: 'Swap Author',
          authorRole: 'worker',
          body: 'Desde un adaptador alternativo',
          createdAt: '2026-10-01T10:00:00.000Z'
        }
      ],
      create: async (input) => ({
        id: 'swap-created',
        postId: input.postId,
        authorId: 'worker-9',
        authorName: 'Swap Author',
        authorRole: 'worker',
        body: input.body,
        createdAt: '2026-10-01T10:00:00.000Z'
      })
    };

    TestBed.overrideProvider(COMMENTS_GATEWAY, { useValue: custom });
    const injected = TestBed.inject(COMMENTS_GATEWAY);

    expect(injected).toBe(custom);
    const comments = await injected.list('post-1');
    expect(comments[0]?.id).toBe('swap-comment');
    expect(comments[0]?.body).toBe('Desde un adaptador alternativo');
    const created = await injected.create({ postId: 'post-1', body: 'Nuevo aporte' });
    expect(created.id).toBe('swap-created');
    expect(created.postId).toBe('post-1');
  });
});
