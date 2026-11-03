import { clampSessionMinutes } from "./prefs-limits";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { addDays } from "@/lib/week";
import type { Contraindication, Equipment, FormatSlug } from "./types";
import type { GeneratedWorkout, Prefs, WorkoutBlock } from "./workout-types";
import type { PastWorkout } from "./history";

type Client = SupabaseClient<Database>;

/** Error "tabla no existe" (migraciones sin aplicar): la UI degrada a estado vacío. */
export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? ""));
}

export const DEFAULT_PREFS: Prefs = {
  days_per_week: 2,
  session_minutes: 30,
  equipment: ["bodyweight"],
  level: 1,
  limitations: [],
  excluded_areas: [],
};

export async function getPrefs(supabase: Client, userId: string): Promise<{ prefs: Prefs | null; missing: boolean }> {
  const { data, error } = await supabase.from("user_strength_prefs").select("*").eq("user_id", userId).maybeSingle();
  if (isMissingTable(error)) return { prefs: null, missing: true };
  if (error) throw new Error(`No se pudieron leer las preferencias: ${error.message}`);
  if (!data) return { prefs: null, missing: false };
  return {
    missing: false,
    prefs: {
      days_per_week: data.days_per_week,
      // Valores guardados antes del límite de 45 min (p. ej. 60) se leen ya reducidos; no se reescribe la base.
      session_minutes: clampSessionMinutes(data.session_minutes),
      equipment: data.equipment as Equipment[],
      level: data.level as 1 | 2 | 3,
      limitations: data.limitations as Contraindication[],
      excluded_areas: data.excluded_areas as Contraindication[],
    },
  };
}

export async function savePrefs(supabase: Client, userId: string, prefs: Prefs): Promise<void> {
  const { error } = await supabase
    .from("user_strength_prefs")
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudieron guardar las preferencias: ${error.message}`);
}

export interface StrengthWorkoutRecord {
  id: string;
  name: string;
  format: FormatSlug;
  date: string;
  duration_min: number;
  intensity: string | null;
  blocks: WorkoutBlock[];
  status: string;
  rpe: number | null;
  felt: "easy" | "ok" | "hard" | null;
  discomfort_areas: string[];
  strength_tss: number | null;
  garmin_workout_id: string | null;
  progress: StrengthProgress | null;
  planned_session_id: string | null;
  guidance: string | null;
}

/** Estado persistido del entreno en vivo para poder cerrar y reanudar. */
export interface StrengthProgress {
  /** Índice lineal del paso actual dentro de la secuencia aplanada. */
  step: number;
  /** Sets ya hechos: clave `${block}:${exercise}` → resultados. */
  done: Record<string, Array<{ reps: number; weight_kg: number | null }>>;
  /** Sustituciones: slug original → slug alternativo. */
  swaps: Record<string, string>;
  started_at: string;
}

function toRecord(row: Database["public"]["Tables"]["strength_workouts"]["Row"]): StrengthWorkoutRecord {
  return {
    id: row.id,
    name: row.name,
    format: row.format as FormatSlug,
    date: row.date,
    duration_min: row.duration_min,
    intensity: row.intensity,
    blocks: row.blocks as unknown as WorkoutBlock[],
    status: row.status,
    rpe: row.rpe,
    felt: row.felt as StrengthWorkoutRecord["felt"],
    discomfort_areas: row.discomfort_areas,
    strength_tss: row.strength_tss,
    garmin_workout_id: row.garmin_workout_id,
    progress: row.progress as unknown as StrengthProgress | null,
    planned_session_id: row.planned_session_id,
    guidance: ((row.generation_log as { guidance?: string | null } | null)?.guidance as string | null | undefined) ?? null,
  };
}

export async function getRecentWorkouts(supabase: Client, userId: string, limit = 12): Promise<{ rows: StrengthWorkoutRecord[]; missing: boolean }> {
  const { data, error } = await supabase
    .from("strength_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (isMissingTable(error)) return { rows: [], missing: true };
  if (error) throw new Error(`No se pudieron leer las rutinas: ${error.message}`);
  return { rows: data.map(toRecord), missing: false };
}

export async function getWorkoutById(supabase: Client, userId: string, id: string): Promise<StrengthWorkoutRecord | null> {
  const { data, error } = await supabase.from("strength_workouts").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`No se pudo leer la rutina: ${error.message}`);
  return data ? toRecord(data) : null;
}

export function toPast(rows: StrengthWorkoutRecord[]): PastWorkout[] {
  return rows.map((r) => ({
    date: r.date, status: r.status, blocks: r.blocks, rpe: r.rpe, felt: r.felt, discomfort_areas: r.discomfort_areas, name: r.name,
  }));
}

export async function insertWorkout(
  supabase: Client,
  userId: string,
  w: GeneratedWorkout,
  extra: { date: string; planned_session_id?: string | null; log?: unknown; strength_tss?: number | null }
): Promise<StrengthWorkoutRecord> {
  const { data, error } = await supabase
    .from("strength_workouts")
    .insert({
      user_id: userId,
      name: w.name,
      format: w.format,
      date: extra.date,
      duration_min: w.duration_min,
      intensity: w.intensity,
      blocks: w.blocks as unknown as Json,
      planned_session_id: extra.planned_session_id ?? null,
      generation_log: (extra.log ?? null) as Json,
      strength_tss: extra.strength_tss ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo guardar la rutina: ${error.message}`);
  return toRecord(data);
}

/** ¿Mañana hay bici de calidad? undefined si planned_sessions no tiene datos de mañana. */
export async function getNextDayQuality(supabase: Client, userId: string, today: string): Promise<boolean | undefined> {
  const { data, error } = await supabase
    .from("planned_sessions")
    .select("session_type")
    .eq("user_id", userId)
    .eq("date", addDays(today, 1))
    .maybeSingle();
  if (error || !data) return undefined;
  return data.session_type === "quality";
}
