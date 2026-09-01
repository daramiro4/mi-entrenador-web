import { describe, expect, it } from "vitest";
import { buildWeeklyNarrativePrompt } from "./narrative";
import type { PlannedSession, PlannedSessionStatus } from "./types";

function mk(
  session_type: PlannedSession["session_type"],
  status: PlannedSessionStatus,
  planned_tss: number | null,
  id: string
): PlannedSession {
  return {
    id,
    user_id: "u",
    season_id: 1,
    date: "2026-08-31",
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

describe("buildWeeklyNarrativePrompt", () => {
  it("incluye el TSS objetivo/cumplido y las sesiones por resultado", () => {
    const week: PlannedSession[] = [
      mk("z2", "done", 95, "mon"),
      mk("quality", "degraded", 90, "tue"),
      mk("z2", "done", 95, "wed"),
      mk("strength", "done", null, "thu"),
      mk("quality", "skipped", 125, "fri"),
      mk("rest", "planned", null, "sat"),
      mk("rest", "planned", null, "sun"),
    ];

    const prompt = buildWeeklyNarrativePrompt(week, "2026-08-31");

    expect(prompt).toContain("2026-08-31");
    expect(prompt).toContain("TSS objetivo: 405");
    expect(prompt).toContain("TSS cumplido: 190 (47%)");
    expect(prompt).toContain("Sesiones hechas: Z2, Z2, Fuerza");
    expect(prompt).toContain("Sesiones saltadas: Calidad");
    expect(prompt).toContain("Sesiones degradadas por fatiga: Calidad");
    // Nunca menciona una decisión de progresión de bloque que no existe.
    expect(prompt.toLowerCase()).not.toContain("sube");
    expect(prompt.toLowerCase()).not.toContain("repite");
  });

  it("sesiones vacías se listan como 'ninguna'", () => {
    const prompt = buildWeeklyNarrativePrompt([], "2026-08-31");
    expect(prompt).toContain("Sesiones hechas: ninguna");
    expect(prompt).toContain("Sesiones saltadas: ninguna");
    expect(prompt).toContain("Sesiones degradadas por fatiga: ninguna");
  });
});
