import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { FooterComponent } from './components/layout/footer.component';
import { HeaderComponent } from './components/layout/header.component';
import { StickyCtaComponent } from './components/layout/sticky-cta.component';
import { isPlatformPath } from './core/platform/platform-paths';
import { PlatformHeaderComponent } from './pages/plataforma/platform-header/platform-header.component';

/**
 * The shell. It owns the landmarks (skip link, header, `main`, footer, mobile CTA) and
 * nothing else: every pixel of page content belongs to a lazy route.
 *
 * The chrome is URL-aware: on the platform subtree it swaps the marketing
 * header/footer/sticky bar for the platform header (its own nav + "Modo demo" pill),
 * because the platform is a separate product surface, not a marketing page.
 *
 * No `styleUrl` by design — the shared patterns live in `styles.css` as `@utility`, so the
 * `anyComponentStyle` budget is never spent.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    StickyCtaComponent,
    PlatformHeaderComponent
  ],
  templateUrl: './app.html'
})
export class App {
  private readonly router = inject(Router);

  /** Reactive across navigations: the shell outlives every route change. */
  protected readonly isPlatform = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => isPlatformPath(this.router.url))
    ),
    { initialValue: isPlatformPath(this.router.url) }
  );
}