import type { ActivityRow, PlannedSession, StrengthSessionRow } from "./types";
import { addDays, getWeekdayIndex } from "./week";
import { estimateHrTss } from "./hr-zones";

/** Provisional (configurable): % del TSS planificado para contar una semana en la racha. */
export const STREAK_MIN_PCT = 85;

const WEEKDAY_NAME = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/**
 * TSS total de actividades. Evita doble conteo: si el mismo día hay una actividad de
 * fuerza de Garmin con TSS y otra escrita por la app (`source = mi-entrenador-web`),
 * solo cuenta la de Garmin.
 *
 * Bici sin potenciómetro (p. ej. la sesión extra del gimnasio por pulso): Garmin no da TSS, así que se
 * estima desde los minutos por zona de pulso (`estimateHrTss`) para que también sume a la semana.
 */
export function sumTss(
  activities: Array<
    Pick<ActivityRow, "tss"> & Partial<Pick<ActivityRow, "date" | "activity_type" | "source" | "hr_zone_seconds">>
  >
): number {
  const garminStrengthDays = new Set(
    activities
      .filter((a) => a.activity_type === "strength" && a.source !== "mi-entrenador-web" && (a.tss ?? 0) > 0)
      .map((a) => a.date)
  );
  return Math.round(
    activities.reduce((acc, a) => {
      const duplicate =
        a.source === "mi-entrenador-web" && a.activity_type === "strength" && garminStrengthDays.has(a.date);
      if (duplicate) return acc;
      const hasTss = a.tss != null && a.tss > 0;
      const estimated = a.activity_type === "cycling" && !hasTss ? estimateHrTss(a.hr_zone_seconds) : null;
      return acc + (hasTss ? a.tss! : (estimated ?? 0));
    }, 0)
  );
}

export function sumPlannedTss(sessions: Pick<PlannedSession, "planned_tss">[]): number {
  return Math.round(sessions.reduce((acc, s) => acc + (s.planned_tss ?? 0), 0));
}

/** Titular humano de la semana según % del TSS objetivo. */
export function weekHeadline(completedTss: number, targetTss: number): string {
  if (targetTss <= 0) return "Aún no hay objetivo de TSS esta semana.";
  const pct = completedTss / targetTss;
  if (pct >= 1) return "Semana cumplida. Buen trabajo.";
  if (pct >= 0.7) return "Vas muy bien esta semana.";
  if (pct >= 0.4) return "Buen ritmo, sigue así.";
  if (pct > 0) return "La semana acaba de arrancar.";
  return "Todo por hacer: empieza cuando quieras.";
}

export interface WeekTotals {
  plannedTss: number;
  completedTss: number;
}

/**
 * Racha: semanas consecutivas (de la más reciente hacia atrás) con
 * completado/planificado >= STREAK_MIN_PCT. Las semanas sin plan cortan la racha.
 * `weeks` va de la más reciente a la más antigua.
 */
export function computeStreak(weeks: WeekTotals[], minPct = STREAK_MIN_PCT): number {
  let streak = 0;
  for (const w of weeks) {
    if (w.plannedTss <= 0) break;
    if ((w.completedTss / w.plannedTss) * 100 >= minPct) streak += 1;
    else break;
  }
  return streak;
}

export type DayState = "done" | "today" | "pending" | "rest" | "degraded" | "skipped" | "none";

export const DAY_STATE_LABEL: Record<DayState, string> = {
  done: "Hecho",
  today: "Hoy",
  pending: "Pendiente",
  rest: "Descanso",
  degraded: "Degradado",
  skipped: "Saltado",
  none: "Sin plan",
};

export function dayState(session: PlannedSession | undefined, date: string, today: string): DayState {
  if (!session) return "none";
  if (session.session_type === "rest") return "rest";
  if (session.status === "done") return "done";
  if (session.status === "skipped") return "skipped";
  if (session.status === "degraded") return "degraded";
  if (date === today) return "today";
  return "pending";
}

/** Línea de redistribución de TSS perdido (decisión 3), o null si no hubo. */
export function redistributionLine(sessions: PlannedSession[]): string | null {
  const moved = sessions.filter((s) => {
    const n = s.notes as { redistributed_to_session_id?: string; redistributed_tss?: number } | null;
    return s.status === "skipped" && n?.redistributed_to_session_id;
  });
  if (moved.length === 0) return null;
  const parts = moved.map((s) => {
    const n = s.notes as { redistributed_to_session_id: string; redistributed_tss?: number };
    const target = sessions.find((t) => t.id === n.redistributed_to_session_id);
    const where = target ? `al ${WEEKDAY_NAME[getWeekdayIndex(target.date)]}` : "a otro día";
    return `${n.redistributed_tss ?? "?"} TSS ${where}`;
  });
  return `TSS perdido movido: ${parts.join(", ")}.`;
}

export interface Totals {
  strengthKgMonth: number;
  hoursLast30: number;
  activitiesLast30: number;
}

export function computeTotals(
  strengthSessions: Pick<StrengthSessionRow, "volume_kg" | "date">[],
  activities: Pick<ActivityRow, "duration_minutes" | "date">[],
  today: string
): Totals {
  const monthPrefix = today.slice(0, 7);
  const since = addDays(today, -29);
  return {
    strengthKgMonth: Math.round(
      strengthSessions.filter((s) => s.date.startsWith(monthPrefix)).reduce((a, s) => a + (s.volume_kg ?? 0), 0)
    ),
    hoursLast30: Math.round(
      (activities.filter((a) => a.date >= since && a.date <= today).reduce((a, x) => a + (x.duration_minutes ?? 0), 0) / 60) * 10
    ) / 10,
    activitiesLast30: activities.filter((a) => a.date >= since && a.date <= today).length,
  };
}

export interface Badge {
  key: string;
  label: string;
  earned: boolean;
}

export function computeBadges(input: { streak: number; totals: Totals; activityCount: number }): Badge[] {
  return [
    { key: "first", label: "Primera actividad", earned: input.activityCount >= 1 },
    { key: "streak2", label: "2 semanas seguidas", earned: input.streak >= 2 },
    { key: "streak4", label: "4 semanas seguidas", earned: input.streak >= 4 },
    { key: "iron", label: "1.000 kg en el mes", earned: input.totals.strengthKgMonth >= 1000 },
    { key: "hours", label: "20 h en 30 días", earned: input.totals.hoursLast30 >= 20 },
  ];
}

/** Saludo según la hora local. */
export function greeting(hour: number, name: string | null): string {
  const base = hour < 6 ? "Buenas noches" : hour < 13 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";
  return name ? `${base}, ${name}` : base;
}
