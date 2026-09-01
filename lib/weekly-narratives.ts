import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { WeeklyNarrative } from "./types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getLatestWeeklyNarrative(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<WeeklyNarrative | null> {
  const { data, error } = await supabase
    .from("weekly_narratives")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la narrativa semanal: ${error.message}`);
  }

  return data;
}

export async function getWeeklyNarrativeForWeek(
  supabase: TypedSupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<WeeklyNarrative | null> {
  const { data, error } = await supabase
    .from("weekly_narratives")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la narrativa de esa semana: ${error.message}`);
  }

  return data;
}

export async function insertWeeklyNarrative(
  supabase: TypedSupabaseClient,
  userId: string,
  seasonId: number,
  weekStartDate: string,
  narrative: string
): Promise<void> {
  const { error } = await supabase.from("weekly_narratives").insert({
    user_id: userId,
    season_id: seasonId,
    week_start_date: weekStartDate,
    narrative,
  });

  if (error) {
    throw new Error(`No se pudo guardar la narrativa semanal: ${error.message}`);
  }
}
