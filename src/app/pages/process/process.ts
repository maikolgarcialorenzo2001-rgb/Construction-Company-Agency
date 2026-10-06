import { ChangeDetectionStrategy, Component } from '@angular/core';

import { processSteps } from '../../../content/process-steps';
import { CtaBlock } from '../../ui/cta-block';
import { SectionHeading } from '../../ui/section-heading';

/**
 * The process timeline. The page reads `content/process-steps.ts` and nothing else: the step
 * copy, the order and the durations all come from that array, so publishing a new step or
 * reordering the journey is a content change and the page cannot drift from it.
 *
 * The step number is rendered from the loop index rather than written in the content, so the
 * sequence can never claim a step that does not exist or repeat a number.
 */
@Component({
  selector: 'app-process',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeading, CtaBlock],
  templateUrl: './process.html'
})
export class Process {
  protected readonly steps = processSteps;
  protected readonly ctaHeading = '¿Arrancamos con tu obra?';
  protected readonly ctaBody =
    'Contanos qué querés construir y te mandamos un presupuesto desglosado por partida.';
}
