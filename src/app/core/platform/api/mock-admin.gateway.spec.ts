import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEMO_ACCOUNTS } from '../mocks/fixtures';
import { MockAdminGateway } from './mock-admin.gateway';
import { ADMIN_GATEWAY } from './ports';

describe('MockAdminGateway', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('maps every seeded demo account to a directory row', async () => {
    const gateway = new MockAdminGateway();

    const users = await gateway.listUsers();

    expect(users).toEqual(
      DEMO_ACCOUNTS.map(({ userId, email, role }) => ({ userId, email, role }))
    );
    expect(users).toHaveLength(6);
  });

  it('never exposes the demo password on any directory row', async () => {
    const users = await new MockAdminGateway().listUsers();

    expect(users).toHaveLength(6);
    for (const user of users) {
      expect(Object.keys(user).sort()).toEqual(['email', 'role', 'userId']);
    }
    expect(JSON.stringify(users)).not.toContain('demo1234');
  });

  it('includes the single seeded admin account with role admin', async () => {
    const users = await new MockAdminGateway().listUsers();

    const admin = users.find((user) => user.userId === 'admin-1');

    expect(admin).toEqual({ userId: 'admin-1', email: 'admin@demo.test', role: 'admin' });
    expect(users.filter((user) => user.role === 'admin')).toHaveLength(1);
  });

  it('resolves the ADMIN_GATEWAY token to the mock adapter without extra providers', () => {
    const gateway = TestBed.inject(ADMIN_GATEWAY);

    expect(gateway).toBeInstanceOf(MockAdminGateway);
    expect(typeof gateway.listUsers).toBe('function');
  });
});
