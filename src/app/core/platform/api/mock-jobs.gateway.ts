import type { JobOpening, Page } from '../domain';
import { JOBS, paginate } from '../mocks/fixtures';
import type { JobsGateway } from './ports';

/** In-memory `JobsGateway` over the seeded openings. */
export class MockJobsGateway implements JobsGateway {
  private readonly jobs: JobOpening[] = [...JOBS];

  async list(page = 1, pageSize = 20): Promise<Page<JobOpening>> {
    return paginate(this.jobs, page, pageSize);
  }

  async byId(id: string): Promise<JobOpening | null> {
    return this.jobs.find((job) => job.id === id) ?? null;
  }
}
