import { Component, input } from '@angular/core';

/**
 * Section title block. Every page section starts with one, so the `h1` of a page is
 * the only `h1` and section titles stay at `h2`.
 */
@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.html'
})
export class SectionHeading {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly lead = input<string>();
}
