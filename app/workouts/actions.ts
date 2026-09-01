"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createWorkout, deleteWorkout, updateWorkout } from "@/lib/workouts";
import type { NewWorkoutInput } from "@/lib/types";

function validate(input: NewWorkoutInput): string | null {
  if (!input.name.trim()) return "El nombre no puede estar vacío.";
  if (input.intervals.length === 0) return "La plantilla necesita al menos un paso.";
  return null;
}

export async function createWorkoutAction(
  input: NewWorkoutInput
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await createWorkout(supabase, user.id, input);
  if (error) return { ok: false, error };

  revalidatePath("/workouts");
  return { ok: true, error: null };
}

export async function updateWorkoutAction(
  id: string,
  input: NewWorkoutInput
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await updateWorkout(supabase, user.id, id, input);
  if (error) return { ok: false, error };

  revalidatePath("/workouts");
  return { ok: true, error: null };
}

export async function deleteWorkoutAction(
  id: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await deleteWorkout(supabase, user.id, id);
  if (error) return { ok: false, error };

  revalidatePath("/workouts");
  return { ok: true, error: null };
}
