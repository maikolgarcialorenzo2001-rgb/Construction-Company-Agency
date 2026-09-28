import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { site } from '../../content/site';
import { PhoneLink } from '../ui/phone-link';

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
  imports: [RouterLink, RouterLinkActive, PhoneLink],
  templateUrl: './header.html'
})
export class Header {
  protected readonly site = site;
}
