import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Service } from '../../content/content.types';
import { ServiceCard } from './service-card';

const service = (overrides: Partial<Service> = {}): Service => ({
  slug: 'reformas-integrales',
  name: 'Reformas integrales',
  summary: 'Renovamos departments y casas completas, con presupuesto desglosado por partida.',
  includes: ['Demolición', 'Instalaciones'],
  typicalDuration: '3 a 4 meses',
  budgetRange: { min: 18000000, max: 32000000, currency: 'ARS' },
  image: {
    src: 'https://images.example.com/servicios/reforma.webp',
    alt: 'Dos operarios demoliendo una pared de un departamento',
    width: 1200,
    height: 900
  },
  relatedProjectSlugs: ['reforma-depto-palermo'],
  ...overrides
});

const render = async (entity: Service): Promise<HTMLElement> => {
  const fixture: ComponentFixture<ServiceCard> = TestBed.createComponent(ServiceCard);
  fixture.componentRef.setInput('service', entity);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('ServiceCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceCard], providers: [provideRouter([])] });
  });

  it.each([
    ['reformas-integrales', 'Reformas integrales'],
    ['locales-comerciales-y-oficinas', 'Locales comerciales y oficinas']
  ])('links to the detail route of %s', async (slug, name) => {
    const element = await render(service({ slug, name }));

    expect(element.querySelector('a')?.getAttribute('href')).toBe(`/servicios/${slug}`);
  });

  it('shows the name and the summary of the service it was given', async () => {
    const element = await render(
      service({ name: 'Obra nueva', summary: 'Viviendas desde el terreno hasta la llave en mano.' })
    );

    expect(element.querySelector('h3')?.textContent?.trim()).toBe('Obra nueva');
    expect(element.textContent).toContain('Viviendas desde el terreno hasta la llave en mano.');
  });

  it('keeps the page outline: the card owns exactly one h3 title', async () => {
    const element = await render(service());

    expect(element.querySelectorAll('h3').length).toBe(1);
  });

  it('renders the service image lazily, leaving priority to the detail hero', async () => {
    const element = await render(service());
    const image = element.querySelector('img');

    expect(image?.getAttribute('src')).toBe('https://images.example.com/servicios/reforma.webp');
    expect(image?.getAttribute('loading')).toBe('lazy');
    // `NgOptimizedImage` always writes `fetchpriority`; only a priority image gets "high".
    expect(image?.getAttribute('fetchpriority')).not.toBe('high');
  });

  it('reserves the intrinsic size of the image it renders', async () => {
    const element = await render(
      service({ image: { ...service().image, width: 1600, height: 1000 } })
    );
    const image = element.querySelector('img');

    expect(image?.getAttribute('width')).toBe('1600');
    expect(image?.getAttribute('height')).toBe('1000');
    expect(image?.getAttribute('alt')).toBe(
      'Dos operarios demoliendo una pared de un departamento'
    );
  });
});
