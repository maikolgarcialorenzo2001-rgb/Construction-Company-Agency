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
    loadComponent: () => import('./pages/home/home').then((m) => m.Home)
  },
  {
    path: 'servicios',
    data: INDEXABLE,
    loadComponent: () => import('./pages/services/services-list').then((m) => m.ServicesList)
  },
  {
    path: 'servicios/:slug',
    data: INDEXABLE,
    loadComponent: () => import('./pages/services/service-detail').then((m) => m.ServiceDetail)
  },
  {
    path: 'proyectos',
    data: INDEXABLE,
    loadComponent: () => import('./pages/projects/projects-list').then((m) => m.ProjectsList)
  },
  {
    path: 'proyectos/:slug',
    data: INDEXABLE,
    loadComponent: () => import('./pages/projects/project-detail').then((m) => m.ProjectDetail)
  },
  {
    path: 'proceso',
    data: INDEXABLE,
    loadComponent: () => import('./pages/process/process').then((m) => m.Process)
  },
  {
    path: 'testimonios',
    data: INDEXABLE,
    loadComponent: () => import('./pages/testimonials/testimonials').then((m) => m.Testimonials)
  },
  {
    path: 'nosotros',
    data: INDEXABLE,
    loadComponent: () => import('./pages/about/about').then((m) => m.About)
  },
  {
    path: 'presupuesto',
    data: INDEXABLE,
    loadComponent: () => import('./pages/quote/quote').then((m) => m.Quote)
  },
  {
    path: '**',
    data: NOINDEX,
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound)
  }
];
