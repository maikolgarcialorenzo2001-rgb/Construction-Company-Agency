import type { Page, Post } from '../domain';
import { FEED_POSTS, paginate } from '../mocks/fixtures';
import { recordJobRequest } from '../mocks/job-request.registry';
import { recordVacancy } from '../mocks/vacancy.registry';
import type { CreatePostDraft, FeedGateway } from './ports';

/**
 * In-memory `FeedGateway`. The seeded timeline is deterministic; every call to
 * `timeline` re-paginates the same store so posts created in the demo session
 * show up immediately (zoneless stores read the promise result into a signal).
 *
 * `create` is author-aware (design D3): the draft carries the session author,
 * and a `job-request`/`vacancy` draft additionally records its structured
 * payload in the matching demo registry — the resolved `Post` stays
 * contract-shaped (no `kind`).
 */
export class MockFeedGateway implements FeedGateway {
  private readonly posts: Post[] = [...FEED_POSTS];
  private sequence = 0;

  async timeline(page = 1, pageSize = 20): Promise<Page<Post>> {
    return paginate(this.posts, page, pageSize);
  }

  async create(draft: CreatePostDraft): Promise<Post> {
    const post: Post = {
      authorId: draft.authorId,
      id: `post-new-${++this.sequence}`,
      content: draft.content,
      attachments: draft.attachments,
      createdAt: new Date().toISOString()
    };
    this.posts.push(post);
    if (draft.kind === 'job-request' && draft.jobRequest) {
      recordJobRequest(post.id, draft.jobRequest);
    }
    if (draft.kind === 'vacancy' && draft.vacancy) {
      recordVacancy(post.id, draft.vacancy);
    }
    return post;
  }
}
