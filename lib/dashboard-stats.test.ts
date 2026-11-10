import { describe, expect, it } from "vitest";
import { sumTss, computeBadges, computeStreak, computeTotals, dayState, greeting, redistributionLine, weekHeadline } from "./dashboard-stats";
import type { PlannedSession } from "./types";

const s = (o: Partial<PlannedSession>): PlannedSession =>
  ({ id: "a", date: "2026-11-02", session_type: "z2", status: "planned", planned_tss: 50, notes: null, ...o }) as PlannedSession;

describe("dashboard-stats", () => {
  it("streak cuenta semanas >= 85 % y se corta con la primera que falla o sin plan", () => {
    expect(computeStreak([{ plannedTss: 100, completedTss: 90 }, { plannedTss: 100, completedTss: 85 }, { plannedTss: 100, completedTss: 50 }, { plannedTss: 100, completedTss: 100 }])).toBe(2);
    expect(computeStreak([{ plannedTss: 0, completedTss: 0 }])).toBe(0);
    expect(computeStreak([])).toBe(0);
  });
  it("titular humano", () => {
    expect(weekHeadline(0, 0)).toMatch(/objetivo/);
    expect(weekHeadline(100, 100)).toMatch(/cumplida/);
  });
  it("estado del día", () => {
    expect(dayState(undefined, "2026-11-02", "2026-11-02")).toBe("none");
    expect(dayState(s({}), "2026-11-02", "2026-11-02")).toBe("today");
    expect(dayState(s({}), "2026-11-03", "2026-11-02")).toBe("pending");
    expect(dayState(s({ status: "done" }), "2026-11-03", "2026-11-02")).toBe("done");
    expect(dayState(s({ session_type: "rest" }), "2026-11-03", "2026-11-02")).toBe("rest");
  });
  it("línea de redistribución", () => {
    expect(redistributionLine([s({})])).toBeNull();
    const line = redistributionLine([
      s({ id: "x", status: "skipped", notes: { redistributed_to_session_id: "y", redistributed_tss: 40 } }),
      s({ id: "y", date: "2026-11-05" }),
    ]);
    expect(line).toContain("40 TSS al jueves");
  });
  it("totales y medallas", () => {
    const t = computeTotals([{ date: "2026-11-01", volume_kg: 600 }, { date: "2026-10-30", volume_kg: 900 }], [{ date: "2026-11-01", duration_minutes: 90 }], "2026-11-10");
    expect(t.strengthKgMonth).toBe(600);
    expect(t.hoursLast30).toBe(1.5);
    expect(computeBadges({ streak: 2, totals: t, activityCount: 1 }).filter((b) => b.earned).length).toBe(2);
  });
  it("sumTss no cuenta dos veces la fuerza del mismo día (Garmin + app)", () => {
    expect(sumTss([
      { tss: 30, date: "2026-11-02", activity_type: "strength", source: "garmin" },
      { tss: 20, date: "2026-11-02", activity_type: "strength", source: "mi-entrenador-web" },
      { tss: 50, date: "2026-11-03", activity_type: "cycling", source: "garmin" },
    ])).toBe(80);
    expect(sumTss([{ tss: 20, date: "2026-11-02", activity_type: "strength", source: "mi-entrenador-web" }])).toBe(20);
  });
  it("saludo", () => {
    expect(greeting(8, "David")).toBe("Buenos días, David");
    expect(greeting(8, null)).toBe("Buenos días");
  });
});

describe("sumTss: bici por pulso", () => {
  const zones = { z1: 0, z2: 1800, z3: 0, z4: 0, z5: 0 }; // 30 min Z2 = 25
  it("estima el TSS de una bici sin potencia a partir de las zonas de pulso", () => {
    expect(sumTss([{ tss: null, activity_type: "cycling", hr_zone_seconds: zones }])).toBe(25);
  });
  it("si Garmin ya da TSS, no lo sustituye", () => {
    expect(sumTss([{ tss: 50, activity_type: "cycling", hr_zone_seconds: zones }])).toBe(50);
  });
  it("no estima para fuerza ni sin zonas", () => {
    expect(sumTss([{ tss: null, activity_type: "strength", hr_zone_seconds: zones }])).toBe(0);
    expect(sumTss([{ tss: null, activity_type: "cycling", hr_zone_seconds: null }])).toBe(0);
  });
});
