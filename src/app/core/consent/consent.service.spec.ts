import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsentService } from './consent.service';

describe('ConsentService', () => {
  let consent: ConsentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    consent = TestBed.inject(ConsentService);
  });

  it('defaults both consents to denied, as the consent stub requires', () => {
    expect(consent.analyticsGranted()).toBe(false);
    expect(consent.adPersonalisationGranted()).toBe(false);
    expect(consent.granted()).toBe(false);
  });

  it('queues callbacks registered while denied and runs none of them before grant', () => {
    const first = vi.fn();
    const second = vi.fn();

    consent.register(first);
    consent.register(second);

    expect(consent.granted()).toBe(false);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('runs a callback immediately when consent is already granted', () => {
    consent.grant();

    const immediate = vi.fn();
    consent.register(immediate);

    expect(immediate).toHaveBeenCalledTimes(1);
  });

  it('flips both signals and flushes the whole queue exactly once', () => {
    const first = vi.fn();
    const second = vi.fn();
    consent.register(first);
    consent.register(second);

    consent.grant();

    expect(consent.analyticsGranted()).toBe(true);
    expect(consent.adPersonalisationGranted()).toBe(true);
    expect(consent.granted()).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    consent.grant();
    consent.grant();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
