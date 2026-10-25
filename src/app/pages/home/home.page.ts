import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal
} from '@angular/core';

import { home } from '../../../content/home';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { resolveProjectSlugs, resolveServiceSlugs } from '../../../content/lookup';
import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';
import { HomePublicationsComponent } from '../../components/home-publications/home-publications.component';
import { mostRecentByKind } from '../../components/home-publications/home-publications';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { isRenderablePostView, toPostView } from '../../core/platform/mocks/post-views';
import { FeedStore } from '../../core/platform/store/feed.store';

/**
 * Landing page. The hero headline is the single H1 and its photo the single priority
 * image of the page. Featured content is resolved from slugs, so the template carries
 * no service or project name of its own.
 *
 * The "Publicaciones" section is gated behind `afterNextRender` (p17 slice 3, D-4):
 * the route is prerendered, and the feed resolves asynchronously, so rendering the
 * teasers on the first pass would leave the server HTML and the client's expected
 * DOM out of sync (NG0501). The gate is a no-op on the server, so the prerendered
 * home carries the marketing shell only and hydration stays clean.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    CtaBlockComponent,
    HomePublicationsComponent,
    ProjectCardComponent,
    SectionHeadingComponent,
    ServiceCardComponent
  ],
  templateUrl: './home.page.html'
})
export class HomePage {
  private readonly feed = inject(FeedStore);

  protected readonly home = home;
  protected readonly featuredServices = resolveServiceSlugs(home.featuredServiceSlugs, services);
  protected readonly featuredProjects = resolveProjectSlugs(home.featuredProjectSlugs, projects);
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';

  /** False on the server and on the first client render; true once the browser painted. */
  protected readonly browserReady = signal(false);

  /** The render-ready timeline shared with the platform feed (D3: never re-mapped here). */
  protected readonly publications = computed(() =>
    this.feed.posts().map(toPostView).filter(isRenderablePostView)
  );

  /** ONE teaser per kind present, newest-first (WU-3.1a). */
  protected readonly teasers = computed(() => mostRecentByKind(this.publications()));

  constructor() {
    afterNextRender(() => this.browserReady.set(true));
    void this.feed.load();
  }
}
