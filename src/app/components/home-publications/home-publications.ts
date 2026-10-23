/**
 * The home publications projection (p17 slice 3, design §5.2): a PURE selector
 * that keeps ONE publication per kind — the newest of each — sorted newest-first
 * overall, with deterministic ties.
 *
 * No Angular imports, no side effects: trivially testable and usable inside a
 * `computed()`.
 */
import type { PostKind, PostView } from '../../core/platform/domain';

/**
 * Orders two publications newest-first: the higher `createdAt` wins (ISO strings
 * compare lexicographically) and an equal timestamp breaks on the id ascending.
 * The same comparator selects the winner of a kind and orders the final list, so
 * the selection and the display order can never disagree.
 */
const byNewestFirst = (left: PostView, right: PostView): number => {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? 1 : -1;
  }
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
};

/**
 * The most recent publication of each kind present in `views` (at most one per
 * `standard`, `job-request` and `vacancy`), newest-first. A kind with no
 * publication is simply ABSENT: never an empty slot and never a placeholder.
 */
export const mostRecentByKind = (views: readonly PostView[]): PostView[] => {
  const newestByKind = new Map<PostKind, PostView>();

  for (const view of views) {
    const current = newestByKind.get(view.kind);
    if (!current || byNewestFirst(view, current) < 0) {
      newestByKind.set(view.kind, view);
    }
  }

  return [...newestByKind.values()].sort(byNewestFirst);
};
