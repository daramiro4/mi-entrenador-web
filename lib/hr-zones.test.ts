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
