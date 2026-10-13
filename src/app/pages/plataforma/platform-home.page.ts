import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';
import type { Role } from '../../core/platform/domain';
import { applicationStatusLabel } from '../../core/platform/store/application-status';
import { ApplicationsStore } from '../../core/platform/store/applications.store';
import { JobsStore } from '../../core/platform/store/jobs.store';

/**
 * Role-aware entry home at `/plataforma/inicio` (design: "a new lazy
 * `PlatformHomePage`"). It forks on `effectiveRole()`:
 *
 * - `worker`  → "Mis postulaciones" from `ApplicationsStore`, scoped to the
 *               session `userId`, with each job title resolved from `JobsStore`.
 * - `company` → "Mis vacantes" filtered client-side by `companyId === userId`,
 *               plus a "Publicar novedad" affordance.
 * - `admin`   → a minimal overview placeholder (full tooling deferred to `p12-admin`).
 *
 * A single `effect` tracks `session.currentUser()`; the store calls run inside
 * `untracked()` so their signal reads/writes never feed back into the effect
 * (p9 lesson — a load write would otherwise re-trigger it and spin).
 */
@Component({
  selector: 'app-platform-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Inicio</h1>

      @switch (effectiveRole()) {
        @case ('worker') {
          <h2 class="mt-8 text-lg font-medium text-ink-900">Mis postulaciones</h2>

          @switch (applications.status()) {
            @case ('loading') {
              <p class="mt-3 text-ink-600">Cargando postulaciones…</p>
            }
            @case ('empty') {
              <p class="mt-3 text-ink-600">Todavía no te postulaste a ninguna vacante.</p>
            }
            @case ('ready') {
              <ul class="mt-3 space-y-3">
                @for (application of applications.applications(); track application.id) {
                  <li data-testid="home-application" class="rounded-xl border border-ink-900/10 p-4">
                    <a
                      [routerLink]="['/plataforma/trabajos', application.jobId]"
                      class="font-medium text-ink-900 underline-offset-4 hover:underline"
                      >{{ jobTitles().get(application.jobId) ?? 'Vacante' }}</a
                    >
                    <p class="mt-1 text-sm text-ink-600">{{ statusLabel(application.status) }}</p>
                  </li>
                }
              </ul>
            }
          }
        }
        @case ('company') {
          <h2 class="mt-8 text-lg font-medium text-ink-900">Mis vacantes</h2>

          <a
            data-testid="home-publish"
            routerLink="/plataforma"
            class="mt-3 inline-block rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
            >Publicar novedad</a
          >

          @if (jobs.listStatus() === 'idle' || jobs.listStatus() === 'loading') {
            <p class="mt-4 text-ink-600">Cargando vacantes…</p>
          } @else if (myOpenings().length === 0) {
            <p class="mt-4 text-ink-600">Todavía no publicaste ninguna vacante.</p>
          } @else {
            <ul class="mt-4 space-y-3">
              @for (opening of myOpenings(); track opening.id) {
                <li data-testid="home-vacancy" class="rounded-xl border border-ink-900/10 p-4">
                  <a
                    [routerLink]="['/plataforma/trabajos', opening.id]"
                    class="font-medium text-ink-900 underline-offset-4 hover:underline"
                    >{{ opening.title }}</a
                  >
                  @if (opening.location) {
                    <p class="mt-1 text-sm text-ink-600">{{ opening.location }}</p>
                  }
                </li>
              }
            </ul>
          }
        }
        @case ('admin') {
          <p data-testid="home-admin-placeholder" class="mt-8 text-ink-600">
            Panel de administración en preparación. Las herramientas de gestión llegan en la
            próxima iteración.
          </p>
        }
      }
    </section>
  `
})
export class PlatformHomePage {
  protected readonly applications = inject(ApplicationsStore);
  protected readonly jobs = inject(JobsStore);
  private readonly session = inject(SessionService);

  /** Explicit role override for previews/tests; `null` falls back to the session. */
  readonly role = input<Role | null>(null);

  /** The session role, unless the explicit input overrides it (test/preview). */
  protected readonly effectiveRole = computed(() => this.role() ?? this.session.role());

  /** es-AR status label, exposed so the template only formats what the gateway returned. */
  protected readonly statusLabel = applicationStatusLabel;

  /** `jobId → title` so a worker row can name the vacancy it applied to. */
  protected readonly jobTitles = computed(() => {
    const titles = new Map<string, string>();
    for (const opening of this.jobs.openings()) {
      titles.set(opening.id, opening.title);
    }
    return titles;
  });

  /** The company's own vacancies, filtered client-side against the session `userId`. */
  protected readonly myOpenings = computed(() => {
    const userId = this.session.currentUser()?.userId;
    if (!userId) {
      return [];
    }
    return this.jobs.openings().filter((opening) => opening.companyId === userId);
  });

  constructor() {
    // Track only `session.currentUser()`; the store calls run inside `untracked`
    // because `load` reads and writes its own signals — tracking them here would
    // let a load write re-trigger this effect and spin.
    effect(() => {
      const user = this.session.currentUser();
      untracked(() => {
        if (!user) {
          return;
        }
        if (user.role === 'worker' || user.role === 'company') {
          void this.jobs.load();
        }
        if (user.role === 'worker') {
          void this.applications.load(user.userId);
        }
      });
    });
  }
}
