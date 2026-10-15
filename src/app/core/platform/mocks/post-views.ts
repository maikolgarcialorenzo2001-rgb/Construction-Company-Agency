/**
 * Pure mapper from the contract-shaped `Post` to the demo-only `PostView`
 * (design D2): the feed template never sees a raw `authorId`. Author names and
 * roles are denormalized from the seeded profiles by key — `WORKER_PROFILES`
 * (by `userId`) then `COMPANY_PROFILES` (by `companyId`) — mirroring the
 * `preview-fixtures` join precedent. No Angular imports, no side effects, so
 * this stays trivially testable and usable from a `computed()`.
 */
import type { Post, PostView, Role } from '../domain';
import { COMPANY_PROFILES, WORKER_PROFILES } from './fixtures';

/** es-AR label shown when a post references an author with no fixture profile. */
export const FALLBACK_AUTHOR_NAME = 'Perfil no disponible';

/** The display data resolved for a post's author. */
interface ResolvedAuthor {
  name: string;
  role: Role;
}

/**
 * Resolves a post's author to a display name + role from the seeded profiles.
 * An unknown id falls back to a labeled placeholder (never the raw id).
 */
const resolveAuthor = (authorId: string): ResolvedAuthor => {
  const worker = WORKER_PROFILES.find((profile) => profile.userId === authorId);
  if (worker) {
    return { name: worker.fullName, role: worker.role };
  }

  const company = COMPANY_PROFILES.find((profile) => profile.companyId === authorId);
  if (company) {
    return { name: company.name, role: company.role };
  }

  return { name: FALLBACK_AUTHOR_NAME, role: 'worker' };
};

/** Maps one contract-shaped `Post` into the denormalized demo view-model. */
export const toPostView = (post: Post): PostView => {
  const author = resolveAuthor(post.authorId);

  return {
    id: post.id,
    kind: 'standard',
    authorId: post.authorId,
    authorName: author.name,
    authorRole: author.role,
    content: post.content,
    attachments: post.attachments ?? [],
    createdAt: post.createdAt
  };
};
