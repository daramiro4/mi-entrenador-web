import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getLatestFtp, getLatestFatigueIndex } from "@/lib/metrics";
import { getPlannedSessionsForWeek, getPlannedSessionsSince } from "@/lib/planned-sessions";
import { computeProgressSignal } from "@/lib/progress";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { SeasonSummaryCard } from "@/components/dashboard/SeasonSummaryCard";
import { WeeklyStrip } from "@/components/dashboard/WeeklyStrip";
import { ChangeGoalButton } from "@/components/dashboard/ChangeGoalButton";
import { DailyAdaptationEffect } from "@/components/dashboard/DailyAdaptationEffect";
import { WeeklyGenerationEffect } from "@/components/dashboard/WeeklyGenerationEffect";

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
  const [latestFtp, fatigueIndex, weeklySessions] = await Promise.all([
    getLatestFtp(supabase, user.id),
    getLatestFatigueIndex(supabase, user.id),
    getPlannedSessionsForWeek(supabase, user.id, weekStartDate),
  ]);

  const progress = latestFtp
    ? computeProgressSignal(
        await getPlannedSessionsSince(supabase, user.id, latestFtp.date, today)
      )
    : null;

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <WeeklyGenerationEffect />
      <DailyAdaptationEffect />
      <div className="max-w-2xl mx-auto space-y-6">
        <HeroStatus fatigueIndex={fatigueIndex} />
        <SeasonSummaryCard
          season={season}
          currentFtpWatts={latestFtp?.ftp_watts ?? null}
          progress={progress}
        />
        <WeeklyStrip sessions={weeklySessions} today={today} />
        <div className="pt-2">
          <ChangeGoalButton />
        </div>
      </div>
    </main>
  );
}
