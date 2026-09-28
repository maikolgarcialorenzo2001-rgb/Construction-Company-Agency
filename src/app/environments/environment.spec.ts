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
}

describe('environment', () => {
  it('should satisfy the Environment contract', () => {
    expectEnvironmentShape(environment);
  });

  it('should have development and production variants that satisfy the Environment contract', () => {
    expectEnvironmentShape(devEnvironment);
    expectEnvironmentShape(prodEnvironment);
  });

  it('should resolve the ENVIRONMENT token through the app config providers', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expectEnvironmentShape(TestBed.inject(ENVIRONMENT));
  });
});
