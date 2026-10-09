import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
import { SessionService } from '../../core/platform/auth/session.service';
import type { CompanyProfile, Role, WorkerProfile } from '../../core/platform/domain';

/** Profile lifecycle: loading → ready | none (no profile for this demo account). */
type ProfileStatus = 'loading' | 'ready' | 'none';

/** Splits the comma-separated skills field into the domain's string array. */
const parseSkills = (raw: string): string[] =>
  raw
    .split(',')
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);

/**
 * Platform profile. The session decides which side of the marketplace to show:
 * a worker edits trade (`skills`) and experience, a company edits its name and
 * description. Reads and writes go through `ProfilesGateway`, so the mock
 * persists the change and the view reflects it. Zoneless: every load lands in a
 * `.set()`, matching the stores.
 */
@Component({
  selector: 'app-platform-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-section font-semibold text-ink-900">Mi perfil</h1>
      <p data-testid="demo-notice" class="mt-3 text-ink-600">
        Modo demo: tu perfil se guarda en este navegador.
      </p>

      @switch (status()) {
        @case ('loading') {
          <p class="mt-6 text-ink-600">Cargando tu perfil…</p>
        }
        @case ('none') {
          <p class="mt-6 text-ink-600">
            Tu cuenta de demo todavía no tiene un perfil cargado.
          </p>
        }
        @case ('ready') {
          @if (role() === 'worker') {
            <p data-testid="worker-name" class="mt-6 text-lg font-medium text-ink-900">
              {{ fullName() }}
            </p>
            <p data-testid="worker-skills-display" class="text-ink-600">{{ skills() }}</p>
            <form data-testid="worker-profile" class="mt-4 space-y-4" (submit)="saveWorker($event)">
              <div>
                <label for="worker-fullName" class="block text-sm font-medium text-ink-900"
                  >Nombre y apellido</label
                >
                <input
                  id="worker-fullName"
                  data-testid="worker-fullName"
                  [value]="fullName()"
                  (input)="onFullName($event)"
                  class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                />
              </div>
              <div>
                <label for="worker-skills" class="block text-sm font-medium text-ink-900"
                  >Oficios (separados por coma)</label
                >
                <input
                  id="worker-skills"
                  data-testid="worker-skills"
                  [value]="skills()"
                  (input)="onSkills($event)"
                  class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                />
              </div>
              <div>
                <label for="worker-bio" class="block text-sm font-medium text-ink-900"
                  >Experiencia</label
                >
                <textarea
                  id="worker-bio"
                  data-testid="worker-bio"
                  rows="3"
                  [value]="bio()"
                  (input)="onBio($event)"
                  class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                ></textarea>
              </div>
              <button
                data-testid="worker-save"
                type="submit"
                class="rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
              >
                Guardar perfil
              </button>
            </form>
          } @else if (role() === 'company') {
            <p data-testid="company-name-display" class="mt-6 text-lg font-medium text-ink-900">
              {{ companyName() }}
            </p>
            <form data-testid="company-profile" class="mt-4 space-y-4" (submit)="saveCompany($event)">
              <div>
                <label for="company-name" class="block text-sm font-medium text-ink-900"
                  >Nombre de la empresa</label
                >
                <input
                  id="company-name"
                  data-testid="company-name"
                  [value]="companyName()"
                  (input)="onCompanyName($event)"
                  class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                />
              </div>
              <div>
                <label for="company-description" class="block text-sm font-medium text-ink-900"
                  >Descripción</label
                >
                <textarea
                  id="company-description"
                  data-testid="company-description"
                  rows="3"
                  [value]="companyDescription()"
                  (input)="onCompanyDescription($event)"
                  class="mt-1 w-full rounded-lg border border-ink-900/15 p-3 text-ink-900"
                ></textarea>
              </div>
              <button
                data-testid="company-save"
                type="submit"
                class="rounded-lg bg-ink-900 px-4 py-2 font-medium text-white"
              >
                Guardar perfil
              </button>
            </form>
          }
        }
      }

      @if (saved()) {
        <p data-testid="profile-saved" role="status" class="mt-4 text-ink-600">Perfil guardado.</p>
      }
    </section>
  `
})
export class PlatformPerfilPage {
  private readonly session = inject(SessionService);
  private readonly profiles = inject(PROFILES_GATEWAY);

  protected readonly role = this.session.role;
  protected readonly status = signal<ProfileStatus>('loading');
  protected readonly saved = signal(false);

  protected readonly workerProfile = signal<WorkerProfile | null>(null);
  protected readonly companyProfile = signal<CompanyProfile | null>(null);

  protected readonly fullName = signal('');
  protected readonly skills = signal('');
  protected readonly bio = signal('');
  protected readonly companyName = signal('');
  protected readonly companyDescription = signal('');

  constructor() {
    effect(() => {
      const user = this.session.currentUser();
      if (user) {
        void this.load(user.userId, user.role);
      }
    });
  }

  protected onFullName(event: Event): void {
    this.fullName.set((event.target as HTMLInputElement).value);
  }

  protected onSkills(event: Event): void {
    this.skills.set((event.target as HTMLInputElement).value);
  }

  protected onBio(event: Event): void {
    this.bio.set((event.target as HTMLTextAreaElement).value);
  }

  protected onCompanyName(event: Event): void {
    this.companyName.set((event.target as HTMLInputElement).value);
  }

  protected onCompanyDescription(event: Event): void {
    this.companyDescription.set((event.target as HTMLTextAreaElement).value);
  }

  protected async saveWorker(event: Event): Promise<void> {
    event.preventDefault();
    const user = this.session.currentUser();
    if (!user) {
      return;
    }
    const updated = await this.profiles.updateWorker(user.userId, {
      fullName: this.fullName().trim(),
      skills: parseSkills(this.skills()),
      bio: this.bio().trim()
    });
    this.workerProfile.set(updated);
    this.saved.set(true);
  }

  protected async saveCompany(event: Event): Promise<void> {
    event.preventDefault();
    const user = this.session.currentUser();
    if (!user) {
      return;
    }
    const updated = await this.profiles.updateCompany(user.userId, {
      name: this.companyName().trim(),
      description: this.companyDescription().trim()
    });
    this.companyProfile.set(updated);
    this.saved.set(true);
  }

  private async load(userId: string, role: Role): Promise<void> {
    this.status.set('loading');
    if (role === 'worker') {
      const profile = await this.profiles.worker(userId);
      if (profile) {
        this.workerProfile.set(profile);
        this.fullName.set(profile.fullName);
        this.skills.set((profile.skills ?? []).join(', '));
        this.bio.set(profile.bio ?? '');
      }
      this.status.set(profile ? 'ready' : 'none');
      return;
    }
    if (role === 'company') {
      const profile = await this.profiles.company(userId);
      if (profile) {
        this.companyProfile.set(profile);
        this.companyName.set(profile.name);
        this.companyDescription.set(profile.description ?? '');
      }
      this.status.set(profile ? 'ready' : 'none');
      return;
    }
    this.status.set('none');
  }
}
