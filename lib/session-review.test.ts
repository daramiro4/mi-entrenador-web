import { describe, expect, it } from "vitest";
import { buildSessionReviewPrompt, validReview } from "./session-review";
import type { ActivityRow, PlannedSession, StrengthSessionRow } from "./types";

const session = (over: Partial<PlannedSession> = {}): PlannedSession => ({
  id: "s", user_id: "u", season_id: 1, date: "2026-11-19", workout_template_id: null, session_type: "quality",
  planned_tss: 80, status: "done", actual_activity_id: 36, notes: null, created_at: "", updated_at: "", ...over,
});
const activity = (over: Partial<ActivityRow> = {}): ActivityRow =>
  ({
    id: 36, user_id: "u", date: "2026-11-19", activity_type: "cycling", duration_minutes: 58.5, avg_power: 151,
    normalized_power: null, tss: 60.7, training_load: 104.8, avg_hr: 148, max_hr: 171, hr_zone_seconds: { z1: 300, z2: 1800, z3: 1200, z4: 200, z5: 0 },
    raw_data: null, source: "garmin", external_id: null, created_at: "", ...over,
  }) as ActivityRow;

describe("buildSessionReviewPrompt", () => {
  it("incluye plan y datos reales, y avisa de que se hizo otro día", () => {
    const p = buildSessionReviewPrompt(session({ notes: { moved_from: "2026-11-18" } }), activity(), { fatigueRecommendation: "precaucion", exercises: [] });
    expect(p).toContain("TSS planificado: 80");
    expect(p).toContain("TSS real: 61");
    expect(p).toContain("Potencia media: 151 W");
    expect(p).toContain("FC media: 148 ppm");
    expect(p).toContain("Z2 30");
    expect(p).toContain("cargado (precaución)");
    expect(p).toContain("2026-11-18");
    expect(p).toContain("máximo 70 palabras");
  });

  it("omite lo que falta en vez de inventarlo", () => {
    const p = buildSessionReviewPrompt(
      session({ planned_tss: null }),
      activity({ avg_power: null, avg_hr: null, max_hr: null, hr_zone_seconds: null, tss: null, training_load: null, duration_minutes: null }),
      { fatigueRecommendation: null, exercises: [] },
    );
    expect(p).not.toContain("Potencia");
    expect(p).not.toContain("FC ");
    expect(p).not.toContain("TSS real");
    expect(p).not.toContain("recuperación ese día");
  });

  it("en fuerza lista los ejercicios y marca el TSS como estimado", () => {
    const ex = [{ exercise: "Sentadilla goblet", sets: 3, reps: 10, weight_kg: 16 }] as StrengthSessionRow[];
    const p = buildSessionReviewPrompt(
      session({ session_type: "strength", planned_tss: null }),
      activity({ activity_type: "strength", tss: null, training_load: 43.8 }),
      { fatigueRecommendation: "normal", exercises: ex },
    );
    expect(p).toContain("TSS real: ≈44 (estimado");
    expect(p).toContain("Sentadilla goblet 3×10 @ 16 kg");
  });
});

describe("validReview", () => {
  const review = { text: "Bien", generated_at: "x", activity_id: 36 };
  it("solo vale si es de la actividad enlazada", () => {
    expect(validReview(session({ notes: { review } }))?.text).toBe("Bien");
    expect(validReview(session({ notes: { review }, actual_activity_id: 99 }))).toBeNull();
    expect(validReview(session())).toBeNull();
  });
});
