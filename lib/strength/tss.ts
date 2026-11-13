/**
 * Carga de fuerza a TSS — PROVISIONAL, una sola constante configurable.
 *   IF = IF_BASE + IF_PER_RPE · RPE      strength_tss = horas · IF² · 100
 * Ej.: 30 min a RPE 6 → IF 0,64 → 20,5 TSS.
 */
export const STRENGTH_TSS = { IF_BASE: 0.4, IF_PER_RPE: 0.04 } as const;

/** Carga mínima (TSS) de las rutinas de movilidad "antídoto de conducción". */
export const MINIMAL_LOAD_TSS = 3;

export function strengthTss(durationMin: number, rpe: number): number {
  const clamped = Math.min(10, Math.max(1, rpe));
  const intensityFactor = STRENGTH_TSS.IF_BASE + STRENGTH_TSS.IF_PER_RPE * clamped;
  return Math.round((durationMin / 60) * intensityFactor ** 2 * 100 * 10) / 10;
}

/** RPE por defecto para estimar el TSS previsto antes de entrenar. */
export const DEFAULT_PLANNED_RPE = 6;

/**
 * TSS de una actividad HECHA que no tiene potencia (fuerza, "otros", bici sin potenciómetro ni zonas…) — PROVISIONAL, constantes configurables.
 * Se cuenta TODO lo que se hace, esté o no en el plan: no se mide, se estima. Prioridad:
 *   1. `tss` ya guardado (p. ej. el de strengthTss con RPE al terminar el entreno en la web).
 *   2. `training_load` de Garmin × LOAD_TO_TSS (1:1 de partida; es la misma carga que ya alimenta el ACWR).
 *   3. nada → null (no se inventa).
 */
export const LOAD_TO_TSS = 1;

export function loadBasedTss(a: {
  tss?: number | null;
  training_load?: number | string | null;
}): { tss: number; estimated: boolean } | null {
  if (a.tss != null && a.tss > 0) return { tss: a.tss, estimated: false };
  const load = a.training_load == null ? NaN : Number(a.training_load);
  if (Number.isFinite(load) && load > 0) return { tss: load * LOAD_TO_TSS, estimated: true };
  return null;
}

/**
 * TSS OBJETIVO de una sesión de fuerza planificada. La fuerza cuenta en el objetivo semanal como bloque propio (no desplaza TSS de
 * bici), pero su `planned_tss` en la base de datos se queda en null a propósito: así "Saltar" no ofrece mover TSS de fuerza a un día
 * de bici (decisión 3) y la capa adaptativa no la recorta por TSS. Este valor se calcula al leer.
 * 50 min a RPE 6 ≈ 34 TSS: cerca de la media real (training_load medio 37 en sesiones de ~54 min).
 */
export const DEFAULT_PLANNED_STRENGTH_MINUTES = 50;

export function plannedStrengthTss(durationMin: number = DEFAULT_PLANNED_STRENGTH_MINUTES): number {
  return strengthTss(durationMin, DEFAULT_PLANNED_RPE);
}

/** Objetivo estimado de una sesión de fuerza planificada sin `planned_tss`; null si no aplica (otro tipo, ya tiene TSS o está saltada). */
export function plannedStrengthTssForSession(session: {
  session_type?: string;
  status?: string;
  planned_tss: number | null;
  notes?: unknown;
}): number | null {
  if (session.session_type !== "strength" || session.planned_tss != null || session.status === "skipped") return null;
  const minutes = (session.notes as { duration_minutes?: unknown } | null | undefined)?.duration_minutes;
  return plannedStrengthTss(typeof minutes === "number" && minutes > 0 ? minutes : undefined);
}
