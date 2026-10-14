/**
 * Post-build verification for the `/previa` preview showcase (W-p13-1).
 *
 * `scripts/verify-prerender.ts` deliberately does NOT cover `/previa`: the route is
 * `NOINDEX` (no JSON-LD, no canonical contract), so it must stay out of that script's
 * `STATIC_PATHS`. That left the strongest R1 guarantee, "the prerendered preview is a
 * non-empty snapshot", verified only by hand.
 *
 * This script closes that gap WITHOUT touching `verify-prerender.ts`: it reads the built
 * `/previa` and `/previa/:role` HTML and asserts each is a non-empty fixture snapshot,
 * carries `robots=noindex`, never leaks the demo credential, and renders EVERY expected
 * row (not just one).
 *
 * Run with Bun (runs TS natively): `bun scripts/verify-previa.ts`.
 * Exit code is non-zero on ANY failure, with one line per failed assertion.
 * `VERIFY_PREVIA_DIST` overrides the browser output root (used to prove the failure path).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  APPLICATIONS,
  COMPANY_PROFILES,
  DEMO_ACCOUNTS,
  FEED_POSTS,
  JOBS,
  WORKER_PROFILES
} from '../src/app/core/platform/mocks/fixtures';
import {
  FALLBACK_VACANCY_LABEL,
  PREVIEW_ROLES
} from '../src/app/core/platform/preview/preview-fixtures';

/** The credential that must never reach any built page. */
const DEMO_PASSWORD = 'demo1234';

/** Browser output root; override only for failure-path proof runs. */
const resolveDistRoot = (): string => {
  const direct = join('dist', 'browser');
  if (existsSync(direct)) return direct;
  // Angular 22 with SSR emits dist/<project>/browser — adapt instead of assuming.
  const distDir = join('dist');
  if (existsSync(distDir)) {
    for (const entry of readdirSync(distDir)) {
      const candidate = join(distDir, entry, 'browser');
      if (existsSync(candidate)) return candidate;
    }
  }
  return direct; // existence check below reports the missing root clearly
};
const DIST_ROOT = process.env.VERIFY_PREVIA_DIST ?? resolveDistRoot();

const REPO_ROOT = process.cwd();

const failures: string[] = [];

const fail = (label: string, message: string): void => {
  failures.push(`✗ ${label}: ${message}`);
};

/** Minimal HTML-entity decode so interpolated fixture text compares against the markup. */
const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const countOccurrences = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

/** Reads `<tag key="value">` from a single markup tag, attribute-order independent. */
const attr = (tag: string, key: string): string | undefined =>
  tag.match(new RegExp(`\\b${key}=["']([^"']*)["']`, 'i'))?.[1];

/** Finds the `<meta>` whose `name` matches, regardless of attribute order. */
const metaTagNamed = (html: string, name: string): string | undefined => {
  const re = /<meta\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if ((attr(match[0], 'name') ?? '').toLowerCase() === name) return match[0];
  }
  return undefined;
};

/** The built HTML of one preview route, or `null` when the file is missing. */
const readPage = (route: string): string | null => {
  const file = join(DIST_ROOT, route, 'index.html');
  if (!existsSync(file)) {
    fail(route, `preview HTML missing at ${relative(REPO_ROOT, file)}`);
    return null;
  }
  return readFileSync(file, 'utf8');
};

/** Asserts the page renders exactly `expected` rows for `testId` (an empty shell has 0). */
const expectRowCount = (label: string, html: string, testId: string, expected: number): void => {
  const found = countOccurrences(html, `data-testid="${testId}"`);
  if (found !== expected) fail(label, `expected ${expected} × "${testId}", found ${found}`);
};

/** Asserts the page carries a `robots` meta whose content includes `noindex`. */
const expectNoindex = (label: string, html: string): void => {
  const tag = metaTagNamed(html, 'robots');
  if (!tag) {
    fail(label, 'no robots meta found');
    return;
  }
  const content = attr(tag, 'content') ?? '';
  if (!/noindex/i.test(content)) fail(label, `robots is not noindex: "${content}"`);
};

/**
 * The invariant assertions every preview page must satisfy. `needles` are fixture-derived
 * strings that MUST appear; the check fails loudly if a page yields no data needle at all,
 * so a silently-empty page can never pass.
 */
