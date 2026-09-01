import type {
  FocusArea,
  GoalType,
  PlannedSessionDraft,
  PlannedSessionNotes,
  SessionType,
} from "./types";
import { addDays, daysBetween } from "./week";

export interface GenerateWeeklyPlanInput {
  /** Lunes de la semana a generar, YYYY-MM-DD. */
  weekStartDate: string;
  goalType: GoalType;
  focusAreas: FocusArea[];
  hoursPerWeek: number | null;
  strengthDaysPerWeek: number | null;
  currentFtpWatts: number | null;
  /** FTP objetivo de la temporada (`seasons.target_ftp`) — se usa como base para el descuento de reaclimatización solo cuando no hay ningún `ftp_history` medido todavía (usuario nuevo, aún sin ramp test). */
  targetFtpWatts: number | null;
  /** Fecha de la última actividad `cycling` en `activities`, o null si nunca ha registrado una. */
  lastCyclingActivityDate: string | null;
  /** Inyectada (no `new Date()`) para que la función sea determinista y testeable. */
  today: string;
}

// --- Constantes de la plantilla semanal normal ---
// CLAUDE.md no fija una fórmula para el TSS semanal objetivo ni para el número
// de días de calidad; estos valores son un punto de partida razonable y están
// aislados aquí para poder ajustarse sin tocar el resto del motor.
const DEFAULT_HOURS_PER_WEEK = 6;
const WEEKLY_TSS_PER_HOUR = 55;
const QUALITY_FOCUS_AREAS: FocusArea[] = ["vo2max", "climbing", "rouleur"];
const QUALITY_TSS_WEIGHT = 1.3;
const REST_DAY_INDEX = 6; // domingo, dentro de una semana lunes=0..domingo=6

// --- Constantes de la ventana de reaclimatación (decisión 5) ---
const REACCLIMATIZATION_THRESHOLD_DAYS = 14; // ">2-3 semanas" sin actividad de ciclismo
const REACCLIMATIZATION_Z2_DAYS = 4;
// Las z2 de reaclimatación no llevan TSS (decisión 5), así que necesitan una
// duración fija para poder enviarse a Garmin. Ajustable.
const REACCLIMATIZATION_Z2_DURATION_MINUTES = 60;

export function computeWeeklyTssTarget(hoursPerWeek: number | null): number {
  const hours = hoursPerWeek ?? DEFAULT_HOURS_PER_WEEK;
  return Math.round((hours * WEEKLY_TSS_PER_HOUR) / 5) * 5;
}

export function computeQualityDaysPerWeek(
  goalType: GoalType,
  focusAreas: FocusArea[]
): number {
  const wantsMoreQuality =
    goalType === "ftp_improvement" ||
    focusAreas.some((area) => QUALITY_FOCUS_AREAS.includes(area));
  return wantsMoreQuality ? 2 : 1;
}

/** Tabla de descuento de FTP efectivo durante la ventana de reaclimatación. */
export function getReacclimatizationDiscountPct(
  daysSinceLastCyclingActivity: number
): number {
  if (daysSinceLastCyclingActivity < 14) return 0;
  if (daysSinceLastCyclingActivity < 28) return -0.05;
  if (daysSinceLastCyclingActivity < 56) return -0.1;
  return -0.15;
}

function daysSinceLastCyclingActivity(
  lastCyclingActivityDate: string | null,
  today: string
): number {
  if (lastCyclingActivityDate === null) {
    return Infinity;
  }
  return daysBetween(lastCyclingActivityDate, today);
}

function roundToNearest5(value: number): number {
  return Math.round(value / 5) * 5;
}

/** Reparte `count` posiciones espaciadas de forma pareja dentro de `candidates`. */
function pickSpacedIndices(candidates: number[], count: number): number[] {
  if (count <= 0 || candidates.length === 0) return [];
  if (count >= candidates.length) return candidates;

  const step = candidates.length / count;
  const picked: number[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(candidates[Math.floor(i * step)]);
  }
  return picked;
}

