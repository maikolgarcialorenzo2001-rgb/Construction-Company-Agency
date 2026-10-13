import { Routes } from '@angular/router';

import { authGuard } from './core/platform/auth/auth.guard';
import { PLATFORM_PREFIX } from './core/platform/platform-paths';

/**
 * Per-route SEO payload consumed by `SeoService` (S10): `indexable` drives the robots
 * meta, `title`/`description` are the es-AR copy that rewrites the head on every
 * navigation. Every content route is indexable; the wildcard route is the only
 * noindex one.
 */
const seo = (indexable: boolean, title: string, description: string) =>
  ({ seo: { indexable, title, description } }) as const;

const INDEXABLE = (title: string, description: string) => seo(true, title, description);
const NOINDEX = (title: string, description: string) => seo(false, title, description);

/**
 * The complete es-AR route table. Every page is a lazy `loadComponent`, so no page
 * code lands in the initial bundle. No guards, no resolvers: navigation is public.
 * `**` MUST stay last.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: INDEXABLE(
      'Obras, reformas y ampliaciones | Constructora Ejemplo',
      '¿Necesitás una reforma, una obra nueva o una ampliación? Contanos qué tenés en mente y armamos tu presupuesto sin compromiso.'
    ),
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'servicios',
    data: INDEXABLE(
      'Servicios de construcción y reformas | Constructora Ejemplo',
      'Reformas integrales, obra nueva, ampliaciones y arreglos con equipo propio, plazos por escrito y presupuesto desglosado por partida.'
    ),
    loadComponent: () => import('./pages/services/services-list.page').then((m) => m.ServicesListPage)
  },
  {
    path: 'servicios/:slug',
    data: INDEXABLE(
      'Servicio de obra y reforma | Constructora Ejemplo',
      'Qué incluye, cuánto tarda y en qué rango de presupuesto queda: el servicio explicado con alcance, plazos y material.'
    ),
    loadComponent: () => import('./pages/services/service-detail.page').then((m) => m.ServiceDetailPage)
  },
  {
    path: 'proyectos',
    data: INDEXABLE(
      'Obras y reformas realizadas | Constructora Ejemplo',
      'Casas, oficinas y locales terminados en CABA y Gran Buenos Aires, con fotos del antes y del después, superficie y plazos.'
    ),
    loadComponent: () => import('./pages/projects/projects-list.page').then((m) => m.ProjectsListPage)
  },
  {
    path: 'proyectos/:slug',
    data: INDEXABLE(
      'Obra realizada | Constructora Ejemplo',
      'Ficha de una obra terminada: superficie, duración, categoría, fotos del antes y del después y el trabajo incluido.'
    ),
    loadComponent: () => import('./pages/projects/project-detail.page').then((m) => m.ProjectDetailPage)
  },
  {
    path: 'proceso',
    data: INDEXABLE(
      'Cómo trabajamos | Constructora Ejemplo',
      'Presupuesto desglosado por partida, plazos por escrito y un único responsable de obra: así llevamos cada obra de principio a fin.'
    ),
    loadComponent: () => import('./pages/process/process.page').then((m) => m.ProcessPage)
  },
  {
    path: 'testimonios',
    data: INDEXABLE(
      'Opiniones de clientes | Constructora Ejemplo',
      'Qué dicen los clientes de nuestras reformas y obras en CABA y el Gran Buenos Aires: reseñas con autor, ciudad y tipo de trabajo.'
    ),
    loadComponent: () => import('./pages/testimonials/testimonials.page').then((m) => m.TestimonialsPage)
  },
  {
    path: 'nosotros',
    data: INDEXABLE(
      'Nosotros | Constructora Ejemplo',
      'Más de quince años de obra en CABA y GBA, matrícula habilitada, seguro de responsabilidad civil y garantía por escrito.'
    ),
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage)
  },
  {
    path: 'presupuesto',
    data: INDEXABLE(
      'Pedí tu presupuesto sin compromiso | Constructora Ejemplo',
      'Contanos qué tenés en mente, qué plazo manejás y dónde queda la obra: te respondemos por WhatsApp con el siguiente paso.'
    ),
    loadComponent: () => import('./pages/quote/quote.page').then((m) => m.QuotePage)
  },
  {
    path: PLATFORM_PREFIX,
    data: NOINDEX(
      'Plataforma | Constructora Ejemplo',
      'Espacio de trabajo de Constructora Ejemplo: novedades, búsquedas laborales y perfil. Contenido de demostración, fuera de buscadores.'
    ),
    children: [
      {
        path: '',
        canActivate: [authGuard],
        data: NOINDEX(
          'Novedades de la plataforma | Constructora Ejemplo',
          'Feed de obras y novedades de la plataforma de Constructora Ejemplo. Contenido de demostración.'
        ),
        loadComponent: () => import('./pages/plataforma/feed.page').then((m) => m.PlatformFeedPage)
      },
      {
        path: 'inicio',
        canActivate: [authGuard],
        data: NOINDEX(
          'Inicio | Plataforma | Constructora Ejemplo',
          'Tu inicio en la plataforma de Constructora Ejemplo: postulaciones, vacantes y novedades según tu rol. Contenido de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/platform-home.page').then((m) => m.PlatformHomePage)
      },
      {
        path: 'trabajos',
        canActivate: [authGuard],
        data: NOINDEX(
          'Trabajos disponibles | Plataforma | Constructora Ejemplo',
          'Búsquedas laborales abiertas en la plataforma de Constructora Ejemplo. Contenido de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/jobs-list.page').then((m) => m.PlatformJobsListPage)
      },
      {
        path: 'trabajos/:id',
        canActivate: [authGuard],
        data: NOINDEX(
          'Detalle del trabajo | Plataforma | Constructora Ejemplo',
          'Detalle de una búsqueda laboral y postulación en la plataforma de Constructora Ejemplo. Contenido de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/job-detail.page').then((m) => m.PlatformJobDetailPage)
      },
      {
        path: 'login',
        data: NOINDEX(
          'Ingresar | Plataforma | Constructora Ejemplo',
          'Acceso a la plataforma de Constructora Ejemplo. Página de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/login.page').then((m) => m.PlatformLoginPage)
      },
      {
        path: 'registro',
        data: NOINDEX(
          'Crear cuenta | Plataforma | Constructora Ejemplo',
          'Registro en la plataforma de Constructora Ejemplo. Página de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/registro.page').then((m) => m.PlatformRegistroPage)
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        data: NOINDEX(
          'Mi perfil | Plataforma | Constructora Ejemplo',
          'Perfil de trabajador o empresa en la plataforma de Constructora Ejemplo. Contenido de demostración.'
        ),
        loadComponent: () =>
          import('./pages/plataforma/perfil.page').then((m) => m.PlatformPerfilPage)
      }
    ]
  },
  {
    path: '**',
    data: NOINDEX(
      'Página no encontrada | Constructora Ejemplo',
      'La página que buscás no existe. Volvé al inicio o pedinos un presupuesto sin compromiso.'
    ),
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];