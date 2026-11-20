import type { PlannedSession } from "./types";
import { addDays, getMondayOfWeek, getWeekEndDate } from "./week";

/**
 * Días de la misma semana a los que se puede mover `session`: desde hoy (o
 * el lunes de la semana, lo que sea más tarde) hasta el domingo, excluyendo
 * el propio día de `session`, y solo si ese día está libre (sin sesión) o
 * tiene una sesión de descanso. Sin reglas fisiológicas todavía (decisión 3
 * completa, pendiente) — "posponer simple".
 */
export function getValidPostponeDates(
  weekSessions: PlannedSession[],
  session: PlannedSession,
  today: string
): string[] {
  const weekStart = getMondayOfWeek(session.date);
  const weekEnd = getWeekEndDate(weekStart);
  const rangeStart = today > weekStart ? today : weekStart;

  const sessionByDate = new Map(weekSessions.map((s) => [s.date, s]));
  const validDates: string[] = [];

  for (let date = rangeStart; date <= weekEnd; date = addDays(date, 1)) {
    if (date === session.date) continue;

    const existing = sessionByDate.get(date);
    if (!existing || existing.session_type === "rest") {
      validDates.push(date);
    }
  }

  return validDates;
}

/** Un destino válido para mover una sesión: un día libre/de descanso, o uno con otra sesión sin hacer con la que se intercambia. */
export interface MoveTarget {
  date: string;
  /** Sesión sin hacer que ya estaba ese día: pasa al día de origen (intercambio). `null` si el día estaba libre o de descanso. */
  swapWith: PlannedSession | null;
}

/**
 * Destinos de "Mover" a mano (el usuario elige, nunca se automatiza): de hoy al domingo de la semana de
 * `session`. A diferencia de `getValidPostponeDates` (que usa la capa adaptativa y solo mira huecos libres),
 * aquí un día con otra sesión sin hacer también vale: se intercambian. Nunca un día con sesión hecha o saltada.
 * Vale también para una sesión de un día ya pasado que no se hizo.
 */
export function getValidMoveTargets(
  weekSessions: PlannedSession[],
  session: PlannedSession,
  today: string
): MoveTarget[] {
  if (session.status !== "planned" && session.status !== "degraded") return [];

  const weekStart = getMondayOfWeek(session.date);
  const weekEnd = getWeekEndDate(weekStart);
  const rangeStart = today > weekStart ? today : weekStart;
  const byDate = new Map(weekSessions.map((s) => [s.date, s]));
  const targets: MoveTarget[] = [];

  for (let date = rangeStart; date <= weekEnd; date = addDays(date, 1)) {
    if (date === session.date) continue;
    const existing = byDate.get(date);
    if (!existing || existing.session_type === "rest") {
      targets.push({ date, swapWith: null });
    } else if (existing.status === "planned" || existing.status === "degraded") {
      targets.push({ date, swapWith: existing });
    }
  }
  return targets;
}
