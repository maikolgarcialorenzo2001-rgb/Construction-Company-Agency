import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AdminConfigStore } from '../../core/platform/store/admin-config.store';
import { AdminStore, type RoleFilter } from '../../core/platform/store/admin.store';

/**
 * Admin-only area at `/plataforma/admin` (design D6/D8). Zoneless and signals-only:
 * it renders `AdminStore` (directory + role filter + D7 filtered counts) and
 * `AdminConfigStore` (two demo-only local toggles). Access is enforced by the route
 * (`[authGuard, roleGuard]`, `data.roles: ['admin']`), so the page itself renders no
 * gate. It calls `load()` on creation; the empty/loading states come from the store.
 */
@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Admin</h1>
      <p class="mt-3 text-ink-600">
        Directorio de cuentas y configuración de la plataforma. Contenido de demostración.
      </p>

      <h2 class="mt-8 text-lg font-medium text-ink-900">Directorio de cuentas</h2>

      <div class="mt-4">
        <label for="admin-role-filter" class="block text-sm font-medium text-ink-900"
          >Filtrar por rol</label
        >
        <select
          id="admin-role-filter"
          data-testid="admin-role-filter"
          class="mt-1 w-full max-w-xs rounded-lg border border-ink-900/15 p-3 text-ink-900"
          [value]="store.roleFilter()"
          (change)="onRoleFilterChange($event)"
        >
          <option value="all">Todos</option>
          <option value="worker">Trabajador</option>
          <option value="company">Empresa</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <p data-testid="admin-counts" class="mt-4 text-sm text-ink-600">
        Trabajadores: {{ store.counts().worker }} · Empresas: {{ store.counts().company }} · Admins:
        {{ store.counts().admin }} · Total: {{ store.counts().total }}
      </p>

      @switch (store.state()) {
        @case ('loading') {
          <p class="mt-6 text-ink-600">Cargando directorio…</p>
        }
        @case ('empty') {
          <p data-testid="admin-empty" class="mt-6 text-ink-600">
            Ninguna cuenta coincide con el filtro.
          </p>
        }
        @case ('ready') {
          <table class="mt-6 w-full border-collapse text-left text-sm">
            <caption class="sr-only">
              Cuentas de demostración de la plataforma
            </caption>
            <thead>
              <tr class="border-b border-ink-900/10">
                <th scope="col" class="py-2 font-semibold text-ink-900">Usuario</th>
                <th scope="col" class="py-2 font-semibold text-ink-900">Email</th>
                <th scope="col" class="py-2 font-semibold text-ink-900">Rol</th>
              </tr>
            </thead>
            <tbody>
              @for (user of store.filteredUsers(); track user.userId) {
                <tr data-testid="admin-user-row" class="border-b border-ink-900/5">
                  <td class="py-2 text-ink-900">{{ user.userId }}</td>
                  <td class="py-2 text-ink-900">{{ user.email }}</td>
                  <td class="py-2 text-ink-900">{{ user.role }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      <h2 class="mt-10 text-lg font-medium text-ink-900">Configuración</h2>
      <fieldset class="mt-4 space-y-3">
        <legend class="text-sm font-medium text-ink-900">
          Opciones de demostración (solo local, sin backend)
        </legend>
        <div>
          <input
            id="admin-toggle-demo-notice"
            data-testid="admin-toggle-demo-notice"
            type="checkbox"
            class="h-4 w-4"
            [checked]="config.showDemoNotice()"
            (change)="onShowDemoNoticeChange($event)"
          />
          <label for="admin-toggle-demo-notice" class="ml-2 text-sm text-ink-900"
            >Mostrar aviso de demo</label
          >
        </div>
        <div>
          <input
            id="admin-toggle-company-registration"
            data-testid="admin-toggle-company-registration"
            type="checkbox"
            class="h-4 w-4"
            [checked]="config.allowCompanyRegistration()"
            (change)="onAllowCompanyRegistrationChange($event)"
          />
          <label for="admin-toggle-company-registration" class="ml-2 text-sm text-ink-900"
            >Permitir registro de empresas (solo demo)</label
          >
        </div>
      </fieldset>
    </section>
  `
})
export class AdminPage {
  protected readonly store = inject(AdminStore);
  protected readonly config = inject(AdminConfigStore);

  constructor() {
    void this.store.load();
  }

  protected onRoleFilterChange(event: Event): void {
    this.store.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  protected onShowDemoNoticeChange(event: Event): void {
    this.config.setShowDemoNotice((event.target as HTMLInputElement).checked);
  }

  protected onAllowCompanyRegistrationChange(event: Event): void {
    this.config.setAllowCompanyRegistration((event.target as HTMLInputElement).checked);
  }
}
