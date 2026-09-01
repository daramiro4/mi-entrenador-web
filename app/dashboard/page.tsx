import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { getLatestFtp, getLatestFatigueIndex } from "@/lib/metrics";
import { getPlannedSessionsForWeek } from "@/lib/planned-sessions";
import { getMondayOfWeek, todayISODate } from "@/lib/week";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { SeasonSummaryCard } from "@/components/dashboard/SeasonSummaryCard";
import { WeeklyStrip } from "@/components/dashboard/WeeklyStrip";
import { ChangeGoalButton } from "@/components/dashboard/ChangeGoalButton";

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

  return (
    <main className="flex-1 px-6 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <HeroStatus fatigueIndex={fatigueIndex} />
        <SeasonSummaryCard season={season} currentFtpWatts={latestFtp?.ftp_watts ?? null} />
        <WeeklyStrip sessions={weeklySessions} today={today} />
        <div className="pt-2">
          <ChangeGoalButton />
        </div>
      </div>
    </main>
  );
}
