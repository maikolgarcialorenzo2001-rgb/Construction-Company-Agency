import { TestBed } from '@angular/core/testing';

import { appConfig } from '../app.config';
import { environment } from './environment';
import { environment as devEnvironment } from './environment.development';
import type { Environment } from './environment.model';
import { environment as prodEnvironment } from './environment.prod';
import { ENVIRONMENT } from './environment.token';

function expectEnvironmentShape(env: Environment): void {
  expect(typeof env.production).toBe('boolean');
  expect(typeof env.apiUrl).toBe('string');
  expect(env.apiUrl.length).toBeGreaterThan(0);
  // Empty is a valid value: an empty id means "no GA4 property yet", which keeps
  // analytics fully silent. What the contract forbids is the key being absent.
  expect(typeof env.gaMeasurementId).toBe('string');
}

describe('environment', () => {
  it('should satisfy the Environment contract', () => {
    expectEnvironmentShape(environment);
  });

  it('should have development and production variants that satisfy the Environment contract', () => {
    expectEnvironmentShape(devEnvironment);
    expectEnvironmentShape(prodEnvironment);
  });

  it('should ship with no GA4 measurement id, so a fresh build collects nothing', () => {
    // The client fills this in before launch; until then every analytics path stays
    // behind the `isRealGa4Id` gate and no gtag.js ever loads.
    expect(environment.gaMeasurementId).toBe('');
    expect(devEnvironment.gaMeasurementId).toBe('');
    expect(prodEnvironment.gaMeasurementId).toBe('');
  });

  it('should resolve the ENVIRONMENT token through the app config providers', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expectEnvironmentShape(TestBed.inject(ENVIRONMENT));
  });
});
