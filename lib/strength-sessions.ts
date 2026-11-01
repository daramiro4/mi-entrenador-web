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

/** strength_sessions vinculadas a un conjunto de activity_id (batch-prefetch del feed de actividades). */
export async function getStrengthSessionsForActivities(
  supabase: TypedSupabaseClient,
  userId: string,
  activityIds: number[]
): Promise<StrengthSessionRow[]> {
  if (activityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("strength_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("activity_id", activityIds);

  if (error) {
    throw new Error(`No se pudieron obtener las sesiones de fuerza vinculadas: ${error.message}`);
  }

  return data;
}

/** Agrupa strength_sessions por activity_id, para el feed de actividades. Descarta filas sin activity_id. */
export function groupStrengthSessionsByActivityId(
  rows: StrengthSessionRow[]
): Record<number, StrengthSessionRow[]> {
  const grouped: Record<number, StrengthSessionRow[]> = {};
  for (const row of rows) {
    if (row.activity_id == null) continue;
    (grouped[row.activity_id] ??= []).push(row);
  }
  return grouped;
}

/** Series de fuerza desde una fecha (inclusive), para el volumen del mes. */
export async function getStrengthSessionsSince(
  supabase: TypedSupabaseClient,
  userId: string,
  fromDate: string
): Promise<StrengthSessionRow[]> {
  const { data, error } = await supabase
    .from("strength_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromDate)
    .order("date");

  if (error) {
    throw new Error(`No se pudieron obtener las series de fuerza: ${error.message}`);
  }

  return data;
}
