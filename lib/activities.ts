import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { ActivityRow } from "./types";
import { getWeekEndDate } from "./week";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getActivitiesForWeek(
  supabase: TypedSupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStartDate)
    .lte("date", getWeekEndDate(weekStartDate))
    .order("date");

  if (error) {
    throw new Error(`No se pudieron obtener las actividades de la semana: ${error.message}`);
  }

  return data;
}

/** Página de actividades más recientes primero, para el feed del dashboard. */
export async function getRecentActivities(
  supabase: TypedSupabaseClient,
  userId: string,
  { limit, offset }: { limit: number; offset: number }
): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`No se pudieron obtener las actividades recientes: ${error.message}`);
  }

  return data;
}

/** Actividades entre dos fechas (inclusive), para racha y totales del dashboard. */
export async function getActivitiesBetween(
  supabase: TypedSupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");

  if (error) {
    throw new Error(`No se pudieron obtener las actividades: ${error.message}`);
  }

  return data;
}
