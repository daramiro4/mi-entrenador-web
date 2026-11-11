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
 * Actividad real (del mismo día) que completa `session`, si hay una. Son
 * candidatas las `planned`/`degraded` y las `done` sin actividad enlazada
 * (marcadas a mano) — nunca `skipped` (el usuario dijo explícitamente que
 * la saltó) ni `done` ya emparejada.
 */
export function findMatchingActivity(
  session: PlannedSession,
  activitiesOnDate: ActivityRow[]
): ActivityRow | null {
  // Una sesión marcada "Hecho" a mano sigue sin actividad enlazada: se enlaza (el estado no cambia), para que
  // las reglas que leen la actividad real (p. ej. el ajuste por pulso) la vean. Una ya enlazada no se toca.
  const isManuallyDoneWithoutActivity = session.status === "done" && session.actual_activity_id == null;
  if (!MATCHABLE_STATUSES.has(session.status) && !isManuallyDoneWithoutActivity) return null;

  const requiredActivityType = SESSION_TYPE_TO_ACTIVITY_TYPE[session.session_type];
  if (!requiredActivityType) return null;

  return activitiesOnDate.find((a) => a.activity_type === requiredActivityType) ?? null;
}
