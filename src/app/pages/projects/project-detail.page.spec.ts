import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { ENVIRONMENT } from '../../environments/environment.token';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { ProjectDetailPage } from './project-detail.page';

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
const observers: { callback: ObserverCallback; targets: Element[] }[] = [];

class IntersectionObserverStub {
  private readonly registration: { callback: ObserverCallback; targets: Element[] };

  constructor(callback: ObserverCallback) {
    this.registration = { callback, targets: [] };
    observers.push(this.registration);
  }
  observe(target: Element): void {
    this.registration.targets.push(target);
  }
  unobserve(target: Element): void {
    this.registration.targets = this.registration.targets.filter((seen) => seen !== target);
  }
  disconnect(): void {
    this.registration.targets = [];
  }
  takeRecords(): Partial<IntersectionObserverEntry>[] {
    return [];
  }
}

const scrollIntoView = (): void => {
  for (const { callback, targets } of observers) {
    for (const target of targets) {
      callback([{ isIntersecting: true, target }]);
    }
  }
};

const renderFixture = async (
  slug: string | undefined
): Promise<ComponentFixture<ProjectDetailPage>> => {
  observers.length = 0;
  const fixture: ComponentFixture<ProjectDetailPage> = TestBed.createComponent(ProjectDetailPage);
  if (slug !== undefined) {
    fixture.componentRef.setInput('slug', slug);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
};

const render = async (slug: string | undefined): Promise<HTMLElement> =>
  (await renderFixture(slug)).nativeElement as HTMLElement;

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    TestBed.configureTestingModule({ imports: [ProjectDetailPage], providers: [provideRouter([])] });
  });

  it('renders the project the slug points to', async () => {
    const element = await render('casa-timber-pilar');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Casa timber en Pilar');
    expect(element.textContent).toContain('Hicimos el estudio de suelos');
  });

  it('renders the 404 component for a slug outside the content', async () => {
    const element = await render('obra-que-no-existe');

    expect(element.querySelector('app-not-found h1')).not.toBeNull();
    expect(element.textContent).not.toContain('Casa timber en Pilar');
    // The slug-miss branch closes with exactly one CTA: the one NotFoundPage renders.
    // Guards against a second block leaking in beside <app-not-found />.
    expect(element.querySelectorAll('app-cta-block')).toHaveLength(1);
  });

  it('renders the 404 component when the route provides no slug at all', async () => {
    const element = await render(undefined);

    expect(element.querySelector('app-not-found')).not.toBeNull();
  });

  it('shows the facts a buyer compares on: location, area, duration and investment', async () => {
    const element = await render('casa-timber-pilar');

    expect(element.textContent).toContain('Pilar, Zona Norte');
    expect(element.textContent).toContain('210 m²');
    expect(element.textContent).toContain('9 meses');
    expect(element.textContent).toContain('USD 380.000');
  });

  it('gives the finished hero the priority load, because it is the LCP of the page', async () => {
    const element = await render('casa-timber-pilar');
    const hero = element.querySelector('[data-testid="project-hero"]');

    expect(hero?.getAttribute('src')).toBe(
      'https://images.example.com/proyectos/casa-timber-pilar/hero.webp'
    );
    expect(hero?.getAttribute('fetchpriority')).toBe('high');
    expect(hero?.getAttribute('width')).toBe('1600');
    expect(hero?.getAttribute('height')).toBe('1067');
  });

  it('puts the before and the after side by side, each one labelled', async () => {
    const element = await render('casa-timber-pilar');
    const before = element.querySelector('[data-testid="before-photo"]');
    const after = element.querySelector('[data-testid="after-photo"]');

    expect(before?.getAttribute('alt')).toBe(
      'Terreno baldío con un árbol existente, antes de empezar la obra'
    );
    expect(after).not.toBeNull();
  });

  it('never shows the hero twice: the after picture of the pair is not the hero', async () => {
    const element = await render('casa-timber-pilar');
    const hero = element.querySelector('[data-testid="project-hero"]');
    const after = element.querySelector('[data-testid="after-photo"]');

    expect(after?.getAttribute('src')).not.toBe(hero?.getAttribute('src'));
  });

  it('defers the rest of the photo gallery until it is about to be seen', async () => {
    const fixture = await renderFixture('casa-timber-pilar');
    const element = fixture.nativeElement as HTMLElement;

    // Hero plus the before/after pair are eager; the gallery below them is not.
    expect(element.querySelector('app-photo-gallery')).not.toBeNull();
    expect(element.querySelectorAll('app-photo-gallery img').length).toBe(0);

    scrollIntoView();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('app-photo-gallery img').length).toBeGreaterThan(0);
  });

  it('links to the services that the project declares, by service name', async () => {
    const element = await render('casa-timber-pilar');
    const links = [...element.querySelectorAll('[data-testid="related-service"]')].map((a) => ({
      href: a.getAttribute('href'),
      label: a.textContent?.trim()
    }));

    expect(links).toEqual(
      projects
        .find((project) => project.slug === 'casa-timber-pilar')
        ?.relatedServiceSlugs.map((slug) => ({
          href: `/servicios/${slug}`,
          label: services.find((service) => service.slug === slug)?.name
        }))
    );
  });

  it('offers a way back to the showcase and closes with the quote CTA', async () => {
    const element = await render('casa-timber-pilar');

    expect(element.querySelector('a[href="/proyectos"]')).not.toBeNull();
    expect(element.querySelector('app-cta-block a[href="/presupuesto"]')).toBeTruthy();
  });
});

describe('ProjectDetailPage per-slug head (Req 10)', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        provideRouter([
          {
            path: 'proyectos/:slug',
            component: ProjectDetailPage,
            data: { seo: { title: 'Proyectos', description: 'Nuestros proyectos' } },
          },
        ]),
        {
          provide: ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'https://api.example.com',
            gaMeasurementId: '',
            siteUrl: 'https://example.com',
          },
        },
      ],
    });
  });

  const render = async (slug: string): Promise<void> => {
    observers.length = 0;
    await TestBed.inject(Router).navigateByUrl(`/proyectos/${slug}`);
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const head = (): HTMLHeadElement => TestBed.inject(DOCUMENT).head;

  it('writes the project title and brief into the head, overriding the generic route title', async () => {
    const obra = projects[0];

    await render(obra.slug);

    expect(head().querySelector('title')?.textContent?.trim()).toBe(obra.title);
    expect(head().querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      obra.brief
    );
  });

  it('keeps og:title and og:description aligned with the head title', async () => {
    const obra = projects[0];

    await render(obra.slug);

    expect(head().querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      obra.title
    );
    expect(head().querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      obra.brief
    );
  });

  it('points canonical and og:url at the per-slug URL', async () => {
    const obra = projects[0];

    await render(obra.slug);
    const url = `https://example.com/proyectos/${obra.slug}`;

    expect(head().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
    expect(head().querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(url);
  });

  it('derives a wholly per-slug head for a second project, distinct from the first', async () => {
    const obra = projects[1];
    expect(obra.title).not.toBe(projects[0].title);

    await render(obra.slug);
    const url = `https://example.com/proyectos/${obra.slug}`;

    expect(head().querySelector('title')?.textContent?.trim()).toBe(obra.title);
    expect(head().querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      obra.brief
    );
    expect(head().querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      obra.title
    );
    expect(head().querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
    expect(head().querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(url);
  });
});
