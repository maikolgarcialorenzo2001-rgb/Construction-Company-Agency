/**
 * Hand-written platform domain model. The shapes intentionally mirror the generated
 * contract types (`FeedPost`, `Job`, `Application`, `WorkerProfile`, `CompanyProfile`)
 * field by field so the DTOs the gateway ports consume are contract-shaped. The binding
 * that proves this is `contract-conformance.ts` (a non-spec file in the build program),
 * not this module: a contract drift fails `bunx ng build` there, not merely `ng test`.
 *
 * Arrays are mutable (not `readonly`) so structural assignability holds in both
 * directions against the generated types, which are emitted with mutable arrays.
 */

/** Shared role model. Registration may self-assign only `worker` or `company`. */
export type Role = 'worker' | 'company' | 'admin';

/** The authenticated platform user (session shape, generated from `/auth/me`). */
export interface User {
  userId: string;
  email: string;
  role: Role;
}

export interface WorkerProfile {
  userId: string;
  role: Role;
  fullName: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface WorkerProfileInput {
  fullName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
}

export interface CompanyProfile {
  companyId: string;
  role: Role;
  name: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  phone?: string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyProfileInput {
  name?: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  phone?: string;
  location?: string;
}

/** A platform profile is either side of the marketplace. */
export type Profile = WorkerProfile | CompanyProfile;

export interface Post {
  id: string;
  authorId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PostInput {
  content: string;
  attachments?: string[];
}

/**
 * Discriminated tag for the feed view-model (design D1). Each structured post
 * type (worker job-request, company vacancy) extends the base template through
 * `[postBody]`/`[postExtra]` without widening the contract `Post`.
 */
export type PostKind = 'standard' | 'job-request' | 'vacancy';

/** Structured payload for worker job-request posts (Plantilla 2). Demo-only. */
export interface JobRequestPayload {
  position: string;
  availability: string;
  modality: string;
  experience: string;
}

/**
 * Reference-only payload for company vacancy posts (Plantilla 3, p16). Holds
 * job ids 1..n and deliberately copies NO `JobOpening` field (title, location,
 * budget, status) — the card resolves jobs live via `JobsStore`, so a job
 * closed after seeding renders truthfully. Demo-only.
 */
export interface VacancyPayload {
  jobIds: string[];
}

/**
 * A denormalized, render-ready feed post consumed by `PostTemplateComponent`
 * (design D1/D2): the template reads a resolved `authorName`/`authorRole` and
 * never a raw `authorId`. Demo-only: there is no OpenAPI schema behind it, so it
 * deliberately has NO `contract-conformance.ts` entry (a `PostView` pair there
 * would break `ng build` — same guard as `Comment`/`DirectoryUser`).
 */
export interface PostView {
  id: string;
  kind: PostKind;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  attachments: string[];
  createdAt: string;
  jobRequest?: JobRequestPayload;
  vacancy?: VacancyPayload;
}

/**
 * A comment attached to a feed post. Demo-only for now: there is no OpenAPI
 * schema behind it, so it deliberately has no `contract-conformance.ts` entry
 * (a Comment pair there would break `ng build` — see the design guard).
 */
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface CommentInput {
  postId: string;
  body: string;
}

export type JobStatus = 'open' | 'closed';

export interface JobOpening {
  id: string;
  companyId: string;
  title: string;
  description: string;
  budget?: number;
  location?: string;
  status: JobStatus;
  createdAt: string;
}

export interface JobOpeningInput {
  title: string;
  description: string;
  budget?: number;
  location?: string;
  status?: JobStatus;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationInput {
  jobId: string;
  message?: string;
}

/**
 * A read-only directory row of the admin area (design D4): the demo account
 * *without* its credential. The type deliberately has no `password` field, so a
 * password cannot leak through it. Demo-only: there is no OpenAPI schema behind
 * it, so it has no `contract-conformance.ts` binding either (a `DirectoryUser`
 * entry there would break `ng build` — same guard as `Comment`, see D5/R7).
 */
export interface DirectoryUser {
  userId: string;
  email: string;
  role: Role;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

/** Generic pagination envelope shared by feed, jobs and applications listings. */
export interface Page<T> {
  items: T[];
  meta: Pagination;
}
