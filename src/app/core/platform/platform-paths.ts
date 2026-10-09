/**
 * The platform subtree lives under a single URL prefix. One prefix means one prerender
 * exclusion, one noindex rule and one chrome/CTA rule, all boundary-exact so a
 * marketing path that merely starts with the same letters (`plataformas-curso`) is
 * never swallowed.
 *
 * Pure and dependency-free: imported by the browser route table, the server route table
 * and the URL-aware shell chrome.
 */

/** Top-level path of the platform subtree. */
export const PLATFORM_PREFIX = 'plataforma';

/**
 * Boundary-exact prefix test: matches the prefix itself and the prefix followed by `/`,
 * never a longer word that merely shares the first letters.
 */
export const isWithinPrefix = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

/**
 * Whether a router URL belongs to the platform subtree. Strips a leading/trailing slash
 * and any query/hash so `/plataforma/trabajos?id=1` and `/plataforma/` both resolve to
 * the subtree, while `/plataformas-curso` does not.
 */
export const isPlatformPath = (url: string): boolean => {
  const [path] = url.split(/[?#]/);
  return isWithinPrefix(path.replace(/^\/+|\/+$/g, ''), PLATFORM_PREFIX);
};
