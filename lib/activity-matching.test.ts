import { describe, expect, it } from "vitest";
import { findMatchingActivity } from "./activity-matching";
import type { ActivityRow, PlannedSession, PlannedSessionStatus } from "./types";

function mkSession(
  session_type: PlannedSession["session_type"],
  status: PlannedSessionStatus,
  id: string
): PlannedSession {
  return {
    id,
    user_id: "u",
    season_id: 1,
    date: "2026-08-31",
    workout_template_id: null,
    session_type,
    planned_tss: 95,
    status,
    actual_activity_id: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
}

function mkActivity(activity_type: string, id: number): ActivityRow {
  return {
    id,
    user_id: "u",
    date: "2026-08-31",
    activity_type,
    duration_minutes: 60,
    avg_power: null,
    normalized_power: null,
    tss: 90,
    training_load: null,
    raw_data: null,
    source: "garmin",
    created_at: "",
    external_id: null,
    avg_hr: null,
    max_hr: null,
    hr_zone_seconds: null,
  };
}

describe("findMatchingActivity", () => {
  const cycling = mkActivity("cycling", 1);
  const strength = mkActivity("strength", 2);

  it("quality/z2 planned se empareja con una actividad cycling", () => {
    expect(findMatchingActivity(mkSession("z2", "planned", "a"), [cycling])).toBe(cycling);
    expect(findMatchingActivity(mkSession("quality", "degraded", "b"), [cycling])).toBe(cycling);
  });

  it("strength solo se empareja con actividad strength, nunca con cycling", () => {
    expect(findMatchingActivity(mkSession("strength", "planned", "c"), [cycling])).toBeNull();
    expect(findMatchingActivity(mkSession("strength", "planned", "d"), [strength])).toBe(strength);
  });

  it("rest nunca empareja", () => {
    expect(findMatchingActivity(mkSession("rest", "planned", "e"), [cycling])).toBeNull();
  });

  it("nunca toca sesiones skipped o ya done", () => {
    expect(findMatchingActivity(mkSession("z2", "skipped", "f"), [cycling])).toBeNull();
    expect(findMatchingActivity(mkSession("z2", "done", "g"), [cycling])).toBeNull();
  });

  it("sin actividades ese día, no hay coincidencia", () => {
    expect(findMatchingActivity(mkSession("z2", "planned", "h"), [])).toBeNull();
  });
});
