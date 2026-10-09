import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '../../app.routes';
import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
import { PlatformRegistroPage } from './registro.page';

/**
 * Strict-mode RED for S5 (task 6.4). The registration UI is restricted to the
 * two self-service roles — `admin` exists in the contract enum but MUST NOT be
 * offered here, so that is the critical assertion.
 */

const fill = (element: HTMLElement, selector: string, value: string): void => {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

const optionValues = (element: HTMLElement): string[] =>
  Array.from(element.querySelectorAll('[data-testid="registro-role"] option')).map(
    (option) => (option as HTMLOptionElement).value
  );

describe('PlatformRegistroPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders one heading and a visible demo notice', () => {
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(
      element.querySelector('[data-testid="demo-notice"]')?.textContent?.toLowerCase()
    ).toContain('demo');
  });

  it('offers only the self-service roles, never admin', () => {
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();

    const options = optionValues(fixture.nativeElement as HTMLElement);
    expect(options).toEqual(['worker', 'company']);
    expect(options).not.toContain('admin');
  });

  it('registers a self-service account and enters the platform', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    fill(element, '[data-testid="registro-email"]', 'nueva@demo.test');
    fill(element, '[data-testid="registro-password"]', 'demo1234');
    const role = element.querySelector('[data-testid="registro-role"]') as HTMLSelectElement;
    role.value = 'company';
    role.dispatchEvent(new Event('change'));

    (element.querySelector('[data-testid="registro-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(SessionService).role()).toBe('company');
    expect(navigate).toHaveBeenCalledWith('/plataforma');
  });
});
