import { computed, Injectable, signal } from '@angular/core';

/** `localStorage` key of the persisted demo admin config. Exported for tests. */
export const ADMIN_CONFIG_STORAGE_KEY = 'admin-config';

/** The two demo-only local toggles. No backend reads them (design D8). */
export interface AdminConfig {
  readonly showDemoNotice: boolean;
  readonly allowCompanyRegistration: boolean;
}

const DEFAULT_CONFIG: AdminConfig = {
  showDemoNotice: false,
  allowCompanyRegistration: false
};

/** `localStorage` is undefined during SSR/prerender; platform is client-only. */
const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Reads the entry defensively: absent in SSR, string is untrusted (mirrors SessionService). */
const readStoredConfig = (): AdminConfig => {
  const store = storage();
  if (!store) {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = store.getItem(ADMIN_CONFIG_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<AdminConfig>;
    return {
      showDemoNotice: parsed?.showDemoNotice === true,
      allowCompanyRegistration: parsed?.allowCompanyRegistration === true
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const writeStoredConfig = (config: AdminConfig): void => {
  const store = storage();
  if (!store) {
    return;
  }
  store.setItem(ADMIN_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

/**
 * Demo-only local configuration (design D8): two toggles held in one signal and
 * mirrored to a single `localStorage` entry, read on init and written on every
 * change — so a reload re-hydrates the toggles exactly like `SessionService`
 * re-hydrates the mock session. Nothing reads this state server-side.
 */
@Injectable({ providedIn: 'root' })
export class AdminConfigStore {
  private readonly config = signal<AdminConfig>(readStoredConfig());

  /** Show the demo notice chrome. */
  readonly showDemoNotice = computed(() => this.config().showDemoNotice);

  /** Allow self-service company registration (demo toggle only). */
  readonly allowCompanyRegistration = computed(() => this.config().allowCompanyRegistration);

  setShowDemoNotice(value: boolean): void {
    this.patch({ showDemoNotice: value });
  }

  setAllowCompanyRegistration(value: boolean): void {
    this.patch({ allowCompanyRegistration: value });
  }

  private patch(changes: Partial<AdminConfig>): void {
    const next: AdminConfig = { ...this.config(), ...changes };
    this.config.set(next);
    writeStoredConfig(next);
  }
}
