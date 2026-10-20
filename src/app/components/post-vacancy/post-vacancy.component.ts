import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoneyRange } from '../../core/format';
import type { JobOpening } from '../../core/platform/domain';
import { jobStatusLabel } from '../../core/platform/store/job-status';

/**
 * Structured "Vacantes" card (design D5/D7, p16 WU2): a read-only,
 * data-in component that renders ALREADY-RESOLVED `JobOpening[]`. Resolution
 * (`resolveVacancyOpenings`) and the hide-on-empty gate (D6) live page-side in
 * WU3, so the card stays presentational and `isRenderablePostView` is
 * untouched. One entry per job: title, optional location/budget, the es-AR
 * status label and a "Postularse" link that is ALWAYS rendered — the label
 * informs, the link never hides, even for `Cerrada`.
 */
@Component({
  selector: 'app-post-vacancy',
  imports: [RouterLink],
  templateUrl: './post-vacancy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostVacancyComponent {
  /** The resolved openings to promote, in payload order. */
  readonly openings = input.required<JobOpening[]>();

  protected readonly jobStatusLabel = jobStatusLabel;

  /** Single-figure budget in es-AR form (`ARS 380.000`); only called when present. */
  protected budgetLabel(job: JobOpening): string {
    const budget = job.budget ?? 0;
    return formatMoneyRange({ min: budget, max: budget, currency: 'ARS' });
  }
}
