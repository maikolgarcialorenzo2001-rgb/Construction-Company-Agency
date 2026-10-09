import type { Application, ApplicationInput, Page } from '../domain';
import { APPLICATIONS, paginate } from '../mocks/fixtures';
import type { ApplicationsFilter, ApplicationsGateway } from './ports';

/** In-memory `ApplicationsGateway`: seeded history plus demo-session creates. */
export class MockApplicationsGateway implements ApplicationsGateway {
  private readonly applications: Application[] = [...APPLICATIONS];
  private sequence = 0;

  async create(input: ApplicationInput): Promise<Application> {
    const application: Application = {
      id: `app-new-${++this.sequence}`,
      jobId: input.jobId,
      // The mock has no session; S4's apply flow runs as the demo worker.
      applicantId: 'worker-1',
      message: input.message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.applications.push(application);
    return application;
  }

  async list(filter: ApplicationsFilter = {}): Promise<Page<Application>> {
    const filtered = this.applications.filter(
      (application) =>
        (filter.jobId === undefined || application.jobId === filter.jobId) &&
        (filter.status === undefined || application.status === filter.status)
    );
    return paginate(filtered);
  }
}
