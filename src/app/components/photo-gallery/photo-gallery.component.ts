import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

import type { ProjectPhoto } from '../../../content/content.types';

@Component({
  selector: 'app-photo-gallery',
  imports: [NgOptimizedImage],
  templateUrl: './photo-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoGalleryComponent {
  /** The evidence set of a project: everything except the hero the detail page already shows. */
  readonly photos = input.required<readonly ProjectPhoto[]>();
}
