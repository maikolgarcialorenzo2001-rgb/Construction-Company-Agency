import type { Page, Post, PostInput } from '../domain';
import { FEED_POSTS, paginate } from '../mocks/fixtures';
import type { FeedGateway } from './ports';

/**
 * In-memory `FeedGateway`. The seeded timeline is deterministic; every call to
 * `timeline` re-paginates the same store so posts created in the demo session
 * show up immediately (zoneless stores read the promise result into a signal).
 */
export class MockFeedGateway implements FeedGateway {
  private readonly posts: Post[] = [...FEED_POSTS];
  private sequence = 0;

  async timeline(page = 1, pageSize = 20): Promise<Page<Post>> {
    return paginate(this.posts, page, pageSize);
  }

  async create(input: PostInput): Promise<Post> {
    const post: Post = {
      // The mock has no session: the composer is company-gated, and the demo
      // company is `company-1` (see fixtures).
      authorId: 'company-1',
      id: `post-new-${++this.sequence}`,
      content: input.content,
      attachments: input.attachments,
      createdAt: new Date().toISOString()
    };
    this.posts.push(post);
    return post;
  }
}
