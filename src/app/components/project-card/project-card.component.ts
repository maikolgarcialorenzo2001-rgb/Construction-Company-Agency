import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { formatArea, formatDuration } from '../../core/format';
import type { Project } from '../../../content/content.types';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './project-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCardComponent {
  /** The project to advertise. `photos[0]` is the finished hero, by data contract. */
  readonly project = input.required<Project>();

  protected readonly area = formatArea;
  protected readonly duration = formatDuration;
}
