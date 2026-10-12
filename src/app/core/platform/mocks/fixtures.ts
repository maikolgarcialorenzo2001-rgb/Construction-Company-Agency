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
  },
  {
    id: 'post-4',
    authorId: 'company-1',
    content:
      'Habilitamos la instalación de gas de un edificio en Caballito. Trabajo terminado y aprobado por la distribuidora.',
    createdAt: '2026-10-06T13:10:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-5',
    authorId: 'worker-2',
    content:
      'Tip de oficio: antes de colgar un tablero, medí la carga de cada circuito. Nos ahorra retrabajos.',
    createdAt: '2026-10-07T09:05:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-6',
    authorId: 'company-2',
    content:
      'Buscamos pintores para una planta industrial en Quilmes. La obra arranca la semana próxima.',
    attachments: ['planta-quilmes-antes.jpg', 'planta-quilmes-despues.jpg'],
    createdAt: '2026-10-08T11:40:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-7',
    authorId: 'worker-3',
    content:
      'Terminé el montaje de una estructura de herrería en Tigre. Quedó a medida, sin ajustes en obra.',
    createdAt: '2026-10-09T16:25:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-8',
    authorId: 'worker-1',
    content:
      'Cerramos la remodelación eléctrica de un local en Palermo. Dejamos planos y memoria de cálculo.',
    createdAt: '2026-10-10T10:15:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'post-9',
    authorId: 'company-1',
    content:
      'Arrancamos el cimado de un multifamiliar en San Isidro. Sumamos dos oficiales al equipo.',
    attachments: ['obra-san-isidro.jpg'],
    createdAt: '2026-10-11T08:50:00.000Z',
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
    createdAt: '2026-10-01T09:15:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    authorId: 'company-1',
    authorName: 'Constructora Norte',
    authorRole: 'company' as const,
    body: 'Te respondemos por interno para coordinar.',
    createdAt: '2026-10-01T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-3',
    postId: 'post-3',
    authorId: 'worker-1',
    authorName: 'Demo Worker',
    authorRole: 'worker' as const,
    body: 'Gracias por el aviso.',
    createdAt: '2026-10-01T11:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-4',
    postId: 'post-4',
    authorId: 'worker-1',
    authorName: 'Demo Worker',
    authorRole: 'worker' as const,
    body: 'Felicitaciones por la habilitación, quedó impecable.',
    createdAt: '2026-10-06T14:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-5',
    postId: 'post-4',
    authorId: 'company-1',
    authorName: 'Constructora Norte',
    authorRole: 'company' as const,
    body: 'Gracias, fue un trabajo coordinado con la distribuidora.',
    createdAt: '2026-10-06T15:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-6',
    postId: 'post-5',
    authorId: 'worker-3',
    authorName: 'Sofía Ruiz',
    authorRole: 'worker' as const,
    body: 'Buen tip, lo voy a aplicar en la próxima obra.',
    createdAt: '2026-10-07T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-7',
    postId: 'post-6',
    authorId: 'worker-2',
    authorName: 'Martín Gómez',
    authorRole: 'worker' as const,
    body: 'Me interesa la planta de Quilmes, tengo disponibilidad.',
    createdAt: '2026-10-08T12:10:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-8',
    postId: 'post-6',
    authorId: 'company-2',
    authorName: 'Grupo Delta',
    authorRole: 'company' as const,
    body: 'Escribinos por la plataforma y coordinamos una visita.',
    createdAt: '2026-10-08T13:45:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-9',
    postId: 'post-7',
    authorId: 'company-1',
    authorName: 'Constructora Norte',
    authorRole: 'company' as const,
    body: 'Excelente terminación, la estructura quedó perfecta.',
    createdAt: '2026-10-09T17:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-10',
    postId: 'post-8',
    authorId: 'worker-3',
    authorName: 'Sofía Ruiz',
    authorRole: 'worker' as const,
    body: 'Gran trabajo, la memoria de cálculo suma mucho.',
    createdAt: '2026-10-10T11:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-11',
    postId: 'post-8',
    authorId: 'company-1',
    authorName: 'Constructora Norte',
    authorRole: 'company' as const,
    body: 'La compartimos con el cliente, quedó muy clara.',
    createdAt: '2026-10-10T12:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'comment-12',
    postId: 'post-9',
    authorId: 'worker-2',
    authorName: 'Martín Gómez',
    authorRole: 'worker' as const,
    body: 'Si necesitan oficiales, cuenten conmigo.',
    createdAt: '2026-10-11T09:20:00.000Z',
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
  },
  {
    id: 'job-4',
    companyId: 'company-2',
    title: 'Plomero con experiencia para edificio en La Plata',
    description:
      'Cambio de cañerías y montantes en un edificio de ocho pisos. Se trabaja por etapas con consorcio.',
    budget: 210000,
    location: 'La Plata, Buenos Aires',
    status: 'open' as const,
    createdAt: '2026-10-06T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'job-5',
    companyId: 'company-2',
    title: 'Pintor de obra para planta industrial en Quilmes',
    description:
      'Pintura epoxi de nave industrial. Se provee equipo de altura y elementos de seguridad.',
    budget: 180000,
    location: 'Quilmes, GBA Sur',
    status: 'open' as const,
    createdAt: '2026-10-07T08:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'job-6',
    companyId: 'company-1',
    title: 'Herrero para estructura metálica en Tigre',
    description:
      'Fabricación y montaje de una estructura metálica a medida para un galpón comercial.',
    budget: 320000,
    location: 'Tigre, GBA Norte',
    status: 'open' as const,
    createdAt: '2026-10-08T14:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'job-7',
    companyId: 'company-1',
    title: 'Dirección de obra para desarrollo en Córdoba',
    description:
      'Dirección técnica de un desarrollo residencial de veinte unidades. Proceso de selección cerrado.',
    location: 'Córdoba Capital',
    status: 'closed' as const,
    createdAt: '2026-09-20T09:00:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<JobOpening>[];

/**
 * Seeded job openings: `job-1`/`job-2` stay `open` (the detail-page sentinels)
 * and `job-3` stays `closed` with no application; `job-4..7` add varied
 * rubros, locations and budgets, including one more `closed` role.
 */
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
  },
  {
    id: 'app-3',
    jobId: 'job-4',
    applicantId: 'worker-2',
    message: 'Experiencia en montantes y cámaras de inspección.',
    status: 'rejected' as const,
    createdAt: '2026-10-06T16:00:00.000Z',
    updatedAt: '2026-10-07T09:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'app-4',
    jobId: 'job-5',
    applicantId: 'worker-3',
    message: 'Trabajé con epoxi en dos naves industriales.',
    status: 'rejected' as const,
    createdAt: '2026-10-07T12:00:00.000Z',
    updatedAt: '2026-10-08T08:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'app-5',
    jobId: 'job-6',
    applicantId: 'worker-2',
    message: 'Puedo fabricar la estructura en taller y montarla en obra.',
    status: 'withdrawn' as const,
    createdAt: '2026-10-08T15:00:00.000Z',
    updatedAt: '2026-10-09T09:30:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'app-6',
    jobId: 'job-7',
    applicantId: 'worker-3',
    message: 'Interesada en la dirección técnica del desarrollo.',
    status: 'withdrawn' as const,
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z',
    isPlaceholder: true
  },
  {
    id: 'app-7',
    jobId: 'job-4',
    applicantId: 'worker-3',
    message: 'Disponible para sumarme a la segunda etapa.',
    status: 'rejected' as const,
    createdAt: '2026-10-09T11:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
    isPlaceholder: true
  }
] satisfies readonly Placeholder<Application>[];

/**
 * Seeded applications covering all four statuses. R1 invariant: `app-1` is the
 * only application on `job-1` (worker-1, `accepted`) and `app-2` the only one on
 * `job-2` (worker-2, `pending`), so `JobsStore.loadApplication` (which reads the
 * first row for a job) never surfaces a wrong status. `job-3` has none.
 */
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
