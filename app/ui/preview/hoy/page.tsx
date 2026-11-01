import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/AppShell";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { WeeklyStrip } from "@/components/dashboard/WeeklyStrip";
import { WeekHeader } from "@/components/dashboard/WeekHeader";
import { SeasonSummaryCard } from "@/components/dashboard/SeasonSummaryCard";
import { FtpProgressionChart } from "@/components/dashboard/FtpProgressionChart";
import { FitnessTrendChart } from "@/components/dashboard/FitnessTrendChart";
import { TotalsCard } from "@/components/dashboard/TotalsCard";
import { WeeklyNarrativeCard } from "@/components/dashboard/WeeklyNarrativeCard";
import { computeBadges, greeting, redistributionLine } from "@/lib/dashboard-stats";
import * as fx from "../fixtures";

export default function PreviewHoy() {
  if (process.env.UI_PREVIEW !== "1" && process.env.NODE_ENV === "production") notFound();
  const totals = { strengthKgMonth: 1850, hoursLast30: 22.5, activitiesLast30: 14 };
  return (
    <AppShell active="hoy">
      <header className="mb-6">
        <p className="text-sm text-label-2 first-letter:uppercase">domingo 1 de noviembre</p>
        <h1 className="text-3xl font-semibold sm:text-4xl" style={{ letterSpacing: "-0.025em" }}>{greeting(9, "David")}</h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusCard fatigueIndex={fx.fatigue} latestMetrics={fx.metrics} />
        <HeroStatus todaySession={fx.sessions.find((s) => s.date === fx.today) ?? fx.sessions[6]} />
        <div className="lg:col-span-2">
          <WeeklyStrip sessions={fx.sessions} activities={[]} strengthSessions={[]} today={fx.today} weekStartDate={fx.monday}
            header={<WeekHeader completedTss={142} targetTss={250} streak={3} redistribution={redistributionLine(fx.sessions)} />} />
        </div>
        <section id="progreso" aria-label="Progreso" className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
          <SeasonSummaryCard season={fx.season} currentFtpWatts={221} progress={{ targetTss: 800, completedTss: 612, pct: 0.765 }} />
          <FtpProgressionChart history={fx.ftpHistory} targetFtp={240} />
          <div className="lg:col-span-2"><FitnessTrendChart points90={fx.trend} /></div>
        </section>
        <TotalsCard totals={totals} badges={computeBadges({ streak: 3, totals, activityCount: 14 })} />
        <WeeklyNarrativeCard narrative={{ id: 1, user_id: "u", season_id: 1, week_start_date: fx.monday, created_at: "", narrative: "Semana sólida: cumpliste casi todo el TSS aun con un día de descanso extra. Sigue así. 🚴" }} />
      </div>
    </AppShell>
  );
}
