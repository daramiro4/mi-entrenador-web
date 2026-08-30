import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./supabase/database.types";
import type { NewSeasonInput, Season } from "./types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getActiveSeason(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<Season | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la temporada activa: ${error.message}`);
  }

  return data as Season | null;
}

export async function archiveActiveSeason(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("seasons")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(`No se pudo archivar la temporada activa: ${error.message}`);
  }
}

export async function createSeason(
  supabase: TypedSupabaseClient,
  userId: string,
  input: NewSeasonInput
): Promise<{ data: Season | null; error: string | null }> {
  const { data, error } = await supabase
    .from("seasons")
    .insert({
      user_id: userId,
      name: input.name,
      goal_type: input.goal_type,
      target_date: input.target_date,
      target_ftp: input.target_ftp,
      target_weight_kg: input.target_weight_kg,
      focus_areas: input.focus_areas,
      hours_per_week: input.hours_per_week,
      strength_days_per_week: input.strength_days_per_week,
      notes: input.notes as unknown as Json,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Season, error: null };
}
