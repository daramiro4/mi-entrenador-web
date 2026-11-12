import Link from "next/link";
import { userHasPassword } from "@/lib/auth-validation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/seasons";
import { resolveBaseFtp } from "@/lib/ftp-base";
import { hrAdjustedFtp, HR_ADJUSTMENT, z2PowerRange } from "@/lib/hr-adjustment";
import { adaptationPhrase, buildHrvChart } from "@/lib/dashboard-v2";
import { DEMO_NARRATIVE, demoFtpHistory, demoHrv, demoWeek } from "@/lib/demo-data";
import type { FatigueRecommendation } from "@/lib/types";
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
  computeBadges, computeStreak, computeTotals, greeting, plannedTssIsEstimated, redistributionLine, sumPlannedTss, sumTss,
} from "@/lib/dashboard-stats";
import { TodaySessionCard, type PowerInfo } from "@/components/dashboard/TodaySessionCard";
import { SeasonPill } from "@/components/dashboard/SeasonPill";
import { HrvBandChart } from "@/components/dashboard/HrvBandChart";
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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  // Modo demo: ?demo=1, solo fuera de producción. Rellena con datos de ejemplo lo que no tiene datos reales.
  const demoOn = (await searchParams).demo === "1" && process.env.NODE_ENV !== "production";
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
    getDailyMetricsHistory(supabase, user.id, addDays(today, -364)),
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
      plannedIsEstimate: plannedTssIsEstimated(plannedSince84.filter((s) => s.date >= start && s.date <= end)),
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

  // --- Datos de la vista (con relleno de ejemplo solo en modo demo) ---
  const sessionsView = weeklySessions.length === 0 && demoOn ? demoWeek(today) : weeklySessions;
  const usingDemoWeek = sessionsView !== weeklySessions;
  const completedTssView = usingDemoWeek ? sessionsView.filter((s) => s.status === "done").reduce((a, s) => a + (s.planned_tss ?? 0), 0) : currentWeek.completedTss;
  const plannedTssView = usingDemoWeek ? sumPlannedTss(sessionsView) : currentWeek.plannedTss;
  const narrativeView = latestNarrative ?? (demoOn ? { narrative: DEMO_NARRATIVE } : null);
  const ftpHistoryView = ftpHistory.length === 0 && demoOn ? demoFtpHistory(today) : ftpHistory;
  const realHrv = dailyMetricsHistory.map((r) => ({ date: r.date, hrv_ms: r.hrv_ms }));
  const hrvRows = !buildHrvChart(realHrv, today, 60).enough && demoOn ? demoHrv(today) : realHrv;

  const todaySession = sessionsView.find((s) => s.date === today) ?? null;
  const recommendation = (fatigueIndex?.recommendation as FatigueRecommendation | null) ?? null;
  const hrDiscountPct = season.notes?.hr_discount_pct ?? 0;

  // Potencia de la Z2 de hoy: % del FTP y vatios, con el ajuste por pulso vigente.
  let power: PowerInfo | null = null;
  if (todaySession?.session_type === "z2") {
    const base = resolveBaseFtp({
      measured: latestFtp?.ftp_watts ?? null,
      provisional: season.notes?.provisional_ftp_watts ?? null,
      garmin: season.notes?.garmin_ftp_watts ?? null,
      sessionType: "z2",
      notes: todaySession.notes,
    });
    const factor = 1 - hrDiscountPct / 100;
    const range = base ? z2PowerRange(hrAdjustedFtp(base.watts, hrDiscountPct)) : null;
    power = {
      pctLow: Math.round(HR_ADJUSTMENT.Z2_LOW_PCT * 100 * factor),
      pctHigh: Math.round(HR_ADJUSTMENT.Z2_HIGH_PCT * 100 * factor),
      wattsLow: range?.low ?? null,
      wattsHigh: range?.high ?? null,
    };
  }
  const adaptation = adaptationPhrase({ session: todaySession, recommendation, hrDiscountPct });

  const [weekdayMonth] = [new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${today}T12:00:00`))];

  return (
    <AppShell active="hoy">
      <DashboardSyncEffect />
      {!userHasPassword(user) && (
        <Link
          href="/ajustes"
          className="mb-4 block rounded-[18px] border border-separator bg-surface px-4 py-3 text-sm text-label hover:bg-surface-2"
        >
          Aún no tienes contraseña. <span className="font-semibold text-accent">Fíjala en Ajustes</span> para entrar sin depender del correo.
        </Link>
      )}
      {!latestFtp && season.notes?.provisional_ftp_watts == null && season.notes?.garmin_ftp_watts == null && (
        <Link
          href="/ajustes"
          className="mb-4 block rounded-[18px] border border-separator bg-surface px-4 py-3 text-sm text-label hover:bg-surface-2"
        >
          Aún no tienes un FTP. <span className="font-semibold text-accent">Indica uno provisional en Ajustes</span> (sirve el que estima Garmin) para calcular bien las zonas.
        </Link>
      )}

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-label-2">{weekdayMonth}</p>
          <h1 className="mt-2 text-[40px] font-bold leading-none sm:text-[56px]">
            {greeting(new Date().getHours(), profileName)}
          </h1>
        </div>
        <SeasonPill goalType={season.goal_type} targetDate={season.target_date} />
      </header>

      <div className="flex flex-col gap-6">
        {/* 2. Hero: anillo de fatiga + sesión de hoy */}
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[280px] flex-1 basis-[340px]">
            <StatusCard fatigueIndex={fatigueIndex} />
          </div>
          <div className="min-w-[280px] flex-[1.4] basis-[420px]">
            <TodaySessionCard
              todaySession={todaySession}
              weekSessions={sessionsView}
              activities={weeklyActivities}
              strengthSessions={weeklyStrengthSessions}
              today={today}
              adaptation={adaptation}
              power={power}
            />
          </div>
        </div>

        {/* 3. Esta semana */}
        <WeeklyStrip
          sessions={sessionsView}
          activities={weeklyActivities}
          strengthSessions={weeklyStrengthSessions}
          today={today}
          weekStartDate={weekStartDate}
          header={
            <WeekHeader
              completedTss={completedTssView}
              targetTss={plannedTssView}
              targetIsEstimate={usingDemoWeek ? false : currentWeek.plannedIsEstimate}
              blockPct={progress?.pct ?? null}
              streak={streak}
              redistribution={redistributionLine(sessionsView)}
            />
          }
        />

        {/* 4. Lectura semanal */}
        <WeeklyNarrativeCard narrative={narrativeView} />

        {/* 5. KPIs de salud */}
        <DailyHealthCard history={dailyMetricsHistory} today={today} />

        {/* 6. Progreso */}
        <section id="progreso" aria-labelledby="progreso-title" className="scroll-mt-20">
          <h2 id="progreso-title" className="mb-3 text-2xl">Progreso</h2>
          <div className="flex flex-wrap gap-6">
            <div className="min-w-[300px] flex-1 basis-[460px]">
              <HrvBandChart rows={hrvRows} today={today} />
            </div>
            <div className="min-w-[300px] flex-1 basis-[460px]">
              <FtpProgressionChart history={ftpHistoryView} targetFtp={season.target_ftp} today={today} />
            </div>
            <div className="min-w-[300px] flex-1 basis-[460px]">
              <SeasonSummaryCard season={season} currentFtpWatts={latestFtp?.ftp_watts ?? null} progress={progress} />
            </div>
            <div className="min-w-[300px] flex-1 basis-[460px]">
              <FitnessTrendChart points90={fitnessTrendPoints} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-6">
          <div className="min-w-[300px] flex-1 basis-[420px]">
            <TotalsCard totals={totals} badges={badges} />
          </div>
          <div className="min-w-[300px] flex-[1.4] basis-[460px]">
            <ActivityFeed
              initialActivities={recentActivities}
              initialStrengthSessionsByActivityId={initialStrengthByActivityId}
              initialHasMore={recentActivities.length === ACTIVITY_FEED_PAGE_SIZE}
              pageSize={ACTIVITY_FEED_PAGE_SIZE}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <ChangeGoalButton />
        <Link href="/ajustes" className="inline-flex min-h-11 items-center text-sm text-label-2 hover:text-label">
          Ajustes de cuenta
        </Link>
      </div>
      {demoOn && (
        <p className="mt-6 text-center font-mono text-xs uppercase tracking-wider text-label-2">Datos de ejemplo</p>
      )}
    </AppShell>
  );
}
