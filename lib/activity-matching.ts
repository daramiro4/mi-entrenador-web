import type { ActivityRow, PlannedSession, SessionType } from "./types";

/** `activity_type` requerido en `activities` para poder completar cada `session_type`. */
const SESSION_TYPE_TO_ACTIVITY_TYPE: Record<SessionType, string | null> = {
  quality: "cycling",
  z2: "cycling",
  strength: "strength",
  rest: null,
};

/** Duración mínima (min) para que una actividad complete una sesión de OTRO día. */
export const MIN_MINUTES_FOR_LATE_MATCH = 30;

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

/**
 * Sesión SIN hacer de un día anterior que `activity` completa de verdad: el usuario hizo el entreno un día
 * distinto al planificado (p. ej. la calidad del miércoles, hecha el jueves). Solo `planned`/`degraded` sin
 * actividad enlazada, del tipo que corresponde, y de una fecha ANTERIOR a la de la actividad; si hay varias,
 * la más cercana a la actividad. La mira después del emparejamiento del mismo día, que tiene prioridad.
 */
export function findEarlierUnresolvedSession(
  activity: ActivityRow,
  sessions: PlannedSession[]
): PlannedSession | null {
  // Una actividad corta (calentar, un paseo) no sustituye a un entreno perdido.
  if ((activity.duration_minutes ?? 0) < MIN_MINUTES_FOR_LATE_MATCH) return null;
  const candidates = sessions
    .filter(
      (s) =>
        MATCHABLE_STATUSES.has(s.status) &&
        s.actual_activity_id == null &&
        s.date < activity.date &&
        SESSION_TYPE_TO_ACTIVITY_TYPE[s.session_type] === activity.activity_type
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0] ?? null;
}
