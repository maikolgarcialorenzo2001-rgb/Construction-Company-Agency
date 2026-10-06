import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PhoneLinkComponent } from '../phone-link/phone-link.component';

/**
 * The end-of-page conversion block: the quote route plus a phone action. It reads no
 * NAP literal of its own — the phone comes from `app-phone-link`.
 */
@Component({
  selector: 'app-cta-block',
  imports: [RouterLink, PhoneLinkComponent],
  templateUrl: './cta-block.component.html'
})
export class CtaBlockComponent {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
  readonly actionLabel = input<string>('Pedir un presupuesto');
}
