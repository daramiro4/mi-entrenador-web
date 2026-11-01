import { generateWorkout } from "@/lib/strength/engine";
import type { StrengthWorkoutRecord } from "@/lib/strength/data";
import { addDays, getMondayOfWeek, todayISODate } from "@/lib/week";
import type {
  DailyMetricsRow, FatigueIndexRow, FtpHistoryRow, PlannedSession, Season,
} from "@/lib/types";
import type { FitnessTrendPoint } from "@/lib/fitness-trend";

/** Datos de ejemplo SOLO para las rutas /ui/preview/* (capturas y Lighthouse, sin base de datos). */
export const today = todayISODate();
export const monday = getMondayOfWeek(today);

const types = ["quality", "z2", "strength", "z2", "rest", "quality", "z2"] as const;
export const sessions: PlannedSession[] = types.map((t, i) => ({
  id: `s${i}`, user_id: "u", season_id: 1, date: addDays(monday, i), workout_template_id: null,
  session_type: t, planned_tss: t === "rest" ? null : t === "quality" ? 85 : t === "strength" ? 25 : 55,
  status: addDays(monday, i) < today ? (i === 2 ? "skipped" : "done") : "planned",
  actual_activity_id: null, notes: null, created_at: "", updated_at: "",
})) as PlannedSession[];

export const fatigue = { acwr_ratio: 1.08, recommendation: "normal", notes: null } as FatigueIndexRow;
export const metrics = { sleep_score: 82, hrv_ms: 54, body_battery_max: 76, stress_avg: 28 } as DailyMetricsRow;
export const season = {
  id: 1, name: "Temporada otoño", goal_type: "ftp_improvement", focus_areas: ["general_health"],
  target_ftp: 240, target_date: addDays(today, 70),
} as unknown as Season;
export const ftpHistory = [196, 202, 208, 215, 221].map((w, i) => ({
  id: i, date: addDays(today, -120 + i * 28), ftp_watts: w, method: "ramp", notes: null, source: null, user_id: "u", created_at: "",
})) as FtpHistoryRow[];
export const trend: FitnessTrendPoint[] = Array.from({ length: 60 }, (_, i) => {
  const fitness = 40 + i * 0.25;
  const fatigueV = 38 + Math.sin(i / 4) * 10;
  return { date: addDays(today, -59 + i), fitness, fatigue: fatigueV, forma: fitness - fatigueV };
});

export const strengthWorkout: StrengthWorkoutRecord = (() => {
  const w = generateWorkout({
    prefs: { days_per_week: 2, session_minutes: 30, equipment: ["bodyweight", "dumbbell", "band"], level: 2, limitations: [], excluded_areas: [] },
    format: "circuito", history: [], recentDiscomfort: [], recentSlugs: [], recentNames: [], seed: 21,
  }).workout!;
  w.blocks[1].exercises.forEach((e, i) => { if (e.weight_kg === null && e.slug.includes("mancuerna")) e.weight_kg = 10 + i; });
  return {
    id: "preview", name: w.name, format: w.format, date: today, duration_min: w.duration_min, intensity: w.intensity,
    blocks: w.blocks, status: "generated", rpe: null, felt: null, discomfort_areas: [], strength_tss: null,
    garmin_workout_id: null, progress: null, planned_session_id: null,
    guidance: "Controla la bajada y respira en cada repetición. La técnica manda sobre la carga.",
  };
})();
