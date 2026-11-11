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
  /** Último FTP MEDIDO (`ftp_history`), o null. El FTP objetivo de la temporada ya no se usa como base: no mide la forma actual. */
  currentFtpWatts: number | null;
  /** Salidas de ciclismo registradas en los últimos 14 días: el test de rampa solo se programa con una base mínima de salidas reales. */
  recentCyclingRides14d: number;
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
// Días de la semana (lunes=0) con Z2 en la ventana de reaclimatación: tres, con un día de descanso entre
// ellas. Cuatro seguidas disparaban la carga aguda de golpe (ACWR 1,9 tras la primera sesión de vuelta).
const REACCLIMATIZATION_Z2_INDICES = [0, 2, 4];
/** Salidas mínimas en los últimos 14 días para programar el test de rampa (sin FTP medido). */
const RAMP_TEST_MIN_RIDES = 3;
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
  currentFtpWatts: number | null
): PlannedSessionDraft[] {
  const days: SessionType[] = new Array(7).fill("rest");
  for (const index of REACCLIMATIZATION_Z2_INDICES) days[index] = "z2";

  // Sin test de rampa en esta ventana: aún no hay salidas reales que lo sostengan. Se programa en la
  // primera semana normal en la que haya >= RAMP_TEST_MIN_RIDES salidas y ningún FTP medido.
  // Solo hay FTP efectivo en las notas si hay un FTP MEDIDO; sin él, las zonas se calculan al enviar con
  // el FTP provisional del usuario (lib/ftp-base.ts).
  const effectiveFtpWatts =
    currentFtpWatts != null ? Math.round(currentFtpWatts * (1 + discountPct)) : undefined;

  return days.map((sessionType, index) => {
    let notes: PlannedSessionNotes | null = null;
    if (sessionType === "z2") {
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
  strengthDays: number,
  scheduleRampTest: boolean
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

  // Test de rampa: la primera sesión de calidad de la semana (sin TSS planificado, como en la ventana de reaclimatación).
  const rampTestIndex = scheduleRampTest ? days.indexOf("quality") : -1;

  return days.map((sessionType, index) => {
    let planned_tss: number | null = null;
    if (sessionType === "quality") planned_tss = qualityTss;
    else if (sessionType === "z2") planned_tss = z2Tss;
    const isRampTest = index === rampTestIndex;

    return {
      date: addDays(weekStartDate, index),
      session_type: sessionType,
      planned_tss: isRampTest ? null : planned_tss,
      notes: isRampTest ? { kind: "ramp_test" as const } : null,
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
    return buildReacclimatizationWeek(input.weekStartDate, discountPct, input.currentFtpWatts);
  }

  const weeklyTssTarget = computeWeeklyTssTarget(input.hoursPerWeek);
  const qualityDays = computeQualityDaysPerWeek(input.goalType, input.focusAreas);
  const strengthDays = input.strengthDaysPerWeek ?? 0;

  const scheduleRampTest = input.currentFtpWatts == null && input.recentCyclingRides14d >= RAMP_TEST_MIN_RIDES;
  return buildNormalWeek(input.weekStartDate, weeklyTssTarget, qualityDays, strengthDays, scheduleRampTest);
}
