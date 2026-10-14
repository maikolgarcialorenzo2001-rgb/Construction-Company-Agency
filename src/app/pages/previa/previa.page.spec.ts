import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  APPLICATIONS,
  COMPANY_PROFILES,
  DEMO_ACCOUNTS,
  FEED_POSTS,
  JOBS,
  WORKER_PROFILES
} from '../../core/platform/mocks/fixtures';
import { PreviaPage } from './previa.page';

/**
 * Strict-mode RED for p13 WU1: `previa.page.ts` does not exist yet, so every scenario
 * below fails to resolve the component. The spec pins the public `/previa` showcase
 * (platform-preview Req "Synchronous fixture snapshot" / "Role variant content"):
 * ONE h1, the default section rendered SYNCHRONOUSLY (one `detectChanges`, no
 * `whenStable` — the R1 de-risk), per-role sections from the `role` input, an admin
 * directory that never leaks `demo1234`, a deterministic unknown-role fallback and
 * hydration-stable identical renders.
 */
describe('PreviaPage', () => {
  let fixture: ComponentFixture<PreviaPage>;

  /** Creates the page and flushes ONE render pass — no `whenStable`, no `await`. */
  const renderSync = (): HTMLElement => {
    fixture = TestBed.createComponent(PreviaPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  /** Creates the page with a `role` input, exactly as `withComponentInputBinding` would bind it. */
  const renderAs = (role: string): HTMLElement => {
    const page = TestBed.createComponent(PreviaPage);
    page.componentRef.setInput('role', role);
    page.detectChanges();
    return page.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('renders exactly one h1', () => {
    const element = renderSync();

    const headings = element.querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe('Modo previa');
  });

  it('renders the default showcase synchronously: feed, open jobs and both profiles in the first render pass', () => {
    // The R1 de-risk: ONE detectChanges, never `whenStable`. A store/await-based page
    // would still be an empty shell here — the prerender would ship a blank `/previa`.
    const element = renderSync();

    const feed = element.querySelectorAll('[data-testid="previa-feed-post"]');
    expect(feed).toHaveLength(FEED_POSTS.length);
    expect(feed.length).toBeGreaterThan(0);

    const openJobs = JOBS.filter((job) => job.status === 'open');
    const jobs = element.querySelectorAll('[data-testid="previa-job"]');
    expect(jobs).toHaveLength(openJobs.length);
    expect(jobs[0].textContent).toContain(openJobs[0].title);

    expect(element.querySelector('[data-testid="previa-worker"]')?.textContent).toContain(
      WORKER_PROFILES[0].fullName
    );
    expect(element.querySelector('[data-testid="previa-company"]')?.textContent).toContain(
      COMPANY_PROFILES[0].name
    );
  });

  it.each([
    ['worker', '[data-testid="previa-applications"]'],
    ['company', '[data-testid="previa-vacancies"]'],
    ['admin', '[data-testid="previa-directory"]']
  ])('renders the %s role section for the role input, not the default one', (role, section) => {
    const element = renderAs(role);

    expect(element.querySelector(section), `${role} role section`).not.toBeNull();
    expect(
      element.querySelector('[data-testid="previa-feed-post"]'),
      `${role} must hide the default feed`
    ).toBeNull();
  });

  it('renders the worker applications joined to their job titles', () => {
    const element = renderAs('worker');

    const rows = element.querySelectorAll('[data-testid="previa-application"]');
    expect(rows).toHaveLength(APPLICATIONS.length);

    const firstJob = JOBS.find((job) => job.id === APPLICATIONS[0].jobId);
    expect(rows[0].textContent).toContain(firstJob?.title);
  });

  it('renders the admin directory as one password-free row per demo account', () => {
    const element = renderAs('admin');

    const rows = element.querySelectorAll('[data-testid="previa-directory-row"]');
    expect(rows).toHaveLength(DEMO_ACCOUNTS.length);
    expect(rows[0].textContent).toContain(DEMO_ACCOUNTS[0].email);
    // The seeded password must never reach the markup, on any row.
    expect(element.outerHTML).not.toContain('demo1234');
  });

  it('falls back to the default view for an unknown role without throwing', () => {
    let element!: HTMLElement;

    expect(() => {
      element = renderAs('inventado');
    }).not.toThrow();

    expect(element.querySelector('[data-testid="previa-feed-post"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="previa-applications"]')).toBeNull();
  });

  it('is hydration-stable: two renders of the same input produce identical markup', () => {
    const first = renderSync();
    const second = renderSync();

    // Compare the rendered content, not the host wrapper: TestBed gives each host a
    // generated `id="rootN"` (harness bookkeeping, not page output).
    expect(first.innerHTML).toBe(second.innerHTML);
  });
});
