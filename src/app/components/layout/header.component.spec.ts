import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { site } from '../../../content/site';
import { toWaDigits } from '../../core/lead/lead-links';
import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
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
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([...routes, { path: '**', component: PageStub }])]
    });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  /** Seeds a signed-in session so the user icon reads a user. */
  const seedSession = (userId: string, role: 'worker' | 'company'): void => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: `mock-token-${userId}`,
        user: { userId, email: `${userId}@demo.test`, role }
      })
    );
  };

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

  it('links the user icon to the login for an anonymous visitor', async () => {
    const element = await render();

    const icon = element.querySelector('app-user-icon-link a');
    expect(icon, 'the marketing header always renders the user icon').not.toBeNull();
    expect(icon?.getAttribute('href')).toBe('/plataforma/login');
    expect(icon?.getAttribute('aria-label')).toBe('Iniciar sesión');
  });

  it('links the user icon to the own profile for a signed-in visitor', async () => {
    seedSession('worker-1', 'worker');

    const element = await render();

    const icon = element.querySelector('app-user-icon-link a');
    expect(icon?.getAttribute('href')).toBe('/plataforma/perfil/worker-1');
    expect(icon?.getAttribute('aria-label')).toBe('Ver mi perfil');
  });

  it('keeps the single platform entry point next to the user icon', async () => {
    seedSession('worker-1', 'worker');

    const element = await render();

    expect(element.querySelectorAll('a[href="/plataforma"]')).toHaveLength(1);
  });

  it('always renders the icon anchor, so the prerendered node count is invariant', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('app-user-icon-link a')).toHaveLength(1);

    await TestBed.inject(SessionService).login('lucia@demo.test', 'demo1234');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.querySelectorAll('app-user-icon-link a')).toHaveLength(1);
  });
});
