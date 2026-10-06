import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { site } from '../../../content/site';
import { testimonials } from '../../../content/testimonials';
import { TestimonialsPage } from './testimonials.page';

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<TestimonialsPage> = TestBed.createComponent(TestimonialsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** `fixture.nativeElement` is the page host, so its own section is the first one. */
const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

const cards = (element: HTMLElement): HTMLElement[] => [
  ...element.querySelectorAll<HTMLElement>('app-testimonial-card')
];

describe('TestimonialsPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestimonialsPage], providers: [provideRouter([])] });
  });

  it('owns the page title exactly once', async () => {
    const element = await render();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Testimonios');
  });

  it('renders one card per review the content declares', async () => {
    const element = await render();

    expect(cards(element).length).toBe(testimonials.length);
  });

  it('credits every author the content declares, so no review is anonymous', async () => {
    const element = await render();
    const authors = cards(element).map((card) => card.querySelector('h3')?.textContent?.trim());

    expect(authors).toEqual(testimonials.map((testimonial) => testimonial.author));
  });

  it('names every author in the page text, so a reader can find their own city', async () => {
    const element = await render();

    for (const testimonial of testimonials) {
      expect(element.textContent).toContain(testimonial.author);
    }
  });

  it('carries the full review text, not just the praise summary', async () => {
    const element = await render();

    for (const testimonial of testimonials) {
      expect(element.textContent).toContain(testimonial.text);
    }
  });

  it('links to the Google profile from content, so the owner can repoint it', async () => {
    const element = await render();
    const [link] = element.querySelectorAll('a[data-testid="google-profile"]');

    expect(link?.getAttribute('href')).toBe(site.googleBusinessProfileUrl);
  });

  it('offers exactly one external link, so the reader has a single place to verify us', async () => {
    const element = await render();
    const external = element.querySelectorAll('a[target="_blank"]');

    expect(external.length).toBe(1);
    expect(external[0].getAttribute('href')).toBe(site.googleBusinessProfileUrl);
    // Opening a new tab must not hand the opener over to the destination.
    expect(external[0].getAttribute('rel')).toContain('noopener');
  });

  it('writes no absolute URL of its own: every link stays inside the app', async () => {
    const element = await render();
    const absolute = [...element.querySelectorAll('a')].filter((link) =>
      /^https?:\/\//.test(link.getAttribute('href') ?? '')
    );

    expect(absolute.length, 'only the Google profile may leave the app').toEqual(
      element.querySelectorAll('a[target="_blank"]').length
    );
  });

  it('loads no image, so the review wall stays a text-only page', async () => {
    const element = await render();

    expect(element.querySelectorAll('img').length).toBe(0);
  });

  it('closes the page with the quote CTA block', async () => {
    const element = await render();
    const cta = pageSection(element).lastElementChild;

    expect(cta?.tagName.toLowerCase()).toBe('app-cta-block');
    expect(cta?.querySelector('a[href="/presupuesto"]')).toBeTruthy();
  });
});
