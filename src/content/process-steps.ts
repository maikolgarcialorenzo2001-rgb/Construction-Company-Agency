import type { ProcessStep } from './content.types';

/**
 * How a job actually runs, from the first site visit to the written warranty. Array order
 * IS the display order: `/proceso` numbers the steps straight from this array, so there is
 * no `order` field and the sequence cannot drift from the copy.
 *
 * Every step carries an expected duration because "how long does this take" is the first
 * question a buyer asks, and a step without a time answer reads as vagueness.
 *
 * ⚠️ PLACEHOLDER DATA. Every entry carries `isPlaceholder: true` and the copy below is
 * realistic placeholder text, not client data. Replace it before launch:
 * `grep -rn "isPlaceholder" src/`.
 */
export const processSteps = [
  {
    title: 'Visita y diagnóstico',
    description:
      'Vamos a la obra, levantamos medidas y revisamos estructura, instalaciones y terminaciones. Salís con un diagnóstico escrito de qué hay que resolver y qué se puede reutilizar.',
    duration: '1 a 2 días',
    isPlaceholder: true
  },
  {
    title: 'Presupuesto desglosado por partida',
    description:
      'Armamos el presupuesto partida por partida —demolición, instalaciones, terminaciones— con cantidades y precios unitarios. Sabés exactamente en qué se va cada peso antes de firmar nada.',
    duration: '3 a 5 días hábiles',
    isPlaceholder: true
  },
  {
    title: 'Contrato y permisos',
    description:
      'Firmamos un contrato con alcance, plazo, forma de pago y penalidades por atraso, y tramitamos los permisos municipales y las habilitaciones que pide cada obra.',
    duration: '1 a 2 semanas',
    isPlaceholder: true
  },
  {
    title: 'Planificación y compras',
    description:
      'Se arma el cronograma por etapas, se confirma el equipo y se reservan los materiales con anticipación. Los tiempos de entrega de cada rubro entran en el plazo antes de empezar.',
    duration: '1 a 3 semanas',
    isPlaceholder: true
  },
  {
    title: 'Ejecución de la obra',
    description:
      'Arrancamos con un único responsable de obra e informes semanales con fotos y certificados de avance. Podés visitar el avance cuando quieras, con cita previa.',
    duration: 'Según el proyecto',
    isPlaceholder: true
  },
  {
    title: 'Entrega y garantía',
    description:
      'Hacen la limpieza final, la entrega de llaves con el acta firmada y el manual de mantenimiento. Queda por escrito el período de garantía de cada tipo de trabajo.',
    duration: '1 semana',
    isPlaceholder: true
  }
] as const satisfies readonly ProcessStep[];
