import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { routes } from '../../../app.routes';
import { SESSION_STORAGE_KEY } from './session.service';

/**
 * Strict-mode RED for S5 (tasks 6.2/6.3): `auth.guard.ts` does not exist and the
 * platform children are not guarded yet, so the redirect scenario and the route
 * table scenario both fail.
 *
 * The spec asserts BOTH the behavior (anonymous protected navigation redirects,
 * auth entry points stay open, marketing stays reachable) and the route table
 * (only the protected platform children carry `canActivate`).
 */

const COMPANY_SESSION = JSON.stringify({
  token: 'mock-token-company-1',
  user: { userId: 'company-1', email: 'norte@demo.test', role: 'company' }
});

describe('authGuard', () => {
  let harness: RouterTestingHarness;

  const build = async (): Promise<void> => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  };

  const url = (): string => TestBed.inject(Router).url;

  beforeEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('redirects an anonymous visitor from a protected platform route to login', async () => {
    await build();

    await harness.navigateByUrl('/plataforma/perfil');
    harness.detectChanges();

    expect(url()).toBe('/plataforma/login');
    expect(
      (harness.fixture.nativeElement as HTMLElement).querySelector('app-platform-login')
    ).toBeTruthy();
  });

  it('lets an authenticated session reach a protected platform route', async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, COMPANY_SESSION);
    await build();

    await harness.navigateByUrl('/plataforma/perfil');
    harness.detectChanges();

    expect(url()).toBe('/plataforma/perfil');
    expect(
      (harness.fixture.nativeElement as HTMLElement).querySelector('app-platform-perfil')
    ).toBeTruthy();
  });

  it('keeps the auth entry points open to anonymous visitors', async () => {
    await build();

    await harness.navigateByUrl('/plataforma/login');
    harness.detectChanges();
    expect(url()).toBe('/plataforma/login');

    await harness.navigateByUrl('/plataforma/registro');
    harness.detectChanges();
    expect(url()).toBe('/plataforma/registro');
  });

  it('leaves marketing routes unguarded and reachable', async () => {
    await build();

    await harness.navigateByUrl('/servicios');
    harness.detectChanges();

    expect(url()).toBe('/servicios');
    expect(
      (harness.fixture.nativeElement as HTMLElement).querySelector('app-services-list')
    ).toBeTruthy();
  });

  it('guards every platform child except login and registro', () => {
    const platform = routes.find((route) => route.path === 'plataforma');
    const children = platform?.children ?? [];

    const guarded = children.filter((child) => child.canActivate).map((child) => child.path);
    expect(guarded).toEqual(['', 'trabajos', 'trabajos/:id', 'perfil']);

    for (const open of children.filter((child) => child.path === 'login' || child.path === 'registro')) {
      expect(open.canActivate, `${open.path} must stay open`).toBeUndefined();
    }

    for (const route of routes.filter((candidate) => candidate.path !== 'plataforma')) {
      expect(route.canActivate, `${route.path} must be unguarded`).toBeUndefined();
      expect(route.canActivateChild, `${route.path} must be unguarded`).toBeUndefined();
      expect(route.resolve, `${route.path} must not resolve`).toBeUndefined();
    }
  });
});