function buildReacclimatizationWeek(
  weekStartDate: string,
  discountPct: number,
  currentFtpWatts: number | null,
  targetFtpWatts: number | null
): PlannedSessionDraft[] {
  const days: SessionType[] = new Array(7).fill("rest");
  for (let i = 0; i < REACCLIMATIZATION_Z2_DAYS; i++) {
    days[i] = "z2";
  }
  days[REACCLIMATIZATION_Z2_DAYS] = "quality"; // ramp test, día 4-5 de la ventana

  // Si nunca se ha medido el FTP (usuario nuevo, sin ftp_history todavía), se
  // usa el FTP objetivo de la temporada como base del descuento en vez de
  // dejar las z2 sin ninguna potencia calculable.
  const baseFtpWatts = currentFtpWatts ?? targetFtpWatts;
  const effectiveFtpWatts =
    baseFtpWatts != null ? Math.round(baseFtpWatts * (1 + discountPct)) : undefined;

  return days.map((sessionType, index) => {
    let notes: PlannedSessionNotes | null = null;
    if (sessionType === "quality") {
      notes = { kind: "ramp_test", reacclimatization_discount_pct: discountPct };
    } else if (sessionType === "z2") {
      notes = {
        reacclimatization_discount_pct: discountPct,
        duration_minutes: REACCLIMATIZATION_Z2_DURATION_MINUTES,
        ...(effectiveFtpWatts != null ? { effective_ftp_watts: effectiveFtpWatts } : {}),
      };
    }

    return {
      date: addDays(weekStartDate, index),
      session_type: sessionType,
      planned_tss: null,
      notes,
    };
  });
}

function buildNormalWeek(
  weekStartDate: string,
  weeklyTssTarget: number,
  qualityDays: number,
  strengthDays: number
): PlannedSessionDraft[] {
  const days: SessionType[] = new Array(7).fill("z2");
  days[REST_DAY_INDEX] = "rest";

  const availableIndices = Array.from({ length: 7 }, (_, i) => i).filter(
    (i) => i !== REST_DAY_INDEX
  );

  const cappedStrengthDays = Math.min(strengthDays, availableIndices.length);
  const strengthIndices = pickSpacedIndices(availableIndices, cappedStrengthDays);
  for (const index of strengthIndices) {
    days[index] = "strength";
  }

  // Nunca alta intensidad el día siguiente a un día de fuerza (decisión 3).
  const strengthSet = new Set(strengthIndices);
  const qualityCandidates = availableIndices.filter(
    (index) => days[index] === "z2" && !strengthSet.has(index - 1)
  );
  const qualityIndices = pickSpacedIndices(
    qualityCandidates,
    Math.min(qualityDays, qualityCandidates.length)
  );
  for (const index of qualityIndices) {
    days[index] = "quality";
  }

  const qualityCount = days.filter((d) => d === "quality").length;
  const z2Count = days.filter((d) => d === "z2").length;
  const weightSum = qualityCount * QUALITY_TSS_WEIGHT + z2Count;
  const perUnitTss = weightSum > 0 ? weeklyTssTarget / weightSum : 0;
  const qualityTss = roundToNearest5(perUnitTss * QUALITY_TSS_WEIGHT);
  const z2Tss = roundToNearest5(perUnitTss);

  return days.map((sessionType, index) => {
    let planned_tss: number | null = null;
    if (sessionType === "quality") planned_tss = qualityTss;
    else if (sessionType === "z2") planned_tss = z2Tss;

    return {
      date: addDays(weekStartDate, index),
      session_type: sessionType,
      planned_tss,
      notes: null,
    };
  });
}

/**
 * Genera la plantilla de la semana siguiente (decisión 1: nunca el macrociclo
 * completo). Si han pasado ≥14 días sin actividad de ciclismo, genera una
 * ventana de reaclimatación (decisión 5) en vez de la plantilla normal.
 */
export function generateWeeklyPlan(
  input: GenerateWeeklyPlanInput
): PlannedSessionDraft[] {
  const daysSince = daysSinceLastCyclingActivity(input.lastCyclingActivityDate, input.today);

  if (daysSince >= REACCLIMATIZATION_THRESHOLD_DAYS) {
    const discountPct = getReacclimatizationDiscountPct(daysSince);
    return buildReacclimatizationWeek(
      input.weekStartDate,
      discountPct,
      input.currentFtpWatts,
      input.targetFtpWatts
    );
  }

  const weeklyTssTarget = computeWeeklyTssTarget(input.hoursPerWeek);
  const qualityDays = computeQualityDaysPerWeek(input.goalType, input.focusAreas);
  const strengthDays = input.strengthDaysPerWeek ?? 0;

  return buildNormalWeek(input.weekStartDate, weeklyTssTarget, qualityDays, strengthDays);
}
