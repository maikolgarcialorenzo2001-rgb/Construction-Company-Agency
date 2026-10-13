import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APPLICATIONS_GATEWAY, JOBS_GATEWAY } from '../../core/platform/api/ports';
import { SESSION_STORAGE_KEY } from '../../core/platform/auth/session.service';
import type { Application, JobOpening, Page, Role } from '../../core/platform/domain';
import { APPLICATIONS, JOBS } from '../../core/platform/mocks/fixtures';
import { PlatformHomePage } from './platform-home.page';

/** Seeds a local mock session, as `SessionService` would after login. */
const seedSession = (role: Role, userId: string): void =>
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'mock-token', user: { userId, email: `${role}@demo.test`, role } })
  );

const emptyJobs: Page<JobOpening> = { items: [], meta: { page: 1, pageSize: 20, total: 0 } };
const emptyApplications: Page<Application> = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0 }
};

/**
 * Zoneless home tests: the page fires its loads from an `effect` on creation, so
 * every scenario drives `detectChanges` + `whenStable` exactly like the store
 * harness. Only a `.set()` in a store can paint the view.
 */
describe('PlatformHomePage', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('renders exactly one Inicio heading for a worker', async () => {
    seedSession('worker', 'worker-1');
    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const headings = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Inicio');
  });

  it('lists only the worker own applications with their job title and status label', async () => {
    seedSession('worker', 'worker-1');
    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Mis postulaciones');

    const rows = element.querySelectorAll('[data-testid="home-application"]');
    const expected = APPLICATIONS.filter((application) => application.applicantId === 'worker-1');
    expect(expected).toHaveLength(1);
    expect(rows).toHaveLength(expected.length);

    // A worker row is a list item, not a bare div.
    expect(element.querySelector('ul')?.querySelector('[data-testid="home-application"]')).not.toBeNull();

    const jobOne = JOBS.find((job) => job.id === expected[0].jobId);
    expect(rows[0].textContent).toContain(jobOne?.title);
    expect(rows[0].textContent).toContain('Aceptada');

    // The role fork must not leak another role's section.
    expect(element.textContent).not.toContain('Mis vacantes');
    expect(element.querySelector('[data-testid="home-admin-placeholder"]')).toBeNull();
  });

  it('shows the worker empty state when the worker has no applications', async () => {
    TestBed.overrideProvider(APPLICATIONS_GATEWAY, {
      useValue: {
        list: async (): Promise<Page<Application>> => emptyApplications,
        create: async () => {
          throw new Error('not under test');
        }
      }
    });
    seedSession('worker', 'worker-1');

    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Todavía no te postulaste a ninguna vacante');
    expect(element.querySelectorAll('[data-testid="home-application"]')).toHaveLength(0);
  });

  it('lists only the company own vacancies and offers the publish affordance', async () => {
    seedSession('company', 'company-1');
    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Mis vacantes');

    const rows = element.querySelectorAll('[data-testid="home-vacancy"]');
    const expected = JOBS.filter((job) => job.companyId === 'company-1');
    expect(expected).toHaveLength(5);
    expect(rows).toHaveLength(expected.length);
    expect(rows[0].textContent).toContain(expected[0].title);

    // Another company's vacancy must never leak into this list.
    expect(element.textContent).not.toContain('Plomero con experiencia para edificio en La Plata');

    const publish = element.querySelector('[data-testid="home-publish"]');
    expect(publish).not.toBeNull();
    expect(publish?.textContent).toContain('Publicar novedad');

    expect(element.textContent).not.toContain('Mis postulaciones');
  });

  it('shows the company empty state while keeping the publish affordance', async () => {
    TestBed.overrideProvider(JOBS_GATEWAY, {
      useValue: {
        list: async (): Promise<Page<JobOpening>> => emptyJobs,
        byId: async () => null
      }
    });
    seedSession('company', 'company-1');

    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Todavía no publicaste ninguna vacante');
    expect(element.querySelectorAll('[data-testid="home-vacancy"]')).toHaveLength(0);
    expect(element.querySelector('[data-testid="home-publish"]')).not.toBeNull();
  });

  it('renders a minimal admin placeholder with no management controls', async () => {
    seedSession('admin', 'admin-1');
    const fixture = TestBed.createComponent(PlatformHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="home-admin-placeholder"]')).not.toBeNull();
    expect(element.querySelectorAll('[data-testid="home-application"]')).toHaveLength(0);
    expect(element.querySelectorAll('[data-testid="home-vacancy"]')).toHaveLength(0);
    expect(element.querySelector('[data-testid="home-publish"]')).toBeNull();

    const headings = element.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Inicio');
  });
});
