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
