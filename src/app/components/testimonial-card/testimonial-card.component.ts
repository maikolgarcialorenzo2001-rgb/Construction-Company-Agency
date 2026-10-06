import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { Testimonial } from '../../../content/content.types';

/** The rating scale the content contract declares: `rating` is a 1-5 integer. */
const RATING_SCALE = 5;

const FILLED_STAR = '★';
const EMPTY_STAR = '☆';

/**
 * One attributed client review. The score is rendered twice on purpose: as five stars for
 * a quick visual read, and as `4/5` plus an `aria-label` so the score is announced as a
 * number instead of being read out as five separate glyphs.
 *
 * The card holds no copy of its own: everything shown comes from the testimonial it is
 * given, so a review can be replaced in `content/testimonials.ts` without touching markup.
 */
@Component({
  selector: 'app-testimonial-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './testimonial-card.component.html'
})
export class TestimonialCardComponent {
  /** The review to quote. */
  readonly testimonial = input.required<Testimonial>();

  protected readonly ratingScale = RATING_SCALE;

  /** One entry per point of the scale, filled up to the score the review declares. */
  protected readonly stars = computed<readonly string[]>(() =>
    Array.from({ length: RATING_SCALE }, (_, index) =>
      index < this.testimonial().rating ? FILLED_STAR : EMPTY_STAR
    )
  );
}
