import type { DirectoryUser } from '../domain';
import { DEMO_ACCOUNTS } from '../mocks/fixtures';
import type { AdminGateway } from './ports';

/**
 * In-memory `AdminGateway`, mirroring the other mock adapters' conventions.
 * It maps the seeded demo credentials to the read-only directory shape and
 * drops `password` at the boundary — the port returns `DirectoryUser[]`, a type
 * that cannot carry a credential (design D4). Returns fresh copies so callers
 * cannot mutate the fixture list.
 */
export class MockAdminGateway implements AdminGateway {
  async listUsers(): Promise<DirectoryUser[]> {
    return DEMO_ACCOUNTS.map(({ userId, email, role }) => ({ userId, email, role }));
  }
}
