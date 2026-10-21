import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FEED_GATEWAY, PROFILES_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import { PlatformPerfilPublicoPage } from './platform-perfil-publico.page';

/**
 * Zoneless public-profile tests: `id` is bound from the `:id` route param by
 * `withComponentInputBinding`, so the specs set it via `setInput` and drive
 * `detectChanges` + `whenStable` to let the resolution settle and paint.
 */
describe('PlatformPerfilPublicoPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

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

  it('renders an explicit no-profile state for an id without a profile', async () => {
    const element = await render('admin-1');

    expect(element.textContent).toContain('No hay un perfil con ese identificador');
    expect(element.querySelector('[data-testid="perfil-not-found"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="perfil-identity"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-bio"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-contact"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-stats"]')).toBeNull();
    expect(element.querySelector('[data-testid="perfil-publications"]')).toBeNull();
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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando el perfil');

    resolveWorker(null);
    const element = await settle(fixture);

    expect(element.textContent).toContain('No encontramos ese perfil');
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
      '2'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidores"]')?.textContent?.trim()).toBe(
      '128'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-seguidos"]')?.textContent?.trim()).toBe(
      '34'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-oficios"]')?.textContent?.trim()).toBe('2');
    expect(stats?.querySelector('[data-testid="perfil-stat-vacantes"]')).toBeNull();
  });

  it('renders the stats row of a company with its open vacancies', async () => {
    const element = await render('company-1');

    const stats = element.querySelector('[data-testid="perfil-stats"]');
    expect(stats?.querySelector('[data-testid="perfil-stat-vacantes"]')?.textContent?.trim()).toBe(
      '3'
    );
    expect(stats?.querySelector('[data-testid="perfil-stat-oficios"]')).toBeNull();
  });

  it('lists only the publications authored by the profile', async () => {
    const element = await render('worker-1');

    const tiles = element.querySelectorAll('[data-testid="perfil-publicacion"]');
    expect(tiles.length).toBe(2);
    expect(element.textContent).toContain('Terminé la instalación eléctrica');
    expect(element.textContent).toContain('Cerramos la remodelación eléctrica');
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

  it('renders the open vacancies of a company with their status and the apply link', async () => {
    const element = await render('company-1');

    const block = element.querySelector('[data-testid="perfil-vacancies"]');
    expect(block).not.toBeNull();

    const entries = block?.querySelectorAll('[data-testid="vacancy-entry"]') ?? [];
    expect(entries.length).toBe(3);

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

  it('renders the open vacancies count that matches the rendered vacancies', async () => {
    const element = await render('company-1');

    const count = element
      .querySelector('[data-testid="perfil-stat-vacantes"]')
      ?.textContent?.trim();
    const rendered = element.querySelectorAll('[data-testid="vacancy-entry"]').length;
    expect(count).toBe(String(rendered));
  });
});
