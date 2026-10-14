import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter
} from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SESSION_STORAGE_KEY } from './session.service';
import { roleGuard } from './role.guard';

/**
 * Strict-mode RED for WU1: `role.guard.ts` does not exist yet, so every
 * scenario below fails to resolve the module. The spec pins the four gating
 * outcomes from `specs/platform-admin` (admin reaches, non-admin home,
 * anonymous login) plus the defensive missing/empty `data.roles` paths.
 */

const sessionFor = (userId: string, email: string, role: string): string =>
  JSON.stringify({ token: `mock-token-${userId}`, user: { userId, email, role } });

const ADMIN_SESSION = sessionFor('admin-1', 'admin@demo.test', 'admin');
const WORKER_SESSION = sessionFor('worker-1', 'lucia@demo.test', 'worker');
const COMPANY_SESSION = sessionFor('company-1', 'norte@demo.test', 'company');

const routeWith = (data: Record<string, unknown>): ActivatedRouteSnapshot =>
  ({ data }) as unknown as ActivatedRouteSnapshot;

describe('roleGuard', () => {
  const state = {} as RouterStateSnapshot;

  const run = (route: ActivatedRouteSnapshot): unknown => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.runInInjectionContext(() => roleGuard(route, state));
  };

  /** `true` means "granted"; anything else is serialized to its target URL. */
  const outcome = (result: unknown): string => {
    if (result === true) {
      return '<granted>';
    }
    return TestBed.inject(Router).serializeUrl(result as never);
  };

  beforeEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('grants an admin session an admin-only route', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, ADMIN_SESSION);

    expect(outcome(run(routeWith({ roles: ['admin'] })))).toBe('<granted>');
  });

  it('redirects an authenticated worker to the platform home', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, WORKER_SESSION);

    expect(outcome(run(routeWith({ roles: ['admin'] })))).toBe('/plataforma/inicio');
  });

  it('redirects an authenticated company session to the platform home', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, COMPANY_SESSION);

    expect(outcome(run(routeWith({ roles: ['admin'] })))).toBe('/plataforma/inicio');
  });

  it('redirects an anonymous visitor to login', () => {
    expect(outcome(run(routeWith({ roles: ['admin'] })))).toBe('/plataforma/login');
  });

  it('is defensive when the allowed roles list is missing', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, ADMIN_SESSION);

    expect(outcome(run(routeWith({})))).toBe('/plataforma/inicio');
  });

  it('is defensive when the allowed roles list is empty', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, ADMIN_SESSION);

    expect(outcome(run(routeWith({ roles: [] })))).toBe('/plataforma/inicio');
  });

  it('redirects an anonymous visitor home-ward defensively to login when roles are missing', () => {
    expect(outcome(run(routeWith({})))).toBe('/plataforma/login');
  });
});
