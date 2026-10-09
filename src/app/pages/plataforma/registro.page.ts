import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';
import type { Role } from '../../core/platform/domain';

/**
 * The roles a visitor may self-assign. `admin` exists in the contract enum but is
 * NEVER offered here: it is not a self-service role (platform-identity: "Role
 * model"). The list is the single source the template and the submit path share.
 */
const SELF_SERVICE_ROLES = [
  { value: 'worker', label: 'Trabajador/a' },
  { value: 'company', label: 'Empresa' }
] as const;

/**
 * Platform registration. It creates a local mock session through
 * `SessionService`; the demo notice keeps the absence of a server honest. Only
 * the self-service roles are offered.
 */
@Component({
  selector: 'app-platform-registro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Crear cuenta</h1>
      <p data-testid="demo-notice" class="mt-3 text-ink-600">
        Modo demo: la cuenta vive en este navegador, no se envía nada a un servidor.
      </p>

      <form data-testid="registro-form" class="mt-6 space-y-4" (submit)="submit($event)">
        <div>
          <label for="registro-email" class="block text-sm font-medium text-ink-900">Email</label>
          <input
            id="registro-email"
            data-testid="registro-email"
            type="email"
            required
            autocomplete="email"
            [value]="email()"
            (input)="onEmail($event)"
            class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          />
        </div>
        <div>
          <label for="registro-password" class="block text-sm font-medium text-ink-900"
            >Contraseña</label
          >
          <input
            id="registro-password"
            data-testid="registro-password"
            type="password"
            required
            autocomplete="new-password"
            [value]="password()"
            (input)="onPassword($event)"
            class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          />
        </div>
        <div>
          <label for="registro-role" class="block text-sm font-medium text-ink-900">Me registro como</label>
          <select
            id="registro-role"
            data-testid="registro-role"
            [value]="role()"
            (change)="onRole($event)"
            class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
          >
            @for (option of roles; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        @if (error()) {
          <p data-testid="registro-error" role="alert" class="text-sm text-ink-900">{{ error() }}</p>
        }

        <button
          data-testid="registro-submit"
          type="submit"
          class="w-full rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
        >
          Crear cuenta
        </button>
      </form>

      <p class="mt-6 text-sm text-ink-600">
        ¿Ya tenés cuenta?
        <a routerLink="/plataforma/login" class="text-ink-900 underline-offset-4 hover:underline"
          >Ingresar</a
        >
      </p>
    </section>
  `
})
export class PlatformRegistroPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly roles = SELF_SERVICE_ROLES;
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<Role>('worker');
  protected readonly error = signal<string | null>(null);

  protected onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onRole(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value as Role);
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    try {
      await this.session.register({
        email: this.email().trim(),
        password: this.password(),
        role: this.role()
      });
      await this.router.navigateByUrl('/plataforma');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'No pudimos crear la cuenta.');
    }
  }
}
