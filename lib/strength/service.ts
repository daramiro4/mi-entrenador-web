import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { todayISODate } from "@/lib/week";
import { generateWorkout } from "./engine";
import { aiEnabled, callGemini, generateWithAi } from "./ai";
import { buildHistory, recentDiscomfortAreas, recentSlugs } from "./history";
import { DEFAULT_PREFS, getNextDayQuality, getPrefs, getRecentWorkouts, insertWorkout, toPast, type StrengthWorkoutRecord } from "./data";
import { strengthTss, DEFAULT_PLANNED_RPE } from "./tss";
import type { FormatSlug } from "./types";
import type { GenerateResult, GeneratedWorkout } from "./workout-types";

export type GenerateOutcome =
  | { ok: true; workout: GeneratedWorkout; saved: StrengthWorkoutRecord | null; log: GenerateResult["attempts"] }
  | { ok: false; reason: "missing_tables" | "no_valid_workout"; message: string; log?: GenerateResult["attempts"] };

/** Genera una rutina por reglas (validada) y, si `save`, la guarda. Compartido por la API interna y las acciones de la UI. */
export async function generateForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  format: FormatSlug,
  opts: { save: boolean; seed?: number; today?: string } = { save: true }
): Promise<GenerateOutcome> {
  const today = opts.today ?? todayISODate();
  const [{ prefs, missing }, recent, nextDayQuality] = await Promise.all([
    getPrefs(supabase, userId),
    getRecentWorkouts(supabase, userId, 12),
    getNextDayQuality(supabase, userId, today),
  ]);
  if (missing || recent.missing) {
    return { ok: false, reason: "missing_tables", message: "Las tablas de fuerza aún no existen en la base de datos (falta aplicar las migraciones)." };
  }
  const past = toPast(recent.rows);
  const genInput = {
    prefs: prefs ?? DEFAULT_PREFS,
    format,
    history: buildHistory(past.filter((p) => p.status === "done")),
    recentDiscomfort: recentDiscomfortAreas(past, today),
    recentSlugs: recentSlugs(past, 2),
    recentNames: past.slice(0, 5).map((p) => p.name),
    nextDayQuality,
    seed: opts.seed ?? Math.floor(Math.random() * 2 ** 31),
  };
  const result = aiEnabled() ? await generateWithAi(genInput, callGemini) : generateWorkout(genInput);
  if (!result.workout) {
    return { ok: false, reason: "no_valid_workout", message: "No se pudo generar una rutina válida con tus preferencias.", log: result.attempts };
  }
  const saved = opts.save
    ? await insertWorkout(supabase, userId, result.workout, {
        date: today,
        log: { attempts: result.attempts, guidance: result.workout.guidance ?? null },
        strength_tss: strengthTss(result.workout.duration_min, DEFAULT_PLANNED_RPE),
      })
    : null;
  return { ok: true, workout: result.workout, saved, log: result.attempts };
}
