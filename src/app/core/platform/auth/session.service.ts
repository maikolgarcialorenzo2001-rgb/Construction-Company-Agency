import { computed, inject, Injectable, signal } from '@angular/core';

import type { RegisterInput } from '../api/ports';
import { AUTH_GATEWAY } from '../api/ports';
import type { User } from '../domain';

/**
 * The local mock session (design decision #4). It is deliberately demo-honest:
 * the state is a signal, the `AuthGateway` adapter is in-memory (no HTTP), and
 * the only persistence is a JSON blob in `localStorage` so a reload keeps the
 * demo signed in. There is no token validation, no expiry and no server round
 * trip — the platform chrome says "Modo demo" precisely because of this.
 */

/** `localStorage` key of the persisted mock session. Exported for tests. */
export const SESSION_STORAGE_KEY = 'constructora.platform.session';

/** The persisted payload: the mock token plus the resolved user. */
export interface StoredSession {
  readonly token: string;
  readonly user: User;
}

/** Reads the storage defensively: absent in SSR, string is untrusted. */
const readStoredSession = (): StoredSession | null => {
  const store = storage();
  if (!store) {
    return null;
  }
  try {
    const raw = store.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed?.user?.userId && parsed.user.role ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredSession = (session: StoredSession | null): void => {
  const store = storage();
  if (!store) {
    return;
  }
  if (session) {
    store.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    store.removeItem(SESSION_STORAGE_KEY);
  }
};

/** `localStorage` is undefined during SSR/prerender; platform is client-only. */
const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(AUTH_GATEWAY);
  private readonly session = signal<StoredSession | null>(readStoredSession());

  /** The signed-in user, or `null` for an anonymous visitor. */
  readonly currentUser = computed(() => this.session()?.user ?? null);

  /** The session role, or `null` when anonymous. Feeds the pages' `role` input. */
  readonly role = computed(() => this.session()?.user.role ?? null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  async login(email: string, password: string): Promise<User> {
    const authenticated = await this.auth.login(email, password);
    const user = await this.auth.me();
    this.persist({ token: authenticated.token, user });
    return user;
  }

  async register(input: RegisterInput): Promise<User> {
    const registered = await this.auth.register(input);
    const user: User = { userId: registered.userId, email: input.email, role: input.role };
    this.persist({ token: registered.token, user });
    return user;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.persist(null);
  }

  private persist(session: StoredSession | null): void {
    writeStoredSession(session);
    this.session.set(session);
  }
}
