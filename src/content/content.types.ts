/**
 * The content schema. These interfaces ARE the content database: every module under
 * `src/content/` is validated against them with `satisfies`, so `tsc` (via
 * `ng build`) is the validator and an out-of-shape entry is a build failure.
 *
 * Every collection entry is `readonly` and ordered by its array position — there is no
 * `order` field, so display order cannot drift. Slugs are kebab-case and unique per
 * collection. Entries that are not real client data carry `isPlaceholder: true`, which
 * keeps the whole content graph auditable with one search (`grep -rn "isPlaceholder" src/`).
 */

export interface ImageAsset {
  /** Absolute external URL. No image binaries live in the repository. */
  readonly src: string;
  /** Non-empty description of the image; an empty alt is a defect. */
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface Area {
  readonly slug: string;
  readonly name: string;
}

export interface OpeningHours {
  readonly days: string;
  /** `HH:mm`, 24h. */
  readonly opens: string;
  /** `HH:mm`, 24h. */
  readonly closes: string;
}

export interface Credentials {
  readonly art: string;
  readonly insurance: string;
  readonly professionalRegistration: string;
  /** `XX-XXXXXXXX-X`. */
  readonly cuit: string;
}

/**
 * Name, address, phone and email. This is the ONLY place these values exist: the shell,
 * the quote form and the JSON-LD projection all read from here, so they cannot drift.
 */
export interface Nap {
  readonly name: string;
  readonly streetAddress: string;
  readonly locality: string;
  readonly region: string;
  readonly postalCode: string;
  readonly country: 'AR';
  /** Human-readable phone, with `+` and grouping. Display only. */
  readonly phoneDisplay: string;
  /** Same phone as bare digits: no `+`, no separators. Source for `wa.me`, `tel:` and JSON-LD. */
  readonly phoneE164: string;
  readonly email: string;
  /** True until the client supplies real NAP data. Release gate, never a build gate. */
  readonly isPlaceholder: boolean;
}

export interface NavItem {
  /** Stable key, unique within `Site.nav`. */
  readonly slug: string;
  /** es-AR section label. */
  readonly label: string;
  /** Absolute router path, e.g. `/servicios`. */
  readonly path: string;
}

export interface Site {
  readonly nap: Nap;
  readonly hours: readonly OpeningHours[];
  readonly credentials: Credentials;
  readonly warranty: string;
  readonly story: string;
  readonly areasServed: readonly Area[];
  readonly googleBusinessProfileUrl: string;
  readonly logo: ImageAsset;
  readonly ogImage: ImageAsset;
  /**
   * Header sections in display order. The quote route is deliberately absent: it is a
   * conversion action rendered by the header, not a navigation section.
   */
  readonly nav: readonly NavItem[];
}

export interface MoneyRange {
  readonly min: number;
  readonly max: number;
  readonly currency: 'ARS' | 'USD';
  readonly note?: string;
}

export interface Service {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly includes: readonly string[];
  readonly typicalDuration: string;
  readonly budgetRange: MoneyRange;
  readonly image: ImageAsset;
  readonly relatedProjectSlugs: readonly string[];
  readonly isPlaceholder?: true;
}

interface BasePhoto {
  readonly image: ImageAsset;
  readonly caption?: string;
}

export type ProjectPhoto =
  | (BasePhoto & { readonly kind: 'before' })
  | (BasePhoto & { readonly kind: 'after' })
  | (BasePhoto & { readonly kind: 'gallery' });

export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly brief: string;
  readonly surfaceAreaM2: number;
  readonly duration: string;
  readonly budgetRange: MoneyRange;
  readonly location: string;
  readonly category: string;
  /** Slug into the testimonials collection. */
  readonly testimonialSlug: string;
  readonly relatedServiceSlugs: readonly string[];
  /** 8-15 entries in P0. `photos[0]` is the hero — never duplicated into another field. */
  readonly photos: readonly ProjectPhoto[];
  readonly isPlaceholder?: true;
}

export interface Testimonial {
  readonly slug: string;
  /** Unnamed praise reads as fabricated, so an author is mandatory. */
  readonly author: string;
  /** City or project type the review comes from. */
  readonly context: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly text: string;
  readonly isPlaceholder?: true;
}

export interface ProcessStep {
  readonly title: string;
  readonly description: string;
  readonly duration: string;
}

export interface HomeContent {
  readonly hero: {
    readonly headline: string;
    readonly subhead: string;
    readonly image: ImageAsset;
  };
  readonly highlights: readonly { readonly title: string; readonly body: string }[];
  readonly featuredServiceSlugs: readonly string[];
  readonly featuredProjectSlugs: readonly string[];
}

export type JobType = 'reforma' | 'obra-nueva' | 'ampliacion' | 'reparacion' | 'comercial' | 'otro';

export type BudgetBracket =
  'sin-definir' | 'hasta-3m' | '3m-8m' | '8m-15m' | 'mas-15m' | 'a-definir';

export type ProjectStage =
  'idea' | 'planificacion' | 'presupuestando' | 'ejecucion' | 'finalizacion';

/**
 * One `<option>` of a quote select. The same object feeds the select and the WhatsApp
 * message label, so the two can never disagree.
 */
export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}
