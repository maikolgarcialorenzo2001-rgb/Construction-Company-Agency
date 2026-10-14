import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '../../app.routes';
import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
import { PlatformLoginPage } from './login.page';

/**
 * Strict-mode RED for S5 (task 6.4): the login stub has no form, so the demo
 * notice, the credential submit and the error branch all fail. The mock session
 * must be visible as demo and must never issue HTTP.
 */

const fill = (element: HTMLElement, selector: string, value: string): void => {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('PlatformLoginPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders one heading and a visible demo notice', () => {
    const fixture = TestBed.createComponent(PlatformLoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(
      element.querySelector('[data-testid="demo-notice"]')?.textContent?.toLowerCase()
    ).toContain('demo');
  });

  it('lists the admin demo credential alongside the existing demo accounts', () => {
    const fixture = TestBed.createComponent(PlatformLoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const copy = element.querySelector('[data-testid="demo-credentials"]')?.textContent ?? '';
    expect(copy).toContain('admin@demo.test');
    expect(copy).toContain('lucia@demo.test');
    expect(copy).toContain('demo1234');
  });

  it('logs in with demo credentials, persists the session and enters the platform', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlatformLoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    fill(element, '[data-testid="login-email"]', 'norte@demo.test');
    fill(element, '[data-testid="login-password"]', 'demo1234');
    (element.querySelector('[data-testid="login-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(SessionService).role()).toBe('company');
    expect(navigate).toHaveBeenCalledWith('/plataforma/inicio');
  });

  it('shows the gateway error when credentials are invalid', async () => {
    const fixture = TestBed.createComponent(PlatformLoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    fill(element, '[data-testid="login-email"]', 'norte@demo.test');
    fill(element, '[data-testid="login-password"]', 'incorrecta');
    (element.querySelector('[data-testid="login-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      element.querySelector('[data-testid="login-error"]')?.textContent
    ).toContain('Credenciales inválidas');
    expect(TestBed.inject(SessionService).currentUser()).toBeNull();
  });
});
