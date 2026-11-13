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

import { sessionTargetTss, plannedTssIsEstimated, sumPlannedTss } from "./dashboard-stats";

describe("objetivo semanal con reaclimatación", () => {
  const z2 = { planned_tss: null, session_type: "z2" as const, notes: { duration_minutes: 60 } };
  it("estima una z2 de reaclimatación por su duración", () => {
    expect(sessionTargetTss(z2)).toEqual({ tss: 50, estimated: true });
  });
  it("usa planned_tss cuando existe", () => {
    expect(sessionTargetTss({ planned_tss: 70, session_type: "z2", notes: null })).toEqual({ tss: 70, estimated: false });
  });
  it("no estima el test de rampa (quality sin TSS)", () => {
    expect(sessionTargetTss({ planned_tss: null, session_type: "quality", notes: { kind: "ramp_test" } }).tss).toBe(0);
  });
  it("suma 4 z2 de 60 min = 200 y avisa de que es estimado", () => {
    expect(sumPlannedTss([z2, z2, z2, z2])).toBe(200);
    expect(plannedTssIsEstimated([z2])).toBe(true);
    expect(plannedTssIsEstimated([{ planned_tss: 50 }])).toBe(false);
  });
});

describe("TSS de fuerza (estimado)", () => {
  it("suma el training_load de Garmin 1:1 cuando no hay tss", () => {
    expect(sumTss([{ tss: null, training_load: 36.6, activity_type: "strength", source: "garmin", date: "2026-11-02" }])).toBe(37);
  });
  it("un tss guardado (RPE al terminar el entreno) manda sobre el training_load", () => {
    expect(sumTss([{ tss: 30, training_load: 99, activity_type: "strength", source: "garmin", date: "2026-11-02" }])).toBe(30);
  });
  it("no cuenta dos veces: la de Garmin con carga estimada anula la de la app del mismo día", () => {
    expect(sumTss([
      { tss: null, training_load: 20, activity_type: "strength", source: "garmin", date: "2026-11-02" },
      { tss: 25, activity_type: "strength", source: "mi-entrenador-web", date: "2026-11-02" },
    ])).toBe(20);
  });
  it("cuenta TODO lo que se hace, esté o no en el plan: también 'otros' y bici sin zonas, con su carga de Garmin", () => {
    expect(sumTss([{ tss: null, training_load: 11.7, activity_type: "other", date: "2026-11-10" }])).toBe(12);
    expect(sumTss([{ tss: null, training_load: 50, activity_type: "cycling" }])).toBe(50);
  });
  it("la bici sin potencia usa primero las zonas de pulso y solo si no hay zonas, la carga", () => {
    const zones = { z1: 0, z2: 1800, z3: 0, z4: 0, z5: 0 }; // 25
    expect(sumTss([{ tss: null, training_load: 80, activity_type: "cycling", hr_zone_seconds: zones }])).toBe(25);
  });
  it("sin tss ni carga no inventa nada (0)", () => {
    expect(sumTss([{ tss: null, training_load: null, activity_type: "other" }])).toBe(0);
  });
  it("una semana mezcla todo: bici con potencia + fuerza no planificada + otra actividad", () => {
    expect(sumTss([
      { tss: 50, activity_type: "cycling", date: "2026-11-09" },
      { tss: null, training_load: 20.1, activity_type: "strength", source: "garmin", date: "2026-11-12" },
      { tss: null, training_load: 11.7, activity_type: "other", date: "2026-11-13" },
    ])).toBe(82);
  });
  it("el objetivo semanal incluye la fuerza planificada como bloque propio y avisa de que es estimado", () => {
    const week = [
      { planned_tss: 60, session_type: "z2" as const, status: "planned" as const },
      { planned_tss: 90, session_type: "quality" as const, status: "planned" as const },
      { planned_tss: null, session_type: "strength" as const, status: "planned" as const },
    ];
    expect(sumPlannedTss(week)).toBe(184); // 150 de bici + 34 de fuerza
    expect(plannedTssIsEstimated(week)).toBe(true);
    expect(plannedTssIsEstimated(week.slice(0, 2))).toBe(false);
  });
  it("una fuerza saltada sale del objetivo (no se puede redistribuir a bici)", () => {
    expect(sumPlannedTss([{ planned_tss: null, session_type: "strength", status: "skipped" }])).toBe(0);
    expect(sessionTargetTss({ planned_tss: null, session_type: "strength", status: "skipped" })).toEqual({ tss: 0, estimated: false });
  });
  it("si una fuerza ya trae planned_tss, se respeta y no es estimada", () => {
    expect(sessionTargetTss({ planned_tss: 25, session_type: "strength", status: "planned" })).toEqual({ tss: 25, estimated: false });
  });
});

