import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { PhoneLink } from '../ui/phone-link';
import { WhatsappLink } from '../ui/whatsapp-link';

const QUOTE_PATH = '/presupuesto';

/**
 * The phone-only conversion bar. It is deliberately absent on the quote route: the form
 * there IS the conversion, and a competing bar would compete with the form's own submit
 * (T10.6 keeps the per-page `cta-block` out of `/presupuesto` for the same reason).
 */
@Component({
  selector: 'app-sticky-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhoneLink, WhatsappLink],
  templateUrl: './sticky-cta.html'
})
export class StickyCta {
  private readonly router = inject(Router);

  /** Reactive across navigations: the shell outlives every route change. */
  protected readonly isQuoteRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith(QUOTE_PATH))
    ),
    { initialValue: this.router.url.startsWith(QUOTE_PATH) }
  );
}
