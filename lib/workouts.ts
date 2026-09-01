import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./supabase/database.types";
import type { NewWorkoutInput, Workout, WorkoutStep, WorkoutType } from "./types";

type TypedSupabaseClient = SupabaseClient<Database>;

function toWorkout(row: {
  intervals: Json | null;
  type: string | null;
  [key: string]: unknown;
}): Workout {
  return {
    ...row,
    intervals: (row.intervals as unknown as WorkoutStep[] | null) ?? [],
    type: row.type as WorkoutType | null,
  } as Workout;
}

export async function getWorkoutsForUser(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron obtener las plantillas: ${error.message}`);
  }

  return data.map(toWorkout);
}

export async function getWorkoutById(
  supabase: TypedSupabaseClient,
  userId: string,
  id: string
): Promise<Workout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la plantilla: ${error.message}`);
  }

  return data ? toWorkout(data) : null;
}

export async function createWorkout(
  supabase: TypedSupabaseClient,
  userId: string,
  input: NewWorkoutInput
): Promise<{ data: Workout | null; error: string | null }> {
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      notes: input.notes,
      intervals: input.intervals as unknown as Json,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toWorkout(data), error: null };
}

export async function updateWorkout(
  supabase: TypedSupabaseClient,
  userId: string,
  id: string,
  input: NewWorkoutInput
): Promise<{ data: Workout | null; error: string | null }> {
  const { data, error } = await supabase
    .from("workouts")
    .update({
      name: input.name,
      type: input.type,
      notes: input.notes,
      intervals: input.intervals as unknown as Json,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: toWorkout(data), error: null };
}

export async function deleteWorkout(
  supabase: TypedSupabaseClient,
  userId: string,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
