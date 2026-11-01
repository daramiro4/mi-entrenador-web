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
