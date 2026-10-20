import { InjectionToken } from '@angular/core';

import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Comment,
  CommentInput,
  CompanyProfile,
  CompanyProfileInput,
  DirectoryUser,
  JobOpening,
  JobRequestPayload,
  Page,
  Post,
  PostKind,
  Role,
  User,
  WorkerProfile,
  WorkerProfileInput
} from '../domain';
import { MockAdminGateway } from './mock-admin.gateway';
import { MockApplicationsGateway } from './mock-applications.gateway';
import { MockAuthGateway } from './mock-auth.gateway';
import { MockCommentsGateway } from './mock-comments.gateway';
import { MockEngagementGateway } from './mock-engagement.gateway';
import { MockFeedGateway } from './mock-feed.gateway';
import { MockJobsGateway } from './mock-jobs.gateway';
import { MockProfilesGateway } from './mock-profiles.gateway';

/**
 * Port/adapter data layer for the platform (design decision #2). Ports are
 * plain interfaces returning `Promise<...>` over contract-shaped domain types;
 * each sits behind an `InjectionToken` whose `providedIn: 'root'` factory
 * returns the mock adapter — the same pattern as `ENVIRONMENT`.
 *
 * Swapping to real HTTP later is a provider change only: either replace the
 * factory or add one `{ provide: FEED_GATEWAY, useClass: HttpFeedGateway }`
 * line. No store or page ever imports a `Mock*` class directly.
 */

/** `POST /auth/register` body (registration offers only self-service roles). */
export interface RegisterInput {
  email: string;
  password: string;
  role: Role;
}

/** `POST /auth/login` 200 body. */
export interface AuthenticatedSession {
  token: string;
  role: Role;
}

/** `POST /auth/register` 201 body. */
export interface RegisteredSession {
  userId: string;
  token: string;
}

/** Mirrors the `jobId` / `applicantId` / `status` filters of `GET /applications`. */
export interface ApplicationsFilter {
  jobId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
}

/**
 * Demo-only create payload (design D3). The contract `PostInput` is
 * conformance-locked, so the draft carries the provenance the contract has no
 * room for: the session `authorId` (no more hardcoded `company-1`) plus the
 * `kind` discriminator and its optional structured payload. The adapter records
 * a `job-request` payload into the demo registry; the resolved `Post` stays
 * contract-shaped and never carries `kind`.
 */
export interface CreatePostDraft {
  authorId: string;
  kind: PostKind;
  content: string;
  attachments?: string[];
  jobRequest?: JobRequestPayload;
}

export interface FeedGateway {
  timeline(page?: number, pageSize?: number): Promise<Page<Post>>;
  create(draft: CreatePostDraft): Promise<Post>;
}

export interface JobsGateway {
  list(page?: number, pageSize?: number): Promise<Page<JobOpening>>;
  /** Resolves `null` for an unknown id so pages can show a not-found state. */
  byId(id: string): Promise<JobOpening | null>;
}

export interface ApplicationsGateway {
  create(input: ApplicationInput): Promise<Application>;
  list(filter?: ApplicationsFilter): Promise<Page<Application>>;
}

export interface AuthGateway {
  register(input: RegisterInput): Promise<RegisteredSession>;
  login(email: string, password: string): Promise<AuthenticatedSession>;
  logout(): Promise<void>;
  /** Rejects with `No autenticado` when there is no session. */
  me(): Promise<User>;
}

export interface ProfilesGateway {
  worker(userId: string): Promise<WorkerProfile | null>;
  updateWorker(userId: string, input: WorkerProfileInput): Promise<WorkerProfile>;
  company(companyId: string): Promise<CompanyProfile | null>;
  updateCompany(companyId: string, input: CompanyProfileInput): Promise<CompanyProfile>;
}

/** Comment threads are read per post and written one comment at a time. */
export interface CommentsGateway {
  list(postId: string): Promise<Comment[]>;
  create(input: CommentInput): Promise<Comment>;
}

/**
 * Demo-only follow/like/save persistence (p14, design D3). Follow is a stored
 * viewer→author edge with no counts; like/save key by viewer + post. Share
 * stays a component concern and never reaches this port.
 *
 * Each `toggle*` resolves the FULL `EngagementState`, so the adapter owns both
 * the flip and the persistence and the store only lands it via `.set()`. A
 * future HTTP swap therefore stays provider-only: same four methods, same
 * resolved shape.
 */
export interface EngagementSnapshot {
  following: string[];
  liked: string[];
  saved: string[];
}

/** `viewerId` → the three id sets that viewer has engaged with. */
export type EngagementState = Record<string, EngagementSnapshot>;

export interface EngagementGateway {
  load(): Promise<EngagementState>;
  toggleFollow(viewerId: string, authorId: string): Promise<EngagementState>;
  toggleLike(viewerId: string, postId: string): Promise<EngagementState>;
  toggleSave(viewerId: string, postId: string): Promise<EngagementState>;
}

/**
 * Read-only admin directory (design D3/D4). No writes and no contract change:
 * the port returns `DirectoryUser[]`, so a password can never travel through it.
 */
export interface AdminGateway {
  listUsers(): Promise<DirectoryUser[]>;
}

export const FEED_GATEWAY = new InjectionToken<FeedGateway>('FEED_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockFeedGateway()
});

export const JOBS_GATEWAY = new InjectionToken<JobsGateway>('JOBS_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockJobsGateway()
});

export const APPLICATIONS_GATEWAY = new InjectionToken<ApplicationsGateway>(
  'APPLICATIONS_GATEWAY',
  {
    providedIn: 'root',
    factory: () => new MockApplicationsGateway()
  }
);

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockAuthGateway()
});

export const PROFILES_GATEWAY = new InjectionToken<ProfilesGateway>('PROFILES_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockProfilesGateway()
});

export const COMMENTS_GATEWAY = new InjectionToken<CommentsGateway>('COMMENTS_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockCommentsGateway()
});

export const ADMIN_GATEWAY = new InjectionToken<AdminGateway>('ADMIN_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockAdminGateway()
});

export const ENGAGEMENT_GATEWAY = new InjectionToken<EngagementGateway>('ENGAGEMENT_GATEWAY', {
  providedIn: 'root',
  factory: () => new MockEngagementGateway()
});
