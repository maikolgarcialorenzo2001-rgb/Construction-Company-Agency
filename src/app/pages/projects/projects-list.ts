import { ChangeDetectionStrategy, Component } from '@angular/core';

import { projects } from '../../../content/projects';
import { CtaBlock } from '../../ui/cta-block';
import { ProjectCard } from '../../ui/project-card';
import { SectionHeading } from '../../ui/section-heading';

/**
 * The project showcase. Driven entirely by `content/projects.ts`: array order is the display
 * order, and no project title is written here, so the page cannot drift from the content.
 * There is no category filter in P0 — the brief lists filtering under what the showcase
 * deliberately leaves out.
 */
@Component({
  selector: 'app-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeading, ProjectCard, CtaBlock],
  templateUrl: './projects-list.html'
})
export class ProjectsList {
  protected readonly projects = projects;
  protected readonly ctaHeading = '¿Querés ver algo parecido en tu casa?';
  protected readonly ctaBody =
    'Contanos qué tenés en mente y te armamos un presupuesto con plazos y partidas.';
}
