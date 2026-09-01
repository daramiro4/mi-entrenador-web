import type { WorkoutStep } from "./types";

export function computeWorkoutDurationMinutes(intervals: WorkoutStep[]): number {
  const totalSeconds = intervals.reduce((sum, step) => sum + step.duration_seconds, 0);
  return Math.round(totalSeconds / 60);
}
