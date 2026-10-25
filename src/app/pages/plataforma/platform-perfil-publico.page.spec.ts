import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appConfig } from '../../app.config';
import { ENGAGEMENT_GATEWAY, FEED_GATEWAY, PROFILES_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import { ENGAGEMENT_STORAGE_KEY } from '../../core/platform/api/mock-engagement.gateway';
import type { WorkerProfile } from '../../core/platform/domain';
import { WORKER_PROFILES } from '../../core/platform/mocks/fixtures';
import { PlatformPerfilPublicoPage } from './platform-perfil-publico.page';

/**
 * Zoneless public-profile tests: `id` is bound from the `:id` route param by
 * `withComponentInputBinding`, so the specs set it via `setInput` and drive
 * `detectChanges` + `whenStable` to let the resolution settle and paint.
 */
describe('PlatformPerfilPublicoPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    // The follow state is persisted: without this the engagement leaks between
    // specs and a "not following" assertion can pass for the wrong reason.
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
  });

  /** Seeds a signed-in session so the page can read the viewer. */
  const seedSession = (userId: string, role: 'worker' | 'company'): void => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: `mock-token-${userId}`,
        user: { userId, email: `${userId}@demo.test`, role }
      })
    );
  };

  /**
   * Lets every pending promise chain settle, then repaints.
   *
   * The profile resolution probes two gateways, so the not-found path needs one
   * more microtask hop than the found one; a macrotask boundary drains the
   * whole microtask queue, so the outcome never depends on the hop count.
   */
  const settle = async (
    fixture: ComponentFixture<PlatformPerfilPublicoPage>
  ): Promise<HTMLElement> => {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  /** Renders the page for an id and waits for the resolution to settle. */
  const render = async (id: string): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(PlatformPerfilPublicoPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return settle(fixture);
  };

  /**
   * Drains the microtask queue and repaints WITHOUT waiting for stability: the
   * stale-id spec keeps a resolution pending, and `whenStable()` would wait for
   * a promise that only the spec resolves.
   */
  const flush = async (fixture: ComponentFixture<PlatformPerfilPublicoPage>): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  it('renders an explicit no-profile state for an id without a profile', async () => {
    const element = await render('admin-1');

    const headings = element.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('No encontramos ese perfil');
    expect(element.textContent).toContain('No encontramos ese perfil');
    expect(element.textContent).toContain('No hay un perfil con ese identificador');
    expect(element.querySelector('[data-testid="perfil-not-found"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="perfil-identity"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-bio"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-contact"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-stats"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-publicaciones"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-vacancies"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-actions"]')).toBeNull();
  });

  it('renders the identity block of a seeded worker', async () => {
    const element = await render('worker-1');

    const headings = element.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('Lucía Fernández');

    const avatar = element.querySelector('[data-testid="perfil-avatar"]');
    expect(avatar?.tagName).toBe('SPAN');
    expect(avatar?.textContent?.trim()).toBe('LF');

    expect(element.querySelector('[data-testid="perfil-role"]')?.textContent).toContain('Trabajador');
    expect(element.querySelector('[data-testid="perfil-location"]')?.textContent).toContain(
      'Avellaneda'
    );
    expect(element.querySelector('[data-testid="perfil-member-since"]')?.textContent).toContain(
      'Miembro desde'
    );
    expect(element.querySelector('[data-testid="perfil-verified"]')).not.toBeNull();
  });

  it('renders the initials avatar without a single image', async () => {
    const element = await render('worker-1');

    expect(element.querySelectorAll('img')).toHaveLength(0);
  });

  it('labels the verified badge by role: a company is Verificada, a worker Verificado', async () => {
    const company = await render('company-1');
    expect(company.querySelector('[data-testid="perfil-verified"]')?.textContent?.trim()).toBe(
      'Verificada'
    );

    const worker = await render('worker-1');
    expect(worker.querySelector('[data-testid="perfil-verified"]')?.textContent?.trim()).toBe(
      'Verificado'
    );
  });

  it('renders the role as a badge, not as a plain paragraph', async () => {
    const element = await render('company-1');

    const role = element.querySelector('[data-testid="perfil-role"]');
    expect(role?.tagName).toBe('SPAN');
    expect(role?.textContent?.trim()).toBe('Empresa');
  });

  it('renders the sector line by role: Rubro for a company, Oficio for a worker', async () => {
    const company = await render('company-1');
    expect(company.querySelector('[data-testid="perfil-sector"]')?.textContent?.trim()).toBe(
      'Rubro: Construcción'
    );

    const worker = await render('worker-1');
    expect(worker.querySelector('[data-testid="perfil-sector"]')?.textContent?.trim()).toBe(
      'Oficio: Electricidad'
    );
  });

  it('shows the loading state while the profile is pending', async () => {
    let resolveWorker!: (profile: unknown) => void;
    TestBed.overrideProvider(PROFILES_GATEWAY, {
      useValue: {
        worker: () =>
          new Promise((resolve) => {
            resolveWorker = resolve;
          }),
        company: async () => null,
        updateWorker: async () => {
          throw new Error('not used');
        },
        updateCompany: async () => {
          throw new Error('not used');
        }
      }
    });

    const fixture: ComponentFixture<PlatformPerfilPublicoPage> =
      TestBed.createComponent(PlatformPerfilPublicoPage);
    fixture.componentRef.setInput('id', 'worker-1');
    fixture.detectChanges();

    const loading = fixture.nativeElement as HTMLElement;
    // The page always carries exactly one h1, even while the profile is pending.
    const loadingHeadings = loading.querySelectorAll('h1');
    expect(loadingHeadings.length).toBe(1);
    expect(loadingHeadings[0].textContent?.trim()).toBe('Perfil');
    expect(loading.textContent).toContain('Cargando el perfil');

    resolveWorker(null);
    const element = await settle(fixture);

    expect(element.textContent).toContain('No encontramos ese perfil');
  });

  it('renders exactly one h1 for a ready profile and for a missing one', async () => {
    const worker = await render('worker-1');
    expect(worker.querySelectorAll('h1').length).toBe(1);
    expect(worker.querySelector('h1')?.textContent?.trim()).toBe('Lucía Fernández');

    const company = await render('company-1');
    expect(company.querySelectorAll('h1').length).toBe(1);
    expect(company.querySelector('h1')?.textContent?.trim()).toBe('Constructora Norte SAC');

    const missing = await render('admin-1');
    expect(missing.querySelectorAll('h1').length).toBe(1);
    expect(missing.querySelector('h1')?.textContent?.trim()).toBe('No encontramos ese perfil');
  });

  it('renders the bio and the skill chips of a worker', async () => {
    const element = await render('worker-1');

    expect(element.querySelector('[data-testid="perfil-bio"]')?.textContent).toContain(
      'Electricista matriculada'
    );

    const chips = element.querySelectorAll('[data-testid="perfil-skill"]');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent?.trim()).toBe('Electricidad');
    expect(chips[1].textContent?.trim()).toBe('Sanitarias');
  });

  it('renders the description and the contact links of a company', async () => {
    const element = await render('company-1');

    expect(element.querySelector('[data-testid="perfil-bio"]')?.textContent).toContain(
      'Obra residencial y comercial'
    );
    expect(element.querySelector('[data-testid="perfil-website"]')?.getAttribute('href')).toBe(
      'https://constructora-norte.test'
    );
    expect(element.querySelector('[data-testid="perfil-email"]')?.getAttribute('href')).toBe(
      'mailto:obras@norte.test'
    );
    expect(element.querySelector('[data-testid="perfil-whatsapp"]')?.getAttribute('href')).toBe(
      'https://wa.me/5491144400001'
    );
  });

  it('renders the contact links of a worker', async () => {
    const element = await render('worker-1');

    expect(element.querySelector('[data-testid="perfil-phone"]')?.getAttribute('href')).toBe(
      'tel:+5491144440000'
    );
    expect(element.querySelector('[data-testid="perfil-whatsapp"]')?.getAttribute('href')).toBe(
      'https://wa.me/5491144440000'
    );
    expect(element.querySelector('[data-testid="perfil-email"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-website"]')).toBeNull();
  });

  it('renders the contact links as plain anchors, not as the site NAP components', async () => {
    const element = await render('worker-1');

    expect(element.querySelector('app-phone-link')).toBeNull();
    expect(element.querySelector('app-whatsapp-link')).toBeNull();
  });

  it('renders the stats row of a worker', async () => {
    const element = await render('worker-1');

    const stats = element.querySelector('[data-testid="perfil-stats"]');
    expect(stats).not.toBeNull();
    expect(stats?.querySelector('[data-testid="perfil-stat-publicaciones"]')?.textContent?.trim()).toBe(
      '3'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidores"]')?.textContent?.trim()).toBe(
      '128'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidos"]')?.textContent?.trim()).toBe(
      '34'
    );
    expect(
      stats?.querySelector('[data-testid="perfil-stat-habilidades"]')?.textContent?.trim()
    ).toBe('2');
    expect(stats?.querySelector('[data-testid="perfil-stat-vacantes"]')).toBeNull();
  });

  it('names the worker skills count "Habilidades", so "Oficio" means only the trade', async () => {
    const element = await render('worker-1');

    const stat = element.querySelector('[data-testid="perfil-stat-habilidades"]');
    expect(stat?.textContent?.trim()).toBe('2');
    expect(stat?.parentElement?.querySelector('dt')?.textContent?.trim()).toBe('Habilidades');

    // The sector line keeps "Oficio" for the trade, and worker-1's FIRST skill
    // chip is literally "Electricidad": one word must never mean two things on
    // the same screen.
    expect(element.querySelector('[data-testid="perfil-sector"]')?.textContent?.trim()).toBe(
      'Oficio: Electricidad'
    );
    expect(element.textContent).not.toContain('Oficios');
  });

  it('renders the stats row of a company with its publications, followers and open vacancies', async () => {
    const element = await render('company-1');

    const stats = element.querySelector('[data-testid="perfil-stats"]');
    expect(stats).not.toBeNull();
    expect(stats?.querySelector('[data-testid="perfil-stat-publicaciones"]')?.textContent?.trim()).toBe(
      '6'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidores"]')?.textContent?.trim()).toBe(
      '310'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidos"]')?.textContent?.trim()).toBe(
      '12'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-vacantes"]')?.textContent?.trim()).toBe(
      '3'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-habilidades"]')).toBeNull();
  });

  it('renders the identity block of a company', async () => {
    const element = await render('company-1');

    const headings = element.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('Constructora Norte SAC');

    // The initials are a demo-only view field: the contract profile has no
    // avatar, so the page renders the demo view and never the raw contract.
    const avatar = element.querySelector('[data-testid="perfil-avatar"]');
    expect(avatar?.tagName).toBe('SPAN');
    expect(avatar?.textContent?.trim()).toBe('CN');

    expect(element.querySelector('[data-testid="perfil-role"]')?.textContent?.trim()).toBe('Empresa');
    expect(element.querySelector('[data-testid="perfil-verified"]')?.textContent?.trim()).toBe(
      'Verificada'
    );
    expect(element.querySelector('[data-testid="perfil-location"]')?.textContent?.trim()).toBe(
      'San Isidro, GBA Norte'
    );
    expect(element.querySelector('[data-testid="perfil-member-since"]')?.textContent).toContain(
      'Miembro desde'
    );
  });

  it('renders the company profile without a single image', async () => {
    const element = await render('company-1');

    expect(element.querySelectorAll('img')).toHaveLength(0);
  });

  it('lists only the publications authored by the profile', async () => {
    const element = await render('worker-1');

    const tiles = element.querySelectorAll('[data-testid="perfil-publicacion"]');
    expect(tiles.length).toBe(3);
    expect(element.textContent).toContain('Terminé la instalación eléctrica');
    expect(element.textContent).toContain('Cerramos la remodelación eléctrica');
    expect(element.textContent).toContain('Busco trabajo como electricista matriculada');
    // A worker-2 post never appears on worker-1's page.
    expect(element.textContent).not.toContain('medí la carga de cada circuito');
  });

  it('renders the kind badge, the preview and the date of every publication', async () => {
    const element = await render('worker-1');

    const tile = element.querySelector('[data-testid="perfil-publicacion"]');
    expect(tile?.querySelector('[data-testid="perfil-publicacion-kind"]')?.textContent?.trim()).toBe(
      'Publicación'
    );
    expect(tile?.querySelector('[data-testid="perfil-publicacion-texto"]')?.textContent).toContain(
      'Terminé la instalación eléctrica de un local en Avellaneda.'
    );
    expect(tile?.querySelector('[data-testid="perfil-publicacion-fecha"]')?.textContent?.trim()).toBe(
      '5 de octubre de 2026'
    );
  });

  it('renders the kind badge of a vacancy publication', async () => {
    const element = await render('company-1');

    const badges = Array.from(
      element.querySelectorAll('[data-testid="perfil-publicacion-kind"]')
    ).map((badge) => badge.textContent?.trim());
    expect(badges).toContain('Vacante');
    expect(badges).toContain('Publicación');
  });

  it('renders no img in the publications grid', async () => {
    const element = await render('company-1');

    const grid = element.querySelector('[data-testid="perfil-publicaciones"]');
    expect(grid).not.toBeNull();
    expect(grid?.querySelectorAll('img').length).toBe(0);
  });

  it('renders the empty state when the profile has no publications', async () => {
    TestBed.overrideProvider(FEED_GATEWAY, {
      useValue: {
        timeline: async () => ({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
        create: async () => {
          throw new Error('not used');
        }
      }
    });

    const element = await render('worker-1');

    expect(element.querySelector('[data-testid="perfil-publicaciones-vacio"]')?.textContent).toContain(
      'Todavía no publicó nada'
    );
    expect(element.querySelectorAll('[data-testid="perfil-publicacion"]').length).toBe(0);
  });

  it('renders no vacancies block for a worker', async () => {
    const element = await render('worker-1');

    expect(element.querySelector('[data-testid="perfil-vacancies"]')).toBeNull();
    expect(element.querySelector('[data-testid="vacancy-entry"]')).toBeNull();
  });

  it('renders the vacancies of a company with their status and the apply link', async () => {
    const element = await render('company-1');

    const block = element.querySelector('[data-testid="perfil-vacancies"]');
    expect(block).not.toBeNull();

    const entries = block?.querySelectorAll('[data-testid="vacancy-entry"]') ?? [];
    // company-1 owns FIVE openings: three open and two closed.
    expect(entries.length).toBe(5);

    const first = entries[0];
    expect(first.querySelector('[data-testid="vacancy-title"]')?.textContent?.trim()).toBe(
      'Albañil con experiencia para obra en Vicente López'
    );
    expect(first.querySelector('[data-testid="vacancy-location"]')?.textContent?.trim()).toBe(
      'Vicente López, GBA Norte'
    );
    expect(first.querySelector('[data-testid="vacancy-budget"]')?.textContent?.trim()).toBe(
      'ARS 380.000'
    );
    expect(first.querySelector('[data-testid="vacancy-status"]')?.textContent).toContain('Abierta');
    expect(first.querySelector('[data-testid="vacancy-apply"]')?.getAttribute('href')).toBe(
      '/plataforma/trabajos/job-1'
    );
  });

  it('lists every vacancy of the company with its live status, open or closed', async () => {
    const element = await render('company-1');

    const block = element.querySelector('[data-testid="perfil-vacancies"]');
    expect(block).not.toBeNull();

    const entries = Array.from(block?.querySelectorAll('[data-testid="vacancy-entry"]') ?? []);
    expect(entries.length).toBe(5);

    const statusOf = (entry: Element): string =>
      entry.querySelector('[data-testid="vacancy-status"]')?.textContent?.trim() ?? '';

    const open = entries.filter((entry) => statusOf(entry).includes('Abierta'));
    const closed = entries.filter((entry) => statusOf(entry).includes('Cerrada'));

    expect(open.length).toBe(3);
    expect(closed.length).toBe(2);

    const closedTitles = closed.map((entry) =>
      entry.querySelector('[data-testid="vacancy-title"]')?.textContent?.trim()
    );
    expect(closedTitles).toEqual([
      'Director de obra para multifamiliar en Rosario',
      'Dirección de obra para desarrollo en Córdoba'
    ]);
  });

  it('keeps the apply link on a closed vacancy', async () => {
    const element = await render('company-1');

    const closed = Array.from(element.querySelectorAll('[data-testid="vacancy-entry"]')).filter(
      (entry) =>
        entry.querySelector('[data-testid="vacancy-status"]')?.textContent?.includes('Cerrada')
    );
    expect(closed.length).toBe(2);

    const apply = closed[0].querySelector('[data-testid="vacancy-apply"]');
    expect(apply?.getAttribute('href')).toBe('/plataforma/trabajos/job-3');
    expect(apply?.getAttribute('aria-label')).toBe(
      'Postularse a Director de obra para multifamiliar en Rosario'
    );
  });

  it('counts only the OPEN vacancies of the company', async () => {
    const element = await render('company-1');

    const count = element
      .querySelector('[data-testid="perfil-stat-vacantes"]')
      ?.textContent?.trim();
    const open = Array.from(element.querySelectorAll('[data-testid="vacancy-entry"]')).filter(
      (entry) =>
        entry.querySelector('[data-testid="vacancy-status"]')?.textContent?.includes('Abierta')
    );

    expect(count).toBe('3');
    expect(open.length).toBe(Number(count));
  });

  it('titles the vacancies with its own heading, with no second card title', async () => {
    const element = await render('company-1');

    const block = element.querySelector('[data-testid="perfil-vacancies"]');
    expect(block).not.toBeNull();

    // The page owns the heading...
    expect(block?.querySelector('h2')?.textContent?.trim()).toBe('Vacantes');
    // ...and the shared card prints NO title of its own: its default copy
    // ("Vacantes disponibles") is WRONG here, because the list also carries
    // the CLOSED vacancies, and a second title would duplicate the heading.
    expect(block?.querySelector('[data-testid="vacancy-card-title"]')).toBeNull();
    expect(block?.textContent).not.toContain('Vacantes disponibles');
  });

  it('offers a login link and no follow button to an anonymous visitor', async () => {
    const element = await render('company-1');

    expect(element.querySelector('[data-testid="perfil-seguir"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-editar"]')).toBeNull();
    const login = element.querySelector('[data-testid="perfil-login"]');
    expect(login?.textContent).toContain('Iniciar sesión');
    expect(login?.getAttribute('href')).toBe('/plataforma/login');
  });

  it('offers the edit link and no follow button to the owner', async () => {
    seedSession('worker-1', 'worker');

    const element = await render('worker-1');

    expect(element.querySelector('[data-testid="perfil-seguir"]')).toBeNull();
    const edit = element.querySelector('[data-testid="perfil-editar"]');
    expect(edit?.textContent).toContain('Editar perfil');
    expect(edit?.getAttribute('href')).toBe('/plataforma/perfil');
  });

  it('hides the edit link from a viewer that is not the owner', async () => {
    seedSession('worker-1', 'worker');

    const element = await render('company-1');

    expect(element.querySelector('[data-testid="perfil-editar"]')).toBeNull();
    // The non-owner gets the follow action instead.
    expect(element.querySelector('[data-testid="perfil-seguir"]')).not.toBeNull();
  });

  it('drops a stale resolution when the id changes before it settles', async () => {
    const pending = new Map<string, (profile: WorkerProfile | null) => void>();
    TestBed.overrideProvider(PROFILES_GATEWAY, {
      useValue: {
        worker: (id: string) =>
          new Promise<WorkerProfile | null>((resolve) => {
            pending.set(id, resolve);
          }),
        company: async () => null,
        updateWorker: async () => {
          throw new Error('not used');
        },
        updateCompany: async () => {
          throw new Error('not used');
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformPerfilPublicoPage);
    fixture.componentRef.setInput('id', 'worker-1');
    fixture.detectChanges();

    // The id changes while the FIRST resolution is still pending: the second id
    // starts its own resolution.
    fixture.componentRef.setInput('id', 'worker-2');
    fixture.detectChanges();
    await flush(fixture);

    expect(pending.has('worker-2'), 'the second id must start its own resolution').toBe(true);

    // The STALE resolution settles first: its result must never reach the page.
    pending.get('worker-1')?.(WORKER_PROFILES[0]);
    await flush(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="perfil-name"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-loading"]')).not.toBeNull();

    // The current resolution lands: ITS profile is the one on screen.
    pending.get('worker-2')?.(WORKER_PROFILES[1]);
    await flush(fixture);

    expect(element.querySelector('[data-testid="perfil-name"]')?.textContent?.trim()).toBe(
      'Martín Gómez'
    );
  });

  it('keeps the LAST resolution when the id comes back to a previous one', async () => {
    const pending: ((profile: WorkerProfile | null) => void)[] = [];
    TestBed.overrideProvider(PROFILES_GATEWAY, {
      useValue: {
        worker: () =>
          new Promise<WorkerProfile | null>((resolve) => {
            pending.push(resolve);
          }),
        company: async () => null,
        updateWorker: async () => {
          throw new Error('not used');
        },
        updateCompany: async () => {
          throw new Error('not used');
        }
      }
    });

    const fixture = TestBed.createComponent(PlatformPerfilPublicoPage);
    // A → B → A: the id leaves and comes back, so the FIRST resolution of
    // "worker-1" and the LAST one share the SAME id.
    fixture.componentRef.setInput('id', 'worker-1');
    fixture.detectChanges();
    fixture.componentRef.setInput('id', 'worker-2');
    fixture.detectChanges();
    fixture.componentRef.setInput('id', 'worker-1');
    fixture.detectChanges();
    await flush(fixture);

    expect(pending.length, 'every id change starts its own resolution').toBe(3);

    // The LAST resolution of "worker-1" lands first.
    pending[2]?.(WORKER_PROFILES[0]);
    await flush(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="perfil-name"]')?.textContent?.trim()).toBe(
      'Lucía Fernández'
    );

    // The FIRST resolution of the SAME id lands now. It is STALE — it belongs
    // to an older generation — so it must never overwrite the newer payload,
    // even though the id matches.
    pending[0]?.({ ...WORKER_PROFILES[0], fullName: 'Ana Stale' });
    await flush(fixture);

    expect(element.querySelector('[data-testid="perfil-name"]')?.textContent?.trim()).toBe(
      'Lucía Fernández'
    );
  });

  it('toggles the follow of another profile for a signed-in viewer', async () => {
    const toggled: [string, string][] = [];
    TestBed.overrideProvider(ENGAGEMENT_GATEWAY, {
      useValue: {
        load: async () => ({}),
        toggleFollow: async (viewerId: string, authorId: string) => {
          toggled.push([viewerId, authorId]);
          return { [viewerId]: { following: [authorId], liked: [], saved: [] } };
        },
        toggleLike: async () => ({}),
        toggleSave: async () => ({})
      }
    });
    seedSession('worker-1', 'worker');

    const fixture = TestBed.createComponent(PlatformPerfilPublicoPage);
    fixture.componentRef.setInput('id', 'company-1');
    fixture.detectChanges();
    const element = await settle(fixture);

    const button = element.querySelector<HTMLButtonElement>('[data-testid="perfil-seguir"]');
    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('Seguir');
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    button?.click();
    await settle(fixture);

    expect(toggled).toEqual([['worker-1', 'company-1']]);
    const flipped = element.querySelector<HTMLButtonElement>('[data-testid="perfil-seguir"]');
    expect(flipped?.textContent?.trim()).toBe('Siguiendo');
    expect(flipped?.getAttribute('aria-pressed')).toBe('true');
  });

  /**
   * The APP's own providers — the real route table AND the real
   * `withComponentInputBinding`, not a copy of them. The specs above drive the
   * id directly, so only this block proves the `:id` route param actually
   * reaches the page in production.
   */
  describe('with the app providers', () => {
    let harness: RouterTestingHarness;

    beforeEach(async () => {
      // The app providers replace the empty router of the outer suite.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        // The app's OWN provider list: the router configuration under test is
        // the one the app boots with, so this block FAILS if `app.config.ts`
        // ever drops `withComponentInputBinding()` (the page would stay on
        // "Cargando el perfil…" forever in production).
        // The testing backend must come AFTER `provideHttpClient()` (already in
        // `appConfig.providers`) so it becomes the active backend.
        providers: [...appConfig.providers, provideHttpClientTesting()]
      });
      harness = await RouterTestingHarness.create();
    });

    it('resolves the profile from the :id route param', async () => {
      await harness.navigateByUrl('/plataforma/perfil/worker-1');
      harness.detectChanges();
      await harness.fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      harness.detectChanges();

      const element = harness.fixture.nativeElement as HTMLElement;
      expect(element.querySelector('app-platform-perfil-publico')).not.toBeNull();
      // The name comes from the URL param: without the binding the page would
      // stay in its loading state with no profile at all.
      expect(element.querySelector('[data-testid="perfil-name"]')?.textContent?.trim()).toBe(
        'Lucía Fernández'
      );
    });
  });
});
