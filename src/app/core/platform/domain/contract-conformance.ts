import type { components, paths } from '../api/generated/schema.gen';
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
 * W1 closure (api-conformance: "Frontend compile-time conformance").
 *
 * A NON-SPEC file, so it is a root of the `tsconfig.app.json` program (its
 * `include` matches every `.ts` under `src/` while `*.spec.ts` is excluded) and
 * therefore type-checked by `bunx ng build` — contract drift becomes a BUILD
 * failure, not only a test failure. Zero runtime value: every declaration here
 * is type-only and erased.
 *
 * The constraint is deliberately BIDIRECTIONAL at each use site: a single
 * `AssertExtends<Schema, Domain>` only proves the domain covers the schema and
 * would silently miss a field REMOVED from the schema — the reverse direction
 * (`AssertExtends<Domain, Schema>`) is what catches removals. See design.md
 * "W1 closure mechanics". Each pair below is `*Covered` (domain candidate must
 * cover the schema) + `*Exact` (schema must still satisfy the domain), and a
 * mismatch is a compile error at the alias itself, regardless of usage.
 */
export type AssertExtends<Target, Candidate extends Target> = Candidate;

type Schema = components['schemas'];

/** `/auth/me` has no named schema; its inline response body is the User shape. */
type MeResponse = paths['/auth/me']['get']['responses'][200]['content']['application/json'];

/** The worker and company profiles as one union, mirrored from the schema. */
type SchemaProfile = Schema['WorkerProfile'] | Schema['CompanyProfile'];

// --- Shared vocabulary ------------------------------------------------------

export type RoleCovered = AssertExtends<Schema['Role'], Role>;
export type RoleExact = AssertExtends<Role, Schema['Role']>;

export type PaginationCovered = AssertExtends<Schema['Pagination'], Pagination>;
export type PaginationExact = AssertExtends<Pagination, Schema['Pagination']>;

export type JobStatusCovered = AssertExtends<Schema['JobStatus'], JobStatus>;
export type JobStatusExact = AssertExtends<JobStatus, Schema['JobStatus']>;

export type ApplicationStatusCovered = AssertExtends<Schema['ApplicationStatus'], ApplicationStatus>;
export type ApplicationStatusExact = AssertExtends<ApplicationStatus, Schema['ApplicationStatus']>;

// --- Entities ---------------------------------------------------------------

export type UserCovered = AssertExtends<MeResponse, User>;
export type UserExact = AssertExtends<User, MeResponse>;

export type ProfileCovered = AssertExtends<SchemaProfile, Profile>;
export type ProfileExact = AssertExtends<Profile, SchemaProfile>;

export type WorkerProfileCovered = AssertExtends<Schema['WorkerProfile'], WorkerProfile>;
export type WorkerProfileExact = AssertExtends<WorkerProfile, Schema['WorkerProfile']>;

export type CompanyProfileCovered = AssertExtends<Schema['CompanyProfile'], CompanyProfile>;
export type CompanyProfileExact = AssertExtends<CompanyProfile, Schema['CompanyProfile']>;

export type PostCovered = AssertExtends<Schema['FeedPost'], Post>;
export type PostExact = AssertExtends<Post, Schema['FeedPost']>;

export type JobOpeningCovered = AssertExtends<Schema['Job'], JobOpening>;
export type JobOpeningExact = AssertExtends<JobOpening, Schema['Job']>;

export type ApplicationCovered = AssertExtends<Schema['Application'], Application>;
export type ApplicationExact = AssertExtends<Application, Schema['Application']>;

// --- Input DTOs -------------------------------------------------------------

export type PostInputCovered = AssertExtends<Schema['FeedPostInput'], PostInput>;
export type PostInputExact = AssertExtends<PostInput, Schema['FeedPostInput']>;

export type JobOpeningInputCovered = AssertExtends<Schema['JobInput'], JobOpeningInput>;
export type JobOpeningInputExact = AssertExtends<JobOpeningInput, Schema['JobInput']>;

export type ApplicationInputCovered = AssertExtends<Schema['ApplicationInput'], ApplicationInput>;
export type ApplicationInputExact = AssertExtends<ApplicationInput, Schema['ApplicationInput']>;

export type WorkerProfileInputCovered = AssertExtends<Schema['WorkerProfileInput'], WorkerProfileInput>;
export type WorkerProfileInputExact = AssertExtends<WorkerProfileInput, Schema['WorkerProfileInput']>;

export type CompanyProfileInputCovered = AssertExtends<
  Schema['CompanyProfileInput'],
  CompanyProfileInput
>;
export type CompanyProfileInputExact = AssertExtends<CompanyProfileInput, Schema['CompanyProfileInput']>;

// --- Page envelopes ---------------------------------------------------------

export type FeedPostPageCovered = AssertExtends<Schema['FeedPostPage'], Page<Post>>;
export type FeedPostPageExact = AssertExtends<Page<Post>, Schema['FeedPostPage']>;

export type JobPageCovered = AssertExtends<Schema['JobPage'], Page<JobOpening>>;
export type JobPageExact = AssertExtends<Page<JobOpening>, Schema['JobPage']>;

export type ApplicationPageCovered = AssertExtends<Schema['ApplicationPage'], Page<Application>>;
export type ApplicationPageExact = AssertExtends<Page<Application>, Schema['ApplicationPage']>;
