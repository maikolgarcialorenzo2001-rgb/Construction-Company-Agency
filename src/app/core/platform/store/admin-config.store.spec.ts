import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ADMIN_CONFIG_STORAGE_KEY, AdminConfigStore } from './admin-config.store';

/** The raw persisted entry, so tests assert what production actually wrote. */
const readStored = (): unknown =>
  JSON.parse(localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY) ?? 'null');

describe('AdminConfigStore', () => {
  beforeEach(() => {
    localStorage.removeItem(ADMIN_CONFIG_STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  it('starts with both demo toggles off when nothing is stored', () => {
    const store = TestBed.inject(AdminConfigStore);

    expect(store.showDemoNotice()).toBe(false);
    expect(store.allowCompanyRegistration()).toBe(false);
  });

  it('persists a toggle change to the localStorage entry', () => {
    const store = TestBed.inject(AdminConfigStore);

    store.setShowDemoNotice(true);

    expect(readStored()).toEqual({ showDemoNotice: true, allowCompanyRegistration: false });
  });

  it('keeps both toggles in the same localStorage entry', () => {
    const store = TestBed.inject(AdminConfigStore);

    store.setShowDemoNotice(true);
    store.setAllowCompanyRegistration(true);

    expect(readStored()).toEqual({ showDemoNotice: true, allowCompanyRegistration: true });
    expect(Object.keys(localStorage).filter((key) => key.startsWith('admin-config'))).toEqual([
      ADMIN_CONFIG_STORAGE_KEY
    ]);
  });

  it('survives a reload: a fresh instance re-reads both stored toggles', () => {
    const store = TestBed.inject(AdminConfigStore);
    store.setShowDemoNotice(true);
    store.setAllowCompanyRegistration(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(AdminConfigStore);

    expect(reloaded.showDemoNotice()).toBe(true);
    expect(reloaded.allowCompanyRegistration()).toBe(true);
  });

  it('survives a reload with only one toggle changed', () => {
    TestBed.inject(AdminConfigStore).setAllowCompanyRegistration(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(AdminConfigStore);

    expect(reloaded.allowCompanyRegistration()).toBe(true);
    expect(reloaded.showDemoNotice()).toBe(false);
  });

  it('falls back to the defaults when the stored entry is not valid JSON', () => {
    localStorage.setItem(ADMIN_CONFIG_STORAGE_KEY, 'not-json');

    const store = TestBed.inject(AdminConfigStore);

    expect(store.showDemoNotice()).toBe(false);
    expect(store.allowCompanyRegistration()).toBe(false);
  });

  it('only honours a stored boolean true when re-reading the entry', () => {
    localStorage.setItem(
      ADMIN_CONFIG_STORAGE_KEY,
      JSON.stringify({ showDemoNotice: 'yes', allowCompanyRegistration: true })
    );

    const store = TestBed.inject(AdminConfigStore);

    expect(store.showDemoNotice()).toBe(false);
    expect(store.allowCompanyRegistration()).toBe(true);
  });
});
