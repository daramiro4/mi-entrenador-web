"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getActivitiesForWeek } from "@/lib/activities";
import {
  getPlannedSessionsForWeek,
  markPlannedSessionDoneFromActivity,
  mergePlannedSessionNotes,
  movePlannedSession,
} from "@/lib/planned-sessions";
import { getLatestFtp } from "@/lib/metrics";
import { setSeasonHrDiscount } from "@/lib/seasons";
import { assessZ2, hrAdjustedFtp, type HrAdjustmentRecord } from "@/lib/hr-adjustment";
import { addDays } from "@/lib/week";
import { resolveBaseFtp } from "@/lib/ftp-base";
import { findEarlierUnresolvedSession, findMatchingActivity } from "@/lib/activity-matching";
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

  // Actividades que no completaron ninguna sesión de su día: puede ser un entreno hecho otro día (p. ej. la
  // calidad del miércoles, hecha el jueves). Se empareja con la sesión pasada sin hacer y se mueve a su día real.
  let current = didChange ? await getPlannedSessionsForWeek(supabase, user.id, weekStartDate) : weekSessions;
  const orphans = weekActivities
    .filter((a) => !current.some((s) => s.actual_activity_id === a.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  for (const activity of orphans) {
    const late = findEarlierUnresolvedSession(activity, current);
    if (!late) continue;

    await markPlannedSessionDoneFromActivity(supabase, user.id, late.id, activity.id);
    await moveToActivityDate(supabase, user.id, late, activity.date, current);
    current = await getPlannedSessionsForWeek(supabase, user.id, weekStartDate);
    didChange = true;
  }

  const sessionsNow = current;
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
  const baseFtp = resolveBaseFtp({
    measured: measuredFtp,
    provisional: season.notes?.provisional_ftp_watts ?? null,
    garmin: season.notes?.garmin_ftp_watts ?? null,
    sessionType: latest.session_type,
    notes: latest.notes,
  });
  const ftpUsed = baseFtp != null ? hrAdjustedFtp(baseFtp.watts, pctBefore) : null;

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

/**
 * Lleva una sesión ya completada al día en que se hizo de verdad, para que el calendario la muestre ahí. Solo se
 * mueve a un día libre, de descanso o con una sesión SALTADA (que se intercambia: sigue saltada, en el día que
 * deja libre); nunca desplaza una sesión pendiente ni una ya hecha — en ese caso se queda en su día, enlazada.
 */
async function moveToActivityDate(
  supabase: SupabaseClient<Database>,
  userId: string,
  session: PlannedSession,
  activityDate: string,
  weekSessions: PlannedSession[]
): Promise<void> {
  if (session.date === activityDate) return;
  const other = weekSessions.find((s) => s.date === activityDate && s.id !== session.id);

  if (!other) {
    await movePlannedSession(supabase, userId, session, { date: activityDate, swapWith: null, restSessionId: null });
  } else if (other.session_type === "rest") {
    await movePlannedSession(supabase, userId, session, { date: activityDate, swapWith: null, restSessionId: other.id });
  } else if (other.status === "skipped") {
    await movePlannedSession(supabase, userId, session, { date: activityDate, swapWith: other, restSessionId: null });
  }
}
