import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { findProject, resolveServiceSlugs } from '../../../content/lookup';
import { projects } from '../../../content/projects';
import { services } from '../../../content/services';
import { formatArea, formatDuration, formatMoneyRange } from '../../core/format';
import { NotFound } from '../not-found/not-found';
import { CtaBlock } from '../../ui/cta-block';
import { PhotoGallery } from '../../ui/photo-gallery';
import { SectionHeading } from '../../ui/section-heading';

/**
 * One project in full: what was broken, what we built, how long, how much, and the
 * evidence. The slug arrives from the route, so a slug outside the content renders the
 * shared 404 component instead of a half-empty page (D3).
 *
 * The photo set is split by purpose, never duplicated: the finished hero is `photos[0]`,
 * the before/after pair carries the comparison the buyer came for, and everything else
 * waits below the fold inside the deferred gallery.
 */
@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, NotFound, CtaBlock, PhotoGallery, SectionHeading],
  templateUrl: './project-detail.html'
})
export class ProjectDetail {
  /** Bound from the route by `withComponentInputBinding()`. */
  readonly slug = input<string>();

  protected readonly project = computed(() => {
    const value = this.slug();
    return value === undefined ? undefined : findProject(value, projects);
  });

  /** The finished picture of the comparison, ignoring the hero the page already shows. */
  protected readonly afterPhoto = computed(() => {
    const detail = this.project();
    return detail?.photos.slice(1).find((photo) => photo.kind === 'after');
  });

  protected readonly beforePhoto = computed(() => {
    const detail = this.project();
    return detail?.photos.find((photo) => photo.kind === 'before');
  });

  /** The rest of the set: process shots that are not part of the before/after pair. */
  protected readonly galleryPhotos = computed(() => {
    const detail = this.project();
    if (detail === undefined) {
      return [];
    }
    const hero = detail.photos[0];
    const before = this.beforePhoto();
    const after = this.afterPhoto();
    return detail.photos.filter((photo) => photo !== hero && photo !== before && photo !== after);
  });

  protected readonly relatedServices = computed(() => {
    const detail = this.project();
    return detail === undefined ? [] : resolveServiceSlugs(detail.relatedServiceSlugs, services);
  });

  protected readonly formatArea = formatArea;
  protected readonly formatDuration = formatDuration;
  protected readonly formatMoneyRange = formatMoneyRange;
  protected readonly ctaHeading = '¿Querés un presupuesto parecido a este?';
  protected readonly ctaBody =
    'Contanos qué tenés en mente y te armamos un desglose por partida, con plazo y materiales.';
}
