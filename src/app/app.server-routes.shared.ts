/**
 * Pure enumeration helpers shared by the server route table (`app.routes.server.ts`).
 *
 * Deliberately free of any `@angular/ssr` import so the jsdom specs can exercise the
 * derivation directly: the guard must fail on a broken derivation, not on a package
 * that only exists in the build. Every value here is computed from its arguments —
 * never from a hardcoded route or slug count.
 */

/**
 * The prerenderable static paths from the browser route table: everything except the
 * wildcard (which must never be prerendered, Req 1) and the `:param` routes (those get
 * their own entries with `getPrerenderParams`).
 */
export const prerenderStaticPaths = (routePaths: readonly string[]): string[] =>
  routePaths.filter((path) => path !== '**' && !path.includes(':'));

/**
 * `{ slug }` param objects for `getPrerenderParams`, one per content entry. The build
 * expands `servicios/:slug` (and friends) over this list, so adding a slug to
 * `src/content` adds a prerendered page with zero route-table edits.
 */
export const slugParams = <T extends { readonly slug: string }>(
  entries: readonly T[]
): Record<string, string>[] => entries.map((entry) => ({ slug: entry.slug }));
