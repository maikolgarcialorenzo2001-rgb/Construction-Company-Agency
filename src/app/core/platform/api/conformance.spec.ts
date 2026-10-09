import { describe, expectTypeOf, it } from 'vitest';
import type { AssertExtends } from '../domain/contract-conformance';
import type { components, operations, paths } from './generated/schema.gen';

/**
 * Type-level conformance spec: locks the generated TypeScript types to the
 * api-contract spec (openspec/changes/p2-api-contract/specs/api-contract/spec.md).
 * Any drift between contracts/openapi.yaml and these assertions fails here.
 */
describe('api contract conformance', () => {
  describe('Role model is constrained', () => {
    it('Role is exactly worker | company | admin', () => {
      expectTypeOf<components['schemas']['Role']>().toEqualTypeOf<'worker' | 'company' | 'admin'>();
    });

    it('profile schemas reference the shared Role enum', () => {
      expectTypeOf<components['schemas']['WorkerProfile']>().toMatchTypeOf<{
        role: components['schemas']['Role'];
      }>();
      expectTypeOf<components['schemas']['CompanyProfile']>().toMatchTypeOf<{
        role: components['schemas']['Role'];
      }>();
    });
  });

  describe('auth domain', () => {
    it('register, login and me operations exist', () => {
      expectTypeOf<paths['/auth/register']['post']>().not.toBeNever();
      expectTypeOf<paths['/auth/login']['post']>().not.toBeNever();
      expectTypeOf<paths['/auth/me']['get']>().not.toBeNever();
    });

    it('login returns token and role', () => {
      type LoginResponse = paths['/auth/login']['post']['responses']['200']['content']['application/json'];
      expectTypeOf<LoginResponse>().toEqualTypeOf<{
        token: string;
        role: components['schemas']['Role'];
      }>();
    });
  });

  describe('jobs domain', () => {
    it('CRUD, listing and search operations exist', () => {
      expectTypeOf<paths['/jobs']['post']>().not.toBeNever();
      expectTypeOf<paths['/jobs']['get']>().not.toBeNever();
      expectTypeOf<paths['/jobs/search']['get']>().not.toBeNever();
      expectTypeOf<paths['/jobs/{jobId}']['get']>().not.toBeNever();
      expectTypeOf<paths['/jobs/{jobId}']['put']>().not.toBeNever();
      expectTypeOf<paths['/jobs/{jobId}']['delete']>().not.toBeNever();
    });

    it('listing and search share the pagination envelope', () => {
      type JobListBody = paths['/jobs']['get']['responses']['200']['content']['application/json'];
      type JobSearchBody = paths['/jobs/search']['get']['responses']['200']['content']['application/json'];
      expectTypeOf<JobListBody>().toEqualTypeOf<components['schemas']['JobPage']>();
      expectTypeOf<JobSearchBody>().toEqualTypeOf<components['schemas']['JobPage']>();
      expectTypeOf<components['schemas']['JobPage']>().toMatchTypeOf<{
        meta: components['schemas']['Pagination'];
      }>();
    });
  });

  describe('applications domain', () => {
    it('create, list and status transition operations exist', () => {
      expectTypeOf<paths['/applications']['post']>().not.toBeNever();
      expectTypeOf<paths['/applications']['get']>().not.toBeNever();
      expectTypeOf<paths['/applications/{applicationId}/status']['patch']>().not.toBeNever();
    });

    it('list shares the pagination envelope', () => {
      expectTypeOf<components['schemas']['ApplicationPage']>().toMatchTypeOf<{
        meta: components['schemas']['Pagination'];
      }>();
    });
  });

  describe('feed domain', () => {
    it('CRUD and timeline operations exist', () => {
      expectTypeOf<paths['/feed/posts']['post']>().not.toBeNever();
      expectTypeOf<paths['/feed/posts/{postId}']['get']>().not.toBeNever();
      expectTypeOf<paths['/feed/posts/{postId}']['put']>().not.toBeNever();
      expectTypeOf<paths['/feed/posts/{postId}']['delete']>().not.toBeNever();
      expectTypeOf<paths['/feed/timeline']['get']>().not.toBeNever();
    });

    it('timeline shares the pagination envelope', () => {
      expectTypeOf<components['schemas']['FeedPostPage']>().toMatchTypeOf<{
        meta: components['schemas']['Pagination'];
      }>();
    });
  });

  describe('profiles domain', () => {
    it('worker and company read/update operations exist', () => {
      expectTypeOf<paths['/profiles/worker/{userId}']['get']>().not.toBeNever();
      expectTypeOf<paths['/profiles/worker/{userId}']['put']>().not.toBeNever();
      expectTypeOf<paths['/profiles/company/{companyId}']['get']>().not.toBeNever();
      expectTypeOf<paths['/profiles/company/{companyId}']['put']>().not.toBeNever();
    });
  });

  describe('shared envelope conventions', () => {
    it('error envelope is uniform', () => {
      expectTypeOf<components['schemas']['Error']>().toEqualTypeOf<{
        code: string;
        message: string;
        details?: Record<string, unknown>;
      }>();
    });

    it('error responses reference the shared error component', () => {
      type Login401 = paths['/auth/login']['post']['responses']['401']['content']['application/json'];
      type Job404 = paths['/jobs/{jobId}']['get']['responses']['404']['content']['application/json'];
      expectTypeOf<Login401>().toEqualTypeOf<components['schemas']['Error']>();
      expectTypeOf<Job404>().toEqualTypeOf<components['schemas']['Error']>();
    });
  });

  describe('operation identifiers survive codegen', () => {
    it('key operations are addressable by operationId', () => {
      expectTypeOf<operations['getMe']>().not.toBeNever();
      expectTypeOf<operations['createJob']>().not.toBeNever();
      expectTypeOf<operations['searchJobs']>().not.toBeNever();
      expectTypeOf<operations['createApplication']>().not.toBeNever();
      expectTypeOf<operations['updateApplicationStatus']>().not.toBeNever();
      expectTypeOf<operations['getTimeline']>().not.toBeNever();
      expectTypeOf<operations['getWorkerProfile']>().not.toBeNever();
      expectTypeOf<operations['updateCompanyProfile']>().not.toBeNever();
    });
  });

  describe('AssertExtends rejects drift (W1 mechanism)', () => {
    it('rejects a candidate that drops the required schema fields', () => {
      // A correct domain type extends the schema type, so the constraint holds. A
      // drifted candidate ({ id: number } is missing authorId/content/createdAt)
      // violates the type-argument constraint, which is exactly what W1 must catch.
      // @ts-expect-error - { id: number } must NOT be assignable to the schema FeedPost
      type Drifted = AssertExtends<components['schemas']['FeedPost'], { id: number }>;

      // The directive above is self-guarding: if AssertExtends ever stopped rejecting
      // this candidate, the error would vanish and tsc would report the now-unused
      // suppression comment, failing the type-check.
      expectTypeOf<Drifted>().toEqualTypeOf<{ id: number }>();
    });
  });
});