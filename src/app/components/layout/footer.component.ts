import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { site } from '../../../content/site';
import { PhoneLinkComponent } from '../phone-link/phone-link.component';
import { WhatsappLinkComponent } from '../whatsapp-link/whatsapp-link.component';

/**
 * The site footer: the NAP, the opening hours, the WhatsApp action and the Google
 * Business Profile. Every value comes from the content modules, so the footer can never
 * drift from the source that feeds JSON-LD and analytics.
 *
 * The surface is light on purpose: the shared `inline` variants of the link components
 * carry `text-brand-800`, which is the accessible pairing for a light background.
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PhoneLinkComponent, WhatsappLinkComponent],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  protected readonly site = site;
  protected readonly year = new Date().getFullYear();
}
