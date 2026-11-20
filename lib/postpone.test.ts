import { describe, expect, it } from "vitest";
import { getValidMoveTargets, getValidPostponeDates } from "./postpone";
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

describe("getValidMoveTargets", () => {
  // Semana 2026-11-16 (lun) .. 2026-11-22 (dom); hoy es viernes 20, como en el caso real.
  const week: PlannedSession[] = [
    { ...mk("2026-11-16", "strength", "mon"), status: "done" },
    { ...mk("2026-11-17", "z2", "tue"), status: "done" },
    mk("2026-11-18", "quality", "wed"), // pasada y sin hacer
    { ...mk("2026-11-19", "strength", "thu"), status: "skipped" },
    mk("2026-11-20", "z2", "fri"),
    mk("2026-11-21", "quality", "sat"),
    mk("2026-11-22", "rest", "sun"),
  ];
  const missed = week[2];
  const today = "2026-11-20";

  it("una sesión pasada sin hacer puede ir a hoy (intercambio) y a días futuros", () => {
    const targets = getValidMoveTargets(week, missed, today);
    expect(targets.map((t) => t.date)).toEqual(["2026-11-20", "2026-11-21", "2026-11-22"]);
    expect(targets[0].swapWith?.id).toBe("fri");
    expect(targets[1].swapWith?.id).toBe("sat");
    expect(targets[2].swapWith).toBeNull(); // el descanso se libera, no se intercambia
  });

  it("nunca ofrece días pasados ni días con sesión hecha o saltada", () => {
    const dates = getValidMoveTargets(week, missed, today).map((t) => t.date);
    expect(dates).not.toContain("2026-11-16");
    expect(dates).not.toContain("2026-11-19");
  });

  it("un día sin fila es un destino libre", () => {
    const sinSabado = week.filter((s) => s.id !== "sat");
    const sat = getValidMoveTargets(sinSabado, missed, today).find((t) => t.date === "2026-11-21");
    expect(sat).toEqual({ date: "2026-11-21", swapWith: null });
  });

  it("no mueve sesiones ya hechas o saltadas", () => {
    expect(getValidMoveTargets(week, week[0], today)).toEqual([]);
    expect(getValidMoveTargets(week, week[3], today)).toEqual([]);
  });

  it("no cambia getValidPostponeDates: la capa adaptativa solo ve huecos libres", () => {
    expect(getValidPostponeDates(week, missed, today)).toEqual(["2026-11-22"]);
  });
});
