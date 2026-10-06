import type { HomeContent } from './content.types';

/**
 * Landing content. The headline and subhead are in es-AR. The featured sets must point
 * at real entries that exist in `services.ts` and `projects.ts` so `resolve*Slugs`
 * never drop them in the page.
 *
 * ⚠️ PLACEHOLDER DATA. The hero copy and photo below are realistic placeholders, not
 * client data. Replace them before launch: `grep -rn "isPlaceholder" src/`.
 */
export const home = {
  hero: {
    headline: 'Obras y reformas con precio en claro',
    subhead:
      'Reformas integrales, obra nueva, ampliaciones y reparaciones. Presupuesto desglosado por partida, plazos por escrito y un único responsable de obra.',
    image: {
      src: 'https://images.example.com/home/hero.webp',
      alt: 'Fachada de obra terminada con detalles arquitectónicos modernos',
      width: 1600,
      height: 900
    }
  },
  highlights: [
    {
      title: 'Presupuesto desglosado',
      body: 'Te enviamos cada partida por separado, para que sepas exactamente en qué se va tu inversión.'
    },
    {
      title: 'Plazos por escrito',
      body: 'Acordamos la fecha de entrega desde el principio y la cumplimos.'
    },
    {
      title: 'Un único responsable',
      body: 'Siempre hablás con la misma persona, desde el primer contacto hasta la entrega de la obra.'
    }
  ],
  featuredServiceSlugs: ['reformas-integrales', 'obra-nueva', 'ampliaciones'],
  featuredProjectSlugs: ['casa-timber-pilar', 'reforma-depto-palermo', 'ampliacion-san-isidrio'],
  isPlaceholder: true
} as const satisfies HomeContent;
