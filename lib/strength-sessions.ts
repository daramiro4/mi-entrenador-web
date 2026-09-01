import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { StrengthSessionRow } from "./types";
import { getWeekEndDate } from "./week";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getStrengthSessionsForWeek(
  supabase: TypedSupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<StrengthSessionRow[]> {
  const { data, error } = await supabase
    .from("strength_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStartDate)
    .lte("date", getWeekEndDate(weekStartDate))
    .order("date");

  if (error) {
    throw new Error(`No se pudieron obtener las sesiones de fuerza de la semana: ${error.message}`);
  }

  return data;
}
