import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '../../app.routes';
import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
import { PlatformRegistroPage } from './registro.page';

/**
 * Strict-mode RED for WU1. Registration is a described single-choice control: a native
 * radio group inside a `<fieldset data-testid="registro-role">`, offering ONLY the two
 * self-service roles — `admin` exists in the contract enum but MUST NOT be offered.
 */

const fill = (element: HTMLElement, selector: string, value: string): void => {
  const input = element.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

/** The picker GROUP: the element carrying the role testid. */
const roleGroup = (element: HTMLElement): HTMLElement =>
  element.querySelector('[data-testid="registro-role"]') as HTMLElement;

/** Every role radio, read from inside the group (never the group itself). */
const roleInputs = (element: HTMLElement): HTMLInputElement[] =>
  Array.from(
    element.querySelectorAll<HTMLInputElement>('[data-testid="registro-role"] input[type="radio"]')
  );

const optionValues = (element: HTMLElement): string[] =>
  roleInputs(element).map((input) => input.value);

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

  it('carries the role testid on the fieldset group that owns every radio', () => {
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const group = roleGroup(element);

    expect(group.tagName.toLowerCase()).toBe('fieldset');
    expect(group.querySelector('legend')?.textContent?.trim()).toBe('Me registro como');

    const inputs = roleInputs(element);
    expect(inputs.length).toBe(2);
    for (const input of inputs) {
      expect(group.contains(input), 'every radio must live inside the group').toBe(true);
    }
  });

  it('defaults to a valid self-service role with exactly one radio selected', () => {
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const checked = roleInputs(element).filter((input) => input.checked);
    expect(checked).toHaveLength(1);
    expect(checked[0].value).toBe('worker');
  });

  it('shows a title and an es-AR description for every offered role', () => {
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const titled = [
      { value: 'worker', title: 'Trabajador/a' },
      { value: 'company', title: 'Empresa' }
    ] as const;

    const inputs = roleInputs(element);
    expect(inputs).toHaveLength(titled.length);

    for (const input of inputs) {
      const match = titled.find((entry) => entry.value === input.value);
      expect(match, `unexpected offered role "${input.value}"`).toBeDefined();

      const label = input.closest('label');
      expect(label, `role "${input.value}" must be labelled`).not.toBeNull();

      const text = (label?.textContent ?? '').replace(/\s+/g, ' ').trim();
      expect(text, `role "${input.value}" title`).toContain(match!.title);
      // The description is copy beyond the title; a title-only label fails this.
      expect(text.length, `role "${input.value}" description`).toBeGreaterThan(
        match!.title.length + 15
      );
    }
  });

  it('registers the chosen role and enters the platform', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlatformRegistroPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    fill(element, '[data-testid="registro-email"]', 'nueva@demo.test');
    fill(element, '[data-testid="registro-password"]', 'demo1234');

    const company = roleInputs(element).find((input) => input.value === 'company');
    expect(company, 'company must be an offered role').toBeDefined();
    company!.click();
    fixture.detectChanges();

    (element.querySelector('[data-testid="registro-submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(SessionService).role()).toBe('company');
    expect(navigate).toHaveBeenCalledWith('/plataforma/inicio');
  });
});
