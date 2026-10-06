import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { home } from '../../../content/home';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { resolveProjectSlugs, resolveServiceSlugs } from '../../../content/lookup';
import { HomePage } from './home.page';

const TEMPLATE = readFileSync(
  join(process.cwd(), 'src', 'app', 'pages', 'home', 'home.page.html'),
  'utf8'
);

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<HomePage> = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

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
});
