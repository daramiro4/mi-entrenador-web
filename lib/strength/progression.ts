import type { HistoryEntry } from "./workout-types";

/** Tope de subida de carga entre sesiones comparables (el validador lo comprueba). */
export const MAX_LOAD_INCREASE = 0.1;
/** Rango de repeticiones de la doble progresión. */
export const REP_RANGE = { min: 8, max: 12 } as const;

export type ProgressionAction = "up_weight" | "up_reps" | "maintain" | "down" | "first_time";

export interface NextLoad {
  action: ProgressionAction;
  weight_kg: number | null;
  reps: number;
  note: string;
}

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/**
 * Doble progresión:
 *  - Todas las reps objetivo con RPE ≤ 8 → sube reps; si ya está en el techo, sube peso (+≤10 %) y vuelve al mínimo.
 *  - "Duro" o molestia → mantiene; "Duro" con RPE ≥ 9,5 → baja ~5 %.
 *  - Resto → mantiene.
 * No decide cargas iniciales (sin historial: peso null, lo elige el usuario).
 */
export function nextLoad(prev: HistoryEntry | undefined, baseReps: number = REP_RANGE.min): NextLoad {
  if (!prev) {
    return { action: "first_time", weight_kg: null, reps: baseReps, note: "Primera vez: elige un peso con el que te sobren 2-3 repeticiones." };
  }
  const targetReps = prev.target_reps ?? baseReps;
  const hitAll = prev.reps_done.length > 0 && prev.reps_done.every((r) => r >= targetReps);
  const weight = prev.weight_kg;

  if (prev.discomfort) {
    return { action: "maintain", weight_kg: weight, reps: targetReps, note: "Hubo molestia: mantén la carga y cuida la técnica." };
  }
  if (prev.felt === "hard") {
    if ((prev.rpe ?? 0) >= 9.5 && weight != null && weight > 0) {
      return { action: "down", weight_kg: roundHalf(weight * 0.95), reps: targetReps, note: "Fue muy duro: bajamos un poco la carga." };
    }
    return { action: "maintain", weight_kg: weight, reps: targetReps, note: "Fue duro: repite la misma carga." };
  }
  if (hitAll && (prev.rpe == null || prev.rpe <= 8)) {
    if (targetReps < REP_RANGE.max) {
      return { action: "up_reps", weight_kg: weight, reps: targetReps + 1, note: "Lo hiciste bien: una repetición más por serie." };
    }
    if (weight != null && weight > 0) {
      const raw = Math.min(weight * (1 + MAX_LOAD_INCREASE), weight + 2.5);
      const w = Math.max(weight + 0.5, roundHalf(raw));
      const capped = w > weight * (1 + MAX_LOAD_INCREASE) ? weight : w;
      return { action: "up_weight", weight_kg: capped, reps: REP_RANGE.min, note: `Sube a ${capped} kg y vuelve a ${REP_RANGE.min} repeticiones.` };
    }
    return { action: "maintain", weight_kg: weight, reps: targetReps, note: "Techo de repeticiones: prueba una variante más difícil." };
  }
  return { action: "maintain", weight_kg: weight, reps: targetReps, note: "Mantén la carga hasta completar todas las repeticiones." };
}
