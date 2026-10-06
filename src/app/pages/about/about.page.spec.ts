import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { site } from '../../../content/site';
import { toWaDigits } from '../../core/lead/lead-links';
import { AboutPage } from './about.page';

const TEMPLATE = readFileSync(
  join(process.cwd(), 'src', 'app', 'pages', 'about', 'about.page.html'),
  'utf8'
);

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<AboutPage> = TestBed.createComponent(AboutPage);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** `fixture.nativeElement` is the page host, so its own section is the first one. */
const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

describe('AboutPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AboutPage], providers: [provideRouter([])] });
  });

  it('owns the page title exactly once', async () => {
    const element = await render();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Nosotros');
  });

  it('tells the company story, verbatim from the site payload', async () => {
    const element = await render();

    expect(element.textContent).toContain(site.story);
  });

  it('shows all four credentials, so a buyer can check us before signing', async () => {
    const element = await render();
    const text = element.textContent ?? '';
    const { credentials } = site;

    expect(element.querySelectorAll('dl[data-testid="credentials"] dd').length).toBe(4);
    expect(text).toContain(credentials.art);
    expect(text).toContain(credentials.insurance);
    expect(text).toContain(credentials.professionalRegistration);
    expect(text).toContain(credentials.cuit);
  });

  it('states the warranty verbatim from the site payload', async () => {
    const element = await render();

    expect(element.textContent).toContain(site.warranty);
  });

  it('renders every NAP value inside the addressable contact block', async () => {
    const element = await render();
    const address = element.querySelector('address')?.textContent ?? '';
    const { nap } = site;

    expect(address).toContain(nap.name);
    expect(address).toContain(nap.streetAddress);
    expect(address).toContain(nap.locality);
    expect(address).toContain(nap.region);
    expect(address).toContain(nap.postalCode);
    expect(address).toContain(nap.country);
    expect(address).toContain(nap.phoneDisplay);
    expect(address).toContain(nap.email);
  });

  it('routes the phone through the shared tel: component, built from the NAP digits', async () => {
    const element = await render();
    const phone = element.querySelector('app-phone-link a[href^="tel:"]');

    expect(phone).not.toBeNull();
    expect(phone?.getAttribute('href')).toBe(`tel:+${toWaDigits(site.nap.phoneE164)}`);
  });

  it('keeps every NAP literal out of the template source', () => {
    const { nap } = site;
    // `country` is excluded on purpose: `'AR'` is a two-letter substring that also
    // appears inside "ART", a standard credential label, so it cannot be a reliable
    // literal check. It is still bound and asserted on the rendered address above.
    const literals = [
      nap.name,
      nap.streetAddress,
      nap.locality,
      nap.region,
      nap.postalCode,
      nap.phoneDisplay,
      nap.phoneE164,
      nap.email
    ];

    for (const literal of literals) {
      expect(
        TEMPLATE.includes(literal),
        `the template must bind site.nap, never repeat "${literal}"`
      ).toBe(false);
    }
  });

  it('closes the page with the quote CTA block as the last element', async () => {
    const element = await render();
    const section = pageSection(element);

    expect(section.lastElementChild?.tagName.toLowerCase()).toBe('app-cta-block');
  });
});
