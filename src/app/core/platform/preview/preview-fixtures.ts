/**
 * Pure, synchronous preview selector (design D4/D5/D6): no Angular imports, no store,
 * no `await` — the `/previa` page renders from this view model, so the prerender emits
 * a non-empty, deterministic, hydration-stable HTML snapshot (R1 de-risk).
 *
 * Every value is derived from the seeded fixtures: no `Date.now()`, no randomness.
 */
import type {
  Application,
  CompanyProfile,
  JobOpening,
  Post,
  Role,
  WorkerProfile
} from '../domain';
import {
  APPLICATIONS,
  COMPANY_PROFILES,
  DEMO_ACCOUNTS,
  FEED_POSTS,
  JOBS,
  WORKER_PROFILES
} from '../mocks/fixtures';

/** The shared preview role list (spec: "shared preview role list"), in route order. */
export const PREVIEW_ROLES = ['worker', 'company', 'admin'] as const;

/** A known preview role segment. */
export type PreviewRole = (typeof PREVIEW_ROLES)[number];

/** Resolves a `:role` segment to a known role; unknown/empty/missing → `null` (default view). */
export const resolvePreviewRole = (raw: string | null | undefined): PreviewRole | null =>
  PREVIEW_ROLES.includes(raw as PreviewRole) ? (raw as PreviewRole) : null;

/** `{ role }` params for the `/previa/:role` prerender (WU2 server entry). */
export const previewRoleParams = (): readonly Record<string, string>[] =>
  PREVIEW_ROLES.map((role) => ({ role }));

/** A demo account directory row: the account WITHOUT its credential (design D7). */
export interface DirectoryRow {
  readonly userId: string;
  readonly email: string;
  readonly role: Role;
}

/** An application joined to its job, labelled for display. */
export interface PreviewApplicationRow {
  readonly application: Application;
  readonly job: JobOpening | null;
  readonly label: string;
}

/** The fixture snapshot the `/previa` page renders — every role branch, one call. */
export interface PreviewViewModel {
  readonly role: PreviewRole | null;
  readonly feed: readonly Post[];
  readonly jobs: readonly JobOpening[];
  readonly worker: WorkerProfile | null;
  readonly company: CompanyProfile | null;
  readonly applications: readonly PreviewApplicationRow[];
  readonly vacancies: readonly JobOpening[];
  readonly directory: readonly DirectoryRow[];
}

/** Label used when an application's job no longer exists in the fixtures. */
export const FALLBACK_VACANCY_LABEL = 'Vacante no disponible';

/**
 * Builds the preview view model from the seeded fixtures. Pure and deterministic
 * (design D9): the first worker/company profile stands in for every visitor, the
 * open jobs power the default section, and the directory drops every password.
 */
export const previewViewModelFor = (role: PreviewRole | null): PreviewViewModel => {
  const company = COMPANY_PROFILES[0] ?? null;

  return {
    role,
    feed: FEED_POSTS,
    jobs: JOBS.filter((job) => job.status === 'open'),
    worker: WORKER_PROFILES[0] ?? null,
    company,
    applications: APPLICATIONS.map((application) => {
      const job = JOBS.find((candidate) => candidate.id === application.jobId) ?? null;
      return { application, job, label: job?.title ?? FALLBACK_VACANCY_LABEL };
    }),
    vacancies: JOBS.filter((job) => job.companyId === company?.companyId),
    directory: DEMO_ACCOUNTS.map(({ userId, email, role: accountRole }) => ({
      userId,
      email,
      role: accountRole
    }))
  };
};
