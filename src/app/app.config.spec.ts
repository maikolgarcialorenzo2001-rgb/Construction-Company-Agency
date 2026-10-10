import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { appConfig } from './app.config';
import { routes } from './app.routes';
import type { GtagWindow } from './core/analytics/analytics.service';
import { ConsentService } from './core/consent/consent.service';
import { environment } from './environments/environment';
import { ENVIRONMENT } from './environments/environment.token';

/** A measurement id in the real GA4 format, so the analytics gate can open. */
const REAL_ID = 'G-7K3M9P2Q1R';

const win = (): GtagWindow => globalThis as unknown as GtagWindow;

/** The route-declared title, read from the same table the router uses. */
const routeTitle = (path: string): string => {
  const route = routes.find((candidate) => candidate.path === path);
  const title = (route?.data?.['seo'] as { title?: string } | undefined)?.title;
  expect(title, `route "${path}" must declare a title`).toBeTruthy();
  return title as string;
};

/** The `('event', name, params)` frames GA4 would receive, read from the data layer. */
const sentEvents = (): { name: string; params: Record<string, unknown> }[] =>
  (win().dataLayer ?? [])
    .map((frame) => frame as unknown as IArguments)
    .filter((frame) => frame[0] === 'event')
    .map((frame) => ({
      name: frame[1] as string,
      params: frame[2] as Record<string, unknown>
    }));

/**
 * Navigates the platform harness and waits for the lazy chunk to paint. The
 * testing backend never auto-responds, so any HTTP issued during activation
 * stays pending and fails `verify()`.
 */
const bootstrapPlatform = async (harness: RouterTestingHarness, url: string): Promise<void> => {
  await harness.navigateByUrl(url);
  await TestBed.inject(ApplicationRef).whenStable();
};

describe('appConfig', () => {
  afterEach(() => {
    delete win().gtag;
    delete win().dataLayer;
    globalThis.document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((script) => script.remove());
  });

  it('registers both the SEO and the analytics initializers', async () => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        {
          provide: ENVIRONMENT,
          useValue: { ...environment, gaMeasurementId: REAL_ID }
        }
      ]
    });

    // Creating the harness instantiates the TestBed, which is what runs both app
    // initializers: SEO subscribes to the router, analytics queues the tag because
    // consent is still denied.
    const harness = await RouterTestingHarness.create();

    // The grant is the only lock left, so the queued tag installs now.
    TestBed.inject(ConsentService).grant();

    const doc = TestBed.inject(DOCUMENT);

    // Analytics initializer ran: a real id plus a grant means the tag is installed.
    expect(doc.querySelector('script[src*="googletagmanager"]')).not.toBeNull();
    expect(typeof win().gtag).toBe('function');

    // SEO initializer ran: it was subscribed before this navigation fired.
    await harness.navigateByUrl('/proceso');

    expect(doc.title).toBe(routeTitle('proceso'));
    expect(sentEvents().some((event) => event.params['page_path'] === '/proceso')).toBe(true);
  });

  it('bootstraps the platform subtree with zero HTTP', async () => {
    TestBed.configureTestingModule({
      // The testing backend must be provided AFTER `provideHttpClient()` (already in
      // `appConfig.providers`) so it becomes the active backend.
      providers: [...appConfig.providers, provideHttpClientTesting()]
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();

    // Both unguarded platform routes activate their lazy chunk and inject the
    // in-memory gateways — neither may touch the network.
    await bootstrapPlatform(harness, '/plataforma/login');
    await bootstrapPlatform(harness, '/plataforma/registro');

    httpMock.verify();
  });
});