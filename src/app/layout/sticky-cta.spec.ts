import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { site } from '../../content/site';
import { toWaDigits } from '../core/lead/lead-links';
import { StickyCta } from './sticky-cta';

@Component({ selector: 'app-page-stub', template: 'stub' })
class PageStub {}

const QUOTE_ROUTE = '/presupuesto';

const navigateTo = async (
  fixture: ComponentFixture<unknown>,
  path: string
): Promise<HTMLElement> => {
  const router = TestBed.inject(Router);
  await router.navigateByUrl(path);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('StickyCta', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StickyCta],
      providers: [
        // A route `path` must not start with a slash, hence the slice.
        provideRouter([
          { path: QUOTE_ROUTE.slice(1), component: PageStub },
          { path: '**', component: PageStub }
        ])
      ]
    });
  });

  it('offers WhatsApp and the phone number on a regular route', async () => {
    const fixture = TestBed.createComponent(StickyCta);
    const element = await navigateTo(fixture, '/servicios');

    expect(element.querySelector('a[href^="https://wa.me/"]')).not.toBeNull();
    expect(element.querySelector('a[href^="tel:"]')?.getAttribute('href')).toBe(
      `tel:+${toWaDigits(site.nap.phoneE164)}`
    );
  });

  it('renders nothing on the quote route, where the form is the conversion', async () => {
    const fixture = TestBed.createComponent(StickyCta);
    const element = await navigateTo(fixture, QUOTE_ROUTE);

    expect(element.querySelector('a')).toBeNull();
    expect(element.textContent?.trim()).toBe('');
  });

  it('comes back when the user leaves the quote route', async () => {
    const fixture = TestBed.createComponent(StickyCta);
    await navigateTo(fixture, QUOTE_ROUTE);

    const element = await navigateTo(fixture, '/proyectos');

    expect(element.querySelector('a[href^="https://wa.me/"]')).not.toBeNull();
  });

  it('is hidden from pointer devices and clears the home indicator on phones', async () => {
    const fixture = TestBed.createComponent(StickyCta);
    const element = await navigateTo(fixture, '/servicios');
    const container = element.firstElementChild as HTMLElement;

    // The bar is phone-only, and it must not sit under the iOS home indicator.
    expect(container.className).toContain('sm:hidden');
    expect(container.className).toContain('pb-[env(safe-area-inset-bottom)]');
    expect(container.className).toContain('fixed');
  });

  it('labels both actions in Spanish', async () => {
    const fixture = TestBed.createComponent(StickyCta);
    const element = await navigateTo(fixture, '/servicios');
    const labels = Array.from(element.querySelectorAll('a')).map((a) => a.textContent?.trim());

    expect(labels).toHaveLength(2);
    for (const label of labels) {
      expect(label).toBeTruthy();
    }
    expect(labels.join(' ')).toContain('WhatsApp');
  });
});
