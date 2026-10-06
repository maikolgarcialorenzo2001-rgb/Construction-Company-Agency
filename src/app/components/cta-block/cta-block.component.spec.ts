import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CtaBlockComponent } from './cta-block.component';

const render = async (): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(CtaBlockComponent);
  fixture.componentRef.setInput('heading', 'Contanos qué tenés en mente');
  fixture.componentRef.setInput(
    'body',
    'Te respondemos con un presupuesto orientativo en 24 horas.'
  );
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('CtaBlockComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CtaBlockComponent], providers: [provideRouter([])] });
  });

  it('renders the heading and the body it was given', async () => {
    const element = await render();

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Contanos qué tenés en mente');
    expect(element.textContent).toContain('presupuesto orientativo en 24 horas');
  });

  it('closes the page with a link to the quote route', async () => {
    const element = await render();

    expect(element.querySelector('a[href="/presupuesto"]')?.textContent).toContain('presupuesto');
  });

  it('offers a phone action next to the quote link', async () => {
    const element = await render();

    expect(element.querySelector('app-phone-link a[href^="tel:"]')).toBeTruthy();
  });

  it('is the last element of the block it renders', async () => {
    const element = await render();
    const section = element.querySelector('section') as HTMLElement;
    const interactive = section.querySelectorAll('a');

    expect(interactive.length).toBeGreaterThan(0);
    expect(interactive[interactive.length - 1].getAttribute('href')?.startsWith('tel:')).toBe(true);
  });
});
