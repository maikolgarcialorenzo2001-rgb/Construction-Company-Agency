import { describe, expectTypeOf, it } from 'vitest';

import type { components, paths } from '../api/generated/schema.gen';
import type {
  AssertExtends,
  ApplicationCovered,
  ApplicationExact,
  ApplicationInputCovered,
  ApplicationInputExact,
  ApplicationPageCovered,
  ApplicationPageExact,
  ApplicationStatusCovered,
  ApplicationStatusExact,
  CompanyProfileCovered,
  CompanyProfileExact,
  CompanyProfileInputCovered,
  CompanyProfileInputExact,
  FeedPostPageCovered,
  FeedPostPageExact,
  JobOpeningCovered,
  JobOpeningExact,
  JobOpeningInputCovered,
  JobOpeningInputExact,
  JobPageCovered,
  JobPageExact,
  JobStatusCovered,
  JobStatusExact,
  PaginationCovered,
  PaginationExact,
  PostCovered,
  PostExact,
  PostInputCovered,
  PostInputExact,
  ProfileCovered,
  ProfileExact,
  RoleCovered,
  RoleExact,
  UserCovered,
  UserExact,
  WorkerProfileCovered,
  WorkerProfileExact,
  WorkerProfileInputCovered,
  WorkerProfileInputExact
} from './contract-conformance';
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  CompanyProfile,
  CompanyProfileInput,
  JobOpening,
  JobOpeningInput,
  JobStatus,
  Page,
  Pagination,
  Post,
  PostInput,
  Profile,
  Role,
  User,
  WorkerProfile,
  WorkerProfileInput
} from './models';

/**
 * Type-level acceptance for api-conformance "Platform domain type bindings":
 * every exported domain type is declared against its `components['schemas']`
 * counterpart through the bidirectional `AssertExtends` aliases in
 * `contract-conformance.ts`.
 *
 * The heavy lifting happens at the alias declarations (a constraint violation
 * there fails `bunx ng build` — the W1 closure). This spec pins that the
 * bindings exist and resolve to the expected side, so deleting or re-wiring a
 * binding breaks the test run as well.
 */
