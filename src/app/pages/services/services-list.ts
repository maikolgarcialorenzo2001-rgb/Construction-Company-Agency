import { ChangeDetectionStrategy, Component } from '@angular/core';

import { services } from '../../../content/services';
import { CtaBlock } from '../../ui/cta-block';
import { SectionHeading } from '../../ui/section-heading';
import { ServiceCard } from '../../ui/service-card';

/**
 * The service catalog. The whole page is driven by `content/services.ts`: the array order
 * is the display order and no service name is written here, so publishing or reordering
 * the catalog is a content change and the page cannot drift from it.
 */
@Component({
  selector: 'app-services-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeading, ServiceCard, CtaBlock],
  templateUrl: './services-list.html'
})
export class ServicesList {
  protected readonly services = services;
  protected readonly ctaHeading = '¿Tenés un proyecto en mente?';
  protected readonly ctaBody =
    'Contanos qué necesitás y te mandamos un presupuesto orientativo en 24 horas.';
}
