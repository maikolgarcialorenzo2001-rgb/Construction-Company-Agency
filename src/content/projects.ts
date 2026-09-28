import type { Project } from './content.types';

/**
 * The project showcase: the proof surface of the site. Every entry answers the buyer's
 * real questions: what was wrong, what we built, how long it took, how much it cost and
 * what it looks like finished. Array order IS the display order on `/proyectos`.
 *
 * Photo rules: 8 to 15 entries, at least one `before` and one `after`, and `photos[0]`
 * is always the finished hero, because the card thumbnail and the detail hero read it.
 * It is derived once and never duplicated into another field.
 *
 * ⚠️ PLACEHOLDER DATA. Every entry carries `isPlaceholder: true`; the briefs, figures,
 * budgets and image URLs are realistic placeholders, not client data. Replace them
 * before launch: `grep -rn "isPlaceholder" src/`.
 */
export const projects = [
  {
    slug: 'casa-timber-pilar',
    title: 'Casa timber en Pilar',
    brief:
      'El cliente tenía un terreno de 600 m² en un barrio de Pilar y la idea de una casa de dos plantas. El terreno estaba sin servicios y tenía un árbol grande que había que preservar. Hicimos el estudio de suelos, el proyecto, la estructura de madera y la obra completa, con las instalaciones conectadas a la red.',
    surfaceAreaM2: 210,
    duration: '9 meses',
    budgetRange: { min: 380000, max: 450000, currency: 'USD' },
    location: 'Pilar, Zona Norte',
    category: 'Obra nueva',
    testimonialSlug: 'opinion-ricardo-buschiazzo',
    relatedServiceSlugs: ['obra-nueva', 'ampliaciones', 'proyectos-y-direccion-de-obra'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/hero.webp',
          alt: 'Fachada de la casa timber terminada, con deck y jardín',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'El terreno sin servicios ni nivelación',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/antes-terreno.webp',
          alt: 'Terreno baldío con un árbol existente, antes de empezar la obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Living con doble altura y ventanal al jardín',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/after-living.webp',
          alt: 'Living con doble altura, piso de madera y ventanal al jardín',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Estructura de madera en ejecución',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/estructura.webp',
          alt: 'Montaje de la estructura de madera de la casa en obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Muros y aislamiento',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/muros.webp',
          alt: 'Muros de madera laminada con aislamiento interior',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Cubierta y aislación',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/cubierta.webp',
          alt: 'Ejecución de la cubierta con aislamiento térmico',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Pase de instalaciones',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/instalaciones.webp',
          alt: 'Pase de las instalaciones eléctricas y sanitarias',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Baño de la planta alta',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/bano.webp',
          alt: 'Baño terminado con revestimiento oscuro',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Jardín terminado con deck',
        image: {
          src: 'https://images.example.com/proyectos/casa-timber-pilar/after-jardin.webp',
          alt: 'Jardín terminado con deck de madera y césped',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'reforma-depto-palermo',
    title: 'Reforma integral en Palermo',
    brief:
      'Un departamento de los años 30 estaba partido en ambientes pequeños, con instalación eléctrica de los años 60 y humedad en la medianera. Abrimos la cocina al living, rehacimos las instalaciones completas y terminamos con piso y revestimiento nuevos. La familia con dos chicos vivió en la obra, así que ordenamos el trabajo por etapas.',
    surfaceAreaM2: 96,
    duration: '4 meses',
    budgetRange: { min: 22000000, max: 31000000, currency: 'ARS' },
    location: 'Palermo, CABA',
    category: 'Reforma',
    testimonialSlug: 'opinion-maria-fernandez',
    relatedServiceSlugs: ['reformas-integrales', 'reparaciones-y-mantenimiento'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/hero.webp',
          alt: 'Living del departamento reformado, con la cocina abierta al fondo',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'El departamento antes de la reforma, con los muros originales',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/antes-living.webp',
          alt: 'Ambiente dividido del departamento con la solería original, antes de la reforma',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Cocina abierta al living',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/after-cocina.webp',
          alt: 'Cocina abierta con mesada de piedra y isla central',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Dormitorio principal con vestidor',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/after-dormitorio.webp',
          alt: 'Dormitorio principal terminado con vestidor y luz natural',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Demolición controlada',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/demolicion.webp',
          alt: 'Demolición de un muro divisor con protección del piso',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Refuerzo de vigas existentes',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/vigas.webp',
          alt: 'Enciminado y refuerzo de las vigas de madera existentes',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Pasada de instalaciones',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/instalaciones.webp',
          alt: 'Pase de cañerías eléctricas y sanitarias en la pared',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Baño terminado',
        image: {
          src: 'https://images.example.com/proyectos/reforma-depto-palermo/after-bano.webp',
          alt: 'Baño terminado con revestimiento y arte de baño',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'vivienda-multifamiliar-urquiza',
    title: 'Vivienda multifamiliar en Villa Urquiza',
    brief:
      'Un lote de fondo con una casa de los 60 que había que demoler. Construimos tres viviendas de dos ambientes con cochera y patio común, respetando la altura máxima de la zona. El municipio exigía un expediente por cada unidad, así que lo tramitamos antes de arrancar la obra.',
    surfaceAreaM2: 264,
    duration: '11 meses',
    budgetRange: { min: 480000, max: 560000, currency: 'USD' },
    location: 'Villa Urquiza, CABA',
    category: 'Obra nueva',
    testimonialSlug: 'opinion-natalia-correa',
    relatedServiceSlugs: ['obra-nueva', 'proyectos-y-direccion-de-obra'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/hero.webp',
          alt: 'Fachada de las tres viviendas terminadas, con cochera',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'La casa de los 60 antes de la demolición',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/antes.webp',
          alt: 'Casa de los años 60 en el lote, antes de demoler',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Unidad 1 terminada',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/after-unidad-1.webp',
          alt: 'Interior terminado de la primera unidad, con piso y cocina',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Unidad 2 con balcón al patio',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/after-unidad-2.webp',
          alt: 'Balcón de la segunda unidad con vista al patio común',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Patio común terminado',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/after-patio.webp',
          alt: 'Patio común terminado con jardín y pérgola',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Excavación y fundación',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/fundacion.webp',
          alt: 'Excavación y ejecución de la fundación de las viviendas',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Estructura de hormigón',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/estructura.webp',
          alt: 'Estructura de hormigón armado de las tres viviendas en obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Mampostería y dinteles',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/mamposteria.webp',
          alt: 'Levantado de mampostería y ejecución de dintel en los vanos',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Impermeabilización de cubiertas',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/cubierta.webp',
          alt: 'Ejecución de la impermeabilización de la cubierta',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Terminaciones en avance',
        image: {
          src: 'https://images.example.com/proyectos/vivienda-multifamiliar-urquiza/terminaciones.webp',
          alt: 'Interior de las viviendas con las terminaciones en curso',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'oficina-microcentro',
    title: 'Oficina en Microcentro',
    brief:
      'Un local de 180 m² en un piso de oficinas de 1930, con estructura metálica y ventanas de altura excesiva. El cliente necesitaba un espacio de trabajo para 24 personas más dos salas de reunión, y además quería habilitar la actividad antes de mudarse. Coordinamos el trámite con el municipio para vencerlo en un mes.',
    surfaceAreaM2: 180,
    duration: '6 meses',
    budgetRange: { min: 210000, max: 265000, currency: 'USD' },
    location: 'Microcentro, CABA',
    category: 'Comercial',
    testimonialSlug: 'opinion-diego-sosa',
    relatedServiceSlugs: ['locales-comerciales-y-oficinas', 'proyectos-y-direccion-de-obra'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/hero.webp',
          alt: 'Oficina terminada con los puestos de trabajo y luz natural',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'El local vacío, con los vidrios rotos',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/antes.webp',
          alt: 'Local vacío y deteriorado, antes del inicio de la obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Sala de trabajo terminada',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/after-sala.webp',
          alt: 'Sala de trabajo terminada con puestos y divisorias',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Sala de reuniones',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/after-reunion.webp',
          alt: 'Sala de reuniones terminada con pantalla y mesa larga',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Refuerzo de estructura metálica',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/estructura.webp',
          alt: 'Refuerzo y pintado de la estructura metálica existente',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Demolición de tabiques',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/demolicion.webp',
          alt: 'Demolición de tabiques en el local en obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Instalaciones y ductos',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/instalaciones.webp',
          alt: 'Instalación de aire acondicionado y ductos en el techo',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Piso técnico elevado',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/piso-tecnico.webp',
          alt: 'Ejecución del piso técnico elevado en la oficina',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Aislamiento acústico de las salas',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/aislamiento.webp',
          alt: 'Aislamiento acústico en los tableros de las salas de reunión',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Recepción y señalética',
        image: {
          src: 'https://images.example.com/proyectos/oficina-microcentro/after-recepcion.webp',
          alt: 'Recepción de la oficina terminada con la señalética de la empresa',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'ampliacion-san-isidrio',
    title: 'Ampliación en San Isidro',
    brief:
      'La familia tenía una casa de los 80 con un fondo sin usar y quería sumar una cocina y un garage, manteniendo la altura de la cubierta original. El cálculo estructural de la ampliación contra la cubierta existente reveló un sobreesfuerzo, y lo resolvimos con perfiles metálicos. Cumplimos la altura máxima permitida en la zona.',
    surfaceAreaM2: 85,
    duration: '5 meses',
    budgetRange: { min: 26000000, max: 44000000, currency: 'ARS' },
    location: 'San Isidro, Zona Norte',
    category: 'Ampliación',
    testimonialSlug: 'opinion-lucia-martinez',
    relatedServiceSlugs: ['ampliaciones', 'reformas-integrales'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/hero.webp',
          alt: 'Ampliación terminada con la cocina integrada al fondo de la casa',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'El fondo sin usar de la casa original',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/antes.webp',
          alt: 'Fondo de la casa con césped y sin construcción, antes de la ampliación',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Cocina nueva',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/after-cocina.webp',
          alt: 'Cocina nueva terminada con isla y equipamiento empotrado',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Garage y acceso al fondo',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/after-garage.webp',
          alt: 'Garage terminado con portón y acceso al fondo',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Excavación para la ampliación',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/excavacion.webp',
          alt: 'Excavación de la ampliación en el fondo de la casa',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Perfiles metálicos de la estructura',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/estructura.webp',
          alt: 'Montaje de la estructura metálica de la ampliación',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Cubierta a la altura de la existente',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/cubierta.webp',
          alt: 'Ejecución de la cubierta de la ampliación alineada a la casa original',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Interior integrado terminado',
        image: {
          src: 'https://images.example.com/proyectos/ampliacion-san-isidrio/after-interior.webp',
          alt: 'Interior integrado entre la cocina nueva y la casa original',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'casa-patronales',
    title: 'Restauración de casa de estilo en Palermo',
    brief:
      'Una casa de 1910 en el centro de Palermo, con los muros de ladrillo agrietados, la cubierta con filtraciones y las vigas de madera que habían perdido sección por la humedad. El trabajo fue estructural: reforzamos los muros, reemplazamos las vigas por perfiles de acero y refimos la cubierta, manteniendo intacta la estética original.',
    surfaceAreaM2: 240,
    duration: '10 meses',
    budgetRange: { min: 520000, max: 640000, currency: 'USD' },
    location: 'Palermo, CABA',
    category: 'Estructuras',
    testimonialSlug: 'opinion-diego-sosa',
    relatedServiceSlugs: ['proyectos-y-direccion-de-obra', 'reparaciones-y-mantenimiento'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/hero.webp',
          alt: 'Casa de estilo restaurada, con la fachada de ladrillo visto original',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'La cubierta con filtraciones y las vigas deterioradas',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/antes-cubierta.webp',
          alt: 'Cubierta deteriorada de la casa de estilo, antes de la restauración',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Vigas nuevas de acero',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/after-vigas.webp',
          alt: 'Vigas de acero nuevas que reemplazan la madera deteriorada',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Muro de ladrillo visto reparado',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/after-muro.webp',
          alt: 'Muro de ladrillo visto reparado y rejuntado',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Apuntalamiento de los muros',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/apuntalamiento.webp',
          alt: 'Apuntalamiento provisional de los muros agrietados',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Demolición de la cubierta vieja',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/demolicion.webp',
          alt: 'Demolición de la cubierta anterior de tejas',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Encimillado del dintel',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/encimillado.webp',
          alt: 'Ejecución del encimillado sobre el dintel de la fachada',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Cubierta nueva en ejecución',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/cubierta.webp',
          alt: 'Montaje de la cubierta nueva con aislamiento térmico',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Fachada restaurada',
        image: {
          src: 'https://images.example.com/proyectos/casa-patronales/after-fachada.webp',
          alt: 'Fachada de la casa restaurada con las carpinterías originales',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'galpon-quilmes',
    title: 'Galpón depósito en Quilmes',
    brief:
      'Un predio de 1.200 m² con un galpón de 620 m² de los 70, sin descartar, y el cliente necesitaba un depósito con oficina de administración, muelle de carga y pasillos de circulación. Reforzamos las columnas metálicas, cambiamos la cubierta y ejecutamos el sistema contra incendio. Hoy el galpón está en operación y lleva un año en servicio.',
    surfaceAreaM2: 620,
    duration: '7 meses',
    budgetRange: { min: 260000, max: 315000, currency: 'USD' },
    location: 'Quilmes, Zona Sur',
    category: 'Comercial',
    testimonialSlug: 'opinion-ricardo-buschiazzo',
    relatedServiceSlugs: ['locales-comerciales-y-oficinas', 'obra-nueva'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/hero.webp',
          alt: 'Galpón terminado con las columnas pintadas y la cubierta nueva',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'El galpón de los 70 con la cubierta vencida',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/antes.webp',
          alt: 'Galpón antiguo con la cubierta vencida y el piso deteriorado',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Interior del depósito terminado',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/after-deposito.webp',
          alt: 'Interior del depósito terminado con la franja de circulación pintada',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Muelle de carga',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/after-muelle.webp',
          alt: 'Muelle de carga terminado con la puerta seccional',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Refuerzo de columnas',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/columnas.webp',
          alt: 'Refuerzo de las columnas metálicas del galpón en obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Retiro de la cubierta anterior',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/cubierta-antes.webp',
          alt: 'Retiro de la cubierta de fibrocemento del galpón',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Piso de hormigón alisado',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/piso.webp',
          alt: 'Ejecución del piso de hormigón alisado del depósito',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Sistema contra incendio',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/incendio.webp',
          alt: 'Instalación de la red de hidrantes y rociadores contra incendio',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Oficina de administración',
        image: {
          src: 'https://images.example.com/proyectos/galpon-quilmes/after-oficina.webp',
          alt: 'Oficina de administración terminada dentro del galpón',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  },
  {
    slug: 'reforma-cocina-belgrano',
    title: 'Reforma de cocina en Belgrano',
    brief:
      'Una cocina de 24 m² con una instalación de 1970, sin ventilación y con la mesada de madera agrietada. La familia no podía mudarse, así que lo hicimos en tres etapas de una semana y siempre con la cocina operativa: montamos una cocina temporaria en el living y entregamos la definitiva en nueve semanas.',
    surfaceAreaM2: 45,
    duration: '9 semanas',
    budgetRange: { min: 8500000, max: 12500000, currency: 'ARS' },
    location: 'Belgrano, CABA',
    category: 'Reforma',
    testimonialSlug: 'opinion-maria-fernandez',
    relatedServiceSlugs: ['reformas-integrales', 'reparaciones-y-mantenimiento'],
    photos: [
      {
        kind: 'after',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/hero.webp',
          alt: 'Cocina nueva terminada con mesada de piedra y alacenas',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'before',
        caption: 'La cocina original con la mesada agrietada',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/antes.webp',
          alt: 'Cocina original con mesada de madera agrietada y alacenas antiguas',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Mesada y alacenas nuevas',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/after-mesonada.webp',
          alt: 'Mesada de piedra con alacenas nuevas y electrodomésticos empotrados',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Cocina temporaria en el living',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/after-temporaria.webp',
          alt: 'Cocina temporaria montada en el living durante la obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Demolición de la cocina vieja',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/demolicion.webp',
          alt: 'Demolición de alacenas y mesada de la cocina original',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Pasada de gas y agua',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/instalaciones.webp',
          alt: 'Pasada de cañerías de gas y agua de la cocina en obra',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'gallery',
        caption: 'Piso y revestimiento nuevos',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/piso.webp',
          alt: 'Colocación del piso y el revestimiento de la cocina',
          width: 1600,
          height: 1067
        }
      },
      {
        kind: 'after',
        caption: 'Cocina entregada y funcionando',
        image: {
          src: 'https://images.example.com/proyectos/reforma-cocina-belgrano/after-entrega.webp',
          alt: 'Cocina nueva terminada y equipada, lista para usar',
          width: 1600,
          height: 1067
        }
      }
    ],
    isPlaceholder: true
  }
] as const satisfies readonly Project[];
