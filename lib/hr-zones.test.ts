import { describe, expect, it } from "vitest";
import { formatHrZoneMinutes } from "./hr-zones";

describe("formatHrZoneMinutes", () => {
  it("convierte segundos a minutos redondeados y descarta zonas en 0", () => {
    const result = formatHrZoneMinutes({
      z1: 168.881,
      z2: 1049.636,
      z3: 2235.973,
      z4: 187.759,
      z5: 0,
    });

    expect(result).toEqual([
      { zone: "Z1", minutes: 3 },
      { zone: "Z2", minutes: 17 },
      { zone: "Z3", minutes: 37 },
      { zone: "Z4", minutes: 3 },
    ]);
  });

  it("todas las zonas en 0 devuelve una lista vacía", () => {
    expect(formatHrZoneMinutes({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })).toEqual([]);
  });
});

import { estimateHrTss, HR_TSS_PER_HOUR } from "./hr-zones";

describe("estimateHrTss", () => {
  it("una hora en Z2 = TSS/h de Z2", () => {
    expect(estimateHrTss({ z1: 0, z2: 3600, z3: 0, z4: 0, z5: 0 })).toBe(HR_TSS_PER_HOUR.z2);
  });
  it("suma las zonas proporcionalmente al tiempo", () => {
    // 30 min Z2 (25) + 9 min Z4 (13,5) = 38,5
    expect(estimateHrTss({ z1: 0, z2: 1800, z3: 0, z4: 540, z5: 0 })).toBe(38.5);
  });
  it("null sin datos de zonas", () => {
    expect(estimateHrTss(null)).toBeNull();
    expect(estimateHrTss({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })).toBeNull();
  });
});
