import { environment } from './environment';
import type { Environment } from './environment.model';

describe('environment', () => {
  it('should satisfy the Environment contract', () => {
    const env: Environment = environment;
    expect(typeof env.production).toBe('boolean');
    expect(typeof env.apiUrl).toBe('string');
    expect(env.apiUrl.length).toBeGreaterThan(0);
  });
});
