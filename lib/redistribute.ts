import type { PlannedSession } from "./types";
import { addDays, getMondayOfWeek, getWeekEndDate } from "./week";

const REDISTRIBUTION_ELIGIBLE_TYPES = new Set(["quality", "z2"]);
const REDISTRIBUTION_ELIGIBLE_STATUSES = new Set(["planned", "degraded"]);

/**
 * Días de la misma semana a los que se puede mover el TSS perdido de
 * `skippedSession`: desde hoy (o el lunes de la semana, lo que sea más
 * tarde) hasta el domingo, excluyendo el propio día de `skippedSession`.
 * Un día es válido si ya tiene una sesión `quality`/`z2` sin resolver
 * (`planned`/`degraded` — no tiene sentido sumar TSS a una ya `done` o
 * `skipped`) y el día anterior de la semana no es `strength` (única regla
 * fisiológica que existe hoy, la misma que usa `lib/plan-generator.ts` al
 * generar la plantilla).
 */
export function getValidRedistributionDates(
  weekSessions: PlannedSession[],
  skippedSession: PlannedSession,
  today: string
): string[] {
  const weekStart = getMondayOfWeek(skippedSession.date);
  const weekEnd = getWeekEndDate(weekStart);
  const rangeStart = today > weekStart ? today : weekStart;

  const sessionByDate = new Map(weekSessions.map((s) => [s.date, s]));
  const validDates: string[] = [];

  for (let date = rangeStart; date <= weekEnd; date = addDays(date, 1)) {
    if (date === skippedSession.date) continue;

    const candidate = sessionByDate.get(date);
    if (!candidate) continue;
    if (!REDISTRIBUTION_ELIGIBLE_TYPES.has(candidate.session_type)) continue;
    if (!REDISTRIBUTION_ELIGIBLE_STATUSES.has(candidate.status)) continue;

    const previousDay = sessionByDate.get(addDays(date, -1));
    if (previousDay?.session_type === "strength") continue;

    validDates.push(date);
  }

  return validDates;
}
