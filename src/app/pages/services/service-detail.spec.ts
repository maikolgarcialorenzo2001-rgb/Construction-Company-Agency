import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { formatMoneyRange } from '../../core/format';
import { ServiceDetail } from './service-detail';

const REFORMAS = services[0];

const render = async (slug?: string): Promise<HTMLElement> => {
  const fixture: ComponentFixture<ServiceDetail> = TestBed.createComponent(ServiceDetail);
  if (slug !== undefined) {
    fixture.componentRef.setInput('slug', slug);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const detailSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

describe('ServiceDetail', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceDetail], providers: [provideRouter([])] });
  });

  it('shows the name of the service the slug resolves to', async () => {
    const element = await render(REFORMAS.slug);

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(REFORMAS.name);
  });

  it('lists every item the service includes, in order', async () => {
    const element = await render(REFORMAS.slug);
    const items = [...element.querySelectorAll('ul[data-testid="includes"] li')].map((li) =>
      li.textContent?.trim()
    );

    expect(items).toEqual([...REFORMAS.includes]);
  });

  it('anchors the service with its duration and its budget range', async () => {
    const element = await render(REFORMAS.slug);

    expect(element.textContent).toContain(REFORMAS.typicalDuration);
    expect(element.textContent).toContain(formatMoneyRange(REFORMAS.budgetRange));
  });

  it('promotes exactly one image, the hero of the page', async () => {
    const element = await render(REFORMAS.slug);
    const priority = element.querySelectorAll('img[fetchpriority="high"]');

    expect(priority.length).toBe(1);
    expect(priority[0].getAttribute('src')).toBe(REFORMAS.image.src);
  });

  it('links to every related project the service declares', async () => {
    const element = await render(REFORMAS.slug);
    const hrefs = [...element.querySelectorAll('a[data-testid="related-project"]')].map((a) =>
      a.getAttribute('href')
    );

    expect(hrefs).toEqual(REFORMAS.relatedProjectSlugs.map((slug) => `/proyectos/${slug}`));
  });

  it('names every related project, so the buyer sees what the work produced', async () => {
    const element = await render(REFORMAS.slug);
    const labels = [...element.querySelectorAll('a[data-testid="related-project"]')].map((a) =>
      a.textContent?.trim()
    );

    expect(labels).toEqual(
      REFORMAS.relatedProjectSlugs.map(
        (slug) => projects.find((project) => project.slug === slug)?.title
      )
    );
  });

  it('never links a project slug that the content does not declare', async () => {
    const element = await render(REFORMAS.slug);
    const hrefs = [...element.querySelectorAll('a[data-testid="related-project"]')].map((a) =>
      a.getAttribute('href')
    );

    for (const href of hrefs) {
      expect(projects.some((project) => `/proyectos/${project.slug}` === href)).toBe(true);
    }
  });

  it('closes the page with the quote CTA block', async () => {
    const element = await render(REFORMAS.slug);
    const cta = detailSection(element).lastElementChild;

    expect(cta?.tagName.toLowerCase()).toBe('app-cta-block');
  });

  it('renders the 404 component instead of a detail page for an unknown slug', async () => {
    const element = await render('no-existe');

    expect(element.querySelector('app-not-found')).toBeTruthy();
    expect(element.textContent).not.toContain(REFORMAS.name);
  });

  it('renders the 404 component when the route delivers no slug at all', async () => {
    const element = await render();

    expect(element.querySelector('app-not-found')).toBeTruthy();
  });
});
