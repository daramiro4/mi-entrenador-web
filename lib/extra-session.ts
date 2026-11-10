import type { FatigueIndexRow, FatigueRecommendation, PlannedSession } from "./types";
import { addDays, daysBetween } from "./week";

/**
 * Sesión extra de bici en el gimnasio: voluntaria, por pulso (Forerunner,
 * zonas de Garmin), fuera del plan. No es una fila de `planned_sessions`, pero
 * SÍ suma al TSS semanal "cumplido" (lib/dashboard-stats.ts: sumTss estima el
 * TSS desde las zonas de pulso, porque sin potenciómetro Garmin no lo da). No
 * entra en la señal de progreso (decisión 8), que solo mira sesiones del plan.
 * La fatiga la recoge el ACWR vía `training_load` de Garmin. Nunca es una sesión dura: los días
 * fuertes (`quality`) se reservan para la bici.
 *
 * La estructura (zonas/duraciones) la construye
 * `mi-entrenador-garmin/api/workout_builder.py: build_hr_workout`; aquí solo
 * se elige la variante.
 */
export type ExtraSessionVariant = "hr_recovery" | "hr_z2" | "hr_intervals";

export type ExtraSessionSuggestion =
  | { type: "none"; reason: string }
  | { type: "session"; variant: ExtraSessionVariant; reason: string };

export const EXTRA_SESSION_VARIANTS: ExtraSessionVariant[] = [
  "hr_recovery",
  "hr_z2",
  "hr_intervals",
];

// Ajustables, sin fórmula cerrada en CLAUDE.md.
/** El cron escribe `fatigue_index` de ayer; más antiguo que esto se trata como "sin datos". */
const FATIGUE_MAX_AGE_DAYS = 2;
/** Por debajo, la carga aguda es baja respecto a la crónica: hay margen para algo de intensidad. */
const LOW_ACWR_THRESHOLD = 0.8;
/** Semana "por detrás" si lo hecho hasta ayer no llega a este % de lo planificado hasta ayer. */
const WEEK_BEHIND_THRESHOLD_PCT = 0.8;

export interface SuggestExtraSessionInput {
  /** La fila de `fatigue_index` más reciente, o null si no hay ninguna. */
  latestFatigue: Pick<FatigueIndexRow, "date" | "recommendation" | "acwr_ratio"> | null;
  /** Sesiones de la semana de `today`. */
  weekSessions: PlannedSession[];
  /** Sesión planificada para mañana (puede ser de la semana siguiente), o null. */
  tomorrowSession: PlannedSession | null;
  today: string;
}

function isWeekBehind(weekSessions: PlannedSession[], today: string): boolean {
  let planned = 0;
  let done = 0;
  for (const session of weekSessions) {
    if (session.date >= today || session.planned_tss == null) continue;
    planned += session.planned_tss;
    if (session.status === "done") done += session.planned_tss;
  }
  return planned > 0 && done / planned < WEEK_BEHIND_THRESHOLD_PCT;
}

export function suggestExtraSession(input: SuggestExtraSessionInput): ExtraSessionSuggestion {
  const { latestFatigue, weekSessions, tomorrowSession, today } = input;

  const fatigueIsFresh =
    latestFatigue != null && daysBetween(latestFatigue.date, today) <= FATIGUE_MAX_AGE_DAYS;

  if (!fatigueIsFresh) {
    return {
      type: "session",
      variant: "hr_z2",
      reason: "No hay datos de fatiga recientes, así que mejor algo suave.",
    };
  }

  const recommendation = latestFatigue.recommendation as FatigueRecommendation;

  if (recommendation === "descanso") {
    return { type: "none", reason: "Hoy mejor no: necesitas descansar." };
  }

  if (recommendation === "precaucion") {
    return {
      type: "session",
      variant: "hr_recovery",
      reason: "Vas cargado: solo soltar piernas.",
    };
  }

  if (tomorrowSession?.date === addDays(today, 1) && tomorrowSession.session_type === "quality") {
    return {
      type: "session",
      variant: "hr_z2",
      reason: "Mañana tienes sesión de calidad: Z2 sin intervalos para llegar fresco.",
    };
  }

  const lowAcwr = latestFatigue.acwr_ratio != null && latestFatigue.acwr_ratio < LOW_ACWR_THRESHOLD;
  if (lowAcwr || isWeekBehind(weekSessions, today)) {
    return {
      type: "session",
      variant: "hr_intervals",
      reason: lowAcwr
        ? "Estás recuperado y con carga baja: hay margen para unos intervalos."
        : "Vas por detrás del objetivo semanal: hay margen para unos intervalos.",
    };
  }

  return { type: "session", variant: "hr_z2", reason: "Estás recuperado: Z2 tranquilo." };
}