const checkPage = (label: string, html: string, needles: readonly (string | undefined)[]): void => {
  if (!html.trim()) {
    fail(label, 'page is empty');
    return;
  }
  const decoded = decodeEntities(html);

  if (!decoded.includes('Modo previa')) fail(label, 'missing the showcase heading "Modo previa"');
  expectNoindex(label, html);
  if (decoded.includes(DEMO_PASSWORD)) fail(label, `leaks the demo credential "${DEMO_PASSWORD}"`);

  let asserted = 0;
  for (const needle of needles) {
    if (!needle) continue;
    asserted += 1;
    if (!decoded.includes(needle)) fail(label, `missing fixture content: "${needle}"`);
  }
  if (asserted === 0) fail(label, 'no fixture data available to assert (fixtures look empty)');
};

// ── Fixture expectations derived from the seed data (never hardcoded copy). ──
const DEFAULT_ROUTE = 'previa';
const worker = WORKER_PROFILES[0];
const company = COMPANY_PROFILES[0];
const openJobs = JOBS.filter((job) => job.status === 'open');
const vacancies = JOBS.filter((job) => job.companyId === company?.companyId);

/** The display label of an application, mirroring the preview view model (job title or fallback). */
const applicationLabel = (application: (typeof APPLICATIONS)[number]): string =>
  JOBS.find((job) => job.id === application.jobId)?.title ?? FALLBACK_VACANCY_LABEL;

/** Asserts a page contains a heading (decoded). */
const expectHeading = (label: string, decoded: string, heading: string): void => {
  if (!decoded.includes(heading)) fail(label, `missing the heading "${heading}"`);
};

// ── 0. The browser output must exist; a missing root is a failure, never a skip. ──
if (!existsSync(DIST_ROOT)) {
  fail('dist', `browser output root missing: ${DIST_ROOT}`);
} else {
  // ── 1. The default `/previa` view renders EVERY feed post, open job and both profiles. ──
  const defaultHtml = readPage(DEFAULT_ROUTE);
  if (defaultHtml !== null) {
    expectRowCount(DEFAULT_ROUTE, defaultHtml, 'previa-feed-post', FEED_POSTS.length);
    expectRowCount(DEFAULT_ROUTE, defaultHtml, 'previa-job', openJobs.length);
    checkPage(DEFAULT_ROUTE, defaultHtml, [
      ...FEED_POSTS.map((post) => post.content),
      ...openJobs.map((job) => job.title),
      worker?.fullName,
      worker?.bio,
      company?.name,
      company?.description
    ]);
    if (!defaultHtml.includes('data-testid="preview-role-switcher"')) {
      fail(DEFAULT_ROUTE, 'the role switcher is missing');
    }
  }

  // ── 2. Each `/previa/:role` view renders its full role-specific section. ──
  for (const role of PREVIEW_ROLES) {
    const route = `${DEFAULT_ROUTE}/${role}`;
    const html = readPage(route);
    if (html === null) continue;

    const decoded = decodeEntities(html);

    switch (role) {
      case 'worker': {
        expectHeading(route, decoded, 'Postulaciones de un trabajador');
        expectRowCount(route, html, 'previa-application', APPLICATIONS.length);
        checkPage(
          route,
          html,
          APPLICATIONS.map((application) => applicationLabel(application))
        );
        break;
      }
      case 'company': {
        expectHeading(route, decoded, 'Vacantes publicadas por una empresa');
        expectRowCount(route, html, 'previa-vacancy', vacancies.length);
        checkPage(
          route,
          html,
          vacancies.map((vacancy) => vacancy.title)
        );
        break;
      }
      case 'admin': {
        expectHeading(route, decoded, 'Directorio de cuentas de demostración');
        expectRowCount(route, html, 'previa-directory-row', DEMO_ACCOUNTS.length);
        checkPage(
          route,
          html,
          DEMO_ACCOUNTS.map((account) => account.email)
        );
        break;
      }
      default: {
        // A role added to PREVIEW_ROLES without a verification branch must never silently pass.
        const exhaustive: never = role;
        fail(route, `no verification defined for preview role "${String(exhaustive)}"`);
      }
    }
  }

  // ── 3. The platform subtree stays client-only: no `plataforma` artifact beside `/previa`. ──
  if (existsSync(join(DIST_ROOT, 'plataforma'))) {
    fail('dist', 'a plataforma artifact exists in the client output');
  }
}

// ── Report. ──
if (failures.length > 0) {
  console.error(`verify-previa: ${failures.length} assertion(s) failed\n`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(
  `PASS · previa pages verified: ${1 + PREVIEW_ROLES.length} (${DEFAULT_ROUTE} + ${PREVIEW_ROLES.join(', ')}) · full row counts · noindex · no demo credential · no plataforma leak`
);
process.exit(0);
