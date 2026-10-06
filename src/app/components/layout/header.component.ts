import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { site } from '../../../content/site';
import { PhoneLinkComponent } from '../phone-link/phone-link.component';

/**
 * The site header. Navigation is driven by `site.nav`, so adding a section is a content
 * change, and the phone action is delegated to the shared `tel:` authority.
 *
 * The inline nav is desktop-only (`lg:block`); on smaller screens the footer carries the
 * same link list, so every route stays reachable without a hamburger menu.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, PhoneLinkComponent],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  protected readonly site = site;
}
