import { Component, computed, inject, input } from '@angular/core';

import { site } from '../../../content/site';
import { AnalyticsService, type LinkPlacement } from '../../core/analytics/analytics.service';
import { buildTelHref, toWaDigits } from '../../core/lead/lead-links';

/** Presentation of the phone action. Kept as a variant so no component styles are needed. */
export type PhoneLinkVariant = 'inline' | 'button';

/**
 * The single `tel:` authority: the target is always derived from the NAP source, so a
 * phone number can only be changed in `content/site.ts`.
 */
@Component({
  selector: 'app-phone-link',
  templateUrl: './phone-link.component.html'
})
export class PhoneLinkComponent {
  private readonly analytics = inject(AnalyticsService);

  /** Visible text. Defaults to the NAP display phone. */
  readonly label = input<string>(site.nap.phoneDisplay);
  readonly variant = input<PhoneLinkVariant>('inline');
  /** Where the link lives, reported as the `call_click` traffic dimension. */
  readonly placement = input<LinkPlacement | ''>('');

  protected readonly href = computed(() => buildTelHref(toWaDigits(site.nap.phoneE164)));

  protected readonly classes = computed(() =>
    this.variant() === 'button'
      ? 'btn-secondary flex-1 text-center'
      : 'font-semibold text-brand-800 hover:underline'
  );

  protected onClick(): void {
    this.analytics.track('call_click', { placement: this.placement() });
  }
}
