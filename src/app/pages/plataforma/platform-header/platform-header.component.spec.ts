import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SESSION_STORAGE_KEY,
  SessionService
} from '../../../core/platform/auth/session.service';
import { PlatformHeaderComponent } from './platform-header.component';

type HeaderRole = 'worker' | 'company' | 'admin';

/** Seeds a local mock session, as `SessionService` would after login. */
const seedSession = (role: HeaderRole): void =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'mock-token',
      user: { userId: `${role}-1`, email: 'demo@test', role }
    })
  );

const create = (role?: HeaderRole): ComponentFixture<PlatformHeaderComponent> => {
  const fixture = TestBed.createComponent(PlatformHeaderComponent);
  if (role) {
    fixture.componentRef.setInput('role', role);
  }
  fixture.detectChanges();
  return fixture;
};

const elementOf = (fixture: ComponentFixture<PlatformHeaderComponent>): HTMLElement =>
  fixture.nativeElement as HTMLElement;

/** Labels in DOM order; empty when the `<nav>` landmark is absent. */
const navLabels = (fixture: ComponentFixture<PlatformHeaderComponent>): string[] =>
  Array.from(elementOf(fixture).querySelectorAll('nav a')).map((a) =>
    (a.textContent ?? '').trim()
  );

const navHrefs = (fixture: ComponentFixture<PlatformHeaderComponent>): (string | null)[] =>
  Array.from(elementOf(fixture).querySelectorAll('nav a')).map((a) => a.getAttribute('href'));

/**
 * Zoneless header tests. The header is a thin renderer over `platformNavFor`, so these
 * cases pin the role→DOM contract and the session reactivity the spec requires.
 */
describe('PlatformHeaderComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [PlatformHeaderComponent],
      providers: [provideRouter([])]
    });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders no work nav but keeps the demo pill for an anonymous visitor', () => {
    const fixture = create();
    const element = elementOf(fixture);

    expect(element.querySelector('nav')).toBeNull();
    expect(element.textContent).toContain('Modo demo');
  });

  it('renders the worker work nav from the explicit role input', () => {
    expect(navLabels(create('worker'))).toEqual(['Inicio', 'Novedades', 'Trabajos', 'Mi perfil']);
  });

  it('renders the admin labels with Admin leading the worker destinations', () => {
    expect(navLabels(create('admin'))).toEqual([
      'Admin',
      'Inicio',
      'Novedades',
      'Trabajos',
      'Mi perfil'
    ]);
  });

  it('renders the relabeled company work nav', () => {
    expect(navLabels(create('company'))).toEqual(['Inicio', 'Novedades', 'Vacantes', 'Mi empresa']);
  });

  it('keeps the destination hrefs stable across roles', () => {
    for (const role of ['worker', 'company'] as const) {
      expect(navHrefs(create(role))).toEqual([
        '/plataforma/inicio',
        '/plataforma',
        '/plataforma/trabajos',
        '/plataforma/perfil'
      ]);
    }
  });

  it('exposes exactly one platform entry link', () => {
    expect(elementOf(create('worker')).querySelectorAll('a[href="/plataforma"]')).toHaveLength(1);
  });

  it('does not render the marketing promo strip inside the platform chrome', () => {
    expect(
      elementOf(create('worker')).querySelector('[data-testid="header-promo"]')
    ).toBeNull();
  });

  it('keeps the demo pill in every state', () => {
    for (const role of [undefined, 'worker', 'company', 'admin'] as const) {
      expect(elementOf(create(role)).textContent).toContain('Modo demo');
    }
  });

  it('renders the company nav from a seeded session without a role input', () => {
    seedSession('company');
    expect(navLabels(create())).toEqual(['Inicio', 'Novedades', 'Vacantes', 'Mi empresa']);
  });

  it('renders the company nav after a real SessionService.login', async () => {
    // Real service path: `login` resolves the in-memory `MockAuthGateway`, persists
    // the session and flips the signal — the same wiring the login page uses.
    await TestBed.inject(SessionService).login('norte@demo.test', 'demo1234');
    expect(navLabels(create())).toEqual(['Inicio', 'Novedades', 'Vacantes', 'Mi empresa']);
  });

  it('renders the worker nav after a real SessionService.login', async () => {
    await TestBed.inject(SessionService).login('lucia@demo.test', 'demo1234');
    expect(navLabels(create())).toEqual(['Inicio', 'Novedades', 'Trabajos', 'Mi perfil']);
  });

  it('removes the work nav when the session is cleared', async () => {
    seedSession('company');
    const fixture = create();
    expect(navLabels(fixture)).toEqual(['Inicio', 'Novedades', 'Vacantes', 'Mi empresa']);

    await TestBed.inject(SessionService).logout();
    fixture.detectChanges();

    expect(elementOf(fixture).querySelector('nav')).toBeNull();
  });

  it('reacts to a role input set after the first render', () => {
    const fixture = create();
    expect(elementOf(fixture).querySelector('nav')).toBeNull();

    fixture.componentRef.setInput('role', 'worker');
    fixture.detectChanges();

    expect(navLabels(fixture)).toEqual(['Inicio', 'Novedades', 'Trabajos', 'Mi perfil']);
  });
});
