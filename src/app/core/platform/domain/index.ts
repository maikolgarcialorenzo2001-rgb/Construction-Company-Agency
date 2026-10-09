/**
 * Domain barrel: the single import surface for gateway ports, stores and pages.
 *
 * Importing through here keeps the domain types in the application's runtime
 * module graph; the contract binding itself lives in `contract-conformance.ts`
 * (type-only, enforced by the build program — see its header).
 */
export * from './models';
