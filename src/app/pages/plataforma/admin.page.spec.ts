import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ADMIN_GATEWAY } from '../../core/platform/api/ports';
import type { DirectoryUser } from '../../core/platform/domain';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import { DEMO_ACCOUNTS } from '../../core/platform/mocks/fixtures';
import {
  ADMIN_CONFIG_STORAGE_KEY,
  AdminConfigStore
} from '../../core/platform/store/admin-config.store';
import { AdminPage } from './admin.page';

/**
 * Strict-mode RED for WU3: `admin.page.ts` does not exist yet, so every scenario
 * below fails to resolve the module. The spec pins the platform-admin directory
 * scenarios (one row per demo account, password never rendered, role filter with
 * D7 filtered counts, empty state) and the two demo-labelled config toggles.
 */

/** The seeded directory rows as the gateway (which strips `password`) returns them. */
const directory = DEMO_ACCOUNTS.map(({ userId, email, role }) => ({ userId, email, role }));

/** Seeds a local mock session, as `SessionService` would after login. */
const seedSession = (): void =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'mock-token-admin-1',
      user: { userId: 'admin-1', email: 'admin@demo.test', role: 'admin' }
    })
  );

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;

  /** Creates the page and flushes the zoneless load pass (constructor fires `load()`). */
  const createLoaded = async (): Promise<HTMLElement> => {
    fixture = TestBed.createComponent(AdminPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  /** Drives the role filter exactly like a user: set the value, fire `change`. */
  const applyFilter = (element: HTMLElement, value: string): void => {
    const select = element.querySelector('[data-testid="admin-role-filter"]') as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  /** Toggles a config checkbox exactly like a user: flip it, fire `change`. */
  const toggle = (element: HTMLElement, testid: string): void => {
    const input = element.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement;
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.removeItem(ADMIN_CONFIG_STORAGE_KEY);
    seedSession();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    localStorage.removeItem(ADMIN_CONFIG_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  });

  it('renders exactly one heading and one directory row per demo account', async () => {
    const element = await createLoaded();

    const headings = element.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Admin');

    const rows = element.querySelectorAll('[data-testid="admin-user-row"]');
    expect(rows).toHaveLength(6);
    for (const user of directory) {
      const row = Array.from(rows).find((candidate) => candidate.textContent?.includes(user.email));
      expect(row, `row for ${user.email} must exist`).toBeTruthy();
      expect(row?.textContent).toContain(user.userId);
      expect(row?.textContent).toContain(user.role);
    }

    // Accessible table: a caption names it and every header is a scoped column head.
    expect(element.querySelector('table caption')).not.toBeNull();
    const headers = element.querySelectorAll('th[scope="col"]');
    expect(headers).toHaveLength(3);
    expect(Array.from(headers).map((th) => th.textContent?.trim())).toEqual([
      'Usuario',
      'Email',
      'Rol'
    ]);
  });

  it('never renders a password value', async () => {
    const element = await createLoaded();

    // Every seeded account shares the demo password; `DirectoryUser` has no
    // credential field, so the rendered directory cannot contain it.
    expect(element.textContent).not.toContain('demo1234');
  });

  it('narrows the rows with the labelled role filter and reports filtered counts (D7)', async () => {
    const element = await createLoaded();

    const label = element.querySelector('label[for="admin-role-filter"]');
    expect(label?.textContent?.trim()).toBe('Filtrar por rol');

    applyFilter(element, 'company');

    const rows = element.querySelectorAll('[data-testid="admin-user-row"]');
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.textContent).toContain('company');
    }
    expect(rows[0].textContent).toContain(directory.find((user) => user.role === 'company')!.email);

    // D7: counts follow the filtered list, so unselected roles report 0.
    const counts = element.querySelector('[data-testid="admin-counts"]')?.textContent ?? '';
    expect(counts).toContain('Trabajadores: 0');
    expect(counts).toContain('Empresas: 2');
    expect(counts).toContain('Admins: 0');
    expect(counts).toContain('Total: 2');
  });

  it('filters down to the single admin account with a total of one', async () => {
    const element = await createLoaded();

    applyFilter(element, 'admin');

    const rows = element.querySelectorAll('[data-testid="admin-user-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('admin-1');
    expect(rows[0].textContent).toContain('admin@demo.test');

    const counts = element.querySelector('[data-testid="admin-counts"]')?.textContent ?? '';
    expect(counts).toContain('Admins: 1');
    expect(counts).toContain('Total: 1');
  });

  it('shows the empty state when the filter matches no account', async () => {
    TestBed.overrideProvider(ADMIN_GATEWAY, {
      useValue: {
        listUsers: async (): Promise<DirectoryUser[]> =>
          directory.filter((user) => user.role === 'worker')
      }
    });

    const element = await createLoaded();
    applyFilter(element, 'company');

    expect(element.querySelectorAll('[data-testid="admin-user-row"]')).toHaveLength(0);
    expect(element.querySelector('[data-testid="admin-empty"]')?.textContent).toContain(
      'Ninguna cuenta coincide'
    );

    // The counts track the empty filtered list too (D7): everything is 0.
    const counts = element.querySelector('[data-testid="admin-counts"]')?.textContent ?? '';
    expect(counts).toContain('Total: 0');
  });

  it('renders the two demo-labelled toggles and persists a change to localStorage', async () => {
    const element = await createLoaded();
    const config = TestBed.inject(AdminConfigStore);

    const labels = Array.from(element.querySelectorAll('label[for^="admin-toggle-"]')).map(
      (label) => label.textContent ?? ''
    );
    expect(labels).toHaveLength(2);
    for (const text of labels) {
      expect(text.toLowerCase()).toContain('demo');
    }

    expect(config.showDemoNotice()).toBe(false);
    toggle(element, 'admin-toggle-demo-notice');

    expect(config.showDemoNotice()).toBe(true);
    expect(JSON.parse(localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY) ?? '{}')).toEqual({
      showDemoNotice: true,
      allowCompanyRegistration: false
    });
  });

  it('re-hydrates both toggles from localStorage on creation, like a reload', async () => {
    localStorage.setItem(
      ADMIN_CONFIG_STORAGE_KEY,
      JSON.stringify({ showDemoNotice: true, allowCompanyRegistration: true })
    );

    const element = await createLoaded();

    const demoNotice = element.querySelector(
      '[data-testid="admin-toggle-demo-notice"]'
    ) as HTMLInputElement;
    const companyRegistration = element.querySelector(
      '[data-testid="admin-toggle-company-registration"]'
    ) as HTMLInputElement;

    expect(demoNotice.checked).toBe(true);
    expect(companyRegistration.checked).toBe(true);
    expect(TestBed.inject(AdminConfigStore).allowCompanyRegistration()).toBe(true);
  });
});
