import { InjectionToken } from '@angular/core';

import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Comment,
  CommentInput,
  CompanyProfile,
  CompanyProfileInput,
  JobOpening,
  Page,
  Post,
  PostInput,
  Role,
  User,
  WorkerProfile,
  WorkerProfileInput
} from '../domain';
import { MockApplicationsGateway } from './mock-applications.gateway';
import { MockAuthGateway } from './mock-auth.gateway';
import { MockCommentsGateway } from './mock-comments.gateway';
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

export interface FeedGateway {
  timeline(page?: number, pageSize?: number): Promise<Page<Post>>;
  create(input: PostInput): Promise<Post>;
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
