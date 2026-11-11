import type { HrZoneSeconds } from "./types";

/**
 * Ajuste por pulso de la potencia de Z2. Si en una Z2 hecha a los vatios prescritos el pulso se fue a
 * Z3+ gran parte del tiempo, el próximo Z2 baja de vatios hasta que el pulso se normalice. Todo son
 * constantes ajustables (acordadas con el usuario, sin fórmula cerrada en CLAUDE.md).
 */
export const HR_ADJUSTMENT = {
  /** Rango de Z2 sobre el FTP efectivo (mismo que `mi-entrenador-garmin/api/workout_builder.py`). */
  Z2_LOW_PCT: 0.65,
  Z2_HIGH_PCT: 0.75,
  /** La potencia media debe ser al menos este % del mínimo del rango para evaluar la sesión. */
  POWER_LOW_TOLERANCE: 0.9,
  /** Fracción del tiempo en Z3 o más de pulso. */
  Z3PLUS_MODERATE: 0.4,
  Z3PLUS_STRONG: 0.6,
  /** Por debajo de esto la sesión fue "buena" y el descuento se va retirando. */
  Z3PLUS_OK: 0.25,
  /** Descuentos en % sobre los vatios. */
  DISCOUNT_MODERATE: 8,
  DISCOUNT_STRONG: 15,
  DISCOUNT_CAP: 20,
  DISCOUNT_STEP_DOWN: 5,
  /** Con mal sueño o pulso en reposo alto el ajuste no pasa de esto y se sugiere descanso. */
  DISCOUNT_POOR_RECOVERY_MAX: 8,
  POOR_SLEEP_MINUTES: 360,
  RESTING_HR_RISE_BPM: 5,
} as const;

export interface HrAdjustmentRecord {
  pct_before: number;
  pct_after: number;
  z3plus_pct: number | null;
  outcome: "increase" | "decrease" | "hold" | "skipped";
  poor_recovery: boolean;
  suggest_rest: boolean;
}

const ZONES: (keyof HrZoneSeconds)[] = ["z1", "z2", "z3", "z4", "z5"];

/** Fracción (0-1) del tiempo en Z3, Z4 o Z5; null si no hay datos de zonas. */
export function z3PlusShare(input: unknown): number | null {
  if (!input || typeof input !== "object") return null;
  const zones = input as Partial<Record<keyof HrZoneSeconds, number>>;
  const total = ZONES.reduce((a, k) => a + (zones[k] ?? 0), 0);
  if (total <= 0) return null;
  const high = (zones.z3 ?? 0) + (zones.z4 ?? 0) + (zones.z5 ?? 0);
  return high / total;
}

/** Rango de Z2 en vatios para un FTP efectivo. */
export function z2PowerRange(ftpWatts: number): { low: number; high: number } {
  return {
    low: Math.round(ftpWatts * HR_ADJUSTMENT.Z2_LOW_PCT),
    high: Math.round(ftpWatts * HR_ADJUSTMENT.Z2_HIGH_PCT),
  };
}

/**
 * FTP con el que se calcula la Z2 enviada: el FTP efectivo (que ya trae el descuento de reaclimatación, si
 * lo hay) menos el descuento por pulso. Se aplica ENCIMA, no "el mayor de los dos": la evaluación del
 * pulso se hace sobre los vatios ya prescritos con reaclimatación, así que el descuento mide cuánto más
 * hay que bajar desde ahí.
 */
export function hrAdjustedFtp(effectiveFtp: number, hrDiscountPct: number): number {
  return Math.round(effectiveFtp * (1 - hrDiscountPct / 100));
}

export interface AssessInput {
  /** Descuento (en %) con el que se hizo la sesión. */
  pctBefore: number;
  avgPower: number | null;
  /** FTP efectivo usado para calcular los vatios de esa sesión (con el descuento ya aplicado). */
  ftpUsed: number | null;
  zones: unknown;
  /** Minutos de sueño de esa noche y FC en reposo frente a su media de 28 días; null si no hay datos. */
  sleepMinutes: number | null;
  restingHr: number | null;
  restingHrBaseline: number | null;
}

export function isPoorRecovery(input: Pick<AssessInput, "sleepMinutes" | "restingHr" | "restingHrBaseline">): boolean {
  const shortSleep = input.sleepMinutes != null && input.sleepMinutes < HR_ADJUSTMENT.POOR_SLEEP_MINUTES;
  const highRestingHr =
    input.restingHr != null &&
    input.restingHrBaseline != null &&
    input.restingHr >= input.restingHrBaseline + HR_ADJUSTMENT.RESTING_HR_RISE_BPM;
  return shortSleep || highRestingHr;
}

/** Evalúa una Z2 hecha y devuelve el nuevo descuento. Función pura. */
export function assessZ2(input: AssessInput): HrAdjustmentRecord {
  const A = HR_ADJUSTMENT;
  const share = z3PlusShare(input.zones);
  const poor = isPoorRecovery(input);
  const base = { pct_before: input.pctBefore, z3plus_pct: share, poor_recovery: poor };

  if (share == null || input.avgPower == null || input.ftpUsed == null) {
    return { ...base, pct_after: input.pctBefore, outcome: "skipped", suggest_rest: false };
  }
  const { low, high } = z2PowerRange(input.ftpUsed);
  const inBand = input.avgPower >= low * A.POWER_LOW_TOLERANCE && input.avgPower <= high;

  if (inBand && share >= A.Z3PLUS_MODERATE) {
    let step: number = share > A.Z3PLUS_STRONG ? A.DISCOUNT_STRONG : A.DISCOUNT_MODERATE;
    if (poor) step = Math.min(step, A.DISCOUNT_POOR_RECOVERY_MAX);
    const after = Math.min(A.DISCOUNT_CAP, input.pctBefore + step);
    return { ...base, pct_after: after, outcome: after > input.pctBefore ? "increase" : "hold", suggest_rest: poor };
  }
  if (input.avgPower >= low * A.POWER_LOW_TOLERANCE && share < A.Z3PLUS_OK && input.pctBefore > 0) {
    return { ...base, pct_after: Math.max(0, input.pctBefore - A.DISCOUNT_STEP_DOWN), outcome: "decrease", suggest_rest: false };
  }
  return { ...base, pct_after: input.pctBefore, outcome: "hold", suggest_rest: false };
}

/** Frase para el panel del día; null si la evaluación no cambió nada que contar. */
export function describeHrAdjustment(r: HrAdjustmentRecord | null | undefined): string | null {
  if (!r || r.outcome === "skipped" || r.outcome === "hold") return null;
  const share = r.z3plus_pct != null ? `${Math.round(r.z3plus_pct * 100)} % del tiempo en Z3+` : "pulso alto";
  if (r.outcome === "increase") {
    const rest = r.suggest_rest ? " Además, conviene descansar o acortar la próxima: poco sueño o pulso en reposo alto." : "";
    return `Pulso alto para esos vatios (${share}). Próxima Z2: -${r.pct_after} % de vatios.${rest}`;
  }
  return r.pct_after === 0
    ? `Buen pulso (${share}). Se retira el descuento de vatios por pulso.`
    : `Buen pulso (${share}). El descuento por pulso baja a -${r.pct_after} %.`;
}
