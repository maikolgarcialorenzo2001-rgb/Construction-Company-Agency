import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SESSION_STORAGE_KEY, SessionService, type StoredSession } from './session.service';

/**
 * Strict-mode RED for S5 (task 6.1): `session.service.ts` does not exist yet, so
 * this file fails to build. The mock session is localStorage-backed, exposes the
 * user as a signal with a `computed` role, clears on logout, survives a reload
 * and never issues HTTP.
 */

const COMPANY = { userId: 'company-1', email: 'norte@demo.test', role: 'company' as const };

const seed = (session: StoredSession): void =>
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

const stored = (): StoredSession | null =>
  JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null') as StoredSession | null;

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  });

  it('logs in, persists the mock session and exposes the user', async () => {
    const session = TestBed.inject(SessionService);
    expect(session.currentUser()).toBeNull();

    const user = await session.login('norte@demo.test', 'demo1234');

    expect(user.role).toBe('company');
    expect(session.currentUser()).toEqual(COMPANY);
    expect(stored()?.user.email).toBe('norte@demo.test');
    expect(stored()?.user.role).toBe('company');
  });

  it('computes the role from the session', async () => {
    const session = TestBed.inject(SessionService);
    await session.login('lucia@demo.test', 'demo1234');

    expect(session.role()).toBe('worker');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('survives a reload by reading the persisted session', () => {
    seed({ token: 'mock-token-company-1', user: COMPANY });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    const session = TestBed.inject(SessionService);

    expect(session.currentUser()).toEqual(COMPANY);
    expect(session.role()).toBe('company');
  });

  it('clears the session and the stored payload on logout', async () => {
    const session = TestBed.inject(SessionService);
    await session.login('norte@demo.test', 'demo1234');

    await session.logout();

    expect(session.currentUser()).toBeNull();
    expect(session.role()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('registers a self-service account and persists the new session', async () => {
    const session = TestBed.inject(SessionService);

    const user = await session.register({
      email: 'nueva@demo.test',
      password: 'demo1234',
      role: 'worker'
    });

    expect(user.email).toBe('nueva@demo.test');
    expect(user.role).toBe('worker');
    expect(session.role()).toBe('worker');
    expect(stored()?.user.email).toBe('nueva@demo.test');
  });

  it('issues no HTTP request for any auth action', async () => {
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(SessionService);

    await session.login('norte@demo.test', 'demo1234');
    await session.logout();

    http.verify();
  });
});
