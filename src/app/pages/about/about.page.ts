import { ChangeDetectionStrategy, Component } from '@angular/core';

import { site } from '../../../content/site';
import { CtaBlockComponent } from '../../components/cta-block/cta-block.component';
import { PhoneLinkComponent } from '../../components/phone-link/phone-link.component';
import { SectionHeadingComponent } from '../../components/section-heading/section-heading.component';

/**
 * The trust page. Every claim a suspicious buyer wants to verify — story, the four
 * credentials, the warranty and the NAP — is read from `content/site.ts`, so the page
 * cannot drift from the payload that feeds the footer and JSON-LD.
 *
 * The NAP block is a real `<address>` and the phone goes through `app-phone-link`,
 * which is the only `tel:` authority: no phone literal exists in this template.
 */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, PhoneLinkComponent, CtaBlockComponent],
  templateUrl: './about.page.html'
})
export class AboutPage {
  protected readonly site = site;
  protected readonly ctaHeading = '¿Hablamos de tu obra?';
  protected readonly ctaBody =
    'Pedinos el presupuesto: te lo armamos desglosado por partida, con plazos y sin sorpresas.';
}
