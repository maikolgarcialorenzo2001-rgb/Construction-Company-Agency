import type { Service } from './content.types';

/**
 * The service catalog: what the company sells, what each job includes, how long it
 * takes and what it usually costs. Array order IS the display order (`/servicios`
 * renders it as declared), so no `order` field exists and the order cannot drift.
 *
 * `relatedProjectSlugs` is the proof half of every entry: it points at real work in
 * `projects.ts`, and `content.spec.ts` fails if a reference ever dangles.
 *
 * ⚠️ PLACEHOLDER DATA. Every entry carries `isPlaceholder: true` and the copy, prices
 * and image URLs below are realistic placeholders, not client data. Replace them before
 * launch: `grep -rn "isPlaceholder" src/`.
 */
export const services = [
  {
    slug: 'reformas-integrales',
    name: 'Reformas integrales',
    summary:
      'Renovamos departamentos y casas completas: abrimos espacios, renovamos las instalaciones y terminamos cada ambiente, con un presupuesto desglosado por partida.',
    includes: [
      'Demolición controlada y retiro de escombros',
      'Apertura de ambientes y refuerzo de la estructura existente',
      'Instalaciones eléctricas, sanitarias y de gas completas',
      'Pisos, revestimientos, cielorrasos y carpintería',
      'Pintura final y limpieza de obra'
    ],
    typicalDuration: '3 a 4 meses',
    budgetRange: {
      min: 18000000,
      max: 34000000,
      currency: 'ARS',
      note: 'valores de referencia para 90 m² en CABA'
    },
    image: {
      src: 'https://images.example.com/servicios/reformas-integrales.webp',
      alt: 'Dos operarios abriendo una pared de un departamento en obra',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: [
      'reforma-depto-palermo',
      'reforma-cocina-belgrano',
      'ampliacion-san-isidrio'
    ],
    isPlaceholder: true
  },
  {
    slug: 'obra-nueva',
    name: 'Obra nueva',
    summary:
      'Viviendas y edificaciones desde la cimentación hasta la llave en mano, con proyecto propio o sobre la base que nos entrega el cliente.',
    includes: [
      'Cimentación y estructura de hormigón armado',
      'Mampostería, nucleos y cubierta',
      'Instalaciones completas y tablero de distribución',
      'Terminaciones, carpintería y pintura',
      'Tramitación de la documentación para la radicación'
    ],
    typicalDuration: '9 a 12 meses',
    budgetRange: {
      min: 420000,
      max: 780000,
      currency: 'USD',
      note: 'por m² terminado, sin amenities'
    },
    image: {
      src: 'https://images.example.com/servicios/obra-nueva.webp',
      alt: 'Estructura de hormigón de una vivienda en construcción',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: ['casa-timber-pilar', 'vivienda-multifamiliar-urquiza'],
    isPlaceholder: true
  },
  {
    slug: 'ampliaciones',
    name: 'Ampliaciones',
    summary:
      'Sumamos un ambiente, un piso o una cochera a una casa existente sin perder lo que ya está construido, cuidando las medianeras.',
    includes: [
      'Estudio de estructura y verificación de los cimientos existentes',
      'Cálculo y ejecución de la ampliación',
      'Cubierta, impermeabilización y desagües pluviales',
      'Interior de la ampliación a la altura de la casa existente',
      'Conexión de las instalaciones al sistema actual'
    ],
    typicalDuration: '4 a 6 meses',
    budgetRange: {
      min: 24000000,
      max: 52000000,
      currency: 'ARS',
      note: 'valores de referencia para 60 m² agregados'
    },
    image: {
      src: 'https://images.example.com/servicios/ampliaciones.webp',
      alt: 'Ampliación en construcción sobre una casa existente, con andamios',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: ['ampliacion-san-isidrio', 'casa-timber-pilar'],
    isPlaceholder: true
  },
  {
    slug: 'reparaciones-y-mantenimiento',
    name: 'Reparaciones y mantenimiento',
    summary:
      'Intervenciones puntuales y trabajos programados: filtraciones, humedad, recambios de instalaciones, pintura y mantenimiento preventivo.',
    includes: [
      'Diagnóstico en sitio con informe escrito',
      'Reparación de filtraciones y humedades',
      'Recambio y upgrade de instalaciones',
      'Pintura de ambientes puntuales',
      'Plan de mantenimiento anual opcional'
    ],
    typicalDuration: '1 a 3 semanas',
    budgetRange: {
      min: 900000,
      max: 6500000,
      currency: 'ARS',
      note: 'valores de referencia por intervención'
    },
    image: {
      src: 'https://images.example.com/servicios/reparaciones.webp',
      alt: 'Operario reparando una instalación eléctrica de una vivienda',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: ['reforma-cocina-belgrano', 'reforma-depto-palermo'],
    isPlaceholder: true
  },
  {
    slug: 'locales-comerciales-y-oficinas',
    name: 'Locales comerciales y oficinas',
    summary:
      'Adecuación de locales, oficinas y depósitos con tiempos de habilitación controlados y coordinación con los organismos de cada categoría.',
    includes: [
      'Proyecto adaptado al uso y a la normativa vigente',
      'Instalaciones específicas para la actividad comercial',
      'Adecuación y terminaciones de alto tránsito',
      'Coordinación de la habilitación y de las inspecciones',
      'Señalética y climatización del área de atención'
    ],
    typicalDuration: '5 a 7 meses',
    budgetRange: {
      min: 52000,
      max: 96000,
      currency: 'USD',
      note: 'por m² de superficie terminada'
    },
    image: {
      src: 'https://images.example.com/servicios/comercial.webp',
      alt: 'Oficina en obra con instalación eléctrica y tabiquería en construcción',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: ['oficina-microcentro', 'galpon-quilmes'],
    isPlaceholder: true
  },
  {
    slug: 'proyectos-y-direccion-de-obra',
    name: 'Proyectos y dirección de obra',
    summary:
      'Para quien ya tiene proyecto pero quiere ejecutarlo con un responsable único: dirigimos su obra, controlamos el costo y rendimos en plazo.',
    includes: [
      'Revisión y ajuste del proyecto que nos entregás',
      'Presupuesto desglosado y seguimiento mensual',
      'Control de calidad y cumplimiento de normas',
      'Coordinación de oficios y proveedores',
      'Informes de avance con fotos y medición de avance'
    ],
    typicalDuration: 'Según proyecto',
    budgetRange: {
      min: 9000,
      max: 22000,
      currency: 'USD',
      note: 'honorarios por mes de dirección de obra'
    },
    image: {
      src: 'https://images.example.com/servicios/direccion-de-obra.webp',
      alt: 'Ingeniero revisando planos junto a un capataz en una obra',
      width: 1200,
      height: 900
    },
    relatedProjectSlugs: ['casa-patronales', 'vivienda-multifamiliar-urquiza'],
    isPlaceholder: true
  }
] as const satisfies readonly Service[];
