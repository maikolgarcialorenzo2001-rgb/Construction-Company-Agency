import { Component, computed, inject, input } from '@angular/core';

import { site } from '../../../content/site';
import { AnalyticsService, type LinkPlacement } from '../../core/analytics/analytics.service';
import { buildWhatsAppUrl, toWaDigits } from '../../core/lead/lead-links';

export type WhatsappLinkVariant = 'inline' | 'button';

/**
 * The single `wa.me` authority: the number comes from the NAP source and the message
 * is optional (the shell invites no text, the quote form passes the built lead message).
 */
@Component({
  selector: 'app-whatsapp-link',
  templateUrl: './whatsapp-link.component.html'
})
export class WhatsappLinkComponent {
  private readonly analytics = inject(AnalyticsService);

  /** Prefilled message. Empty means a plain "write us" link. */
  readonly message = input<string>('');
  readonly label = input<string>('Escribinos por WhatsApp');
  readonly variant = input<WhatsappLinkVariant>('inline');
  /** Where the link lives, reported as the `whatsapp_click` traffic dimension. */
  readonly placement = input<LinkPlacement | ''>('');

  protected readonly href = computed(() =>
    buildWhatsAppUrl(toWaDigits(site.nap.phoneE164), this.message())
  );

  protected readonly classes = computed(() =>
    this.variant() === 'button'
      ? 'btn-primary flex-1 text-center'
      : 'font-semibold text-brand-800 hover:underline'
  );

  protected onClick(): void {
    this.analytics.track('whatsapp_click', { placement: this.placement() });
  }
}
