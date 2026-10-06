import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Service } from '../../../content/content.types';

/**
 * One catalog entry. The whole card is the link, so the tap target is the image plus
 * the copy. The thumbnail is always lazy: the single priority image of a page belongs
 * to its detail hero, never to a catalog list.
 */
@Component({
  selector: 'app-service-card',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './service-card.component.html'
})
export class ServiceCardComponent {
  readonly service = input.required<Service>();
}
