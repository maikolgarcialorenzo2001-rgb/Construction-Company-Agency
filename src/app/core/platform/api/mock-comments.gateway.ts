import type { Comment, CommentInput } from '../domain';
import { COMMENTS } from '../mocks/fixtures';
import type { CommentsGateway } from './ports';

/**
 * In-memory `CommentsGateway`, mirroring `MockFeedGateway` conventions
 * (synthetic id, `new Date().toISOString()`, hard-coded demo author). Reads
 * return copies so callers cannot mutate the internal list; `create` appends
 * to the store so later `list` calls see the new comment (zoneless stores
 * paint the gateway result into a signal).
 */
export class MockCommentsGateway implements CommentsGateway {
  private static seq = 0;
  private readonly comments: Comment[] = [...COMMENTS];

  async list(postId: string): Promise<Comment[]> {
    return this.comments
      .filter((comment) => comment.postId === postId)
      .map((comment) => ({ ...comment }));
  }

  async create(input: CommentInput): Promise<Comment> {
    const comment: Comment = {
      id: `comment-new-${++MockCommentsGateway.seq}`,
      postId: input.postId,
      // The mock has no session: composer runs as the demo worker (see fixtures).
      authorId: 'worker-1',
      authorName: 'Demo Worker',
      authorRole: 'worker',
      body: input.body.trim(),
      createdAt: new Date().toISOString()
    };
    this.comments.push(comment);
    return { ...comment };
  }
}