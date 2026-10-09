import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { FeedGateway } from './ports';
import {
  APPLICATIONS_GATEWAY,
  AUTH_GATEWAY,
  FEED_GATEWAY,
  JOBS_GATEWAY,
  PROFILES_GATEWAY
} from './ports';

describe('gateway ports (DI tokens)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
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
});
