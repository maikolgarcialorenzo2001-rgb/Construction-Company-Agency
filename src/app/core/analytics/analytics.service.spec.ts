import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { MockInstance } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { routes } from '../../app.routes';
import { environment } from '../../environments/environment';
import type { Environment } from '../../environments/environment.model';
import { ENVIRONMENT } from '../../environments/environment.token';
import { ConsentService } from '../consent/consent.service';
import {
  AnalyticsService,
  isRealGa4Id,
  type AnalyticsEvent,
  type GtagWindow
} from './analytics.service';

/** A measurement id in the real GA4 format, standing in for the client's own. */
const REAL_ID = 'G-7K3M9P2Q1R';

/** The window contract the gtag snippet creates, read back from the shared jsdom window. */
const win = (): GtagWindow => globalThis as unknown as GtagWindow;

interface Network {
  readonly fetchSpy: ReturnType<typeof vi.fn>;
  readonly xhrSpy: ReturnType<typeof vi.fn>;
  readonly createElement: MockInstance;
  readonly appendChild: MockInstance;
}

/** One `('event', name, params)` frame, exactly as GA4 would read it from the data layer. */
interface SentEvent {
  readonly name: string;
  readonly params: Record<string, unknown>;
}

describe('AnalyticsService', () => {
  let consent: ConsentService;
  let doc: Document;

  afterEach(() => {
    delete win().gtag;
    delete win().dataLayer;
    // The head is shared across the whole file: a script injected by one test must not
    // read as a leak in the next.
    globalThis.document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((script) => script.remove());
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Boots the service with an explicit measurement id, consent still denied. */
  const setup = (gaMeasurementId: string): AnalyticsService => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: ENVIRONMENT,
          useValue: { ...environment, gaMeasurementId } satisfies Environment
        }
      ]
    });

    consent = TestBed.inject(ConsentService);
    doc = TestBed.inject(DOCUMENT);
    return TestBed.inject(AnalyticsService);
  };

  /** Probes every channel a request could leave through, before `init()` runs. */
  const spyOnNetwork = (): Network => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const xhrSpy = vi.fn();
    vi.stubGlobal('XMLHttpRequest', xhrSpy);

    return {
      fetchSpy,
      xhrSpy,
      createElement: vi.spyOn(doc, 'createElement'),
      appendChild: vi.spyOn(doc.head, 'appendChild')
    };
  };

  const isGtagScript = (node: Node | undefined): node is HTMLScriptElement =>
    !!node && (node as Element).tagName === 'SCRIPT' && (node as HTMLScriptElement).src.includes(
      'googletagmanager'
    );

  /** The gtag loader scripts sitting in the live head. */
  const headScripts = (): HTMLScriptElement[] =>
    Array.from(doc.querySelectorAll<HTMLScriptElement>('script')).filter(isGtagScript);

  /**
   * Every trace the loader could have left behind: the live head plus both DOM spies.
   * A blocked init must leave none of the three.
   */
  const injectedScripts = (net: Network): HTMLScriptElement[] => [
    ...headScripts(),
    ...net.createElement.mock.results
      .map((result) => result.value as Node)
      .filter(isGtagScript),
    ...net.appendChild.mock.calls.map((call) => call[0] as Node).filter(isGtagScript)
  ];

  /** The events GA4 would actually receive, read straight from the data layer. */
  const sentEvents = (): SentEvent[] => {
    const layer = win().dataLayer ?? [];
    return layer
      .map((frame) => frame as unknown as IArguments)
      .filter((frame) => frame[0] === 'event')
      .map((frame) => ({
        name: frame[1] as string,
        params: frame[2] as Record<string, unknown>
      }));
  };

  /** A real id plus a granted consent: the only state where anything may be sent. */
  const openAnalytics = (): AnalyticsService => {
    const service = setup(REAL_ID);
    spyOnNetwork();
    consent.grant();
    service.init();
    return service;
  };

  describe('isRealGa4Id', () => {
    it('accepts a measurement id in the real G-XXXXXXXXXX format', () => {
      expect(isRealGa4Id(REAL_ID)).toBe(true);
      expect(isRealGa4Id('G-1A2B3C4D5E')).toBe(true);
    });

    it('rejects every value a placeholder deployment ships', () => {
      for (const id of ['', 'G-PLACEHOLDER', 'G-XXXXXXXXXX', 'PLACEHOLDER', undefined, null]) {
        expect(isRealGa4Id(id), `${String(id)} must not unlock analytics`).toBe(false);
      }
    });

    it('rejects anything that is not a genuine measurement id', () => {
      const impostors = [
        'g-7k3m9p2q1r', // GA4 ids are uppercase
        'UA-12345678-1', // Universal Analytics, not GA4
        'G-7K3M9P2Q1', // nine characters
        'G-7K3M9P2Q1RR', // eleven characters
        'G 7K3M9P2Q1R', // wrong separator
        '7K3M9P2Q1R', // no prefix
        'G-PLACEHOLDE', // placeholder text wearing the GA4 shape
        'G-!!!!!!!!!!' // not alphanumeric
      ];

      for (const id of impostors) {
        expect(isRealGa4Id(id), `${id} must be rejected`).toBe(false);
      }
    });
  });

  describe('init gate', () => {
    it('stays silent without a measurement id: no script, no gtag, zero requests', () => {
      const service = setup('');
      const net = spyOnNetwork();

      service.init();
      service.track('page_view', { page_path: '/' });

      expect(injectedScripts(net)).toEqual([]);
      expect(headScripts()).toEqual([]);
      expect(win().gtag).toBeUndefined();
      expect(win().dataLayer).toBeUndefined();
      expect(net.fetchSpy).not.toHaveBeenCalled();
      expect(net.xhrSpy).not.toHaveBeenCalled();
    });

    it('stays silent with a placeholder id, even when consent is already granted', () => {
      const service = setup('G-PLACEHOLDER');
      const net = spyOnNetwork();
      consent.grant();

      service.init();
      service.track('call_click', { placement: 'header' });

      expect(injectedScripts(net)).toEqual([]);
      expect(win().gtag).toBeUndefined();
      expect(net.fetchSpy).not.toHaveBeenCalled();
      expect(net.xhrSpy).not.toHaveBeenCalled();
    });

    it('stays silent with a real id until consent arrives: pre-consent means nothing loads', () => {
      const service = setup(REAL_ID);
      const net = spyOnNetwork();

      service.init();
      service.track('page_view', { page_path: '/' });

      expect(injectedScripts(net)).toEqual([]);
      expect(win().gtag).toBeUndefined();
      expect(sentEvents()).toEqual([]);
      expect(net.fetchSpy).not.toHaveBeenCalled();
      expect(net.xhrSpy).not.toHaveBeenCalled();
    });

    it('injects gtag.js and defines window.gtag when consent was granted first', () => {
      const service = setup(REAL_ID);
      spyOnNetwork();
      consent.grant();

      service.init();

      expect(headScripts()).toHaveLength(1);
      expect(headScripts()[0].src).toContain(`googletagmanager.com/gtag/js?id=${REAL_ID}`);
      expect(headScripts()[0].async).toBe(true);
      expect(typeof win().gtag).toBe('function');
      expect(Array.isArray(win().dataLayer)).toBe(true);
    });

    it('flushes the queued load exactly once when the grant finally arrives', () => {
      const service = setup(REAL_ID);
      spyOnNetwork();
      service.init();

      expect(headScripts()).toEqual([]);

      consent.grant();
      expect(headScripts()).toHaveLength(1);

      consent.grant();
      consent.grant();
      expect(headScripts()).toHaveLength(1);
    });

    it('never injects twice, no matter how often init() is called', () => {
      const service = openAnalytics();

      service.init();
      service.init();

      expect(headScripts()).toHaveLength(1);
    });

    it('buffers pre-consent events and replays them once, and only once, after the grant', () => {
      const service = setup(REAL_ID);
      spyOnNetwork();
      service.init();

      service.track('call_click', { placement: 'sticky' });
      service.track('page_view', { page_path: '/proceso' });

      expect(sentEvents()).toEqual([]);

      consent.grant();

      expect(sentEvents().map((event) => event.name)).toEqual(['call_click', 'page_view']);
      expect(sentEvents()[0].params).toEqual({ placement: 'sticky' });
    });
  });

  describe('track', () => {
    it('sends only the enumerated events and silently drops every other name', () => {
      const service = openAnalytics();

      service.track('page_view', { page_path: '/proceso' });
      service.track('call_click', { placement: 'header' });
      service.track('whatsapp_click', { placement: 'footer' });
      service.track('generate_lead', { work_type: 'Reforma' });
      // A hostile caller bypassing the type must still be stopped at runtime.
      service.track('sign_up' as unknown as AnalyticsEvent, { method: 'email' });
      service.track('purchase' as unknown as AnalyticsEvent, { value: 100 });

      expect(sentEvents().map((event) => event.name)).toEqual([
        'page_view',
        'call_click',
        'whatsapp_click',
        'generate_lead'
      ]);
    });

    it('never ships a digit run of six or more digits, nor a text key', () => {
      const service = openAnalytics();

      service.track('generate_lead', {
        work_type: 'Reforma integral',
        area_m2: 45,
        budget_label: 'Entre 3 y 8 millones',
        text: 'Mi celular es 11 5555 1234',
        phone: '+54 9 11 2345-6789',
        reference_id: '20261006'
      });

      const payload = JSON.stringify(sentEvents()[0]?.params ?? {});

      expect(payload).not.toMatch(/\d{6,}/);
      expect(payload).not.toContain('text=');
      expect(Object.keys(sentEvents()[0]?.params ?? {})).not.toContain('text');

      // The PII-free fields survive untouched, so the guard redacts, it does not blank.
      expect(sentEvents()[0]?.params).toEqual({
        work_type: 'Reforma integral',
        area_m2: 45,
        budget_label: 'Entre 3 y 8 millones'
      });
    });

    it('reports a page_view on every NavigationEnd, carrying path and title', async () => {
      openAnalytics();
      const harness = await RouterTestingHarness.create();

      await harness.navigateByUrl('/proceso');
      const afterFirst = sentEvents().filter((event) => event.name === 'page_view');
      expect(afterFirst).toHaveLength(1);
      expect(afterFirst[0].params['page_path']).toBe('/proceso');
      expect(typeof afterFirst[0].params['page_title']).toBe('string');

      await harness.navigateByUrl('/presupuesto');
      const afterSecond = sentEvents().filter((event) => event.name === 'page_view');

      expect(afterSecond.map((event) => event.params['page_path'])).toEqual([
        '/proceso',
        '/presupuesto'
      ]);
    });

    it('sends nothing at all while the measurement id is empty, on any route', async () => {
      const service = setup('');
      const net = spyOnNetwork();
      service.init();

      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/proceso');
      service.track('generate_lead', { work_type: 'Reforma' });

      expect(sentEvents()).toEqual([]);
      expect(injectedScripts(net)).toEqual([]);
      expect(net.fetchSpy).not.toHaveBeenCalled();
      expect(net.xhrSpy).not.toHaveBeenCalled();
    });
  });
});
