import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PhoneLink } from './phone-link';

/**
 * The end-of-page conversion block: the quote route plus a phone action. It reads no
 * NAP literal of its own — the phone comes from `app-phone-link`.
 */
@Component({
  selector: 'app-cta-block',
  imports: [RouterLink, PhoneLink],
  templateUrl: './cta-block.html'
})
export class CtaBlock {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
  readonly actionLabel = input<string>('Pedir un presupuesto');
}
