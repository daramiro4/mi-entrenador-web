import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getLatestFtp, getLatestFatigueIndex } from "@/lib/metrics";
import { getPlannedSessionsForWeek, getPlannedSessionsSince } from "@/lib/planned-sessions";
import { getActivitiesForWeek } from "@/lib/activities";
import { getStrengthSessionsForWeek } from "@/lib/strength-sessions";
import { computeProgressSignal } from "@/lib/progress";
import { getLatestWeeklyNarrative } from "@/lib/weekly-narratives";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { SeasonSummaryCard } from "@/components/dashboard/SeasonSummaryCard";
import { WeeklyNarrativeCard } from "@/components/dashboard/WeeklyNarrativeCard";
import { WeeklyStrip } from "@/components/dashboard/WeeklyStrip";
import { ChangeGoalButton } from "@/components/dashboard/ChangeGoalButton";
import { LinkButton } from "@/components/ui/Button";
import { DashboardSyncEffect } from "@/components/dashboard/DashboardSyncEffect";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const season = await getActiveSeason(supabase, user.id);
  if (!season) {
    redirect("/onboarding");
  }

  const today = todayISODate();
  const weekStartDate = getMondayOfWeek(today);
  const [
    latestFtp,
    fatigueIndex,
    weeklySessions,
    latestNarrative,
    weeklyActivities,
    weeklyStrengthSessions,
  ] = await Promise.all([
    getLatestFtp(supabase, user.id),
    getLatestFatigueIndex(supabase, user.id),
    getPlannedSessionsForWeek(supabase, user.id, weekStartDate),
    getLatestWeeklyNarrative(supabase, user.id),
    getActivitiesForWeek(supabase, user.id, weekStartDate),
    getStrengthSessionsForWeek(supabase, user.id, weekStartDate),
  ]);

  const progress = latestFtp
    ? computeProgressSignal(
        await getPlannedSessionsSince(supabase, user.id, latestFtp.date, today)
      )
    : null;

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <DashboardSyncEffect />
      <div className="max-w-2xl mx-auto space-y-6">
        <HeroStatus
          fatigueIndex={fatigueIndex}
          todaySession={weeklySessions.find((s) => s.date === today) ?? null}
        />
        <SeasonSummaryCard
          season={season}
          currentFtpWatts={latestFtp?.ftp_watts ?? null}
          progress={progress}
        />
        <WeeklyNarrativeCard narrative={latestNarrative} />
        <WeeklyStrip
          sessions={weeklySessions}
          activities={weeklyActivities}
          strengthSessions={weeklyStrengthSessions}
          today={today}
        />
        <div className="pt-2 flex gap-3">
          <LinkButton href="/workouts" variant="secondary">
            Plantillas de entreno
          </LinkButton>
          <ChangeGoalButton />
        </div>
      </div>
    </main>
  );
}
