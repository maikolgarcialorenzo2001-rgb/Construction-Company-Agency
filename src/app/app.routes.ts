import { Routes } from '@angular/router';

/**
 * SEO flags consumed by `SeoService` (S10). Every content route is indexable; the
 * wildcard route is the only noindex one. S10 replaces this shared flag with
 * per-route title/description metadata.
 */
const INDEXABLE = { seo: { indexable: true } } as const;
const NOINDEX = { seo: { indexable: false } } as const;

/**
 * The complete es-AR route table. Every page is a lazy `loadComponent`, so no page
 * code lands in the initial bundle. No guards, no resolvers: navigation is public.
 * `**` MUST stay last.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: INDEXABLE,
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'servicios',
    data: INDEXABLE,
    loadComponent: () => import('./pages/services/services-list.page').then((m) => m.ServicesListPage)
  },
  {
    path: 'servicios/:slug',
    data: INDEXABLE,
    loadComponent: () => import('./pages/services/service-detail.page').then((m) => m.ServiceDetailPage)
  },
  {
    path: 'proyectos',
    data: INDEXABLE,
    loadComponent: () => import('./pages/projects/projects-list.page').then((m) => m.ProjectsListPage)
  },
  {
    path: 'proyectos/:slug',
    data: INDEXABLE,
    loadComponent: () => import('./pages/projects/project-detail.page').then((m) => m.ProjectDetailPage)
  },
  {
    path: 'proceso',
    data: INDEXABLE,
    loadComponent: () => import('./pages/process/process.page').then((m) => m.ProcessPage)
  },
  {
    path: 'testimonios',
    data: INDEXABLE,
    loadComponent: () => import('./pages/testimonials/testimonials.page').then((m) => m.TestimonialsPage)
  },
  {
    path: 'nosotros',
    data: INDEXABLE,
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage)
  },
  {
    path: 'presupuesto',
    data: INDEXABLE,
    loadComponent: () => import('./pages/quote/quote.page').then((m) => m.QuotePage)
  },
  {
    path: '**',
    data: NOINDEX,
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