describe('platform domain bindings to the contract (W1)', () => {
  describe('entities', () => {
    it('binds User to the /auth/me response in both directions', () => {
      type MeResponse = paths['/auth/me']['get']['responses'][200]['content']['application/json'];

      expectTypeOf<UserCovered>().toEqualTypeOf<User>();
      expectTypeOf<UserExact>().toEqualTypeOf<MeResponse>();
    });

    it('binds Role to the shared schema enum in both directions', () => {
      expectTypeOf<RoleCovered>().toEqualTypeOf<Role>();
      expectTypeOf<RoleExact>().toEqualTypeOf<components['schemas']['Role']>();
    });

    it('binds Profile to the worker|company schema union in both directions', () => {
      expectTypeOf<ProfileCovered>().toEqualTypeOf<Profile>();
      expectTypeOf<ProfileExact>().toEqualTypeOf<
        components['schemas']['WorkerProfile'] | components['schemas']['CompanyProfile']
      >();
    });

    it('binds WorkerProfile and CompanyProfile in both directions', () => {
      expectTypeOf<WorkerProfileCovered>().toEqualTypeOf<WorkerProfile>();
      expectTypeOf<WorkerProfileExact>().toEqualTypeOf<components['schemas']['WorkerProfile']>();
      expectTypeOf<CompanyProfileCovered>().toEqualTypeOf<CompanyProfile>();
      expectTypeOf<CompanyProfileExact>().toEqualTypeOf<components['schemas']['CompanyProfile']>();
    });

    it('binds Post to FeedPost in both directions', () => {
      expectTypeOf<PostCovered>().toEqualTypeOf<Post>();
      expectTypeOf<PostExact>().toEqualTypeOf<components['schemas']['FeedPost']>();
    });

    it('binds JobOpening to Job in both directions', () => {
      expectTypeOf<JobOpeningCovered>().toEqualTypeOf<JobOpening>();
      expectTypeOf<JobOpeningExact>().toEqualTypeOf<components['schemas']['Job']>();
    });

    it('binds Application to Application in both directions', () => {
      expectTypeOf<ApplicationCovered>().toEqualTypeOf<Application>();
      expectTypeOf<ApplicationExact>().toEqualTypeOf<components['schemas']['Application']>();
    });
  });

  describe('DTOs, enums and the pagination envelope', () => {
    it('binds every input DTO in both directions', () => {
      expectTypeOf<PostInputCovered>().toEqualTypeOf<PostInput>();
      expectTypeOf<PostInputExact>().toEqualTypeOf<components['schemas']['FeedPostInput']>();
      expectTypeOf<JobOpeningInputCovered>().toEqualTypeOf<JobOpeningInput>();
      expectTypeOf<JobOpeningInputExact>().toEqualTypeOf<components['schemas']['JobInput']>();
      expectTypeOf<ApplicationInputCovered>().toEqualTypeOf<ApplicationInput>();
      expectTypeOf<ApplicationInputExact>().toEqualTypeOf<components['schemas']['ApplicationInput']>();
      expectTypeOf<WorkerProfileInputCovered>().toEqualTypeOf<WorkerProfileInput>();
      expectTypeOf<WorkerProfileInputExact>().toEqualTypeOf<components['schemas']['WorkerProfileInput']>();
      expectTypeOf<CompanyProfileInputCovered>().toEqualTypeOf<CompanyProfileInput>();
      expectTypeOf<CompanyProfileInputExact>().toEqualTypeOf<components['schemas']['CompanyProfileInput']>();
    });

    it('binds the status enums and Pagination in both directions', () => {
      expectTypeOf<JobStatusCovered>().toEqualTypeOf<JobStatus>();
      expectTypeOf<JobStatusExact>().toEqualTypeOf<components['schemas']['JobStatus']>();
      expectTypeOf<ApplicationStatusCovered>().toEqualTypeOf<ApplicationStatus>();
      expectTypeOf<ApplicationStatusExact>().toEqualTypeOf<components['schemas']['ApplicationStatus']>();
      expectTypeOf<PaginationCovered>().toEqualTypeOf<Pagination>();
      expectTypeOf<PaginationExact>().toEqualTypeOf<components['schemas']['Pagination']>();
    });

    it('binds each page envelope to Page<T> in both directions', () => {
      expectTypeOf<FeedPostPageCovered>().toEqualTypeOf<Page<Post>>();
      expectTypeOf<FeedPostPageExact>().toEqualTypeOf<components['schemas']['FeedPostPage']>();
      expectTypeOf<JobPageCovered>().toEqualTypeOf<Page<JobOpening>>();
      expectTypeOf<JobPageExact>().toEqualTypeOf<components['schemas']['JobPage']>();
      expectTypeOf<ApplicationPageCovered>().toEqualTypeOf<Page<Application>>();
      expectTypeOf<ApplicationPageExact>().toEqualTypeOf<components['schemas']['ApplicationPage']>();
    });
  });

  describe('AssertExtends rejects drift in both directions (W1 mechanism)', () => {
    it('rejects a candidate that drops required schema fields (forward, cf. api/conformance probe)', () => {
      // @ts-expect-error - a candidate without the schema's required fields must not pass
      type Drifted = AssertExtends<components['schemas']['Job'], { title: string }>;

      expectTypeOf<Drifted>().toEqualTypeOf<{ title: string }>();
    });

    it('rejects a schema that lost a field the domain requires (reverse: field removal)', () => {
      // The reverse half is what a single-direction AssertExtends would miss:
      // removing a field from the schema must break the binding here.
      // @ts-expect-error - a schema without `content` must not satisfy Post
      type Drifted = AssertExtends<Post, Omit<components['schemas']['FeedPost'], 'content'>>;

      expectTypeOf<Drifted>().toEqualTypeOf<Omit<components['schemas']['FeedPost'], 'content'>>();
    });
  });
});
