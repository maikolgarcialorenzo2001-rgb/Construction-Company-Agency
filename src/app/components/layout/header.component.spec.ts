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
});
