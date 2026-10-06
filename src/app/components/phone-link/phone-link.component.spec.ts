import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { site } from '../../../content/site';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { toWaDigits } from '../../core/lead/lead-links';
import { PhoneLinkComponent } from './phone-link.component';

const render = async (inputs: Record<string, unknown> = {}): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(PhoneLinkComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('PhoneLinkComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PhoneLinkComponent] });
  });

  it('points at the NAP phone in tel: form', async () => {
    const element = await render();

    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      `tel:+${toWaDigits(site.nap.phoneE164)}`
    );
  });

  it('renders the NAP phone as its visible label by default', async () => {
    const element = await render();

    expect(element.querySelector('a')?.textContent?.trim()).toBe(site.nap.phoneDisplay);
  });

  it('accepts a custom label without changing the target', async () => {
    const element = await render({ label: 'Llamanos ahora' });
    const anchor = element.querySelector('a');

    expect(anchor?.textContent?.trim()).toBe('Llamanos ahora');
    expect(anchor?.getAttribute('href')).toBe(`tel:+${toWaDigits(site.nap.phoneE164)}`);
  });

  it('switches presentation for the button variant', async () => {
    const inline = await render();
    const button = await render({ variant: 'button' });

    expect(button.querySelector('a')?.getAttribute('href')).toBe(
      inline.querySelector('a')?.getAttribute('href')
    );
    expect(button.querySelector('a')?.className).not.toBe(inline.querySelector('a')?.className);
  });

  describe('analytics', () => {
    it('reports exactly one call_click, carrying the placement', async () => {
      const element = await render({ placement: 'header' });
      const track = vi.spyOn(TestBed.inject(AnalyticsService), 'track');

      element.querySelector('a')?.click();

      expect(track).toHaveBeenCalledTimes(1);
      const [event, params] = track.mock.calls[0];
      expect(event).toBe('call_click');
      expect(params).toEqual({ placement: 'header' });

      const payload = JSON.stringify(params);
      expect(payload).not.toMatch(/\d{6,}/);
      expect(payload).not.toContain('text=');
    });

    it('falls back to an empty placement instead of guessing one', async () => {
      const element = await render();
      const track = vi.spyOn(TestBed.inject(AnalyticsService), 'track');

      element.querySelector('a')?.click();

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith('call_click', { placement: '' });
    });
  });
});
