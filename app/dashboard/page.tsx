import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import {
  getLatestFtp,
  getLatestFatigueIndex,
  getFatigueIndexHistory,
  getDailyMetricsHistory,
  getFtpHistory,
} from "@/lib/metrics";
import { getPlannedSessionsForWeek, getPlannedSessionsSince } from "@/lib/planned-sessions";
import { getActivitiesForWeek, getRecentActivities } from "@/lib/activities";
import {
  getStrengthSessionsForWeek,
  getStrengthSessionsForActivities,
  groupStrengthSessionsByActivityId,
} from "@/lib/strength-sessions";
import { computeProgressSignal } from "@/lib/progress";
import { buildFitnessTrendPoints } from "@/lib/fitness-trend";
import { getLatestWeeklyNarrative } from "@/lib/weekly-narratives";
import { addDays, getMondayOfWeek, todayISODate } from "@/lib/week";
import { AppShell } from "@/components/ui/AppShell";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { TotalsCard } from "@/components/dashboard/TotalsCard";
import { WeekHeader } from "@/components/dashboard/WeekHeader";
import { getProfileName } from "@/lib/profile";
import { getActivitiesBetween } from "@/lib/activities";
import { getStrengthSessionsSince } from "@/lib/strength-sessions";
import {
  computeBadges, computeStreak, computeTotals, greeting, redistributionLine, sumPlannedTss, sumTss,
} from "@/lib/dashboard-stats";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { SeasonSummaryCard } from "@/components/dashboard/SeasonSummaryCard";
import { WeeklyNarrativeCard } from "@/components/dashboard/WeeklyNarrativeCard";
import { WeeklyStrip } from "@/components/dashboard/WeeklyStrip";
import { ChangeGoalButton } from "@/components/dashboard/ChangeGoalButton";
import { DashboardSyncEffect } from "@/components/dashboard/DashboardSyncEffect";
import { FtpProgressionChart } from "@/components/dashboard/FtpProgressionChart";
import { FitnessTrendChart } from "@/components/dashboard/FitnessTrendChart";
import { DailyHealthCard } from "@/components/dashboard/DailyHealthCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

const ACTIVITY_FEED_PAGE_SIZE = 12;

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
    fatigueTrendRows,
    dailyMetricsHistory,
    ftpHistory,
    recentActivities,
    profileName,
    activities84,
    plannedSince84,
    strengthSinceMonth,
  ] = await Promise.all([
    getLatestFtp(supabase, user.id),
    getLatestFatigueIndex(supabase, user.id),
    getPlannedSessionsForWeek(supabase, user.id, weekStartDate),
    getLatestWeeklyNarrative(supabase, user.id),
    getActivitiesForWeek(supabase, user.id, weekStartDate),
    getStrengthSessionsForWeek(supabase, user.id, weekStartDate),
    getFatigueIndexHistory(supabase, user.id, addDays(today, -89)),
    getDailyMetricsHistory(supabase, user.id, addDays(today, -6)),
    getFtpHistory(supabase, user.id),
    getRecentActivities(supabase, user.id, { limit: ACTIVITY_FEED_PAGE_SIZE, offset: 0 }),
    getProfileName(supabase, user.id),
    getActivitiesBetween(supabase, user.id, addDays(weekStartDate, -77), today),
    getPlannedSessionsSince(supabase, user.id, addDays(weekStartDate, -77), today),
    getStrengthSessionsSince(supabase, user.id, `${today.slice(0, 7)}-01`),
  ]);

  const progress = latestFtp
    ? computeProgressSignal(
        await getPlannedSessionsSince(supabase, user.id, latestFtp.date, today)
      )
    : null;

  const strengthActivityIds = recentActivities
    .filter((a) => a.activity_type === "strength")
    .map((a) => a.id);
  const initialStrengthSessions =
    strengthActivityIds.length > 0
      ? await getStrengthSessionsForActivities(supabase, user.id, strengthActivityIds)
      : [];
  const initialStrengthByActivityId = groupStrengthSessionsByActivityId(initialStrengthSessions);
  const fitnessTrendPoints = buildFitnessTrendPoints(fatigueTrendRows);

  // Semana actual + 11 anteriores (de la más reciente a la más antigua) para la racha.
  const weekTotals = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(weekStartDate, -7 * i);
    const end = addDays(start, 6);
    return {
      plannedTss: sumPlannedTss(plannedSince84.filter((s) => s.date >= start && s.date <= end)),
      completedTss: sumTss(activities84.filter((a) => a.date >= start && a.date <= end)),
    };
  });
  const currentWeek = weekTotals[0];
  // La semana en curso solo suma a la racha si ya está cumplida; si no, cuenta desde la anterior.
  const streak = computeStreak(
    currentWeek.plannedTss > 0 && currentWeek.completedTss / currentWeek.plannedTss >= 0.85
      ? weekTotals
      : weekTotals.slice(1)
  );
  const totals = computeTotals(strengthSinceMonth, activities84, today);
  const badges = computeBadges({ streak, totals, activityCount: activities84.length });
  const latestMetrics = dailyMetricsHistory[dailyMetricsHistory.length - 1] ?? null;
  const dateLabel = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${today}T12:00:00`)
  );

  return (
    <AppShell active="hoy">
      <DashboardSyncEffect />
      <header className="mb-6">
        <p className="text-sm capitalize text-label-2">{dateLabel}</p>
        <h1 className="text-3xl font-semibold sm:text-4xl" style={{ letterSpacing: "-0.025em" }}>
          {greeting(new Date().getHours(), profileName)}
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusCard fatigueIndex={fatigueIndex} latestMetrics={latestMetrics} />
        <HeroStatus todaySession={weeklySessions.find((s) => s.date === today) ?? null} />
        <div className="lg:col-span-2">
          <WeeklyStrip
            sessions={weeklySessions}
            activities={weeklyActivities}
            strengthSessions={weeklyStrengthSessions}
            today={today}
            weekStartDate={weekStartDate}
            header={
              <WeekHeader
                completedTss={currentWeek.completedTss}
                targetTss={currentWeek.plannedTss}
                streak={streak}
                redistribution={redistributionLine(weeklySessions)}
              />
            }
          />
        </div>
        <section id="progreso" aria-label="Progreso" className="scroll-mt-20 grid gap-6 lg:col-span-2 lg:grid-cols-2">
          <SeasonSummaryCard
            season={season}
            currentFtpWatts={latestFtp?.ftp_watts ?? null}
            progress={progress}
          />
          <FtpProgressionChart history={ftpHistory} targetFtp={season.target_ftp} />
          <div className="lg:col-span-2">
            <FitnessTrendChart points90={fitnessTrendPoints} />
          </div>
        </section>
        <TotalsCard totals={totals} badges={badges} />
        <WeeklyNarrativeCard narrative={latestNarrative} />
        <DailyHealthCard history={dailyMetricsHistory} today={today} />
        <ActivityFeed
          initialActivities={recentActivities}
          initialStrengthSessionsByActivityId={initialStrengthByActivityId}
          initialHasMore={recentActivities.length === ACTIVITY_FEED_PAGE_SIZE}
          pageSize={ACTIVITY_FEED_PAGE_SIZE}
        />
      </div>
      <div className="mt-6">
        <ChangeGoalButton />
      </div>
    </AppShell>
  );
}
