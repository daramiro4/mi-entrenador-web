import { describe, expect, it } from "vitest";
import { computeProgressSignal } from "./progress";
import type { PlannedSession, PlannedSessionStatus } from "./types";

function mk(planned_tss: number | null, status: PlannedSessionStatus, id: string): PlannedSession {
  return {
    id,
    user_id: "u",
    season_id: 1,
    date: "2026-09-07",
    workout_template_id: null,
    session_type: "z2",
    planned_tss,
    status,
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

describe("computeProgressSignal", () => {
  it("suma planned_tss de todas como objetivo, y de las done como cumplido", () => {
    const sessions: PlannedSession[] = [
      mk(95, "done", "a"),
      mk(95, "done", "b"),
      mk(125, "skipped", "c"),
      mk(95, "planned", "d"),
      mk(null, "planned", "e"), // rest, no cuenta
    ];

    expect(computeProgressSignal(sessions)).toEqual({
      targetTss: 410,
      completedTss: 190,
      pct: 190 / 410,
    });
  });

  it("pct es null si no hay TSS objetivo en el bloque", () => {
    expect(computeProgressSignal([])).toEqual({ targetTss: 0, completedTss: 0, pct: null });
  });
});
