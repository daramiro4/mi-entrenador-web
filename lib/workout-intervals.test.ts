import { describe, expect, it } from "vitest";
import { computeWorkoutDurationMinutes } from "./workout-intervals";
import type { WorkoutStep } from "./types";

function step(kind: WorkoutStep["kind"], duration_seconds: number): WorkoutStep {
  return { kind, duration_seconds, target_low_pct_ftp: 60, target_high_pct_ftp: 70 };
}

describe("computeWorkoutDurationMinutes", () => {
  it("suma la duración de todos los pasos y redondea a minutos", () => {
    const intervals = [step("warmup", 600), step("interval", 300), step("recovery", 300)];
    expect(computeWorkoutDurationMinutes(intervals)).toBe(20);
  });

  it("es 0 si no hay pasos", () => {
    expect(computeWorkoutDurationMinutes([])).toBe(0);
  });
});
