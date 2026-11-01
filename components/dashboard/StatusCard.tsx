import { FatigueRing } from "@/components/fatigue-ring/FatigueRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tile } from "@/components/ui/Tile";
import type { DailyMetricsRow, FatigueIndexRow, FatigueRecommendation } from "@/lib/types";

function fmt(v: number | null | undefined, suffix = ""): string {
  return v != null ? `${Math.round(v)}${suffix}` : "—";
}

/** Tu estado: anillo de fatiga + baldosas Sueño, VFC, Body Battery, Estrés (última fila disponible). */
export function StatusCard({
  fatigueIndex,
  latestMetrics,
}: {
  fatigueIndex: FatigueIndexRow | null;
  latestMetrics: DailyMetricsRow | null;
}) {
  return (
    <GlassCard aria-labelledby="estado-title">
      <h2 id="estado-title" className="text-lg font-semibold">Tu estado</h2>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
        <FatigueRing
          acwrRatio={fatigueIndex?.acwr_ratio ?? null}
          recommendation={(fatigueIndex?.recommendation as FatigueRecommendation | null) ?? null}
          notes={fatigueIndex?.notes ?? null}
        />
        <div className="grid w-full flex-1 grid-cols-2 gap-3">
          <Tile label="Sueño" dotColor="var(--m-sleep)">
            <p className="metric mt-1 text-2xl font-semibold">{fmt(latestMetrics?.sleep_score)}</p>
          </Tile>
          <Tile label="VFC" dotColor="var(--m-hrv)">
            <p className="metric mt-1 text-2xl font-semibold">{fmt(latestMetrics?.hrv_ms, " ms")}</p>
          </Tile>
          <Tile label="Body Battery" dotColor="var(--m-battery)">
            <p className="metric mt-1 text-2xl font-semibold">{fmt(latestMetrics?.body_battery_max)}</p>
          </Tile>
          <Tile label="Estrés" dotColor="var(--m-stress)">
            <p className="metric mt-1 text-2xl font-semibold">{fmt(latestMetrics?.stress_avg)}</p>
          </Tile>
        </div>
      </div>
      {!latestMetrics && (
        <p className="mt-4 text-sm text-label-2">Aún no hay datos de salud sincronizados.</p>
      )}
    </GlassCard>
  );
}
