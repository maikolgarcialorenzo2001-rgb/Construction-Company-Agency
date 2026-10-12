/**
 * Deterministic demo fixtures for the mock gateways (design: "Mocks return
 * deterministic fixtures"). Every seeded entry carries `isPlaceholder: true`,
 * the repo-wide audit marker (`grep -rn "isPlaceholder" src/`) — these are fake
 * records until real client data lands, and the "Modo demo" chrome says so.
 *
 * The `satisfies readonly Post[]`-style clause on each export is the design's
 * contract-shape proof: fixtures are structurally the domain model, so a domain
 * type change (W1) breaks the fixtures at compile time as well.
 */
import type {
  Application,
  Comment,
  CompanyProfile,
  JobOpening,
  Page,
  Post,
  Role,
  WorkerProfile
} from '../domain';

/** A fixture entry: the domain shape plus the placeholder audit marker. */
export type Placeholder<T> = T & { readonly isPlaceholder: true };

/** A seeded demo credential (mock auth only — never part of the domain model). */
export interface DemoAccount {
  userId: string;
  email: string;
  password: string;
  role: Role;
}

// --- Feed -------------------------------------------------------------------

const seededPosts = [
  {
    id: 'post-1',
    authorId: 'company-1',
    content:
      'Avance de obra en Villa Crespo: terminamos el cimado del piso 2 y arrancamos con el armado de la losa.',
    createdAt: '2026-10-01T14:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-2',
    authorId: 'company-1',
    content:
      'Buscamos electricista matriculado para obra en Vicente López. Disponibilidad inmediata: escribinos desde la plataforma.',
    createdAt: '2026-10-03T15:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-3',
    authorId: 'worker-1',
    content:
      'Terminé la instalación eléctrica de un local en Avellaneda. Dejo las fotos en mi perfil por si les sirve.',
    createdAt: '2026-10-05T18:45:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<Post>[];

/** Seeded timeline entries. */
export const FEED_POSTS = seededPosts satisfies readonly Post[];

// --- Comments ---------------------------------------------------------------

const seededComments = [
  {
    id: 'comment-1',
    postId: 'post-1',
    authorId: 'worker-1',
    authorName: 'Demo Worker',
    authorRole: 'worker' as const,
    body: 'Buen punto, comparto la misma inquietud.',
    createdAt: '2025-10-01T09:15:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    authorId: 'company-1',
    authorName: 'Constructora Norte',
    authorRole: 'company' as const,
    body: 'Te respondemos por interno para coordinar.',
    createdAt: '2025-10-01T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-3',
    postId: 'post-3',
    authorId: 'worker-1',
    authorName: 'Demo Worker',
    authorRole: 'worker' as const,
    body: 'Gracias por el aviso.',
    createdAt: '2025-10-01T11:30:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<Comment>[];

/**
 * Seeded comment threads: post-1 has 2, post-3 has 1, post-2 has 0 — the
 * ready and empty store states both get exercised. Ascending `createdAt`.
 */
export const COMMENTS = seededComments satisfies readonly Comment[];

// --- Jobs -------------------------------------------------------------------

const seededJobs = [
  {
    id: 'job-1',
    companyId: 'company-1',
    title: 'Albañil con experiencia para obra en Vicente López',
    description:
      'Casa unifamiliar en etapa de obra gruesa. Se busca albañil con experiencia comprobada para revoque y contrapiso. Jornada de lunes a sábado.',
    budget: 380000,
    location: 'Vicente López, GBA Norte',
    status: 'open' as const,
    createdAt: '2026-09-28T12:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'job-2',
    companyId: 'company-1',
    title: 'Electricista matriculado para locales comerciales',
    description:
      'Instalación de tableros y luminarias en dos locales en Villa Crespo. Trabajo por etapa, con materiales provistos por la obra.',
    budget: 250000,
    location: 'Villa Crespo, CABA',
    status: 'open' as const,
    createdAt: '2026-10-02T09:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'job-3',
    companyId: 'company-1',
    title: 'Director de obra para multifamiliar en Rosario',
    description:
      'Dirección técnica de un desarrollo de 12 unidades. Etapa de selección cerrada.',
    location: 'Rosario, Santa Fe',
    status: 'closed' as const,
    createdAt: '2026-09-10T11:00:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<JobOpening>[];

/** Seeded job openings (one `open` senior role, one `open` trade, one `closed`). */
export const JOBS = seededJobs satisfies readonly JobOpening[];

// --- Applications -----------------------------------------------------------

const seededApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    applicantId: 'worker-1',
    message: 'Tengo ocho años de oficio y disponibilidad inmediata.',
    status: 'accepted' as const,
    createdAt: '2026-09-30T16:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    applicantId: 'worker-2',
    message: 'Matrícula vigente y herramienta propia.',
    status: 'pending' as const,
    createdAt: '2026-10-04T13:20:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<Application>[];

/** Seeded applications, including one non-default (`accepted`) status. */
export const APPLICATIONS = seededApplications satisfies readonly Application[];

// --- Profiles ---------------------------------------------------------------

const seededWorkerProfile = {
  userId: 'worker-1',
  role: 'worker' as const,
  fullName: 'Lucía Fernández',
  phone: '+54 9 11 4444-0000',
  location: 'Avellaneda, GBA Sur',
  bio: 'Electricista matriculada, ocho años de obra residencial y comercial.',
  skills: ['Electricidad', 'Sanitarias'],
  createdAt: '2026-09-15T12:00:00.000Z',
  isPlaceholder: true
} satisfies Placeholder<WorkerProfile>;

/** The demo worker profile behind `worker-1`. */
export const WORKER_PROFILE = seededWorkerProfile satisfies WorkerProfile;

const seededCompanyProfile = {
  companyId: 'company-1',
  role: 'company' as const,
  name: 'Constructora Norte SAC',
  description: 'Obra residencial y comercial en GBA Norte y CABA.',
  contactEmail: 'obras@norte.test',
  website: 'https://constructora-norte.test',
  location: 'San Isidro, GBA Norte',
  createdAt: '2026-09-10T12:00:00.000Z',
  isPlaceholder: true
} satisfies Placeholder<CompanyProfile>;

/** The demo company profile behind `company-1`. */
export const COMPANY_PROFILE = seededCompanyProfile satisfies CompanyProfile;

// --- Demo accounts ----------------------------------------------------------

const seededAccounts = [
  {
    userId: 'worker-1',
    email: 'lucia@demo.test',
    password: 'demo1234',
    role: 'worker' as const,
    isPlaceholder: true
  },
  {
    userId: 'company-1',
    email: 'norte@demo.test',
    password: 'demo1234',
    role: 'company' as const,
    isPlaceholder: true
  }
] satisfies readonly Placeholder<DemoAccount>[];

/**
 * Seeded mock credentials. Both passwords are the obvious `demo1234`: this is
 * a local mock with no network, the auth screens say "Modo demo".
 */
export const DEMO_ACCOUNTS = seededAccounts satisfies readonly DemoAccount[];

// --- Mock support -----------------------------------------------------------

/**
 * Page slicing shared by the mock list endpoints. Defaults mirror the contract
 * (`page` 1-based, `pageSize` 20).
 */
export const paginate = <T>(items: readonly T[], page = 1, pageSize = 20): Page<T> => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  meta: { page, pageSize, total: items.length }
});
