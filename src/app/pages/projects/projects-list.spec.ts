import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { projects } from '../../../content/projects';
import { ProjectsList } from './projects-list';

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<ProjectsList> = TestBed.createComponent(ProjectsList);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** `fixture.nativeElement` is the page host, so its own section is the first one. */
const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

describe('ProjectsList', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectsList], providers: [provideRouter([])] });
  });

  it('renders one card per project, in content order', async () => {
    const element = await render();
    const hrefs = [...element.querySelectorAll('app-project-card a')].map((a) =>
      a.getAttribute('href')
    );

    expect(hrefs).toEqual(projects.map((project) => `/proyectos/${project.slug}`));
  });

  it('renders the titles the content declares and no other', async () => {
    const element = await render();
    const titles = [...element.querySelectorAll('app-project-card h3')].map((h) =>
      h.textContent?.trim()
    );

    expect(titles).toEqual(projects.map((project) => project.title));
  });

  it('promotes no image above the fold: the showcase list has no priority image', async () => {
    const element = await render();

    expect(element.querySelectorAll('img').length).toBe(projects.length);
    expect(element.querySelectorAll('img[fetchpriority="high"]').length).toBe(0);
  });

  it('shows the whole catalog: filtering by category is out of scope here', async () => {
    const element = await render();

    // Every category of the content is present at once: no filter narrows the grid.
    for (const category of new Set(projects.map((project) => project.category))) {
      expect(element.textContent).toContain(category);
    }
  });

  it('closes the page with the quote CTA block', async () => {
    const element = await render();
    const cta = pageSection(element).lastElementChild;

    expect(cta?.tagName.toLowerCase()).toBe('app-cta-block');
    expect(cta?.querySelector('a[href="/presupuesto"]')).toBeTruthy();
  });
});
