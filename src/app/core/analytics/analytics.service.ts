import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

import { ENVIRONMENT } from '../../environments/environment.token';
import { ConsentService } from '../consent/consent.service';

/**
 * The closed set of events this site may emit. It is enumerated on purpose: analytics
 * that can send anything can send everything, and this one cannot.
 */
export type AnalyticsEvent = 'page_view' | 'call_click' | 'whatsapp_click' | 'generate_lead';

/** Scalars only. Free text never reaches the wire, see `sanitize()`. */
export type AnalyticsParams = Record<string, string | number | boolean>;

/**
 * The closed set of places a contact link can live on the page. A placement is a
 * traffic dimension, so it is typed too: only the real call sites are expressible.
 */
export type LinkPlacement = 'header' | 'footer' | 'sticky' | 'cta' | 'about';

/** The window contract the gtag snippet creates once it is installed. */
export interface GtagWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

const ALLOWED_EVENTS: readonly AnalyticsEvent[] = [
  'page_view',
  'call_click',
  'whatsapp_click',
  'generate_lead'
];

/** Six digits in a row is where a phone, a DNI or a card number starts to show up. */
const DIGIT_RUN = /\d{6,}/;

/** The same digits with the separators removed, so `11 5555-1234` is caught too. */
const BARE_DIGITS = /\D/g;

/** Placeholders keep the GA4 shape but point at no property, so they must stay silent. */
const PLACEHOLDER_MARKERS = ['PLACE', 'XXXX', 'TEST'];

/**
 * GA4 measurement ids are `G-` plus exactly ten uppercase alphanumerics. The markers
 * catch the ids that fake that shape (`G-XXXXXXXXXX`, `G-PLACEHOLDE`) without being a
 * real property.
 */
const GA4_ID = /^G-[A-Z0-9]{10}$/;

/**
 * The single gate that decides whether analytics exists at all: `true` only for a
 * genuine GA4 measurement id. An empty environment value, a placeholder or anything
 * malformed returns `false`, and every downstream path stays silent.
 */
export function isRealGa4Id(id: string | null | undefined): boolean {
  if (!id || !GA4_ID.test(id)) {
    return false;
  }

  return !PLACEHOLDER_MARKERS.some((marker) => id.includes(marker));
}

/**
 * Owns GA4. Two independent locks guard it, and both must open before anything ships:
 * a real measurement id (no id, no analytics) and granted consent (no grant, no tag).
 * Before the grant the gtag loader is not even injected, so there is no tag on the page
 * to leak pre-consent hits; events fired meanwhile are held in memory and replayed once,
 * on the single flush `ConsentService.grant()` performs.
 *
 * Everything it sends passes two filters: an event allowlist (see `AnalyticsEvent`) and
 * a payload guard that drops free text and six-digit runs. The tag is a stub until the
 * client replaces the placeholder measurement id — see the release gate in the README.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly consent = inject(ConsentService);
  private readonly environment = inject(ENVIRONMENT);

  private started = false;
  /** The master switch: on only when a real measurement id is configured. */
  private enabled = false;
  private installed = false;
  private readonly pending: { event: AnalyticsEvent; params: AnalyticsParams }[] = [];

  /**
   * Registers the `page_view` listener and asks the consent service for the load.
   * Safe to call again: repeat calls are no-ops instead of second subscriptions.
   */
  init(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.subscribeToNavigations();

    if (!isRealGa4Id(this.environment.gaMeasurementId)) {
      return;
    }

    this.enabled = true;
    // Runs now when consent is already granted, queues the load otherwise.
    this.consent.register(() => this.install());
  }

  /**
   * Queues one enumerated event. Unknown names are dropped (a no-op, never an error),
   * an empty environment drops everything, and a real id without consent buffers the
   * event until the grant replays it.
   */
  track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
    if (!ALLOWED_EVENTS.includes(event)) {
      return;
    }

    if (!this.enabled) {
      return;
    }

    const payload = sanitize(params);

    if (!this.installed) {
      this.pending.push({ event, params: payload });
      return;
    }

    this.send(event, payload);
  }

  private subscribeToNavigations(): void {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.track('page_view', {
          page_path: event.urlAfterRedirects,
          page_title: this.document.title
        });
      }
    });
  }

  /**
   * Writes the gtag snippet: the data layer, `window.gtag` and the gtag.js script tag.
   * Only reachable through the consent queue, so pre-consent it never runs.
   */
  private install(): void {
    if (this.installed) {
      return;
    }
    this.installed = true;

    const win = this.document.defaultView as (Window & GtagWindow) | null;

    if (win) {
      win.dataLayer ??= [];
      win.gtag = function gtag(): void {
        // GA4 reads the `arguments` object, so it must be pushed as-is, not spread.
        // eslint-disable-next-line prefer-rest-params -- the gtag contract needs it
        win.dataLayer?.push(arguments);
      };
      win.gtag('js', new Date());
      win.gtag('config', this.environment.gaMeasurementId);

      const script = this.document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.environment.gaMeasurementId}`;
      this.document.head.appendChild(script);
    }

    const queued = this.pending.splice(0, this.pending.length);
    for (const entry of queued) {
      this.send(entry.event, entry.params);
    }
  }

  private send(event: AnalyticsEvent, params: AnalyticsParams): void {
    const win = this.document.defaultView as (Window & GtagWindow) | null;
    win?.gtag?.('event', event, params);
  }
}

/**
 * The payload guard. A param is dropped, not redacted in place, when its key is free
 * text or its value would leak a phone, a DNI or a card number: a run of six or more
 * digits, or six digits once separators are stripped, so a formatted number is caught
 * too. What survives is enumerated, scalar, PII-free data.
 */
function sanitize(params: AnalyticsParams): AnalyticsParams {
  const clean: AnalyticsParams = {};

  for (const [key, value] of Object.entries(params)) {
    if (key.toLowerCase().startsWith('text')) {
      continue;
    }

    const text = String(value);
    const digits = text.replace(BARE_DIGITS, '');
    if (DIGIT_RUN.test(text) || digits.length >= 6 || text.includes('text=')) {
      continue;
    }

    clean[key] = value;
  }

  return clean;
}
