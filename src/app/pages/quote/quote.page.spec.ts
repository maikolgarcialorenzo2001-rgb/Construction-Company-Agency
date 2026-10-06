import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Option } from '../../../content/content.types';
import { BUDGET_OPTIONS, JOB_TYPE_OPTIONS, STAGE_OPTIONS } from '../../../content/quote-options';
import { site } from '../../../content/site';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  LEAD_MAIL_SUBJECT,
  LEAD_PHOTO_INVITE,
  buildLeadMessage,
  buildMailtoUrl,
  buildTelHref,
  buildWhatsAppUrl,
  toWaDigits
} from '../../core/lead/lead-links';
import { QuotePage } from './quote.page';

/** The eight declared controls, in the order the visitor meets them on the page. */
const CONTROL_NAMES = [
  'workType',
  'location',
  'areaM2',
  'budget',
  'stage',
  'comment',
  'consent',
  'website'
] as const;

/** The controls a fully valid submission fills in. Labels are resolved from the arrays. */
const SUBMISSION = {
  workType: 'reforma',
  location: 'Palermo',
  areaM2: 85,
  budget: '3m-8m',
  stage: 'planificacion',
  comment: 'Prefiero arrancar en marzo.'
} as const;

let fixture: ComponentFixture<QuotePage>;

const render = async (): Promise<HTMLElement> => {
  fixture = TestBed.createComponent(QuotePage);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const formOf = (element: HTMLElement): HTMLFormElement =>
  element.querySelector('form') as HTMLFormElement;

const controlsOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('input, select, textarea')
];

const controlOf = (element: HTMLElement, name: string): HTMLElement =>
  element.querySelector(`[formcontrolname="${name}"]`) as HTMLElement;

const errorOf = (element: HTMLElement, name: string): HTMLElement | null =>
  element.querySelector(`#${name}-error`);

/** The honeypot is in the DOM but hidden from assistive tech and from the tab order. */
const isHoneypot = (control: HTMLElement): boolean => control.getAttribute('aria-hidden') === 'true';

/** Submit through the DOM, exactly as a visitor would: the event must reach `ngSubmit`. */
const submit = async (element: HTMLElement): Promise<void> => {
  formOf(element).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
};

interface FillOptions {
  readonly location?: string;
  readonly areaM2?: number | string;
  readonly consent?: boolean;
}

/** Valid required fields, so a single override isolates exactly one validator. */
const fillRequired = ({
  location = SUBMISSION.location,
  areaM2 = SUBMISSION.areaM2,
  consent = true
}: FillOptions = {}): void => {
  const controls = fixture.componentInstance.form.controls;
  controls.workType.setValue(SUBMISSION.workType);
  controls.location.setValue(location);
  controls.areaM2.setValue(areaM2);
  controls.consent.setValue(consent);
};

/** Every field, optionals included: the happy path of the form. */
const fillAll = (): void => {
  fillRequired();
  const controls = fixture.componentInstance.form.controls;
  controls.budget.setValue(SUBMISSION.budget);
  controls.stage.setValue(SUBMISSION.stage);
  controls.comment.setValue(SUBMISSION.comment);
};

