import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
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
});
