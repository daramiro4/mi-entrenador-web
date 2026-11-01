import { EXERCISE_BY_SLUG } from "./library";
import type { Contraindication } from "./types";
import type { HistoryEntry, WorkoutBlock } from "./workout-types";

export interface PastWorkout {
  date: string;
  status: string;
  blocks: WorkoutBlock[];
  rpe: number | null;
  felt: "easy" | "ok" | "hard" | null;
  discomfort_areas: string[];
  name: string;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

/** Última sesión comparable por ejercicio, a partir de rutinas terminadas (de la más reciente a la más antigua). */
export function buildHistory(pastDone: PastWorkout[]): HistoryEntry[] {
  const seen = new Map<string, HistoryEntry>();
  for (const w of pastDone) {
    if (w.status !== "done") continue;
    for (const b of w.blocks) {
      if (b.kind !== "main") continue;
      for (const e of b.exercises) {
        if (seen.has(e.slug) || !e.result || e.result.sets.length === 0) continue;
        const weights = e.result.sets.map((s) => s.weight_kg).filter((x): x is number => x != null);
        const rpes = e.result.sets.map((s) => s.rpe).filter((x): x is number => x != null);
        const ex = EXERCISE_BY_SLUG[e.slug];
        seen.set(e.slug, {
          slug: e.slug,
          weight_kg: median(weights),
          target_reps: e.rep_scheme ? e.rep_scheme[0] : (e.reps ?? null),
          reps_done: e.result.sets.map((s) => s.reps),
          rpe: rpes.length ? Math.max(...rpes) : w.rpe,
          felt: w.felt,
          discomfort: !!ex && ex.contraindications.some((c) => w.discomfort_areas.includes(c)),
        });
      }
    }
  }
  return [...seen.values()];
}

export function recentSlugs(past: PastWorkout[], take = 2): string[] {
  return past.slice(0, take).flatMap((w) => w.blocks.filter((b) => b.kind === "main").flatMap((b) => b.exercises.map((e) => e.slug)));
}

/** Zonas con molestia en los últimos `days` días (se excluyen hasta que el usuario las limpie en preferencias). */
export function recentDiscomfortAreas(past: PastWorkout[], today: string, days = 14): Contraindication[] {
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() - days);
  const iso = limit.toISOString().slice(0, 10);
  const areas = new Set<string>();
  for (const w of past) if (w.date >= iso) w.discomfort_areas.forEach((a) => areas.add(a));
  return [...areas] as Contraindication[];
}
