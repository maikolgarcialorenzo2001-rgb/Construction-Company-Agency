import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { home } from '../../../content/home';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { resolveProjectSlugs, resolveServiceSlugs } from '../../../content/lookup';
import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';

/**
 * Landing page. The hero headline is the single H1 and its photo the single priority
 * image of the page. Featured content is resolved from slugs, so the template carries
 * no service or project name of its own.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    CtaBlockComponent,
    ProjectCardComponent,
    SectionHeadingComponent,
    ServiceCardComponent
  ],
  templateUrl: './home.page.html'
})
export class HomePage {
  protected readonly home = home;
  protected readonly featuredServices = resolveServiceSlugs(home.featuredServiceSlugs, services);
  protected readonly featuredProjects = resolveProjectSlugs(home.featuredProjectSlugs, projects);
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';
}
