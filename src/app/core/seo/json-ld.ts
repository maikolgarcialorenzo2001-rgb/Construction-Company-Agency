import type { Site } from '../../../content/content.types';

/**
 * The JSON-LD projection of the site payload: a whitelist of schema.org fields built
 * field by field. The content graph carries internal markers (`isPlaceholder`,
 * credentials, the display phone) that MUST NOT reach the machine-readable layer, so
 * this module never spreads `site` — every shipped key is declared here.
 */

/** schema.org `DayOfWeek` enumeration. */
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/**
 * Translation layer from the es-AR `OpeningHours.days` label (human copy) to the
 * schema.org enumeration (machine-readable). An undeclared label keeps its
 * `description` and simply ships without `dayOfWeek` instead of inventing one.
 */
const DAY_OF_WEEK: Readonly<Record<string, readonly DayOfWeek[]>> = {
  'Lunes a viernes': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  'Sábados': ['Saturday'],
  'Domingos': ['Sunday']
};

export interface PostalAddressJsonLd {
  readonly '@type': 'PostalAddress';
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly addressRegion: string;
  readonly postalCode: string;
  readonly addressCountry: string;
}

export interface OpeningHoursSpecificationJsonLd {
  readonly '@type': 'OpeningHoursSpecification';
  readonly description: string;
  readonly opens: string;
  readonly closes: string;
  readonly dayOfWeek?: readonly DayOfWeek[];
}

export interface AreaServedJsonLd {
  readonly '@type': 'AdministrativeArea';
  readonly identifier: string;
  readonly name: string;
}

export interface BusinessJsonLd {
  readonly '@context': 'https://schema.org';
  readonly '@type': readonly ('HomeAndConstructionBusiness' | 'GeneralContractor')[];
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly image: readonly string[];
  readonly logo: string;
  readonly telephone: string;
  readonly email: string;
  readonly address: PostalAddressJsonLd;
  readonly openingHoursSpecification: readonly OpeningHoursSpecificationJsonLd[];
  readonly areaServed: readonly AreaServedJsonLd[];
  readonly sameAs: readonly string[];
}

/**
 * Builds the `HomeAndConstructionBusiness` graph for one route.
 *
 * @param pageUrl Canonical absolute URL of the current route; JSON-LD must describe
 * the page it ships on, so the caller (SeoService) owns the URL.
 */
export const buildJsonLd = (site: Site, pageUrl: string): BusinessJsonLd => ({
  '@context': 'https://schema.org',
  '@type': ['HomeAndConstructionBusiness', 'GeneralContractor'],
  name: site.nap.name,
  description: site.story,
  url: pageUrl,
  image: [site.ogImage.src],
  logo: site.logo.src,
  telephone: site.nap.phoneE164,
  email: site.nap.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.nap.streetAddress,
    addressLocality: site.nap.locality,
    addressRegion: site.nap.region,
    postalCode: site.nap.postalCode,
    addressCountry: site.nap.country
  },
  openingHoursSpecification: site.hours.map((entry) => {
    const dayOfWeek = DAY_OF_WEEK[entry.days];
    return {
      '@type': 'OpeningHoursSpecification',
      description: entry.days,
      opens: entry.opens,
      closes: entry.closes,
      ...(dayOfWeek === undefined ? {} : { dayOfWeek })
    };
  }),
  areaServed: site.areasServed.map((area) => ({
    '@type': 'AdministrativeArea',
    identifier: area.slug,
    name: area.name
  })),
  sameAs: [site.googleBusinessProfileUrl]
});