/** Labels are read from the option arrays, never hardcoded: the form must resolve them. */
const labelOf = <T extends string>(options: readonly Option<T>[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? '';

/** The message a `fillAll()` submission must produce, built from the same content arrays. */
const FULL_MESSAGE = buildLeadMessage({
  workTypeLabel: labelOf(JOB_TYPE_OPTIONS, SUBMISSION.workType),
  location: SUBMISSION.location,
  areaM2: SUBMISSION.areaM2,
  budgetLabel: labelOf(BUDGET_OPTIONS, SUBMISSION.budget),
  stageLabel: labelOf(STAGE_OPTIONS, SUBMISSION.stage),
  comment: SUBMISSION.comment
});

/** The message when only the required fields are filled in. */
const MINIMAL_MESSAGE = buildLeadMessage({
  workTypeLabel: labelOf(JOB_TYPE_OPTIONS, SUBMISSION.workType),
  location: SUBMISSION.location,
  areaM2: SUBMISSION.areaM2
});

const waUrl = (message: string): string =>
  buildWhatsAppUrl(toWaDigits(site.nap.phoneE164), message);

/** The decoded `text=` payload of a `wa.me` URL, so line content can be asserted. */
const messageIn = (url: string): string => decodeURIComponent(url.split('text=')[1] ?? '');

describe('QuotePage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuotePage],
      providers: [provideRouter([]), provideHttpClient()]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('field set', () => {
    it('renders exactly the eight declared controls, no more and no fewer', async () => {
      const form = formOf(await render());
      const controls = controlsOf(form);

      expect(controls.length).toBe(8);
      expect(controls.map((control) => control.getAttribute('formcontrolname'))).toEqual([
        ...CONTROL_NAMES
      ]);
    });

    it('gives every visible control a label and a describedby target that exists', async () => {
      const form = formOf(await render());
      const visible = controlsOf(form).filter((control) => !isHoneypot(control));

      expect(visible.length).toBe(7);

      for (const control of visible) {
        const name = control.getAttribute('formcontrolname');
        const id = control.getAttribute('id');

        expect(id, `${name} must carry an id`).toBeTruthy();
        expect(form.querySelector(`label[for="${id}"]`), `label for ${name}`).not.toBeNull();

        const describedBy = control.getAttribute('aria-describedby');
        expect(describedBy, `${name} must be described by aria-describedby`).toBeTruthy();

        for (const reference of (describedBy ?? '').split(/\s+/).filter(Boolean)) {
          expect(form.querySelector(`#${reference}`), `${name} → #${reference}`).not.toBeNull();
        }
      }
    });

    it('never renders a file input or any upload affordance', async () => {
      const element = await render();

      expect(element.querySelectorAll('input[type="file"], [type="file"]').length).toBe(0);
      expect(element.outerHTML).not.toMatch(/type=["']file["']/);
    });
  });

  describe('validation', () => {
    it('hides the honeypot from real users while keeping it present in the DOM', async () => {
      const honeypot = controlOf(await render(), 'website');

      expect(honeypot).not.toBeNull();
      expect(honeypot.tagName.toLowerCase()).toBe('input');
      expect(honeypot.getAttribute('type')).toBe('text');
      expect(honeypot.classList.contains('absolute')).toBe(true);
      expect(honeypot.classList.contains('h-0')).toBe(true);
      expect(honeypot.classList.contains('w-0')).toBe(true);
      expect(honeypot.classList.contains('opacity-0')).toBe(true);
      expect(honeypot.getAttribute('tabindex')).toBe('-1');
      expect(honeypot.getAttribute('autocomplete')).toBe('off');
      expect(honeypot.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps the honeypot out of the validator chain: it is a trap, not a requirement', async () => {
      await render();
      const honeypot = fixture.componentInstance.form.controls.website;

      expect(honeypot.validator).toBeNull();
      expect(honeypot.valid).toBe(true);
    });

    it('blocks an invalid submit: nothing opens, errors surface, first invalid gets focus', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      await submit(element);

      expect(openSpy).not.toHaveBeenCalled();

      for (const name of ['workType', 'location', 'areaM2', 'consent']) {
        expect(controlOf(element, name).getAttribute('aria-invalid'), `${name} aria-invalid`).toBe(
          'true'
        );
        expect(errorOf(element, name)?.textContent?.trim(), `${name} error text`).toBeTruthy();
        expect(errorOf(element, name)?.getAttribute('role'), `${name} role=alert`).toBe('alert');
      }

      // A valid optional control stays quiet: no error noise on untouched fields.
      expect(errorOf(element, 'budget')?.textContent?.trim()).toBe('');
      expect(controlOf(element, 'budget').hasAttribute('aria-invalid')).toBe(false);

      // `markAllAsTouched()` ran, so the messages are allowed to show at all.
      const { form } = fixture.componentInstance;
      expect(form.controls.location.touched).toBe(true);
      expect(form.controls.consent.touched).toBe(true);

      // The first invalid control takes focus, so the keyboard user lands on the fix.
      expect(document.activeElement).toBe(controlOf(element, 'workType'));
    });

    it('rejects a ubicación shorter than four characters', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fillRequired({ location: 'Abc' });

      await submit(element);

      expect(openSpy).not.toHaveBeenCalled();
      expect(controlOf(element, 'location').getAttribute('aria-invalid')).toBe('true');
      expect(errorOf(element, 'location')?.textContent?.trim()).toBeTruthy();
      expect(document.activeElement).toBe(controlOf(element, 'location'));
    });

    it('rejects a superficie outside the 1–10000 window', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fillRequired({ areaM2: 10001 });

      await submit(element);

      expect(openSpy).not.toHaveBeenCalled();
      expect(controlOf(element, 'areaM2').getAttribute('aria-invalid')).toBe('true');
      expect(errorOf(element, 'areaM2')?.textContent?.trim()).toBeTruthy();
      expect(document.activeElement).toBe(controlOf(element, 'areaM2'));
    });

    it('blocks an unchecked consent like any other required field', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fillRequired({ consent: false });

      await submit(element);

      expect(openSpy).not.toHaveBeenCalled();
      expect(controlOf(element, 'consent').getAttribute('aria-invalid')).toBe('true');
      expect(errorOf(element, 'consent')?.textContent?.trim()).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('opens exactly one prefilled WhatsApp tab, with the labels resolved from the option arrays', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fillAll();

      await submit(element);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith(waUrl(FULL_MESSAGE), '_blank');
      expect(fixture.componentInstance.sent()).toBe(true);
    });

    it('drops the optional lines the visitor never filled and still ends with the photo invite', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fillRequired();

      await submit(element);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith(waUrl(MINIMAL_MESSAGE), '_blank');

      const message = messageIn(openSpy.mock.calls[0][0] as string);
      expect(message).not.toContain('Presupuesto estimado:');
      expect(message).not.toContain('Etapa:');
      expect(message).not.toContain('Comentario:');
      expect(message.endsWith(LEAD_PHOTO_INVITE)).toBe(true);
    });

    it('silences a filled honeypot: no open, no success state, no error, no touched control', async () => {
      const element = await render();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      fixture.componentInstance.form.controls.website.setValue('https://ejemplo.com');

      await submit(element);

      expect(openSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.sent()).toBe(false);
      expect(element.querySelector('[data-testid="quote-success"]')).toBeNull();
      expect(fixture.componentInstance.form.controls.location.touched).toBe(false);

      const announced = [...element.querySelectorAll('[role="alert"]')].filter(
        (alert) => alert.textContent?.trim()
      );
      expect(announced.length).toBe(0);
    });
  });

  describe('success state', () => {
    const handOff = async (): Promise<HTMLElement> => {
      const element = await render();
      vi.spyOn(window, 'open').mockReturnValue(null);
      fillAll();
      await submit(element);
      return element;
    };

    it('replaces the form with a success view that falls back to the NAP phone', async () => {
      const element = await handOff();

      expect(element.querySelector('form')).toBeNull();

      const tel = element.querySelector<HTMLAnchorElement>('a[href^="tel:"]');
      expect(tel).not.toBeNull();
      expect(tel?.getAttribute('href')).toBe(buildTelHref(toWaDigits(site.nap.phoneE164)));
    });

    it('offers a mailto: fallback carrying the very same message body', async () => {
      const element = await handOff();

      const mail = element.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
      expect(mail).not.toBeNull();
      expect(mail?.getAttribute('href')).toBe(
        buildMailtoUrl(site.nap.email, LEAD_MAIL_SUBJECT, FULL_MESSAGE)
      );
    });

    it('issues zero HTTP requests across the whole flow: HttpClient and fetch stay untouched', async () => {
      const http = TestBed.inject(HttpClient);
      const spies = [
        vi.spyOn(http, 'request').mockReturnValue(EMPTY),
        vi.spyOn(http, 'get').mockReturnValue(EMPTY),
        vi.spyOn(http, 'post').mockReturnValue(EMPTY),
        vi.spyOn(http, 'put').mockReturnValue(EMPTY),
        vi.spyOn(http, 'patch').mockReturnValue(EMPTY),
        vi.spyOn(http, 'delete').mockReturnValue(EMPTY),
        vi.spyOn(http, 'head').mockReturnValue(EMPTY),
        vi.spyOn(http, 'options').mockReturnValue(EMPTY),
        vi.spyOn(http, 'jsonp').mockReturnValue(EMPTY)
      ];
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      const element = await render();
      await submit(element); // invalid: rejected, still silent on the network

      const controls = fixture.componentInstance.form.controls;
      controls.website.setValue('bot@spam.example');
      await submit(element); // honeypot: silent return
      controls.website.reset('');

      fillAll();
      await submit(element); // valid: the handoff

      expect(openSpy).toHaveBeenCalledTimes(1);

      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('analytics', () => {
    const trackSpy = () => vi.spyOn(TestBed.inject(AnalyticsService), 'track');

    it('reports generate_lead exactly once on a successful handoff, PII-free', async () => {
      const element = await render();
      vi.spyOn(window, 'open').mockReturnValue(null);
      const track = trackSpy();
      fillAll();

      await submit(element);

      const leads = track.mock.calls.filter(([event]) => event === 'generate_lead');
      expect(leads).toHaveLength(1);

      const params = leads[0][1];
      expect(params).toEqual({
        work_type: labelOf(JOB_TYPE_OPTIONS, SUBMISSION.workType),
        area_m2: SUBMISSION.areaM2,
        budget: labelOf(BUDGET_OPTIONS, SUBMISSION.budget),
        stage: labelOf(STAGE_OPTIONS, SUBMISSION.stage)
      });

      const payload = JSON.stringify(params);
      expect(payload).not.toMatch(/\d{6,}/);
      expect(payload).not.toContain('text=');
      // The location and the free comment are PII: they must never travel.
      expect(payload).not.toContain(SUBMISSION.location);
      expect(payload).not.toContain(SUBMISSION.comment);
    });

    it('stays silent on the honeypot path', async () => {
      const element = await render();
      vi.spyOn(window, 'open').mockReturnValue(null);
      const track = trackSpy();
      fixture.componentInstance.form.controls.website.setValue('https://ejemplo.com');

      await submit(element);

      expect(track.mock.calls.filter(([event]) => event === 'generate_lead')).toHaveLength(0);
    });

    it('stays silent when the form is rejected', async () => {
      const element = await render();
      vi.spyOn(window, 'open').mockReturnValue(null);
      const track = trackSpy();

      await submit(element);

      expect(track).not.toHaveBeenCalledWith('generate_lead', expect.anything());
    });
  });
});
