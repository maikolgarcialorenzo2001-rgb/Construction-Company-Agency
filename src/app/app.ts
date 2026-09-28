import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { StickyCta } from './layout/sticky-cta';

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
  imports: [RouterOutlet, Header, Footer, StickyCta],
  templateUrl: './app.html'
})
export class App {}
