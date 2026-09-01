"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFatigueIndexForDate } from "@/lib/metrics";
import {
  degradePlannedSession,
  getPlannedSessionsForWeek,
  postponePlannedSession,
} from "@/lib/planned-sessions";
import { computeDailyAdaptation } from "@/lib/daily-adaptation";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import type { FatigueRecommendation } from "@/lib/types";

/**
 * Aplica la capa diaria adaptativa (decisión 4) a la sesión de hoy, si hace
 * falta. Se llama una vez al montar el dashboard (ver
 * components/dashboard/DailyAdaptationEffect.tsx) — no es una acción que el
 * usuario dispare. Es naturalmente idempotente: una vez que la sesión de hoy
 * deja de estar `planned` (degradada o movida de fecha), sucesivas llamadas
 * no encuentran nada que adaptar.
 */
export async function ensureDailyAdaptationAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const today = todayISODate();

  const [fatigueIndex, weekSessions] = await Promise.all([
    getFatigueIndexForDate(supabase, user.id, today),
    getPlannedSessionsForWeek(supabase, user.id, getMondayOfWeek(today)),
  ]);

  if (!fatigueIndex?.recommendation) {
    return;
  }

  const todaySession = weekSessions.find((s) => s.date === today);
  if (!todaySession || todaySession.status !== "planned") {
    return;
  }

  const result = computeDailyAdaptation(
    todaySession,
    weekSessions,
    fatigueIndex.recommendation as FatigueRecommendation,
    today
  );

  if (result.type === "none" || result.type === "postpone_unavailable") {
    return;
  }

  if (result.type === "degrade") {
    await degradePlannedSession(
      supabase,
      user.id,
      todaySession.id,
      result.newSessionType,
      result.newPlannedTss
    );
  } else {
    const conflictingRest = weekSessions.find(
      (s) => s.date === result.newDate && s.session_type === "rest"
    );
    await postponePlannedSession(
      supabase,
      user.id,
      todaySession.id,
      result.newDate,
      conflictingRest?.id ?? null
    );
  }

  revalidatePath("/dashboard");
}
