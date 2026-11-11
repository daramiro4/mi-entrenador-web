"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getActivitiesForWeek } from "@/lib/activities";
import {
  getPlannedSessionsForWeek,
  markPlannedSessionDoneFromActivity,
  mergePlannedSessionNotes,
} from "@/lib/planned-sessions";
import { getLatestFtp } from "@/lib/metrics";
import { setSeasonHrDiscount } from "@/lib/seasons";
import { assessZ2, hrAdjustedFtp, type HrAdjustmentRecord } from "@/lib/hr-adjustment";
import { addDays } from "@/lib/week";
import { findMatchingActivity } from "@/lib/activity-matching";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import type { ActivityRow, PlannedSession, Season } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

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

  const sessionsNow = didChange ? await getPlannedSessionsForWeek(supabase, user.id, weekStartDate) : weekSessions;
  const adjusted = await assessDoneZ2Sessions(supabase, user.id, season, sessionsNow, weekActivities);

  if (didChange || adjusted) {
    revalidatePath("/dashboard");
  }
}

/**
 * Ajuste por pulso (lib/hr-adjustment.ts): evalúa las Z2 hechas que aún no se evaluaron. Solo la más
 * reciente cambia el descuento; las anteriores sin evaluar se marcan `skipped` para no acumular
 * retroactivamente descuentos de sesiones hechas antes de existir la regla. Devuelve true si escribió algo.
 */
async function assessDoneZ2Sessions(
  supabase: SupabaseClient<Database>,
  userId: string,
  season: Season,
  sessions: PlannedSession[],
  activities: ActivityRow[]
): Promise<boolean> {
  const pending = sessions
    .filter((s) => s.session_type === "z2" && s.status === "done" && s.actual_activity_id != null && !s.notes?.hr_adjustment)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (pending.length === 0) return false;

  const pctBefore = season.notes?.hr_discount_pct ?? 0;
  const latest = pending[pending.length - 1];

  for (const old of pending.slice(0, -1)) {
    const record: HrAdjustmentRecord = {
      pct_before: pctBefore, pct_after: pctBefore, z3plus_pct: null, outcome: "skipped", poor_recovery: false, suggest_rest: false,
    };
    await mergePlannedSessionNotes(supabase, userId, old, { hr_adjustment: record });
  }

  const activity = activities.find((a) => a.id === latest.actual_activity_id);
  const measuredFtp = (await getLatestFtp(supabase, userId))?.ftp_watts ?? null;
  const baseFtp = measuredFtp ?? latest.notes?.effective_ftp_watts ?? null;
  const ftpUsed = baseFtp != null ? hrAdjustedFtp(baseFtp, pctBefore) : null;

  const [metricsRes, baselineRes] = await Promise.all([
    supabase.from("daily_metrics").select("sleep_duration_minutes, resting_hr").eq("user_id", userId).eq("date", latest.date).maybeSingle(),
    supabase.from("daily_metrics").select("resting_hr").eq("user_id", userId).gte("date", addDays(latest.date, -28)).lt("date", latest.date).not("resting_hr", "is", null),
  ]);
  const baselineValues = (baselineRes.data ?? []).map((r) => Number(r.resting_hr));
  const restingHrBaseline = baselineValues.length >= 5 ? baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length : null;

  const record = assessZ2({
    pctBefore,
    avgPower: activity?.avg_power != null ? Number(activity.avg_power) : null,
    ftpUsed,
    zones: activity?.hr_zone_seconds ?? null,
    sleepMinutes: metricsRes.data?.sleep_duration_minutes ?? null,
    restingHr: metricsRes.data?.resting_hr ?? null,
    restingHrBaseline,
  });

  await mergePlannedSessionNotes(supabase, userId, latest, { hr_adjustment: record });
  if (record.pct_after !== pctBefore) await setSeasonHrDiscount(supabase, userId, season, record.pct_after);
  return true;
}
