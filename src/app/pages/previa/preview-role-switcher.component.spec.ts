import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
import { DEMO_ACCOUNTS } from '../../core/platform/mocks/fixtures';
import { PREVIEW_ROLES } from '../../core/platform/preview/preview-fixtures';
import { PreviewRoleSwitcherComponent } from './preview-role-switcher.component';

/**
 * Strict-mode RED for p13 WU2: the switcher component does not exist yet, so every
 * scenario below fails to resolve it. The spec pins the "Client-only role switcher"
 * requirement: one labelled demo-login control per seeded account (never a password),
 * plain anchors to the prerendered `/previa/:role` pages, no write while rendering,
 * and an entry that logs the demo account in (no registration) then enters `/plataforma/inicio`.
 */
describe('PreviewRoleSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  /** Creates the switcher and flushes one synchronous render pass. */
  const render = () => {
    const fixture = TestBed.createComponent(PreviewRoleSwitcherComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  /** The "enter platform" control whose accessible name carries the account email. */
  const enterControlFor = (element: HTMLElement, email: string): HTMLButtonElement | undefined =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('[data-testid="preview-enter"]')).find(
      (control) => (control.getAttribute('aria-label') ?? '').includes(email)
    );

  it('renders one labelled control per seeded account and never a password', () => {
    const { element } = render();

    const controls = element.querySelectorAll('[data-testid="preview-enter"]');
    expect(DEMO_ACCOUNTS.length).toBe(6);
    expect(controls).toHaveLength(DEMO_ACCOUNTS.length);

    for (const account of DEMO_ACCOUNTS) {
      expect(enterControlFor(element, account.email), `${account.email} control`).toBeDefined();
    }

    // The seeded credential must never reach the markup.
    expect(element.outerHTML).not.toContain('demo1234');
  });

  it('exposes a plain anchor to every prerendered role page, in preview order', () => {
    const { element } = render();

    const hrefs = Array.from(
      element.querySelectorAll('[data-testid="preview-role-link"]')
    ).map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual(PREVIEW_ROLES.map((role) => `/previa/${role}`));
  });

  it('performs no write while rendering: no login and no stored session', () => {
    const session = TestBed.inject(SessionService);
    const login = vi.spyOn(session, 'login');

    render();

    expect(login).not.toHaveBeenCalled();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('logs each of the 6 demo accounts in and enters the platform, without registering', async () => {
    const session = TestBed.inject(SessionService);
    const register = vi.spyOn(session, 'register');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    expect(DEMO_ACCOUNTS.length).toBe(6);

    for (const account of DEMO_ACCOUNTS) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      const login = vi.spyOn(session, 'login');
      const { fixture, element } = render();

      enterControlFor(element, account.email)?.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(login, `${account.email} login`).toHaveBeenCalledWith(account.email, 'demo1234');
      expect(session.currentUser()?.userId, `${account.email} userId`).toBe(account.userId);
      expect(session.currentUser()?.role, `${account.email} role`).toBe(account.role);
      expect(navigate, `${account.email} navigation`).toHaveBeenCalledWith('/plataforma/inicio');

      login.mockRestore();
      navigate.mockClear();
    }

    expect(register).not.toHaveBeenCalled();
  });
});
