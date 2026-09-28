import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { findService } from '../../../content/lookup';
import { services } from '../../../content/services';
import { formatDuration, formatMoneyRange } from '../../core/format';
import { NotFound } from '../not-found/not-found';
import { CtaBlock } from '../../ui/cta-block';
import { SectionHeading } from '../../ui/section-heading';

/**
 * One service in full: what it includes, how long it takes, what it costs and the
 * projects that prove it. The slug arrives from the route, so a slug outside the
 * catalog renders the shared 404 component instead of a half-empty detail page (D3).
 */
@Component({
  selector: 'app-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgOptimizedImage,
    NotFound,
    CtaBlock,
    SectionHeading
  ],
  templateUrl: './service-detail.html'
})
export class ServiceDetail {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();

  protected readonly service = computed(() => {
    const value = this.slug();
    return value === undefined ? undefined : findService(value, services);
  });

  protected readonly formatDuration = formatDuration;
  protected readonly formatMoneyRange = formatMoneyRange;
  protected readonly ctaHeading = '¿Querés un presupuesto para este trabajo?';
  protected readonly ctaBody =
    'Contanos dónde estás y qué tenés en mente, y te respondemos con un desglose por partida.';
}
