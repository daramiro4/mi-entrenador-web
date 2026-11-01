import { describe, expect, it } from "vitest";
import { buildFitnessTrendPoints, hasEnoughTrendData } from "./fitness-trend";
import type { FatigueIndexRow } from "./types";

function mk(
  date: string,
  acute_load: number | null,
  chronic_load: number | null
): FatigueIndexRow {
  return {
    id: 1,
    user_id: "u",
    date,
    acute_load,
    chronic_load,
    acwr_ratio: null,
    recommendation: null,
    notes: null,
    created_at: "",
  };
}

describe("buildFitnessTrendPoints", () => {
  it("calcula forma = chronic_load - acute_load", () => {
    const rows = [mk("2026-09-01", 60, 80)];
    expect(buildFitnessTrendPoints(rows)).toEqual([
      { date: "2026-09-01", fitness: 80, fatigue: 60, forma: 20 },
    ]);
  });

  it("descarta filas sin acute_load o chronic_load", () => {
    const rows = [
      mk("2026-09-01", null, 80),
      mk("2026-09-02", 60, null),
      mk("2026-09-03", 60, 80),
    ];
    expect(buildFitnessTrendPoints(rows)).toEqual([
      { date: "2026-09-03", fitness: 80, fatigue: 60, forma: 20 },
    ]);
  });
});

describe("hasEnoughTrendData", () => {
  it("false con menos de 7 puntos por defecto", () => {
    const points = Array.from({ length: 6 }, (_, i) => ({
      date: `d${i}`,
      fitness: 1,
      fatigue: 1,
      forma: 0,
    }));
    expect(hasEnoughTrendData(points)).toBe(false);
  });

  it("true con 7 puntos o más por defecto", () => {
    const points = Array.from({ length: 7 }, (_, i) => ({
      date: `d${i}`,
      fitness: 1,
      fatigue: 1,
      forma: 0,
    }));
    expect(hasEnoughTrendData(points)).toBe(true);
  });
});
