import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { FEED_POSTS, JOBS, APPLICATIONS, COMMENTS, DEMO_ACCOUNTS } from '../mocks/fixtures';
import { MockCommentsGateway } from './mock-comments.gateway';
import {
  APPLICATIONS_GATEWAY,
  AUTH_GATEWAY,
  COMMENTS_GATEWAY,
  FEED_GATEWAY,
  JOBS_GATEWAY,
  PROFILES_GATEWAY
} from './ports';

describe('mock gateway adapters', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('FeedGateway mock', () => {
    it('returns the seeded timeline deterministically, placeholder-flagged', async () => {
      const gateway = TestBed.inject(FEED_GATEWAY);

      const first = await gateway.timeline();
      const second = await gateway.timeline();

      expect(first.items.map((post) => post.id)).toEqual(FEED_POSTS.map((post) => post.id));
      expect(first).toEqual(second);
      expect(FEED_POSTS.every((post) => post.isPlaceholder)).toBe(true);
      expect(first.meta).toEqual({ page: 1, pageSize: 20, total: FEED_POSTS.length });
    });

    it('keeps created posts in later timelines and grows the envelope', async () => {
      const gateway = TestBed.inject(FEED_GATEWAY);

      const created = await gateway.create({ content: 'Iniciamos losa en Sarandí' });

      expect(created.content).toBe('Iniciamos losa en Sarandí');
      expect(created.id).toMatch(/^post-new-/);

      const after = await gateway.timeline();
      expect(after.items.map((post) => post.id)).toContain(created.id);
      expect(after.meta.total).toBe(FEED_POSTS.length + 1);
    });
  });

  describe('JobsGateway mock', () => {
    it('lists the seeded openings inside the pagination envelope', async () => {
      const gateway = TestBed.inject(JOBS_GATEWAY);

      const page = await gateway.list();

      expect(page.items.map((job) => job.id)).toEqual(JOBS.map((job) => job.id));
      expect(page.meta.total).toBe(JOBS.length);
      expect(JOBS.every((job) => job.isPlaceholder)).toBe(true);
    });

    it('resolves one opening by id and null for an unknown one', async () => {
      const gateway = TestBed.inject(JOBS_GATEWAY);

      const known = await gateway.byId(JOBS[0].id);
      const unknown = await gateway.byId('job-que-no-existe');

      expect(known?.title).toBe(JOBS[0].title);
      expect(unknown).toBeNull();
    });
  });

  describe('ApplicationsGateway mock', () => {
    it('seeds an application with a non-default status for tracking', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const page = await gateway.list();

      const accepted = page.items.filter((application) => application.status === 'accepted');
      expect(accepted).toHaveLength(1);
      expect(accepted[0].jobId).toBe(JOBS[0].id);
      expect(APPLICATIONS.some((application) => application.isPlaceholder)).toBe(true);
    });

    it('creates applications as pending and keeps them listable by job', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const created = await gateway.create({ jobId: JOBS[1].id, message: 'Tengo disponibilidad' });

      expect(created.status).toBe('pending');
      expect(created.jobId).toBe(JOBS[1].id);

      const forJob = await gateway.list({ jobId: JOBS[1].id });
      expect(forJob.items.map((application) => application.id)).toContain(created.id);
    });

    it('filters by status so the board only shows what was asked for', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const pending = await gateway.list({ status: 'pending' });

      expect(pending.items).toHaveLength(1);
      expect(pending.items[0].status).toBe('pending');
    });

    it('filters by applicantId so an applicant only sees their own', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const page = await gateway.list({ applicantId: 'worker-1' });

      expect(page.items.map((application) => application.id)).toEqual(['app-1']);
    });

    it('combines jobId and applicantId with AND semantics', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const both = await gateway.list({ jobId: JOBS[1].id, applicantId: 'worker-2' });
      expect(both.items.map((application) => application.id)).toEqual(['app-2']);

      const none = await gateway.list({ jobId: JOBS[0].id, applicantId: 'worker-2' });
      expect(none.items).toEqual([]);
      expect(none.meta.total).toBe(0);
    });

    it('returns an empty page when no application matches', async () => {
      const gateway = TestBed.inject(APPLICATIONS_GATEWAY);

      const page = await gateway.list({ applicantId: 'sin-postulaciones' });

      expect(page.items).toEqual([]);
      expect(page.meta.total).toBe(0);
    });
  });

  describe('AuthGateway mock', () => {
    it('logs a seeded demo account in and exposes it through me()', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);
      const demo = DEMO_ACCOUNTS[0];

      const session = await gateway.login(demo.email, demo.password);

      expect(session.role).toBe(demo.role);
      const me = await gateway.me();
      expect(me.userId).toBe(demo.userId);
      expect(me.email).toBe(demo.email);
    });

    it('rejects wrong credentials without issuing any network call', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);

      await expect(gateway.login(DEMO_ACCOUNTS[0].email, 'otra-clave')).rejects.toThrow(
        'Credenciales inválidas'
      );
    });

    it('registers a new account that can read itself through me()', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);

      const registered = await gateway.register({
        email: 'nuevo@demo.test',
        password: 'demo1234',
        role: 'worker'
      });

      expect(registered.userId).toMatch(/^user-/);
      expect(registered.token).toBeTruthy();

      const me = await gateway.me();
      expect(me.email).toBe('nuevo@demo.test');
      expect(me.role).toBe('worker');
    });

    it('clears the session on logout so me() stops resolving', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);
      const demo = DEMO_ACCOUNTS[1];

      await gateway.login(demo.email, demo.password);
      await gateway.logout();

      await expect(gateway.me()).rejects.toThrow('No autenticado');
    });

    it('rejects a self-assigned admin role with a Spanish error and creates no session', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);

      await expect(
        gateway.register({ email: 'admin@demo.test', password: 'demo1234', role: 'admin' })
      ).rejects.toThrow('Rol no permitido para el registro');

      await expect(gateway.me()).rejects.toThrow('No autenticado');
    });

    it('registers a company account through me()', async () => {
      const gateway = TestBed.inject(AUTH_GATEWAY);

      const registered = await gateway.register({
        email: 'empresa@demo.test',
        password: 'demo1234',
        role: 'company'
      });

      expect(registered.userId).toMatch(/^user-/);

      const me = await gateway.me();
      expect(me.email).toBe('empresa@demo.test');
      expect(me.role).toBe('company');
    });
  });

  describe('ProfilesGateway mock', () => {
    it('round-trips the worker profile, preserving untouched fields', async () => {
      const gateway = TestBed.inject(PROFILES_GATEWAY);

      const before = await gateway.worker('worker-1');
      expect(before?.fullName).toBe('Lucía Fernández');

      await gateway.updateWorker('worker-1', {
        phone: '+54 9 11 5555-0000',
        skills: ['Electricidad', 'Plomería']
      });

      const after = await gateway.worker('worker-1');
      expect(after?.phone).toBe('+54 9 11 5555-0000');
      expect(after?.skills).toEqual(['Electricidad', 'Plomería']);
      expect(after?.fullName).toBe('Lucía Fernández');
      expect(after?.updatedAt).toBeTruthy();
    });

    it('round-trips the company profile', async () => {
      const gateway = TestBed.inject(PROFILES_GATEWAY);

      const before = await gateway.company('company-1');
      expect(before?.name).toBe('Constructora Norte SAC');

      await gateway.updateCompany('company-1', { description: 'Obras comerciales en GBA Norte' });

      const after = await gateway.company('company-1');
      expect(after?.description).toBe('Obras comerciales en GBA Norte');
      expect(after?.name).toBe('Constructora Norte SAC');
    });

    it('reads an unknown profile as null instead of throwing', async () => {
      const gateway = TestBed.inject(PROFILES_GATEWAY);

      expect(await gateway.worker('sin-usuario')).toBeNull();
      expect(await gateway.company('sin-empresa')).toBeNull();
    });

    it('seeds the extra demo profiles so worker-2/3 and company-2 resolve', async () => {
      const gateway = TestBed.inject(PROFILES_GATEWAY);

      const worker2 = await gateway.worker('worker-2');
      const worker3 = await gateway.worker('worker-3');
      const company2 = await gateway.company('company-2');

      expect(worker2?.fullName).toBe('Martín Gómez');
      expect(worker3?.fullName).toBe('Sofía Ruiz');
      expect(company2?.name).toBe('Grupo Delta Construcciones');
    });
  });

  describe('CommentsGateway mock', () => {
    it('lists only the requested post thread, in seeded chronological order', async () => {
      const gateway = TestBed.inject(COMMENTS_GATEWAY);

      const thread = await gateway.list('post-1');

      expect(thread.map((comment) => comment.id)).toEqual(['comment-1', 'comment-2']);
      expect(thread.every((comment) => comment.postId === 'post-1')).toBe(true);
    });

    it('returns an empty thread for a post with no comments', async () => {
      const gateway = TestBed.inject(COMMENTS_GATEWAY);

      const thread = await gateway.list('post-2');

      expect(thread).toEqual([]);
    });

    it('returns copies so callers cannot mutate the stored thread', async () => {
      const gateway = TestBed.inject(COMMENTS_GATEWAY);

      const first = await gateway.list('post-1');
      first[0].body = 'mutado por el llamado';

      const second = await gateway.list('post-1');
      expect(second[0].body).toBe(COMMENTS[0].body);
      expect(second[0].body).not.toBe('mutado por el llamado');
    });

    it('creates a comment with a synthetic id, ISO timestamp and the demo author', async () => {
      const gateway = TestBed.inject(COMMENTS_GATEWAY);

      const created = await gateway.create({ postId: 'post-1', body: '  Sumate al avance del lunes  ' });

      expect(created.id).toBe('comment-new-1');
      expect(created.postId).toBe('post-1');
      expect(created.body).toBe('Sumate al avance del lunes');
      expect(created.authorId).toBe('worker-1');
      expect(created.authorName).toBe('Demo Worker');
      expect(created.authorRole).toBe('worker');
      expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(Number.isNaN(new Date(created.createdAt).getTime())).toBe(false);
    });

    it('scopes synthetic ids per instance so a fresh gateway restarts at 1', async () => {
      const first = new MockCommentsGateway();
      const second = new MockCommentsGateway();

      const a = await first.create({ postId: 'post-1', body: 'primero' });
      const b = await second.create({ postId: 'post-1', body: 'segundo' });

      expect(a.id).toBe('comment-new-1');
      expect(b.id).toBe('comment-new-1');
    });

    it('keeps created comments in later reads of the same thread, advancing ids', async () => {
      const gateway = TestBed.inject(COMMENTS_GATEWAY);

      const first = await gateway.create({ postId: 'post-3', body: 'Aviso confirmado' });
      const second = await gateway.create({ postId: 'post-3', body: 'Segundo aviso' });

      const thread = await gateway.list('post-3');
      expect(thread.map((comment) => comment.id)).toContain(first.id);
      expect(thread.map((comment) => comment.id)).toContain(second.id);
      expect(thread).toHaveLength(3); // 1 seeded + 2 created

      expect(second.id).not.toBe(first.id);
      const seq = (id: string) => Number(id.replace('comment-new-', ''));
      expect(seq(second.id)).toBeGreaterThan(seq(first.id));
    });
  });
});
