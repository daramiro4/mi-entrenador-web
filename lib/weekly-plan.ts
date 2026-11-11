import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { PlannedSession, Season } from "./types";
import { countCyclingActivitiesSince, getLastCyclingActivityDate, getLatestFtp } from "./metrics";
import { generateWeeklyPlan } from "./plan-generator";
import { insertPlannedSessions } from "./planned-sessions";
import { addDays, todayISODate } from "./week";

type TypedSupabaseClient = SupabaseClient<Database>;

/** Genera la plantilla de `weekStartDate` (lunes) para `season` y la persiste. */
export async function generateAndSaveWeeklyPlan(
  supabase: TypedSupabaseClient,
  userId: string,
  season: Season,
  weekStartDate: string
): Promise<PlannedSession[]> {
  const today = todayISODate();
  const [latestFtp, lastCyclingActivityDate, recentCyclingRides14d] = await Promise.all([
    getLatestFtp(supabase, userId),
    getLastCyclingActivityDate(supabase, userId),
    countCyclingActivitiesSince(supabase, userId, addDays(today, -14)),
  ]);

  const drafts = generateWeeklyPlan({
    weekStartDate,
    goalType: season.goal_type,
    focusAreas: season.focus_areas ?? [],
    hoursPerWeek: season.hours_per_week,
    strengthDaysPerWeek: season.strength_days_per_week,
    currentFtpWatts: latestFtp?.ftp_watts ?? null,
    recentCyclingRides14d,
    lastCyclingActivityDate,
    today,
  });

  return insertPlannedSessions(supabase, userId, season.id, drafts);
}
