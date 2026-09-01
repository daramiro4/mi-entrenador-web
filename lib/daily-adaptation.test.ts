import { describe, expect, it } from "vitest";
import { computeDailyAdaptation } from "./daily-adaptation";
import type { PlannedSession } from "./types";

function mk(
  date: string,
  session_type: PlannedSession["session_type"],
  planned_tss: number | null,
  id: string
): PlannedSession {
  return {
    id,
    user_id: "u",
    season_id: 1,
    date,
    workout_template_id: null,
    session_type,
    planned_tss,
    status: "planned",
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

const week: PlannedSession[] = [
  mk("2026-09-07", "strength", null, "mon"),
  mk("2026-09-08", "quality", 125, "tue"),
  mk("2026-09-09", "z2", 95, "wed"),
  mk("2026-09-10", "strength", null, "thu"),
  mk("2026-09-11", "z2", 95, "fri"),
  mk("2026-09-12", "rest", null, "sat"),
  mk("2026-09-13", "rest", null, "sun"),
];

describe("computeDailyAdaptation", () => {
  it("normal: sin cambios", () => {
    const today = week.find((s) => s.id === "tue")!;
    expect(computeDailyAdaptation(today, week, "normal", "2026-09-08")).toEqual({ type: "none" });
  });

  it("precaución sobre quality: degrada a z2 y reduce el TSS un 25%", () => {
    const today = week.find((s) => s.id === "tue")!;
    expect(computeDailyAdaptation(today, week, "precaucion", "2026-09-08")).toEqual({
      type: "degrade",
      newSessionType: "z2",
      newPlannedTss: 94, // 125 * 0.75 = 93.75 -> redondeado
    });
  });

  it("precaución sobre z2: se queda z2, reduce el TSS un 25%", () => {
    const today = week.find((s) => s.id === "wed")!;
    expect(computeDailyAdaptation(today, week, "precaucion", "2026-09-09")).toEqual({
      type: "degrade",
      newSessionType: "z2",
      newPlannedTss: 71, // 95 * 0.75 = 71.25 -> redondeado
    });
  });

  it("precaución sobre strength: nunca se cancela del todo, pero no hay nada sensato que degradar", () => {
    const today = week.find((s) => s.id === "mon")!;
    expect(computeDailyAdaptation(today, week, "precaucion", "2026-09-07")).toEqual({
      type: "none",
    });
  });

  it("descanso: pospone automáticamente al hueco libre más próximo", () => {
    const today = week.find((s) => s.id === "tue")!;
    expect(computeDailyAdaptation(today, week, "descanso", "2026-09-08")).toEqual({
      type: "postpone",
      newDate: "2026-09-12", // sábado, primer rest/hueco libre desde el martes
    });
  });

  it("descanso sobre un día que ya es rest: sin cambios", () => {
    const today = week.find((s) => s.id === "sat")!;
    expect(computeDailyAdaptation(today, week, "descanso", "2026-09-12")).toEqual({
      type: "none",
    });
  });
});
