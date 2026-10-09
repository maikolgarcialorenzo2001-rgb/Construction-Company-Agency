import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';

/**
 * Platform login. The session is a local mock (`SessionService`): submitting the
 * demo credentials writes the mock session, no HTTP is issued. The screen says
 * "Modo demo" so the affordance is honest, and it links to the open registration
 * route for a visitor without a session.
 */
@Component({
  selector: 'app-platform-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Ingresar</h1>
      <p data-testid="demo-notice" class="mt-3 text-ink-600">
        Modo demo: el acceso es local, no se envía nada a un servidor.
      </p>

      <form data-testid="login-form" class="mt-6 space-y-4" (submit)="submit($event)">
        <div>
          <label for="login-email" class="block text-sm font-medium text-ink-900">Email</label>
          <input
            id="login-email"
            data-testid="login-email"
            type="email"
            required
            autocomplete="email"
            [value]="email()"
            (input)="onEmail($event)"
            class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          />
        </div>
        <div>
          <label for="login-password" class="block text-sm font-medium text-ink-900">Contraseña</label>
          <input
            id="login-password"
            data-testid="login-password"
            type="password"
            required
            autocomplete="current-password"
            [value]="password()"
            (input)="onPassword($event)"
            class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          />
        </div>

        @if (error()) {
          <p data-testid="login-error" role="alert" class="text-sm text-ink-900">{{ error() }}</p>
        }

        <button
          data-testid="login-submit"
          type="submit"
          class="w-full rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
        >
          Ingresar
        </button>
      </form>

      <p class="mt-6 text-sm text-ink-600">
        Cuentas de demo: <code>lucia@demo.test</code> o <code>norte@demo.test</code> · contraseña
        <code>demo1234</code>
      </p>
      <p class="mt-2 text-sm text-ink-600">
        ¿No tenés cuenta?
        <a routerLink="/plataforma/registro" class="text-ink-900 underline-offset-4 hover:underline"
          >Crear cuenta</a
        >
      </p>
    </section>
  `
})
export class PlatformLoginPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);

  protected onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    try {
      await this.session.login(this.email().trim(), this.password());
      await this.router.navigateByUrl('/plataforma');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'No pudimos ingresar. Probá de nuevo.');
    }
  }
}
