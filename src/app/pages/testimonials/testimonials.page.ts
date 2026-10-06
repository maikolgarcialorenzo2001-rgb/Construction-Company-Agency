import { ChangeDetectionStrategy, Component } from '@angular/core';

import { site } from '../../../content/site';
import { testimonials } from '../../../content/testimonials';
import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';
import { TestimonialCardComponent } from '../../components/testimonial-card/testimonial-card.component';

/**
 * The review wall. Reviews come from `content/testimonials.ts` and the verification link from
 * `site.googleBusinessProfileUrl`; this page declares no review copy and no URL of its own, so
 * the owner replaces both without touching the markup.
 *
 * The Google link is deliberately the only outbound link on the page: one place for a
 * suspicious buyer to check us independently, which is the whole point of the page.
 */
@Component({
  selector: 'app-testimonials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, TestimonialCardComponent, CtaBlockComponent],
  templateUrl: './testimonials.page.html'
})
export class TestimonialsPage {
  protected readonly testimonials = testimonials;
  protected readonly googleBusinessProfileUrl = site.googleBusinessProfileUrl;
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';
}
