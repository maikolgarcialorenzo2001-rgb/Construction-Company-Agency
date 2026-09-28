import { Component, computed, input } from '@angular/core';

import { site } from '../../content/site';
import { buildWhatsAppUrl, toWaDigits } from '../core/lead/lead-links';

export type WhatsappLinkVariant = 'inline' | 'button';

/**
 * The single `wa.me` authority: the number comes from the NAP source and the message
 * is optional (the shell invites no text, the quote form passes the built lead message).
 */
@Component({
  selector: 'app-whatsapp-link',
  templateUrl: './whatsapp-link.html'
})
export class WhatsappLink {
  /** Prefilled message. Empty means a plain "write us" link. */
  readonly message = input<string>('');
  readonly label = input<string>('Escribinos por WhatsApp');
  readonly variant = input<WhatsappLinkVariant>('inline');

  protected readonly href = computed(() =>
    buildWhatsAppUrl(toWaDigits(site.nap.phoneE164), this.message())
  );

  protected readonly classes = computed(() =>
    this.variant() === 'button'
      ? 'btn-primary flex-1 text-center'
      : 'font-semibold text-brand-800 hover:underline'
  );
}
