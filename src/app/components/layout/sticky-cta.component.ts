import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { isPlatformPath } from '../../core/platform/platform-paths';
import { PhoneLinkComponent } from '../phone-link/phone-link.component';
import { WhatsappLinkComponent } from '../whatsapp-link/whatsapp-link.component';

const QUOTE_PATH = '/presupuesto';

/**
 * The phone-only conversion bar. It is deliberately absent on the quote route (the form
 * there IS the conversion) and across the whole platform subtree (which owns its own
 * conversion flow, off the marketing shell). The platform test is boundary-exact, so a
 * marketing path like `/plataformas-curso` is never swallowed.
 */
@Component({
  selector: 'app-sticky-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhoneLinkComponent, WhatsappLinkComponent],
  templateUrl: './sticky-cta.component.html'
})
export class StickyCtaComponent {
  private readonly router = inject(Router);

  /** True when the bar must not render: on the quote route or inside the platform subtree. */
  protected readonly isHidden = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.shouldHide(this.router.url))
    ),
    { initialValue: this.shouldHide(this.router.url) }
  );

  private shouldHide(url: string): boolean {
    return url.startsWith(QUOTE_PATH) || isPlatformPath(url);
  }
}
