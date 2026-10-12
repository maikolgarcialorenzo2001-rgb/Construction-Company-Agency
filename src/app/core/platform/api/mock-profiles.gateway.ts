import type {
  CompanyProfile,
  CompanyProfileInput,
  WorkerProfile,
  WorkerProfileInput
} from '../domain';
import { COMPANY_PROFILES, WORKER_PROFILES } from '../mocks/fixtures';
import type { ProfilesGateway } from './ports';

/**
 * In-memory `ProfilesGateway`. Updates merge into the stored profile and bump
 * `updatedAt`, so a write followed by a read round-trips (the mock "persists"
 * within the demo session — no network involved).
 */
export class MockProfilesGateway implements ProfilesGateway {
  private readonly workers = new Map<string, WorkerProfile>(
    WORKER_PROFILES.map((profile): [string, WorkerProfile] => [profile.userId, profile])
  );
  private readonly companies = new Map<string, CompanyProfile>(
    COMPANY_PROFILES.map((profile): [string, CompanyProfile] => [profile.companyId, profile])
  );

  async worker(userId: string): Promise<WorkerProfile | null> {
    return this.workers.get(userId) ?? null;
  }

  async updateWorker(userId: string, input: WorkerProfileInput): Promise<WorkerProfile> {
    const existing = this.workers.get(userId);
    if (!existing) {
      throw new Error('Perfil no encontrado');
    }
    const updated: WorkerProfile = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.workers.set(userId, updated);
    return updated;
  }

  async company(companyId: string): Promise<CompanyProfile | null> {
    return this.companies.get(companyId) ?? null;
  }

  async updateCompany(companyId: string, input: CompanyProfileInput): Promise<CompanyProfile> {
    const existing = this.companies.get(companyId);
    if (!existing) {
      throw new Error('Perfil no encontrado');
    }
    const updated: CompanyProfile = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString()
    };
    this.companies.set(companyId, updated);
    return updated;
  }
}
