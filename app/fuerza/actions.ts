"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateForUser, type GenerateOutcome } from "@/lib/strength/service";
import { drivingAntidote } from "@/lib/strength/antidote";
import { getPrefs, getWorkoutById, insertWorkout, savePrefs, DEFAULT_PREFS } from "@/lib/strength/data";
import { FORMATS } from "@/lib/strength/formats";
import type { Contraindication, Equipment, FormatSlug } from "@/lib/strength/types";
import type { Prefs } from "@/lib/strength/workout-types";
import { todayISODate } from "@/lib/week";

const EQUIPMENT: Equipment[] = ["bodyweight", "dumbbell", "barbell", "machine", "cable", "band", "kettlebell"];
const AREAS: Contraindication[] = ["low_back", "knee", "shoulder", "neck", "wrist", "hip", "elbow"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

function sanitizePrefs(input: Prefs): Prefs {
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));
  const equipment = input.equipment.filter((e) => EQUIPMENT.includes(e));
  return {
    days_per_week: clamp(input.days_per_week, 1, 5),
    session_minutes: clamp(input.session_minutes, 15, 60),
    equipment: equipment.includes("bodyweight") ? equipment : ["bodyweight", ...equipment],
    level: clamp(input.level, 1, 3) as 1 | 2 | 3,
    limitations: input.limitations.filter((a) => AREAS.includes(a)),
    excluded_areas: input.excluded_areas.filter((a) => AREAS.includes(a)),
  };
}

export async function savePrefsAction(input: Prefs): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    await savePrefs(supabase, user.id, sanitizePrefs(input));
    revalidatePath("/fuerza");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al guardar" };
  }
}

export async function generateWorkoutAction(format: FormatSlug): Promise<GenerateOutcome> {
  const { supabase, user } = await requireUser();
  if (!FORMATS.some((f) => f.slug === format)) {
    return { ok: false, reason: "no_valid_workout", message: "Formato inválido." };
  }
  const outcome = await generateForUser(supabase, user.id, format, { save: true });
  revalidatePath("/fuerza");
  return outcome;
}

/** Crea una sesión del "Antídoto de conducción" (rutina fija) lista para el modo en vivo. */
export async function startAntidoteAction(): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const a = drivingAntidote();
    const rec = await insertWorkout(supabase, user.id, a, {
      date: todayISODate(),
      log: { kind: "antidote" },
      strength_tss: a.tss,
    });
    return { ok: true, id: rec.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo crear la sesión" };
  }
}

/**
 * Esfuerzo percibido (Fácil/Justo/Duro) y molestias de la última rutina.
 * Las zonas con molestia pasan a `excluded_areas` hasta que el usuario las limpie en sus preferencias.
 */
export async function submitEffortAction(input: {
  workoutId: string;
  felt: "easy" | "ok" | "hard";
  discomfort: Contraindication[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const w = await getWorkoutById(supabase, user.id, input.workoutId);
    if (!w) return { ok: false, error: "Rutina no encontrada" };
    const areas = input.discomfort.filter((a) => AREAS.includes(a));
    const { error } = await supabase
      .from("strength_workouts")
      .update({ felt: input.felt, discomfort_areas: areas })
      .eq("id", input.workoutId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    if (areas.length > 0) {
      const { prefs } = await getPrefs(supabase, user.id);
      const base = prefs ?? DEFAULT_PREFS;
      await savePrefs(supabase, user.id, {
        ...base,
        excluded_areas: [...new Set([...base.excluded_areas, ...areas])],
      });
    }
    revalidatePath("/fuerza");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al guardar" };
  }
}
