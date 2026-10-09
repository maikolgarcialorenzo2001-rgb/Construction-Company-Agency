import type { User } from '../domain';
import { DEMO_ACCOUNTS } from '../mocks/fixtures';
import type { AuthGateway, AuthenticatedSession, RegisterInput, RegisteredSession } from './ports';

interface StoredAccount {
  userId: string;
  email: string;
  password: string;
  role: User['role'];
}

/**
 * Local mock auth: no network, state lives in the adapter instance. This is
 * exactly what the "Modo demo" chrome promises — registration and login are a
 * demo affordance, never a real credential store.
 */
export class MockAuthGateway implements AuthGateway {
  private readonly accounts: StoredAccount[] = DEMO_ACCOUNTS.map((account) => ({
    userId: account.userId,
    email: account.email,
    password: account.password,
    role: account.role
  }));
  private current: User | null = null;
  private sequence = 0;

  async register(input: RegisterInput): Promise<RegisteredSession> {
    if (this.accounts.some((account) => account.email === input.email)) {
      throw new Error('Ya existe una cuenta con ese email');
    }
    const user: User = {
      userId: `user-new-${++this.sequence}`,
      email: input.email,
      role: input.role
    };
    this.accounts.push({ ...user, password: input.password });
    this.current = user;
    return { userId: user.userId, token: `mock-token-${user.userId}` };
  }

  async login(email: string, password: string): Promise<AuthenticatedSession> {
    const account = this.accounts.find(
      (candidate) => candidate.email === email && candidate.password === password
    );
    if (!account) {
      throw new Error('Credenciales inválidas');
    }
    this.current = { userId: account.userId, email: account.email, role: account.role };
    return { token: `mock-token-${account.userId}`, role: account.role };
  }

  async logout(): Promise<void> {
    this.current = null;
  }

  async me(): Promise<User> {
    if (!this.current) {
      throw new Error('No autenticado');
    }
    return this.current;
  }
}
