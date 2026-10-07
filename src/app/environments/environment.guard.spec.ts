import { describe, expect, it } from 'vitest';

import { environment as devEnvironment } from './environment.development';
import type { Environment } from './environment.model';
import { environment as prodEnvironment } from './environment.prod';

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const expectSiteUrlShape = (env: Environment): void => {
  expect(typeof env.siteUrl).toBe('string');
  if (env.production) {
    const trimmed = env.siteUrl.trim();
    expect(trimmed.length).toBeGreaterThan(0);
    expect(isAbsoluteHttpUrl(trimmed)).toBe(true);
    expect(trimmed.toLowerCase()).not.toContain('localhost');
  } else {
    // Development may be empty (dev fallback uses document.location.origin).
    expect(typeof env.siteUrl).toBe('string');
  }
};

describe('environment.siteUrl', () => {
  it('enforces siteUrl shape in prod/non-prod variants', () => {
    expectSiteUrlShape(prodEnvironment);
    expectSiteUrlShape(devEnvironment);
  });

  it('prod siteUrl is absolute and not localhost', () => {
    const trimmed = prodEnvironment.siteUrl.trim();
    expect(trimmed.length).toBeGreaterThan(0);
    const url = new URL(trimmed);
    expect(url.origin).toBe(trimmed);
    expect(trimmed.toLowerCase()).not.toContain('localhost');
  });
});
