"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getPlannedSessionById,
  getPlannedSessionsForWeek,
  postponePlannedSession,
  updatePlannedSessionStatus,
} from "@/lib/planned-sessions";
import { getValidPostponeDates } from "@/lib/postpone";
import { getMondayOfWeek, todayISODate } from "@/lib/week";

export interface PlannedSessionActionResult {
  ok: boolean;
  error: string | null;
}

export async function markPlannedSessionDoneAction(
  plannedSessionId: string
): Promise<PlannedSessionActionResult> {
  return setStatus(plannedSessionId, "done");
}

export async function skipPlannedSessionAction(
  plannedSessionId: string
): Promise<PlannedSessionActionResult> {
  return setStatus(plannedSessionId, "skipped");
}

async function setStatus(
  plannedSessionId: string,
  status: "done" | "skipped"
): Promise<PlannedSessionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await getPlannedSessionById(supabase, user.id, plannedSessionId);
  if (!session) {
    return { ok: false, error: "No se encontró la sesión planificada." };
  }

  await updatePlannedSessionStatus(supabase, user.id, plannedSessionId, status);
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function postponePlannedSessionAction(
  plannedSessionId: string,
  newDate: string
): Promise<PlannedSessionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await getPlannedSessionById(supabase, user.id, plannedSessionId);
  if (!session) {
    return { ok: false, error: "No se encontró la sesión planificada." };
  }

  const weekSessions = await getPlannedSessionsForWeek(
    supabase,
    user.id,
    getMondayOfWeek(session.date)
  );
  const validDates = getValidPostponeDates(weekSessions, session, todayISODate());

  if (!validDates.includes(newDate)) {
    return { ok: false, error: "Ese día ya no está disponible para posponer." };
  }

  const conflictingRest = weekSessions.find(
    (s) => s.date === newDate && s.session_type === "rest"
  );

  await postponePlannedSession(
    supabase,
    user.id,
    plannedSessionId,
    newDate,
    conflictingRest?.id ?? null
  );
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}
