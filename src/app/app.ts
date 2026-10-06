import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './components/layout/footer.component';
import { HeaderComponent } from './components/layout/header.component';
import { StickyCtaComponent } from './components/layout/sticky-cta.component';

/**
 * The shell. It owns the landmarks (skip link, header, `main`, footer, mobile CTA) and
 * nothing else: every pixel of page content belongs to a lazy route.
 *
 * No `styleUrl` by design — the shared patterns live in `styles.css` as `@utility`, so the
 * `anyComponentStyle` budget is never spent.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, StickyCtaComponent],
  templateUrl: './app.html'
})
export class App {}
