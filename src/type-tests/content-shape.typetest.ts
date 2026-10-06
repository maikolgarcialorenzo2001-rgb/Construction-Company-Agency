import type { Service } from '../content/content.types';

/**
 * content-model Req 1 (negative contract): an out-of-shape entry MUST be a compile
 * error, not a runtime surprise. The `@ts-expect-error` below is that check — if the
 * content schema ever loosens until this object stops being an error, TypeScript
 * reports TS2578 ("Unused '@ts-expect-error' directive") and the build fails.
 *
 * This file sits under `src/`, so the same build that validates the real content
 * modules (tsconfig.app.json, every non-spec file) validates this one too — but
 * nothing imports it, so it never reaches the bundle.
 */
// @ts-expect-error: out-of-shape content entry — required fields missing (content-model Req 1)
export const outOfShapeService = { slug: 'obra-sin-todos-los-campos' } as const satisfies Service;