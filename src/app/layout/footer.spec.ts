import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { site } from '../../content/site';
import { toWaDigits } from '../core/lead/lead-links';
import { Footer } from './footer';

const render = async (): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(Footer);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('Footer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] });
  });

  it('renders every NAP value, read from the NAP source', async () => {
    const text = (await render()).textContent ?? '';
    const { nap } = site;

    expect(text).toContain(nap.name);
    expect(text).toContain(nap.streetAddress);
    expect(text).toContain(nap.locality);
    expect(text).toContain(nap.region);
    expect(text).toContain(nap.postalCode);
    expect(text).toContain(nap.phoneDisplay);
    expect(text).toContain(nap.email);
  });

  it('renders every opening hour', async () => {
    const text = (await render()).textContent ?? '';

    for (const hours of site.hours) {
      expect(text).toContain(hours.days);
      expect(text).toContain(`${hours.opens} a ${hours.closes}`);
    }
  });

  it('offers a wa.me deep link built from the NAP digits', async () => {
    const links = (await render()).querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]');

    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toContain(toWaDigits(site.nap.phoneE164));
  });

  it('opens the Google Business Profile in a new tab, safely', async () => {
    const link = (await render()).querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/constructora-ejemplo"]'
    );

    expect(link).not.toBeNull();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener');
  });

  it('links the navigation sections, the home route and the quote route', async () => {
    const hrefs = Array.from((await render()).querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    );

    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/presupuesto', ...site.nav.map((i) => i.path)])
    );
  });

  it('names the current year in the copyright line', async () => {
    const text = (await render()).textContent ?? '';

    expect(text).toContain(String(new Date().getFullYear()));
  });
});
