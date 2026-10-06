import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { site } from '../../../content/site';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { toWaDigits } from '../../core/lead/lead-links';
import { WhatsappLinkComponent } from './whatsapp-link.component';

const digits = toWaDigits(site.nap.phoneE164);

const render = async (inputs: Record<string, unknown> = {}): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(WhatsappLinkComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('WhatsappLinkComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [WhatsappLinkComponent] });
  });

  it('builds the wa.me deep link for the NAP number', async () => {
    const element = await render();

    expect(element.querySelector('a')?.getAttribute('href')).toBe(`https://wa.me/${digits}?text=`);
  });

  it('encodes the invited message into the text parameter', async () => {
    const element = await render({ message: 'Hola, quiero un presupuesto' });
    const href = element.querySelector('a')?.getAttribute('href') ?? '';

    expect(href.startsWith(`https://wa.me/${digits}?text=`)).toBe(true);
    expect(new URL(href).searchParams.get('text')).toBe('Hola, quiero un presupuesto');
  });

  it('leaves the text parameter empty when there is no invitation', async () => {
    const element = await render({ message: '' });
    const href = element.querySelector('a')?.getAttribute('href') ?? '';

    expect(new URL(href).searchParams.get('text')).toBe('');
  });

  it('renders a WhatsApp label by default and honours a custom one', async () => {
    const defaultElement = await render();
    const custom = await render({ label: 'Escribinos' });

    expect(defaultElement.querySelector('a')?.textContent?.trim()).toContain('WhatsApp');
    expect(custom.querySelector('a')?.textContent?.trim()).toBe('Escribinos');
  });

  it('switches presentation for the button variant', async () => {
    const inline = await render();
    const button = await render({ variant: 'button' });

    expect(button.querySelector('a')?.className).not.toBe(inline.querySelector('a')?.className);
  });

  describe('analytics', () => {
    it('reports exactly one whatsapp_click, carrying the placement and never the message', async () => {
      const element = await render({ placement: 'footer', message: 'Hola, quiero un presupuesto' });
      const track = vi.spyOn(TestBed.inject(AnalyticsService), 'track');

      element.querySelector('a')?.click();

      expect(track).toHaveBeenCalledTimes(1);
      const [event, params] = track.mock.calls[0];
      expect(event).toBe('whatsapp_click');
      expect(params).toEqual({ placement: 'footer' });

      const payload = JSON.stringify(params);
      expect(payload).not.toMatch(/\d{6,}/);
      expect(payload).not.toContain('text=');
      expect(payload).not.toContain('presupuesto');
    });

    it('falls back to an empty placement instead of guessing one', async () => {
      const element = await render();
      const track = vi.spyOn(TestBed.inject(AnalyticsService), 'track');

      element.querySelector('a')?.click();

      expect(track).toHaveBeenCalledWith('whatsapp_click', { placement: '' });
    });
  });
});
