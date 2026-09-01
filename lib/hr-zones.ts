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
