import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { processSteps } from '../../../content/process-steps';
import { Process } from './process';

const render = async (): Promise<HTMLElement> => {
  const fixture: ComponentFixture<Process> = TestBed.createComponent(Process);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** `fixture.nativeElement` is the page host, so its own section is the first one. */
const pageSection = (element: HTMLElement): HTMLElement =>
  element.querySelector('section') as HTMLElement;

const stepItems = (element: HTMLElement): HTMLElement[] => [
  ...element.querySelectorAll<HTMLElement>('[data-testid="process-step"]')
];

describe('Process', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Process], providers: [provideRouter([])] });
  });

  it('owns the page title exactly once', async () => {
    const element = await render();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Cómo trabajamos');
  });

  it('renders one entry per process step the content declares', async () => {
    const element = await render();

    expect(stepItems(element).length).toBe(processSteps.length);
  });

  it('numbers the steps 1 to N in content order, so the journey reads as a sequence', async () => {
    const element = await render();
    const numbers = stepItems(element).map((item) =>
      item.querySelector('[data-testid="step-number"]')?.textContent?.trim()
    );

    expect(numbers).toEqual(processSteps.map((_, index) => String(index + 1)));
  });

  it('renders the step titles the content declares, in order and nothing else', async () => {
    const element = await render();
    const titles = stepItems(element).map((item) => item.querySelector('h3')?.textContent?.trim());

    expect(titles).toEqual(processSteps.map((step) => step.title));
  });

  it('describes every step, because a title alone tells the buyer nothing', async () => {
    const element = await render();

    for (const step of processSteps) {
      expect(element.textContent).toContain(step.description);
    }
  });

  it('states how long every step takes, the first question a buyer asks', async () => {
    const element = await render();
    const durations = stepItems(element).map((item) =>
      item.querySelector('[data-testid="step-duration"]')?.textContent?.trim()
    );

    expect(durations).toEqual(processSteps.map((step) => step.duration));
  });

  it('loads no image, so the process page stays a text-only page', async () => {
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
