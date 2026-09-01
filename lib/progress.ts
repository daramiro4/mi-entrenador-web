import type { PlannedSession } from "./types";

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
    if (session.planned_tss == null) continue;
    targetTss += session.planned_tss;
    if (session.status === "done") {
      completedTss += session.planned_tss;
    }
  }

  return {
    targetTss,
    completedTss,
    pct: targetTss > 0 ? completedTss / targetTss : null,
  };
}
