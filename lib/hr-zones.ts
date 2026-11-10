import type { HrZoneSeconds } from "./types";

const ZONE_ORDER: (keyof HrZoneSeconds)[] = ["z1", "z2", "z3", "z4", "z5"];
const ZONE_LABEL: Record<keyof HrZoneSeconds, string> = {
  z1: "Z1",
  z2: "Z2",
  z3: "Z3",
  z4: "Z4",
  z5: "Z5",
};

/** Minutos por zona, redondeados, descartando las zonas en 0 (una sesión de fuerza rara vez toca Z5). */
export function formatHrZoneMinutes(
  zones: HrZoneSeconds
): { zone: string; minutes: number }[] {
  return ZONE_ORDER.map((key) => ({
    zone: ZONE_LABEL[key],
    minutes: Math.round(zones[key] / 60),
  })).filter((entry) => entry.minutes > 0);
}

/**
 * TSS estimado por hora en cada zona de pulso (Z1..Z5). Supuesto ajustable: sin potenciómetro Garmin no
 * calcula TSS, así que se aproxima con la intensidad típica de cada zona (misma escala que el TSS por
 * potencia: 100 = una hora al umbral). Z2 sostenida ≈ 50/h, intervalos de Z4 ≈ 90/h.
 */
export const HR_TSS_PER_HOUR: Record<keyof HrZoneSeconds, number> = {
  z1: 30,
  z2: 50,
  z3: 70,
  z4: 90,
  z5: 110,
};

/** TSS estimado a partir de los minutos por zona de pulso; null si no hay datos de zonas. */
export function estimateHrTss(input: unknown): number | null {
  // `hr_zone_seconds` es jsonb en la base de datos: se valida la forma antes de usarlo.
  if (!input || typeof input !== "object") return null;
  const zones = input as Partial<Record<keyof HrZoneSeconds, number>>;
  const total = ZONE_ORDER.reduce((acc, key) => acc + (zones[key] ?? 0), 0);
  if (total <= 0) return null;
  const tss = ZONE_ORDER.reduce((acc, key) => acc + ((zones[key] ?? 0) / 3600) * HR_TSS_PER_HOUR[key], 0);
  return Math.round(tss * 10) / 10;
}
