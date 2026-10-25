import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { home } from '../../../content/home';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { resolveProjectSlugs, resolveServiceSlugs } from '../../../content/lookup';
import { FEED_GATEWAY } from '../../core/platform/api/ports';
import type { Page, Post } from '../../core/platform/domain';
import { HomePage } from './home.page';

const TEMPLATE = readFileSync(
  join(process.cwd(), 'src', 'app', 'pages', 'home', 'home.page.html'),
  'utf8'
);

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<HomePage> = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  await fixture.whenStable();
  // The publications section is gated by `afterNextRender`: it lands on the
  // render pass AFTER the first client render (the hydration invariant).
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

/** The newest standard-only timeline, used for the missing-kind case. */
const STANDARD_ONLY_POSTS: readonly Post[] = [
  {
    id: 'post-only-standard',
    authorId: 'company-1',
    content: 'Una publicación estándar sin otras plantillas en la home.',
    createdAt: '2026-10-20T10:00:00.000Z'
  }
];

const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

describe('HomePage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HomePage], providers: [provideRouter([])] });
  });

  it('owns the page title exactly once', async () => {
    const element = await render();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(home.hero.headline);
  });

  it('gives the hero the single priority load of the page, because it is the LCP', async () => {
    const element = await render();
    const priority = element.querySelectorAll('img[fetchpriority="high"]');

    // The featured cards render their own thumbnails; only the hero may be promoted.
    expect(priority.length).toBe(1);
    expect(priority[0].getAttribute('src')).toBe(home.hero.image.src);
    expect(priority[0].getAttribute('alt')).toBe(home.hero.image.alt);
  });

  it('renders one highlight block per highlight in content', async () => {
    const element = await render();
    const highlights = element.querySelectorAll('[data-testid="highlight"]');

    expect(highlights.length).toBe(home.highlights.length);
  });

  it('renders featured services resolved from slugs and no hardcoded names', async () => {
    const element = await render();
    const resolved = resolveServiceSlugs(home.featuredServiceSlugs, services);
    const serviceCards = element.querySelectorAll('app-service-card');

    expect(serviceCards.length).toBe(resolved.length);
    for (const resolvedService of resolved) {
      expect(element.textContent).toContain(resolvedService.name);
    }
  });

  it('renders featured projects resolved from slugs and no hardcoded names', async () => {
    const element = await render();
    const resolved = resolveProjectSlugs(home.featuredProjectSlugs, projects);
    const projectCards = element.querySelectorAll('app-project-card');

    expect(projectCards.length).toBe(resolved.length);
    for (const resolvedProject of resolved) {
      expect(element.textContent).toContain(resolvedProject.title);
    }
  });

  it('keeps every service and project name out of the template source', () => {
    const names = [
      ...resolveServiceSlugs(home.featuredServiceSlugs, services).map((service) => service.name),
      ...resolveProjectSlugs(home.featuredProjectSlugs, projects).map((project) => project.title)
    ];

    for (const name of names) {
      expect(
        TEMPLATE.includes(name),
        `"${name}" must come from the resolved content, never from the template`
      ).toBe(false);
    }
  });

  it('closes the page with the quote CTA block as the last element', async () => {
    const element = await render();
    const section = pageSection(element);
    const last = section.lastElementChild;

    expect(last?.tagName.toLowerCase()).toBe('app-cta-block');
  });

  it('places the publications section after the hero and before the CTA block', async () => {
    const element = await render();
    const section = pageSection(element);
    const children = Array.from(section.children);
    const publications = section.querySelector('app-home-publications');
    const cta = section.querySelector('app-cta-block');
    const hero = section.querySelector('[data-testid="home-hero"]');

    expect(publications).not.toBeNull();
    expect(cta).not.toBeNull();
    expect(hero).not.toBeNull();
    expect(children.indexOf(publications as Element)).toBeGreaterThan(
      children.indexOf(hero?.closest('div') as Element)
    );
    expect(children.indexOf(publications as Element)).toBeLessThan(
      children.indexOf(cta as Element)
    );
    expect(children.indexOf(cta as Element)).toBe(children.length - 1);
  });

  it('shows the most recent publication of each kind, with its badge, author, role and text', async () => {
    const element = await render();
    const section = element.querySelector('app-home-publications');
    const cards = Array.from(
      section?.querySelectorAll('[data-testid="home-publication"]') ?? []
    );

    expect(cards).toHaveLength(3);
    expect(cards[0].textContent).toContain('Búsqueda laboral');
    expect(cards[0].textContent).toContain('Sofía Ruiz');
    expect(cards[0].textContent).toContain('Trabajador');
    expect(cards[0].textContent).toContain('Ofrezco servicios de herrería');
    expect(cards[1].textContent).toContain('Vacante');
    expect(cards[1].textContent).toContain('Grupo Delta Construcciones');
    expect(cards[1].textContent).toContain('Empresa');
    expect(cards[2].textContent).toContain('Publicación');
    expect(cards[2].textContent).toContain('Constructora Norte SAC');
    expect(cards[2].textContent).toContain('Arrancamos el cimado');
  });

  it('adds no image to the home page: the teasers are text-only', async () => {
    const element = await render();
    const section = element.querySelector('app-home-publications');

    expect(element.querySelectorAll('img').length).toBe(7);
    expect(element.querySelectorAll('img[fetchpriority="high"]').length).toBe(1);
    expect(section?.querySelectorAll('img').length).toBe(0);
  });

  it('gates the publications section behind the browser render and reveals it when stable', async () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-home-publications')).not.toBeNull();
    // The gate itself is the hydration contract: the prerendered home must not
    // carry the async section (the build-time proof in WU-3.3 checks the HTML).
    expect(TEMPLATE).toMatch(
      /@if \(browserReady\(\) && teasers\(\)\.length > 0\) \{\s*<app-home-publications/
    );
  });

  it('renders no publications section at all when the timeline is empty', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [],
          meta: { page: 1, pageSize: 20, total: 0 }
        })
      }
    });
    const element = await render();

    expect(element.querySelector('app-home-publications')).toBeNull();
    expect(pageSection(element).lastElementChild?.tagName.toLowerCase()).toBe('app-cta-block');
  });

  it('renders one teaser without empty slots when only one kind exists', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async (): Promise<Page<Post>> => ({
          items: [...STANDARD_ONLY_POSTS],
          meta: { page: 1, pageSize: 20, total: STANDARD_ONLY_POSTS.length }
        })
      }
    });
    const element = await render();
    const section = element.querySelector('app-home-publications');
    const cards = section?.querySelectorAll('[data-testid="home-publication"]');

    expect(cards).toHaveLength(1);
    expect(cards?.[0].textContent).toContain('Publicación');
    expect(section?.querySelectorAll('[data-testid="home-publication-kind"]')).toHaveLength(1);
  });
});
