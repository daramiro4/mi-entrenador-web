import { describe, expect, it } from "vitest";
import { getValidPostponeDates } from "./postpone";
import type { PlannedSession } from "./types";

function mk(
  date: string,
  session_type: PlannedSession["session_type"],
  id: string
): PlannedSession {
  return {
    id,
    user_id: "u",
    season_id: 1,
    date,
    workout_template_id: null,
    session_type,
    planned_tss: 50,
    status: "planned",
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

describe("getValidPostponeDates", () => {
  // Semana lunes 2026-09-07 .. domingo 2026-09-13.
  const week: PlannedSession[] = [
    mk("2026-09-07", "strength", "mon"),
    mk("2026-09-08", "z2", "tue"),
    mk("2026-09-09", "quality", "wed"),
    mk("2026-09-10", "strength", "thu"),
    // viernes vacío (sin fila)
    mk("2026-09-12", "rest", "sat"),
    mk("2026-09-13", "z2", "sun"),
  ];
  const toMove = week.find((s) => s.id === "wed")!; // 2026-09-09, quality

  it("solo días vacíos o de descanso son válidos, nunca el propio día", () => {
    expect(getValidPostponeDates(week, toMove, "2026-09-07")).toEqual([
      "2026-09-11",
      "2026-09-12",
    ]);
  });

  it("today posterior no cambia el resultado si sigue dentro de la semana", () => {
    expect(getValidPostponeDates(week, toMove, "2026-09-11")).toEqual([
      "2026-09-11",
      "2026-09-12",
    ]);
  });

  it("sin días libres, devuelve vacío", () => {
    const fullWeek: PlannedSession[] = [
      mk("2026-09-07", "z2", "mon"),
      mk("2026-09-08", "z2", "tue"),
      mk("2026-09-09", "quality", "wed"),
      mk("2026-09-10", "z2", "thu"),
      mk("2026-09-11", "z2", "fri"),
      mk("2026-09-12", "z2", "sat"),
      mk("2026-09-13", "z2", "sun"),
    ];
    expect(getValidPostponeDates(fullWeek, fullWeek[2], "2026-09-07")).toEqual([]);
  });
});
