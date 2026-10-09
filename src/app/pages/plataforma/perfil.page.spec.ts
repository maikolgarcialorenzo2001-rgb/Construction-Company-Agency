import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PROFILES_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import { PlatformPerfilPage } from './perfil.page';

/**
 * Strict-mode RED for S5 (task 6.4): the profile stub renders a placeholder, so
 * both round-trip scenarios fail. Profiles are read and written through
 * `ProfilesGateway`, which persists the change in the mock adapter.
 */

const seed = (user: { userId: string; email: string; role: 'worker' | 'company' }): void =>
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'mock-token', user }));

const fill = (element: HTMLElement, selector: string, value: string): void => {
  const input = element.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('PlatformPerfilPage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders one heading and a visible demo notice', async () => {
    seed({ userId: 'worker-1', email: 'lucia@demo.test', role: 'worker' });
    const fixture = TestBed.createComponent(PlatformPerfilPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(
      element.querySelector('[data-testid="demo-notice"]')?.textContent?.toLowerCase()
    ).toContain('demo');
  });

  it('round-trips the worker profile through ProfilesGateway', async () => {
    seed({ userId: 'worker-1', email: 'lucia@demo.test', role: 'worker' });
    const fixture = TestBed.createComponent(PlatformPerfilPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Lucía Fernández');
    expect(element.textContent).toContain('Electricidad');

    fill(element, '[data-testid="worker-fullName"]', 'Lucía Fernández Gómez');
    fill(element, '[data-testid="worker-skills"]', 'Electricidad, Sanitarias, Climatización');
    (element.querySelector('[data-testid="worker-save"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Lucía Fernández Gómez');
    const persisted = await TestBed.inject(PROFILES_GATEWAY).worker('worker-1');
    expect(persisted?.fullName).toBe('Lucía Fernández Gómez');
    expect(persisted?.skills).toEqual(['Electricidad', 'Sanitarias', 'Climatización']);
  });

  it('round-trips the company profile through ProfilesGateway', async () => {
    seed({ userId: 'company-1', email: 'norte@demo.test', role: 'company' });
    const fixture = TestBed.createComponent(PlatformPerfilPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Constructora Norte SAC');

    fill(element, '[data-testid="company-name"]', 'Constructora Norte SRL');
    (element.querySelector('[data-testid="company-save"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Constructora Norte SRL');
    const persisted = await TestBed.inject(PROFILES_GATEWAY).company('company-1');
    expect(persisted?.name).toBe('Constructora Norte SRL');
  });
});
