import { ChangeDetectionStrategy, Component } from '@angular/core';

import { site } from '../../../content/site';
import { testimonials } from '../../../content/testimonials';
import { CtaBlock } from '../../ui/cta-block';
import { SectionHeading } from '../../ui/section-heading';
import { TestimonialCard } from '../../ui/testimonial-card';

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
  imports: [SectionHeading, TestimonialCard, CtaBlock],
  templateUrl: './testimonials.html'
})
export class Testimonials {
  protected readonly testimonials = testimonials;
  protected readonly googleBusinessProfileUrl = site.googleBusinessProfileUrl;
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';
}
