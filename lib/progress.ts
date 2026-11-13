import type { PlannedSession } from "./types";
import { plannedStrengthTssForSession } from "./strength/tss";

export interface ProgressSignal {
  targetTss: number;
  completedTss: number;
  /** null si no hay TSS objetivo en el bloque (ej. solo ventana de reaclimatación). */
  pct: number | null;
}

/**
 * Decisión 8 — señal de progreso: % de TSS objetivo cumplido, acumulado en
 * el bloque actual (desde el último test de FTP). Puramente informativo —
 * nunca dispara un recálculo de `target_ftp`.
 */
export function computeProgressSignal(sessionsSinceLastTest: PlannedSession[]): ProgressSignal {
  let targetTss = 0;
  let completedTss = 0;

  for (const session of sessionsSinceLastTest) {
    // La fuerza no lleva planned_tss en la base de datos: su objetivo se estima al leer (cuenta como bloque propio).
    const target = session.planned_tss ?? plannedStrengthTssForSession(session);
    if (target == null) continue;
    targetTss += target;
    if (session.status === "done") {
      completedTss += target;
    }
  }

  return {
    targetTss,
    completedTss,
    pct: targetTss > 0 ? completedTss / targetTss : null,
  };
}
