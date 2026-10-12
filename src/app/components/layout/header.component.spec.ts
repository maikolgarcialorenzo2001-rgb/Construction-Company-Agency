import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { site } from '../../../content/site';
import { toWaDigits } from '../../core/lead/lead-links';
import { HeaderComponent } from './header.component';

@Component({ selector: 'app-page-stub', template: 'stub' })
class PageStub {}

const render = async (): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const navLinks = (element: HTMLElement): HTMLAnchorElement[] =>
  Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a[href]'));

// Real routes: `aria-current` only settles if the navigation actually matches.
const routes = site.nav.map((item) => ({
  path: item.path.slice(1),
  component: PageStub
}));

const navigateTo = async (
  fixture: ComponentFixture<HeaderComponent>,
  path: string
): Promise<HTMLElement> => {
  await TestBed.inject(Router).navigateByUrl(path);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('HeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([...routes, { path: '**', component: PageStub }])]
    });
  });

  it('renders one link per navigation item, in content order', async () => {
    const links = navLinks(await render());

    expect(links.map((a) => a.getAttribute('href'))).toEqual(site.nav.map((item) => item.path));
    expect(links.map((a) => a.textContent?.trim())).toEqual(site.nav.map((item) => item.label));
  });

  it('links the brand back to the home route', async () => {
    const element = await render();
    const brand = element.querySelector<HTMLAnchorElement>('a[href="/"]');

    expect(brand?.textContent).toContain(site.nap.name);
  });

  it('links every top-level route, conversion route included', async () => {
    const element = await render();
    const hrefs = Array.from(element.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/',
        '/servicios',
        '/proyectos',
        '/proceso',
        '/testimonios',
        '/nosotros',
        '/presupuesto'
      ])
    );
  });

  it('exposes exactly one phone action, pointing at the NAP number', async () => {
    const element = await render();
    const phones = element.querySelectorAll('a[href^="tel:"]');

    expect(phones.length).toBe(1);
    expect(phones[0].getAttribute('href')).toBe(`tel:+${toWaDigits(site.nap.phoneE164)}`);
  });

  it('exposes a single platform entry point linking to /plataforma', async () => {
    const element = await render();
    const entries = Array.from(element.querySelectorAll('a[href="/plataforma"]'));

    expect(entries).toHaveLength(1);
    expect(entries[0].textContent?.trim()).toBeTruthy();
  });

  it('marks the section of the current route', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const element = await navigateTo(fixture, '/servicios');

    const current = element.querySelectorAll('nav a[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(current[0].getAttribute('href')).toBe('/servicios');
  });

  it('marks no section on the home route', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const element = await navigateTo(fixture, '/');

    expect(element.querySelectorAll('nav a[aria-current="page"]').length).toBe(0);
  });

  it('renders the promo strip inside the header with a registration CTA', async () => {
    const element = await render();
    const strip = element.querySelector('header [data-testid="header-promo"]');

    expect(strip, 'the promo strip must live inside the header landmark').not.toBeNull();
    expect(strip!.textContent).toContain(site.promo.text);

    const cta = strip!.querySelector<HTMLAnchorElement>('[data-testid="header-promo-cta"]');
    expect(cta?.getAttribute('href')).toBe('/plataforma/registro');
    expect(cta?.textContent?.trim()).toBe(site.promo.ctaLabel);
  });

  it('lists every promo plan in the strip', async () => {
    const element = await render();
    const rows = element.querySelectorAll('[data-testid="header-promo-plans"] li');

    expect(rows).toHaveLength(site.promo.plans.length);
    expect(site.promo.plans.length).toBeGreaterThan(0);
    site.promo.plans.forEach((plan, index) => {
      expect(rows[index].textContent, `plan ${plan.name} name`).toContain(plan.name);
      expect(rows[index].textContent, `plan ${plan.name} price`).toContain(plan.price);
    });
  });

  it('keeps the promo strip static, non-dismissible and image-free', async () => {
    const element = await render();
    const strip = element.querySelector('[data-testid="header-promo"]');

    expect(strip).not.toBeNull();
    expect(strip!.querySelectorAll('img')).toHaveLength(0);
    expect(
      strip!.querySelectorAll('button'),
      'the promo strip must not offer a dismiss control'
    ).toHaveLength(0);
  });
});
