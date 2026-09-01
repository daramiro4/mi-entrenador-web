import { describe, expect, it } from "vitest";
import { getValidRedistributionDates } from "./redistribute";
import type { PlannedSession } from "./types";

function mk(
  date: string,
  session_type: PlannedSession["session_type"],
  status: PlannedSession["status"],
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
    status,
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

describe("getValidRedistributionDates", () => {
  it("solo quality/z2 planned/degraded, nunca el día siguiente a strength, nunca rest/done/skipped", () => {
    const week: PlannedSession[] = [
      mk("2026-09-07", "strength", "planned", "mon"),
      mk("2026-09-08", "z2", "planned", "tue"), // día siguiente a fuerza -> inválido
      mk("2026-09-09", "quality", "planned", "wed"), // sesión que se salta
      mk("2026-09-10", "strength", "planned", "thu"),
      mk("2026-09-11", "z2", "done", "fri"), // ya hecha -> inválida
      mk("2026-09-12", "rest", "planned", "sat"), // descanso -> inválido (no quality/z2)
      mk("2026-09-13", "z2", "planned", "sun"), // válido
    ];
    const toSkip = week.find((s) => s.id === "wed")!;

    expect(getValidRedistributionDates(week, toSkip, "2026-09-07")).toEqual(["2026-09-13"]);
  });

  it("un día degraded sigue siendo válido como destino", () => {
    const week: PlannedSession[] = [
      mk("2026-09-07", "quality", "planned", "mon"),
      mk("2026-09-08", "z2", "degraded", "tue"),
    ];
    expect(getValidRedistributionDates(week, week[0], "2026-09-07")).toEqual(["2026-09-08"]);
  });
});
