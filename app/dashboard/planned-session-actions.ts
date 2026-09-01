"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getPlannedSessionById,
  getPlannedSessionsForWeek,
  postponePlannedSession,
  setPlannedSessionTss,
  skipPlannedSessionWithRedistribution,
  updatePlannedSessionStatus,
} from "@/lib/planned-sessions";
import { getValidPostponeDates } from "@/lib/postpone";
import { getValidRedistributionDates } from "@/lib/redistribute";
import { getMondayOfWeek, todayISODate } from "@/lib/week";

export interface PlannedSessionActionResult {
  ok: boolean;
  error: string | null;
}

export async function markPlannedSessionDoneAction(
  plannedSessionId: string
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

  await updatePlannedSessionStatus(supabase, user.id, plannedSessionId, "done");
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function skipPlannedSessionAction(
  plannedSessionId: string,
  redistributeToDate: string | null
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

  if (redistributeToDate === null) {
    await updatePlannedSessionStatus(supabase, user.id, plannedSessionId, "skipped");
    revalidatePath("/dashboard");
    return { ok: true, error: null };
  }

  const weekSessions = await getPlannedSessionsForWeek(
    supabase,
    user.id,
    getMondayOfWeek(session.date)
  );
  const validDates = getValidRedistributionDates(weekSessions, session, todayISODate());

  if (!validDates.includes(redistributeToDate)) {
    return { ok: false, error: "Ese día ya no está disponible para mover el TSS." };
  }

  const target = weekSessions.find((s) => s.date === redistributeToDate);
  if (!target || session.planned_tss == null) {
    return { ok: false, error: "No se encontró el día de destino." };
  }

  await skipPlannedSessionWithRedistribution(supabase, user.id, plannedSessionId, {
    ...(session.notes ?? {}),
    redistributed_to_session_id: target.id,
    redistributed_tss: session.planned_tss,
  });
  await setPlannedSessionTss(
    supabase,
    user.id,
    target.id,
    (target.planned_tss ?? 0) + session.planned_tss
  );
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function undoPlannedSessionStatusAction(
  plannedSessionId: string
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

  if (session.status !== "done" && session.status !== "skipped") {
    return { ok: false, error: "No hay nada que deshacer." };
  }

  if (session.notes?.redistributed_to_session_id) {
    return {
      ok: false,
      error: "No se puede deshacer: el TSS ya se movió a otro día.",
    };
  }

  await updatePlannedSessionStatus(supabase, user.id, plannedSessionId, "planned");
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
