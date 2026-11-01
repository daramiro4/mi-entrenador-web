"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutById, type StrengthProgress } from "@/lib/strength/data";
import { applyResults } from "@/lib/strength/steps";
import { MINIMAL_LOAD_TSS, strengthTss } from "@/lib/strength/tss";
import type { Json } from "@/lib/supabase/database.types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

/** Persiste el estado del entreno para poder cerrar y reanudar. */
export async function saveProgressAction(workoutId: string, progress: StrengthProgress): Promise<{ ok: boolean }> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("strength_workouts")
      .update({ progress: progress as unknown as Json, status: "in_progress" })
      .eq("id", workoutId)
      .eq("user_id", user.id)
      .neq("status", "done");
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/** Registra una serie en strength_sessions (una fila por serie). */
export async function logSetAction(input: {
  workoutId: string;
  slug: string;
  name: string;
  setIndex: number;
  reps: number | null;
  seconds: number | null;
  weight_kg: number | null;
  date: string;
}): Promise<{ ok: boolean }> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("strength_sessions").insert({
      user_id: user.id,
      date: input.date,
      exercise: input.name,
      exercise_slug: input.slug,
      workout_id: input.workoutId,
      set_index: input.setIndex,
      sets: 1,
      reps: input.reps,
      weight_kg: input.weight_kg,
      volume_kg: input.reps != null && input.weight_kg != null ? input.reps * input.weight_kg : null,
      notes: input.seconds != null ? `${input.seconds} s` : null,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/**
 * Termina la rutina: vuelca resultados, calcula strength_tss y lo integra en el TSS semanal
 * (sesión `strength` planificada del día + fila en `activities`), sin tocar el cálculo del bot.
 */
export async function finishWorkoutAction(
  workoutId: string,
  input: { rpe: number; elapsed_min: number }
): Promise<{ ok: boolean; tss?: number; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const w = await getWorkoutById(supabase, user.id, workoutId);
    if (!w) return { ok: false, error: "Rutina no encontrada" };
    const isAntidote = w.name === "Antídoto de conducción";
    const progress = w.progress;
    const blocks = progress ? applyResults(w.blocks, progress.done, progress.swaps) : w.blocks;
    const minutes = Math.min(Math.max(Math.round(input.elapsed_min), 3), Math.round(w.duration_min * 1.5));
    const rpe = Math.min(10, Math.max(1, input.rpe));
    const tss = isAntidote ? MINIMAL_LOAD_TSS : strengthTss(minutes, rpe);

    const { error } = await supabase
      .from("strength_workouts")
      .update({ status: "done", blocks: blocks as unknown as Json, rpe, strength_tss: tss, progress: null })
      .eq("id", workoutId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);

    // 1) Sesión de fuerza planificada del día → hecha, con el TSS en notes.
    if (!isAntidote) {
      const { data: planned } = await supabase
        .from("planned_sessions")
        .select("id, notes")
        .eq("user_id", user.id)
        .eq("date", w.date)
        .eq("session_type", "strength")
        .in("status", ["planned", "degraded"])
        .maybeSingle();
      if (planned) {
        await supabase
          .from("planned_sessions")
          .update({
            status: "done",
            notes: { ...((planned.notes as Record<string, unknown> | null) ?? {}), strength_tss: tss, strength_workout_id: workoutId } as Json,
          })
          .eq("id", planned.id);
      }
    }

    // 2) TSS semanal: completar la actividad de fuerza que ya trajo Garmin ese día, o crear la nuestra.
    const type = isAntidote ? "mobility" : "strength";
    const { data: existing } = await supabase
      .from("activities")
      .select("id, tss")
      .eq("user_id", user.id)
      .eq("date", w.date)
      .eq("activity_type", type)
      .limit(1)
      .maybeSingle();
    if (existing) {
      if (existing.tss == null) await supabase.from("activities").update({ tss }).eq("id", existing.id);
    } else {
      await supabase.from("activities").insert({
        user_id: user.id,
        date: w.date,
        activity_type: type,
        duration_minutes: minutes,
        tss,
        source: "mi-entrenador-web",
        external_id: `sw:${workoutId}`,
      });
    }

    revalidatePath("/fuerza");
    revalidatePath("/dashboard");
    return { ok: true, tss };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo terminar la rutina" };
  }
}
