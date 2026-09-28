import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { services } from '../../../content/services';
import { ServicesList } from './services-list';

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<ServicesList> = TestBed.createComponent(ServicesList);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** `fixture.nativeElement` is the page host, so its own section is the first one. */
const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

describe('ServicesList', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServicesList], providers: [provideRouter([])] });
  });

  it('renders one card per service, in content order', async () => {
    const element = await render();
    const hrefs = [...element.querySelectorAll('app-service-card a')].map((a) =>
      a.getAttribute('href')
    );

    expect(hrefs).toEqual(services.map((service) => `/servicios/${service.slug}`));
  });

  it('renders the names the content declares and no other', async () => {
    const element = await render();
    const titles = [...element.querySelectorAll('app-service-card h3')].map((h) =>
      h.textContent?.trim()
    );

    expect(titles).toEqual(services.map((service) => service.name));
  });

  it('promotes no image above the fold: the catalog list has no priority image', async () => {
    const element = await render();

    expect(element.querySelectorAll('img').length).toBe(services.length);
    expect(element.querySelectorAll('img[fetchpriority="high"]').length).toBe(0);
  });

  it('closes the page with the quote CTA block', async () => {
    const element = await render();
    const cta = pageSection(element).lastElementChild;

    expect(cta?.tagName.toLowerCase()).toBe('app-cta-block');
    expect(cta?.querySelector('a[href="/presupuesto"]')).toBeTruthy();
  });
});
