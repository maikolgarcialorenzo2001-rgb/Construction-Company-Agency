import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ADMIN_GATEWAY } from '../api/ports';
import type { DirectoryUser } from '../domain';
import { DEMO_ACCOUNTS } from '../mocks/fixtures';
import { AdminStore } from './admin.store';

/** The seeded directory rows as the gateway (which strips `password`) would return them. */
const directory = DEMO_ACCOUNTS.map(({ userId, email, role }) => ({ userId, email, role }));

describe('AdminStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts idle with no directory loaded', () => {
    const store = TestBed.inject(AdminStore);

    expect(store.state()).toBe('idle');
    expect(store.users()).toEqual([]);
  });

  it('loads the directory through the gateway: idle → loading → ready', async () => {
    const store = TestBed.inject(AdminStore);

    const pending = store.load();
    expect(store.state()).toBe('loading');

    await pending;

    expect(store.state()).toBe('ready');
    expect(store.users()).toHaveLength(6);
    expect(store.filteredUsers()).toEqual(directory);
  });

  it('narrows the visible directory to the selected role', async () => {
    const store = TestBed.inject(AdminStore);
    await store.load();

    expect(store.roleFilter()).toBe('all');

    store.roleFilter.set('company');

    expect(store.filteredUsers()).toHaveLength(2);
    expect(store.filteredUsers().map((user) => user.role)).toEqual(['company', 'company']);
    expect(store.state()).toBe('ready');
  });

  it('computes the per-role counts over the filtered list (D7)', async () => {
    const store = TestBed.inject(AdminStore);
    await store.load();

    expect(store.counts()).toEqual({ worker: 3, company: 2, admin: 1, total: 6 });

    store.roleFilter.set('company');

    expect(store.counts()).toEqual({ worker: 0, company: 2, admin: 0, total: 2 });
  });

  it('filters the single admin account and reports a filtered total of one', async () => {
    const store = TestBed.inject(AdminStore);
    await store.load();

    store.roleFilter.set('admin');

    expect(store.filteredUsers()).toEqual([
      { userId: 'admin-1', email: 'admin@demo.test', role: 'admin' }
    ]);
    expect(store.counts()).toEqual({ worker: 0, company: 0, admin: 1, total: 1 });
  });

  it('shows the empty state when the filter matches no account', async () => {
    TestBed.overrideProvider(ADMIN_GATEWAY, {
      useValue: {
        listUsers: async (): Promise<DirectoryUser[]> =>
          directory.filter((user) => user.role === 'worker')
      }
    });

    const store = TestBed.inject(AdminStore);
    await store.load();

    store.roleFilter.set('company');

    expect(store.filteredUsers()).toEqual([]);
    expect(store.state()).toBe('empty');
    expect(store.counts()).toEqual({ worker: 0, company: 0, admin: 0, total: 0 });
  });

  it('shows the empty state when the gateway lists no accounts', async () => {
    TestBed.overrideProvider(ADMIN_GATEWAY, {
      useValue: { listUsers: async (): Promise<DirectoryUser[]> => [] }
    });

    const store = TestBed.inject(AdminStore);

    await store.load();

    expect(store.state()).toBe('empty');
    expect(store.users()).toEqual([]);
  });

  it('guards load so the gateway is called once, even when called repeatedly', async () => {
    let listCalls = 0;
    TestBed.overrideProvider(ADMIN_GATEWAY, {
      useValue: {
        listUsers: async (): Promise<DirectoryUser[]> => {
          listCalls++;
          return directory;
        }
      }
    });

    const store = TestBed.inject(AdminStore);

    const first = store.load();
    const second = store.load();
    await Promise.all([first, second]);
    await store.load();

    expect(listCalls).toBe(1);
    expect(store.state()).toBe('ready');
    expect(store.users()).toHaveLength(6);
  });
});
