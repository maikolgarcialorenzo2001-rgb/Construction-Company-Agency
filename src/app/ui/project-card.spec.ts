import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Project } from '../../content/content.types';
import { ProjectCard } from './project-card';

const project = (overrides: Partial<Project> = {}): Project => ({
  slug: 'casa-timber-pilar',
  title: 'Casa timber en Pilar',
  brief: 'Obra completa de una casa de dos plantas con estructura de madera.',
  surfaceAreaM2: 210,
  duration: '9 meses',
  budgetRange: { min: 380000, max: 450000, currency: 'USD' },
  location: 'Pilar, Zona Norte',
  category: 'Obra nueva',
  testimonialSlug: 'opinion-ricardo-buschiazzo',
  relatedServiceSlugs: ['obra-nueva'],
  photos: [
    {
      kind: 'after',
      image: {
        src: 'https://images.example.com/proyectos/casa-timber-pilar/hero.webp',
        alt: 'Fachada de la casa timber terminada',
        width: 1600,
        height: 1067
      }
    },
    {
      kind: 'before',
      caption: 'El terreno sin servicios',
      image: {
        src: 'https://images.example.com/proyectos/casa-timber-pilar/antes-terreno.webp',
        alt: 'Terreno baldío antes de empezar la obra',
        width: 1600,
        height: 1067
      }
    }
  ],
  isPlaceholder: true,
  ...overrides
});

const render = async (entity: Project): Promise<HTMLElement> => {
  const fixture: ComponentFixture<ProjectCard> = TestBed.createComponent(ProjectCard);
  fixture.componentRef.setInput('project', entity);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('ProjectCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectCard], providers: [provideRouter([])] });
  });

  it('links to the detail route of the project it was given', async () => {
    const element = await render(project());

    expect(element.querySelector('a')?.getAttribute('href')).toBe('/proyectos/casa-timber-pilar');
  });

  it('shows the title, the location and the category', async () => {
    const element = await render(
      project({
        title: 'Oficina en Microcentro',
        location: 'Microcentro, CABA',
        category: 'Comercial'
      })
    );

    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Oficina en Microcentro');
    expect(element.textContent).toContain('Microcentro, CABA');
    expect(element.textContent).toContain('Comercial');
  });

  it('keeps the page outline: the card owns exactly one h3 title', async () => {
    const element = await render(project());

    expect(element.querySelectorAll('h3').length).toBe(1);
  });

  it('renders the finished photo as the thumbnail, never the first before picture', async () => {
    const element = await render(project());
    const image = element.querySelector('img');

    // `photos[0]` is the finished hero by contract; the before picture is evidence for the detail page.
    expect(image?.getAttribute('src')).toBe(
      'https://images.example.com/proyectos/casa-timber-pilar/hero.webp'
    );
    expect(image?.getAttribute('alt')).toBe('Fachada de la casa timber terminada');
  });

  it('renders the thumbnail lazily, leaving priority to the detail hero', async () => {
    const element = await render(project());
    const image = element.querySelector('img');

    expect(image?.getAttribute('loading')).toBe('lazy');
    // `NgOptimizedImage` always writes `fetchpriority`; only a priority image gets "high".
    expect(image?.getAttribute('fetchpriority')).not.toBe('high');
  });

  it('reserves the intrinsic size of the thumbnail', async () => {
    const element = await render(project());
    const image = element.querySelector('img');

    expect(image?.getAttribute('width')).toBe('1600');
    expect(image?.getAttribute('height')).toBe('1067');
  });

  it('shows the surface area and the duration of the project', async () => {
    const element = await render(project({ surfaceAreaM2: 264, duration: '11 meses' }));

    expect(element.textContent).toContain('264 m²');
    expect(element.textContent).toContain('11 meses');
  });
});
