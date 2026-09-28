import type { BudgetBracket, JobType, Option, ProjectStage } from './content.types';

/**
 * Options for the quote form selects. Each object feeds both the `<option>` label and
 * the WhatsApp message label, so the visitor sees the same wording in the form, in the
 * message and in the specs. Values are kebab-case slugs, never display text.
 */
export const JOB_TYPE_OPTIONS: readonly Option<JobType>[] = [
  { value: 'reforma', label: 'Reforma' },
  { value: 'obra-nueva', label: 'Obra nueva' },
  { value: 'ampliacion', label: 'Ampliación' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'comercial', label: 'Local comercial' },
  { value: 'otro', label: 'Otro' }
];

export const BUDGET_OPTIONS: readonly Option<BudgetBracket>[] = [
  { value: 'sin-definir', label: 'Todavía no lo definí' },
  { value: 'hasta-3m', label: 'Hasta 3 millones' },
  { value: '3m-8m', label: 'Entre 3 y 8 millones' },
  { value: '8m-15m', label: 'Entre 8 y 15 millones' },
  { value: 'mas-15m', label: 'Más de 15 millones' },
  { value: 'a-definir', label: 'Necesito ayuda para calcularlo' }
];

export const STAGE_OPTIONS: readonly Option<ProjectStage>[] = [
  { value: 'idea', label: 'Todavía es una idea' },
  { value: 'planificacion', label: 'Ya tengo planos' },
  { value: 'presupuestando', label: 'Estoy pedidos presupuestos' },
  { value: 'ejecucion', label: 'Quiero arrancar la obra' },
  { value: 'finalizacion', label: 'Quiero cerrar detalles' }
];
