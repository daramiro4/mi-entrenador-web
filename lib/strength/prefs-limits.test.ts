import { describe, expect, it } from "vitest";
import { clampSessionMinutes, MAX_SESSION_MINUTES, SESSION_MINUTE_OPTIONS } from "./prefs-limits";
import { generateWorkout } from "./engine";
import { FORMATS } from "./formats";
import type { Prefs } from "./workout-types";

describe("duración de sesión", () => {
  it("un valor antiguo de 60 min se reduce a 45", () => {
    expect(clampSessionMinutes(60)).toBe(45);
    expect(clampSessionMinutes(45)).toBe(45);
    expect(clampSessionMinutes(10)).toBe(15);
    expect(clampSessionMinutes(Number.NaN)).toBe(30);
  });

  it("todas las opciones ofrecidas están dentro del máximo", () => {
    expect(Math.max(...SESSION_MINUTE_OPTIONS)).toBe(MAX_SESSION_MINUTES);
  });

  it("cada formato genera una rutina válida con las opciones ofrecidas y el equipamiento completo", () => {
    const prefs = (m: number): Prefs => ({
      days_per_week: 3,
      session_minutes: m,
      equipment: ["bodyweight", "machine", "dumbbell", "band", "kettlebell", "cable", "barbell"],
      level: 2,
      limitations: [],
      excluded_areas: [],
    });
    for (const minutes of [45]) {
      for (const f of FORMATS) {
        for (let seed = 1; seed <= 40; seed++) {
          const r = generateWorkout({
            prefs: prefs(minutes), format: f.slug, history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed,
          });
          expect(r.workout, `${f.slug} ${minutes} min semilla ${seed}`).not.toBeNull();
        }
      }
    }
  });
});
