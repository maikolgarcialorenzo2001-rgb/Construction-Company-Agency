import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';
import type { Role } from '../../core/platform/domain';

/**
 * A role a visitor may self-assign. `admin` exists in the contract enum but is NEVER
 * offered here (platform-identity: "Role model"); narrowing the union to the
 * self-service roles makes "admin is un-offerable" a compile-time guarantee.
 */
type SelfServiceRoleValue = Extract<Role, 'worker' | 'company'>;

/** One role card: the value sent to `register`, plus the title and its es-AR blurb. */
interface RoleOption {
  readonly value: SelfServiceRoleValue;
  readonly title: string;
  readonly description: string;
}

/**
 * The roles a visitor may self-assign. `admin` is deliberately absent. The list is the
 * single source the template and the submit path share.
 */
const SELF_SERVICE_ROLES = [
  {
    value: 'worker',
    title: 'Trabajador/a',
    description: 'Acceso para ofrecer servicios y postularse a trabajos.'
  },
  {
    value: 'company',
    title: 'Empresa',
    description: 'Acceso para publicar proyectos y contratar profesionales.'
  }
] as const satisfies readonly RoleOption[];

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
        <fieldset
          data-testid="registro-role"
          class="mt-1 rounded-lg border border-ink-900/15 p-3"
        >
          <legend class="text-sm font-medium text-ink-900">Me registro como</legend>
          <div class="mt-2 space-y-2">
            @for (option of roles; track option.value) {
              <label class="flex items-start gap-3 rounded-lg border border-ink-900/10 p-3">
                <input
                  type="radio"
                  name="registro-role"
                  [value]="option.value"
                  [checked]="role() === option.value"
                  (change)="onRole(option.value)"
                  required
                  class="mt-1"
                />
                <span class="flex flex-col">
                  <span class="font-medium text-ink-900">{{ option.title }}</span>
                  <span class="text-sm text-ink-600">{{ option.description }}</span>
                </span>
              </label>
            }
          </div>
        </fieldset>

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
  protected readonly role = signal<SelfServiceRoleValue>('worker');
  protected readonly error = signal<string | null>(null);

  protected onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPassword(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected onRole(value: SelfServiceRoleValue): void {
    this.role.set(value);
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
