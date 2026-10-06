import type { Testimonial } from './content.types';

/**
 * Attributed client reviews. Unnamed praise reads as fabricated, so every entry credits an
 * author plus the context the review comes from: the kind of work, or the place it was done.
 *
 * The slugs are NOT free-form: `projects.ts` already ships eight projects that point at these
 * reviews with `testimonialSlug`, so a slug no project references — or a project reference with
 * no review here — is a broken cross-collection link and `content.spec.ts` fails.
 *
 * PLACEHOLDER DATA. Every entry carries `isPlaceholder: true`; the names and quotes below are
 * fictional. Replace them before launch, keeping the slug references intact:
 * `grep -rn "isPlaceholder" src/`.
 */
export const testimonials = [
  {
    slug: 'opinion-ricardo-buschiazzo',
    author: 'Ricardo Buschiazzo',
    context: 'Casa timber en Pilar y galpón depósito en Quilmes',
    rating: 5,
    text: 'Dos obras con ellos y las dos cerraron con el presupuesto original. En la casa de Pilar respetaron cada fecha del cronograma.',
    isPlaceholder: true
  },
  {
    slug: 'opinion-maria-fernandez',
    author: 'María Fernández',
    context: 'Reforma integral en Palermo y reforma de cocina en Belgrano',
    rating: 5,
    text: 'Después de dos constructores que me dejaron a medias, acá vi el presupuesto partida por partida y cada cambio de precio avisado antes.',
    isPlaceholder: true
  },
  {
    slug: 'opinion-natalia-correa',
    author: 'Natalia Correa',
    context: 'Vivienda multifamiliar en Villa Urquiza',
    rating: 4,
    text: 'El trabajo de terminaciones es impecable y las unidades se entregaron al día. Pedí un cuarto más y lo resolvieron sin mover el cronograma.',
    isPlaceholder: true
  },
  {
    slug: 'opinion-diego-sosa',
    author: 'Diego Sosa',
    context: 'Oficina en Microcentro y restauración de casa de estilo en Palermo',
    rating: 5,
    text: 'Restaurar una casa de estilo de los treinta sin perder las molduras originales es un riesgo enorme. El equipo tuvo cuidado con cada detalle.',
    isPlaceholder: true
  },
  {
    slug: 'opinion-lucia-martinez',
    author: 'Lucía Martínez',
    context: 'Ampliación de vivienda en San Isidro',
    rating: 5,
    text: 'Ampliar con la familia adentro es un tema aparte. Mantuvieron el resto de la casa limpio y nos comunicaron el avance cada semana.',
    isPlaceholder: true
  }
] as const satisfies readonly Testimonial[];
