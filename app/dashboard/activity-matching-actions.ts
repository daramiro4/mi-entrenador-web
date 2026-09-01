"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getActivitiesForWeek } from "@/lib/activities";
import { getPlannedSessionsForWeek, markPlannedSessionDoneFromActivity } from "@/lib/planned-sessions";
import { findMatchingActivity } from "@/lib/activity-matching";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import type { ActivityRow } from "@/lib/types";

/**
 * Empareja actividades reales de `activities` (sincronizadas por
 * mi-entrenador-garmin) con sesiones planificadas de la semana actual que
 * siguen `planned`/`degraded` — las marca `done` y enlaza
 * `actual_activity_id`, sin pedir confirmación (ver plan: confirmado con el
 * usuario, mismo espíritu que la decisión 4). Se llama desde
 * `DashboardSyncEffect` ANTES de la capa adaptativa diaria — el orden
 * importa: evita que la capa adaptativa degrade una sesión que ya se hizo
 * de verdad (ver `ensureDailyAdaptationAction`, que ya se salta cualquier
 * sesión que no siga `planned`).
 */
export async function ensureActivityMatchesAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const season = await getActiveSeason(supabase, user.id);
  if (!season) {
    return;
  }

  const weekStartDate = getMondayOfWeek(todayISODate());
  const [weekSessions, weekActivities] = await Promise.all([
    getPlannedSessionsForWeek(supabase, user.id, weekStartDate),
    getActivitiesForWeek(supabase, user.id, weekStartDate),
  ]);

  const activitiesByDate = new Map<string, ActivityRow[]>();
  for (const activity of weekActivities) {
    const list = activitiesByDate.get(activity.date) ?? [];
    list.push(activity);
    activitiesByDate.set(activity.date, list);
  }

  let didChange = false;

  for (const session of weekSessions) {
    if (session.actual_activity_id != null) continue;

    const match = findMatchingActivity(session, activitiesByDate.get(session.date) ?? []);
    if (!match) continue;

    await markPlannedSessionDoneFromActivity(supabase, user.id, session.id, match.id);
    didChange = true;
  }

  if (didChange) {
    revalidatePath("/dashboard");
  }
}
