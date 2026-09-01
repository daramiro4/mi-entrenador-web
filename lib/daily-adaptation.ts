import type { FatigueRecommendation, PlannedSession, SessionType } from "./types";
import { getValidPostponeDates } from "./postpone";

// "Menos series/intensidad" (decisión 4) — reducción aplicada al TSS al
// degradar una sesión de precaución. Ajustable, sin fórmula cerrada en
// CLAUDE.md, mismo espíritu que las constantes de lib/plan-generator.ts.
const DEGRADE_TSS_REDUCTION_PCT = 0.25;

export type DailyAdaptationResult =
  | { type: "none" }
  | { type: "degrade"; newSessionType: SessionType; newPlannedTss: number | null }
  | { type: "postpone"; newDate: string }
  | { type: "postpone_unavailable" };

/**
 * Decisión 4 — capa diaria adaptativa: qué hacer con la sesión de hoy según
 * `fatigue_index.recommendation`. Consume la recomendación, no la recalcula.
 * - normal → sin cambios.
 * - precaución → degrada quality→z2 (o reduce TSS si ya era z2); fuerza y
 *   descanso no tienen nada sensato que degradar.
 * - descanso → se pospone al hueco libre más próximo esa semana (automático,
 *   a diferencia de la redistribución manual de la decisión 3).
 */
export function computeDailyAdaptation(
  todaySession: PlannedSession,
  weekSessions: PlannedSession[],
  recommendation: FatigueRecommendation,
  today: string
): DailyAdaptationResult {
  if (recommendation === "normal") {
    return { type: "none" };
  }

  if (recommendation === "precaucion") {
    if (todaySession.session_type === "quality") {
      return {
        type: "degrade",
        newSessionType: "z2",
        newPlannedTss:
          todaySession.planned_tss != null
            ? Math.round(todaySession.planned_tss * (1 - DEGRADE_TSS_REDUCTION_PCT))
            : null,
      };
    }
    if (todaySession.session_type === "z2") {
      return {
        type: "degrade",
        newSessionType: "z2",
        newPlannedTss:
          todaySession.planned_tss != null
            ? Math.round(todaySession.planned_tss * (1 - DEGRADE_TSS_REDUCTION_PCT))
            : null,
      };
    }
    return { type: "none" };
  }

  // recommendation === "descanso"
  if (todaySession.session_type === "rest") {
    return { type: "none" };
  }

  const nearestFreeDay = getValidPostponeDates(weekSessions, todaySession, today)[0];
  return nearestFreeDay ? { type: "postpone", newDate: nearestFreeDay } : { type: "postpone_unavailable" };
}
