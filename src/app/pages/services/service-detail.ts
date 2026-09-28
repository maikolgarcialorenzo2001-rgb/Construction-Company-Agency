import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { findService, resolveProjectSlugs } from '../../../content/lookup';
import { projects } from '../../../content/projects';
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
  imports: [RouterLink, NgOptimizedImage, NotFound, CtaBlock, SectionHeading],
  templateUrl: './service-detail.html'
})
export class ServiceDetail {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();

  protected readonly service = computed(() => {
    const value = this.slug();
    return value === undefined ? undefined : findService(value, services);
  });

  /**
   * Resolved from the declared slugs, so a link can carry the project title the buyer
   * recognises and a slug that leaves the content never becomes a dead link.
   */
  protected readonly relatedProjects = computed(() => {
    const detail = this.service();
    return detail === undefined ? [] : resolveProjectSlugs(detail.relatedProjectSlugs, projects);
  });

  protected readonly formatDuration = formatDuration;
  protected readonly formatMoneyRange = formatMoneyRange;
  protected readonly ctaHeading = '¿Querés un presupuesto para este trabajo?';
  protected readonly ctaBody =
    'Contanos dónde estás y qué tenés en mente, y te respondemos con un desglose por partida.';
}
