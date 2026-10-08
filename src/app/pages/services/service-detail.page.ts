import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { findService, resolveProjectSlugs } from '../../../content/lookup';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { formatDuration, formatMoneyRange } from '../../core/format';
import { SeoService } from '../../core/seo/seo.service';
import { NotFoundPage } from '../not-found/not-found.page';
import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';

/**
 * One service in full: what it includes, how long it takes, what it costs and the
 * projects that prove it. The slug arrives from the route, so a slug outside the
 * catalog renders the shared 404 component instead of a half-empty detail page (D3).
 */
@Component({
  selector: 'app-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, NotFoundPage, CtaBlockComponent, SectionHeadingComponent],
  templateUrl: './service-detail.page.html'
})
export class ServiceDetailPage {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();

  private readonly seo = inject(SeoService);

  constructor() {
    // Overrides are cleared on every NavigationStart, so the head is re-set here on
    // each navigation that resolves a service. `service()` re-reads the slug, so the
    // effect re-fires when the route input changes (Req 10).
    effect(() => {
      const detail = this.service();
      if (detail !== undefined) {
        this.seo.override({ title: detail.name, description: detail.summary });
      }
    });
  }

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
