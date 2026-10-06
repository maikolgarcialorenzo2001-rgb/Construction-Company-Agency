import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Testimonial } from '../../../content/content.types';
import { TestimonialCardComponent } from './testimonial-card.component';

const review = (overrides: Partial<Testimonial> = {}): Testimonial => ({
  slug: 'opinion-ricardo-buschiazzo',
  author: 'Ricardo Buschiazzo',
  context: 'Casa timber en Pilar',
  rating: 5,
  text: 'Respetaron cada fecha del cronograma y el presupuesto original.',
  isPlaceholder: true,
  ...overrides
});

const render = async (entity: Testimonial): Promise<HTMLElement> => {
  const fixture: ComponentFixture<TestimonialCardComponent> = TestBed.createComponent(TestimonialCardComponent);
  fixture.componentRef.setInput('testimonial', entity);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

/** The review ships a numeric score; the stars are decoration over that number. */
const filledStars = (element: HTMLElement): number =>
  (element.querySelector('[data-testid="rating"]')?.textContent?.match(/★/g) ?? []).length;

describe('TestimonialCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestimonialCardComponent], providers: [provideRouter([])] });
  });

  it('credits the author of the review, never an anonymous quote', async () => {
    const element = await render(review({ author: 'María Fernández' }));

    expect(element.querySelector('h3')?.textContent?.trim()).toBe('María Fernández');
  });

  it('says where the review comes from, so the visitor can judge its relevance', async () => {
    const element = await render(review({ context: 'Reforma integral en Palermo' }));

    expect(element.textContent).toContain('Reforma integral en Palermo');
  });

  it('renders the review text itself', async () => {
    const element = await render(
      review({ text: 'La reforma terminó un día antes de lo pactado.' })
    );

    expect(element.querySelector('blockquote')?.textContent).toContain(
      'La reforma terminó un día antes de lo pactado.'
    );
  });

  it('shows the score out of five, so reviews can be compared at a glance', async () => {
    const element = await render(review({ rating: 4 }));

    expect(element.querySelector('[data-testid="rating"]')?.textContent).toContain('4/5');
  });

  it('fills one star per point of the score', async () => {
    const five = await render(review({ rating: 5 }));
    const three = await render(review({ rating: 3 }));

    expect(filledStars(five)).toBe(5);
    expect(filledStars(three)).toBe(3);
  });

  it('announces the score to a screen reader instead of reading five loose stars', async () => {
    const element = await render(review({ rating: 4 }));

    expect(element.querySelector('[data-testid="rating"]')?.getAttribute('aria-label')).toBe(
      'Puntaje 4 de 5'
    );
  });

  it('keeps the page outline: the card owns exactly one h3 title', async () => {
    const element = await render(review());

    expect(element.querySelectorAll('h3').length).toBe(1);
  });

  it('renders no image, so the wall of reviews costs no network requests', async () => {
    const element = await render(review());

    expect(element.querySelectorAll('img').length).toBe(0);
  });
});
