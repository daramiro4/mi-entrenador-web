import type { FatigueRecommendation, FtpHistoryRow, GoalType, PlannedSession, SessionType } from "./types";
import { addDays, daysBetween } from "./week";

/* ------------------------------------------------------------------ Anillo de fatiga */

/** Relleno provisional del arco según la recomendación (fáciles de cambiar). */
export const FATIGUE_ARC_FILL: Record<FatigueRecommendation, number> = {
  normal: 0.75,
  precaucion: 0.45,
  descanso: 0.2,
};

export interface FatigueView {
  word: string;
  subtext: string;
  /** Token CSS del arco: normal Volt, precaución Ember, descanso Fatiga. */
  color: string;
  fill: number;
  zoneIndex: 0 | 1 | 2;
}

export const FATIGUE_ZONES: { key: FatigueRecommendation; label: string }[] = [
  { key: "normal", label: "Recuperado" },
  { key: "precaucion", label: "Cuidado" },
  { key: "descanso", label: "Descanso" },
];

export function fatigueView(recommendation: FatigueRecommendation | null): FatigueView | null {
  switch (recommendation) {
    case "normal":
      return { word: "Recuperado", subtext: "Carga normal", color: "var(--volt)", fill: FATIGUE_ARC_FILL.normal, zoneIndex: 0 };
    case "precaucion":
      return { word: "Cuidado, vas cargado", subtext: "Carga elevada", color: "var(--accent)", fill: FATIGUE_ARC_FILL.precaucion, zoneIndex: 1 };
    case "descanso":
      return { word: "Necesitas descansar", subtext: "Carga muy alta", color: "var(--danger)", fill: FATIGUE_ARC_FILL.descanso, zoneIndex: 2 };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ Cabecera */

const SEASON_GOAL_LABEL: Record<GoalType, string> = {
  ftp_improvement: "Mejora de FTP",
  event_prep: "Preparación de evento",
  maintenance: "Mantenimiento",
};

/** "Mejora de FTP · 15/03/2027" (la fecha, si existe, en formato corto). */
export function seasonPillLabel(goalType: GoalType, targetDate: string | null): string {
  const goal = SEASON_GOAL_LABEL[goalType] ?? goalType;
  if (!targetDate) return goal;
  const [y, m, d] = targetDate.slice(0, 10).split("-");
  return `${goal} · ${d}/${m}/${y}`;
}

/* ------------------------------------------------------------------ Sesión de hoy */

export interface StructureSegment {
  label: string;
  pct: number;
}

/** Estructura orientativa por tipo de sesión (no hay estructura guardada en planned_sessions). */
export const SESSION_STRUCTURE: Record<SessionType, StructureSegment[]> = {
  z2: [
    { label: "Calentamiento", pct: 10 },
    { label: "Bloque principal", pct: 80 },
    { label: "Vuelta a la calma", pct: 10 },
  ],
  quality: [
    { label: "Calentamiento", pct: 20 },
    { label: "Bloque principal", pct: 60 },
    { label: "Vuelta a la calma", pct: 20 },
  ],
  strength: [
    { label: "Calentamiento", pct: 15 },
    { label: "Bloque principal", pct: 70 },
    { label: "Vuelta a la calma", pct: 15 },
  ],
  rest: [],
};

export function adaptationPhrase(input: {
  session: Pick<PlannedSession, "status" | "session_type"> | null;
  recommendation: FatigueRecommendation | null;
  hrDiscountPct: number;
}): string | null {
  const { session, recommendation, hrDiscountPct } = input;
  if (!session || session.session_type === "rest") return null;
  if (session.status === "degraded") return "Adaptada por tu fatiga: menos carga que lo previsto.";
  if (session.status === "done" || session.status === "skipped") return null;
  if (session.session_type === "z2" && hrDiscountPct > 0) {
    return `Vatios −${hrDiscountPct} % por tu pulso en la última Z2.`;
  }
  if (recommendation === "precaucion") return "Con precaución: si el pulso se dispara, baja los vatios.";
  return "Sin cambios sobre el plan.";
}

/* ------------------------------------------------------------------ KPIs */

/** Últimos `days` valores no nulos (ascendente por fecha) de una métrica. */
export function lastValues<T extends { date: string }>(rows: T[], pick: (row: T) => number | null, today: string, days = 14): number[] {
  const from = addDays(today, -(days - 1));
  return rows
    .filter((r) => r.date >= from && r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(pick)
    .filter((v): v is number => v != null);
}

/** Diferencia del último valor frente a la media de los anteriores; null si no hay base. */
export function deltaVsAverage(values: number[]): number | null {
  if (values.length < 3) return null;
  const last = values[values.length - 1];
  const prev = values.slice(0, -1);
  return Math.round(last - prev.reduce((a, b) => a + b, 0) / prev.length);
}

/* ------------------------------------------------------------------ VFC contra tu normal */

export const HRV_BAND_DAYS = 60;
export const HRV_MIN_DAYS = 14;
export const HRV_SD_FACTOR = 0.5;

export interface HrvRow {
  date: string;
  hrv_ms: number | null;
}

export interface HrvPoint {
  date: string;
  hrv: number | null;
  /** Media móvil de 7 días (con al menos 3 valores en la ventana). */
  ma7: number | null;
}

export type HrvStatus = "dentro" | "por debajo" | "por encima";

export interface HrvChartData {
  points: HrvPoint[];
  band: { low: number; high: number; mean: number } | null;
  status: HrvStatus | null;
  latestMa7: number | null;
  /** false si hay menos de HRV_MIN_DAYS días con dato: estado vacío. */
  enough: boolean;
}

/** Banda de rango normal: media ± 0,5 DE sobre ln(hrv), devuelta a ms con exp. */
export function hrvBand(values: number[]): { low: number; high: number; mean: number } | null {
  const positives = values.filter((v) => v > 0);
  if (positives.length < 2) return null;
  const logs = positives.map(Math.log);
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance = logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1);
  const sd = Math.sqrt(variance);
  return {
    low: Math.exp(mean - HRV_SD_FACTOR * sd),
    high: Math.exp(mean + HRV_SD_FACTOR * sd),
    mean: Math.exp(mean),
  };
}

export function hrvStatus(ma7: number | null, band: { low: number; high: number } | null): HrvStatus | null {
  if (ma7 == null || band == null) return null;
  if (ma7 < band.low) return "por debajo";
  if (ma7 > band.high) return "por encima";
  return "dentro";
}

export function hrvSubtitle(status: HrvStatus | null): string {
  if (!status) return "Aún no hay suficientes datos para comparar con tu rango normal.";
  return `La media de 7 días está ${status} de tu rango normal.`;
}

/** Serie diaria con media móvil de 7 días y la banda de los 60 días que terminan en `today`. */
export function buildHrvChart(rows: HrvRow[], today: string, periodDays: number): HrvChartData {
  const byDate = new Map<string, number>();
  for (const r of rows) if (r.hrv_ms != null && r.hrv_ms > 0) byDate.set(r.date, r.hrv_ms);

  const days = Array.from({ length: periodDays }, (_, i) => addDays(today, -(periodDays - 1 - i)));
  const points: HrvPoint[] = days.map((date) => {
    const window = Array.from({ length: 7 }, (_, k) => byDate.get(addDays(date, -k))).filter((v): v is number => v != null);
    return {
      date,
      hrv: byDate.get(date) ?? null,
      ma7: window.length >= 3 ? window.reduce((a, b) => a + b, 0) / window.length : null,
    };
  });

  const bandValues = Array.from({ length: HRV_BAND_DAYS }, (_, i) => byDate.get(addDays(today, -i))).filter((v): v is number => v != null);
  const enough = bandValues.length >= HRV_MIN_DAYS;
  const band = enough ? hrvBand(bandValues) : null;
  const latestMa7 = [...points].reverse().find((p) => p.ma7 != null)?.ma7 ?? null;
  return { points, band, status: hrvStatus(latestMa7, band), latestMa7, enough };
}

/* ------------------------------------------------------------------ Historial de FTP */

/** Semanas hasta el próximo test (rango razonable 4-6). */
export const NEXT_TEST_WEEKS = 5;

export interface FtpSeries {
  points: { date: string; ftp: number }[];
  /** Último valor prolongado hasta hoy (línea escalonada). */
  stepEnd: { date: string; ftp: number } | null;
  nextTest: { date: string; ftp: number } | null;
}

export function buildFtpSeries(history: Pick<FtpHistoryRow, "date" | "ftp_watts">[], today: string): FtpSeries {
  const points = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({ date: h.date, ftp: Math.round(h.ftp_watts) }));
  const last = points[points.length - 1];
  if (!last) return { points, stepEnd: null, nextTest: null };
  const nextDate = addDays(last.date, NEXT_TEST_WEEKS * 7);
  return {
    points,
    stepEnd: daysBetween(last.date, today) > 0 ? { date: today, ftp: last.ftp } : null,
    nextTest: { date: nextDate, ftp: last.ftp },
  };
}
