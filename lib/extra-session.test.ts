import { describe, expect, it } from "vitest";
import { suggestExtraSession, type SuggestExtraSessionInput } from "./extra-session";
import type { PlannedSession } from "./types";

function mk(
  date: string,
  session_type: PlannedSession["session_type"],
  planned_tss: number | null,
  status: PlannedSession["status"] = "planned"
): PlannedSession {
  return {
    id: date,
    user_id: "u",
    season_id: 1,
    date,
    workout_template_id: null,
    session_type,
    planned_tss,
    status,
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

const today = "2026-09-10"; // jueves

const week: PlannedSession[] = [
  mk("2026-09-07", "strength", null, "done"),
  mk("2026-09-08", "quality", 125, "done"),
  mk("2026-09-09", "z2", 95, "done"),
  mk("2026-09-10", "strength", null),
  mk("2026-09-11", "z2", 95),
  mk("2026-09-12", "z2", 95),
  mk("2026-09-13", "rest", null),
];

function input(overrides: Partial<SuggestExtraSessionInput> = {}): SuggestExtraSessionInput {
  return {
    latestFatigue: { date: "2026-09-09", recommendation: "normal", acwr_ratio: 1.0 },
    weekSessions: week,
    tomorrowSession: week[4],
    today,
    ...overrides,
  };
}

describe("suggestExtraSession", () => {
  it("normal y semana al día: Z2", () => {
    expect(suggestExtraSession(input())).toMatchObject({ type: "session", variant: "hr_z2" });
  });

  it("descanso: ninguna sesión", () => {
    const result = suggestExtraSession(
      input({ latestFatigue: { date: "2026-09-09", recommendation: "descanso", acwr_ratio: 1.6 } })
    );
    expect(result.type).toBe("none");
  });

  it("precaución: recuperación", () => {
    const result = suggestExtraSession(
      input({ latestFatigue: { date: "2026-09-09", recommendation: "precaucion", acwr_ratio: 1.4 } })
    );
    expect(result).toMatchObject({ type: "session", variant: "hr_recovery" });
  });

  it("ACWR bajo: intervalos", () => {
    const result = suggestExtraSession(
      input({ latestFatigue: { date: "2026-09-09", recommendation: "normal", acwr_ratio: 0.7 } })
    );
    expect(result).toMatchObject({ type: "session", variant: "hr_intervals" });
  });

  it("semana por detrás del TSS planificado hasta ayer: intervalos", () => {
    const behind = week.map((s) => (s.date === "2026-09-08" ? { ...s, status: "skipped" as const } : s));
    expect(suggestExtraSession(input({ weekSessions: behind }))).toMatchObject({
      type: "session",
      variant: "hr_intervals",
    });
  });

  it("mañana es calidad: Z2 aunque haya margen para intervalos", () => {
    const result = suggestExtraSession(
      input({
        latestFatigue: { date: "2026-09-09", recommendation: "normal", acwr_ratio: 0.7 },
        tomorrowSession: mk("2026-09-11", "quality", 125),
      })
    );
    expect(result).toMatchObject({ type: "session", variant: "hr_z2" });
  });

  it("sin datos de fatiga, o demasiado antiguos: Z2", () => {
    expect(suggestExtraSession(input({ latestFatigue: null }))).toMatchObject({ variant: "hr_z2" });
    expect(
      suggestExtraSession(
        input({ latestFatigue: { date: "2026-09-01", recommendation: "normal", acwr_ratio: 0.5 } })
      )
    ).toMatchObject({ variant: "hr_z2" });
  });

  it("la sesión de hoy no cuenta como pendiente para ir por detrás", () => {
    const todayQuality = week.map((s) =>
      s.date === today ? { ...s, session_type: "quality" as const, planned_tss: 200 } : s
    );
    expect(suggestExtraSession(input({ weekSessions: todayQuality }))).toMatchObject({
      variant: "hr_z2",
    });
  });
});
