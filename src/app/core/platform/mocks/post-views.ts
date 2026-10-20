/**
 * Pure view-model helpers for the demo feed (design D2): the mapper from the
 * contract-shaped `Post` to the demo-only `PostView` denormalizes the author
 * from the seeded profiles by key — `WORKER_PROFILES` (by `userId`) then
 * `COMPANY_PROFILES` (by `companyId`) — mirroring the `preview-fixtures` join
 * precedent, so the feed template never sees a raw `authorId`. The
 * `hasVisibleText`/`isRenderablePostView` predicates own the never-empty rule
 * (WU5) at the same layer. No Angular imports, no side effects, so this stays
 * trivially testable and usable from a `computed()`.
 */
import type { Post, PostView, Role } from '../domain';
import { COMPANY_PROFILES, WORKER_PROFILES } from './fixtures';
import { getJobRequest } from './job-request.registry';

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
  const jobRequest = getJobRequest(post.id);

  return {
    id: post.id,
    kind: jobRequest ? 'job-request' : 'standard',
    authorId: post.authorId,
    authorName: author.name,
    authorRole: author.role,
    content: post.content,
    attachments: post.attachments ?? [],
    createdAt: post.createdAt,
    // A registry miss omits the key entirely (design D2) so the existing
    // `toEqual` specs and `isRenderablePostView` keep holding verbatim.
    ...(jobRequest ? { jobRequest } : {})
  };
};

/**
 * True when `content` carries visible text: whitespace-only counts as blank
 * (p14 WU5 — "posts with no text have no text"). Shared by the template's
 * body-region guard and `isRenderablePostView` so both can never drift apart.
 */
export const hasVisibleText = (content: string): boolean => content.trim() !== '';

/**
 * Never-empty invariant (p14 WU5): a view is renderable only with text, a
 * real image URL, or both. Text-only and image-only are legitimate shapes;
 * only "neither" is invalid, so the feed filters those views out before they
 * can render an empty card. Blank URL entries (`''`) are placeholders, not
 * images, so they do not count toward the invariant.
 */
export const isRenderablePostView = (view: PostView): boolean =>
  hasVisibleText(view.content) || view.attachments.some((url) => hasVisibleText(url));
