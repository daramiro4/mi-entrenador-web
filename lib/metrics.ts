import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { FatigueIndexRow, FtpHistoryRow } from "./types";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getLatestFtp(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<FtpHistoryRow | null> {
  const { data, error } = await supabase
    .from("ftp_history")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener el último FTP: ${error.message}`);
  }

  return data;
}

/** Peso más reciente conocido: último daily_metrics con peso, o el peso base del perfil. */
export async function getLatestWeightKg(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<number | null> {
  const { data: metric, error: metricError } = await supabase
    .from("daily_metrics")
    .select("weight_kg")
    .eq("user_id", userId)
    .not("weight_kg", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (metricError) {
    throw new Error(`No se pudo obtener el peso reciente: ${metricError.message}`);
  }

  if (metric?.weight_kg != null) {
    return metric.weight_kg;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("weight_kg")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`No se pudo obtener el peso del perfil: ${profileError.message}`);
  }

  return profile?.weight_kg ?? null;
}

/** Fecha de la última actividad de ciclismo registrada, o null si nunca hubo una. */
export async function getLastCyclingActivityDate(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("date")
    .eq("user_id", userId)
    .eq("activity_type", "cycling")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la última actividad de ciclismo: ${error.message}`);
  }

  return data?.date ?? null;
}

/** Fila exacta de `fatigue_index` para `date` (no "la más reciente") — para no adaptar el día de hoy con una lectura de ayer. */
export async function getFatigueIndexForDate(
  supabase: TypedSupabaseClient,
  userId: string,
  date: string
): Promise<FatigueIndexRow | null> {
  const { data, error } = await supabase
    .from("fatigue_index")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener el índice de fatiga del día: ${error.message}`);
  }

  return data;
}

export async function getLatestFatigueIndex(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<FatigueIndexRow | null> {
  const { data, error } = await supabase
    .from("fatigue_index")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener el índice de fatiga: ${error.message}`);
  }

  return data;
}
