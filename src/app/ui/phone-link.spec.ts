import { TestBed } from '@angular/core/testing';

import { site } from '../../content/site';
import { toWaDigits } from '../core/lead/lead-links';
import { PhoneLink } from './phone-link';

const render = async (inputs: Record<string, unknown> = {}): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(PhoneLink);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('PhoneLink', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PhoneLink] });
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
});
