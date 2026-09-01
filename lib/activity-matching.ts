import type { ActivityRow, PlannedSession, SessionType } from "./types";

/** `activity_type` requerido en `activities` para poder completar cada `session_type`. */
const SESSION_TYPE_TO_ACTIVITY_TYPE: Record<SessionType, string | null> = {
  quality: "cycling",
  z2: "cycling",
  strength: "strength",
  rest: null,
};

const MATCHABLE_STATUSES = new Set(["planned", "degraded"]);

/**
 * Actividad real (del mismo día) que completa `session`, si hay una. Solo
 * sesiones `planned`/`degraded` son candidatas — nunca `skipped` (el
 * usuario dijo explícitamente que la saltó) ni `done` (ya emparejada).
 */
export function findMatchingActivity(
  session: PlannedSession,
  activitiesOnDate: ActivityRow[]
): ActivityRow | null {
  if (!MATCHABLE_STATUSES.has(session.status)) return null;

  const requiredActivityType = SESSION_TYPE_TO_ACTIVITY_TYPE[session.session_type];
  if (!requiredActivityType) return null;

  return activitiesOnDate.find((a) => a.activity_type === requiredActivityType) ?? null;
}
