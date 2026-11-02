import type { DailyMetricsRow } from "@/lib/types";
import { daysBetween } from "@/lib/week";

export type HealthMetricKey = "sleep" | "stress" | "hrv" | "rhr" | "bodyBattery";

interface MetricDef {
  key: HealthMetricKey;
  label: string;
  /** Texto a mostrar para esa fila, o null si la fila no tiene el dato. */
  text: (row: DailyMetricsRow) => string | null;
  /** Valor numérico para la tendencia, o null. */
  num: (row: DailyMetricsRow) => number | null;
}

const r = (v: number) => `${Math.round(v)}`;

const DEFS: MetricDef[] = [
  { key: "sleep", label: "Sueño", text: (x) => (x.sleep_score != null ? r(x.sleep_score) : null), num: (x) => x.sleep_score },
  { key: "stress", label: "Estrés", text: (x) => (x.stress_avg != null ? r(x.stress_avg) : null), num: (x) => x.stress_avg },
  { key: "hrv", label: "VFC", text: (x) => (x.hrv_ms != null ? `${r(x.hrv_ms)} ms` : null), num: (x) => x.hrv_ms },
  { key: "rhr", label: "FC reposo", text: (x) => (x.resting_hr != null ? `${r(x.resting_hr)} ppm` : null), num: (x) => x.resting_hr },
  {
    key: "bodyBattery",
    label: "Body Battery",
    // Rango mínimo–máximo del día; si solo hay uno de los dos, se usa el máximo (el dato existente).
    text: (x) =>
      x.body_battery_max == null
        ? null
        : x.body_battery_min != null
          ? `${r(x.body_battery_min)}–${r(x.body_battery_max)}`
          : r(x.body_battery_max),
    num: (x) => x.body_battery_max,
  },
];

export interface HealthMetricSummary {
  key: HealthMetricKey;
  label: string;
  /** Último valor disponible (de hoy o de un día anterior), o null si no hay ninguno en el historial. */
  text: string | null;
  /** Fecha de la fila de la que sale `text`. */
  date: string | null;
  /** true si `text` es de hoy. */
  isToday: boolean;
  /** "ayer", "hace 3 días"… o null si es de hoy o no hay dato. */
  ageLabel: string | null;
  /** Serie ascendente para la tendencia. */
  series: number[];
}

/** "ayer" / "hace N días" respecto a `today`. null si es el mismo día. */
export function ageLabel(date: string, today: string): string | null {
  const days = daysBetween(date, today);
  if (days <= 0) return null;
  return days === 1 ? "ayer" : `hace ${days} días`;
}

/**
 * Último valor disponible de cada métrica en `history` (ascendente por fecha), no solo el de la
 * última fila: una fila vacía o incompleta no tapa el dato del día anterior. Misma regla para
 * todas las tarjetas de salud.
 */
export function summarizeHealthMetrics(history: DailyMetricsRow[], today: string): HealthMetricSummary[] {
  return DEFS.map((def) => {
    let text: string | null = null;
    let date: string | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      const t = def.text(history[i]);
      if (t != null) {
        text = t;
        date = history[i].date;
        break;
      }
    }
    const series = history.map(def.num).filter((v): v is number => v != null);
    return {
      key: def.key,
      label: def.label,
      text,
      date,
      isToday: date === today,
      ageLabel: date ? ageLabel(date, today) : null,
      series,
    };
  });
}
