import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./supabase/database.types";
import type { PlannedSession, PlannedSessionDraft, PlannedSessionStatus } from "./types";
import { getWeekEndDate } from "./week";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function getPlannedSessionsForWeek(
  supabase: TypedSupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<PlannedSession[]> {
  const { data, error } = await supabase
    .from("planned_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStartDate)
    .lte("date", getWeekEndDate(weekStartDate))
    .order("date");

  if (error) {
    throw new Error(`No se pudieron obtener las sesiones planificadas: ${error.message}`);
  }

  return data as PlannedSession[];
}

export async function getPlannedSessionById(
  supabase: TypedSupabaseClient,
  userId: string,
  plannedSessionId: string
): Promise<PlannedSession | null> {
  const { data, error } = await supabase
    .from("planned_sessions")
    .select("*")
    .eq("id", plannedSessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener la sesión planificada: ${error.message}`);
  }

  return data as PlannedSession | null;
}

export async function updatePlannedSessionStatus(
  supabase: TypedSupabaseClient,
  userId: string,
  plannedSessionId: string,
  status: PlannedSessionStatus
): Promise<void> {
  const { error } = await supabase
    .from("planned_sessions")
    .update({ status })
    .eq("id", plannedSessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`No se pudo actualizar el estado de la sesión: ${error.message}`);
  }
}

export async function postponePlannedSession(
  supabase: TypedSupabaseClient,
  userId: string,
  plannedSessionId: string,
  newDate: string
): Promise<void> {
  const { error } = await supabase
    .from("planned_sessions")
    .update({ date: newDate })
    .eq("id", plannedSessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`No se pudo posponer la sesión: ${error.message}`);
  }
}

export async function insertPlannedSessions(
  supabase: TypedSupabaseClient,
  userId: string,
  seasonId: number,
  drafts: PlannedSessionDraft[]
): Promise<PlannedSession[]> {
  const { data, error } = await supabase
    .from("planned_sessions")
    .insert(
      drafts.map((draft) => ({
        user_id: userId,
        season_id: seasonId,
        date: draft.date,
        session_type: draft.session_type,
        planned_tss: draft.planned_tss,
        notes: draft.notes as unknown as Json,
      }))
    )
    .select("*");

  if (error) {
    throw new Error(`No se pudieron guardar las sesiones planificadas: ${error.message}`);
  }

  return data as PlannedSession[];
}
