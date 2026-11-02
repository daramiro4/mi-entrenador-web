import { FatigueRing } from "@/components/fatigue-ring/FatigueRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tile } from "@/components/ui/Tile";
import { summarizeHealthMetrics, type HealthMetricKey } from "@/lib/health-metrics";
import type { DailyMetricsRow, FatigueIndexRow, FatigueRecommendation } from "@/lib/types";

const TILES: { key: HealthMetricKey; dot: string }[] = [
  { key: "sleep", dot: "var(--m-sleep)" },
  { key: "hrv", dot: "var(--m-hrv)" },
  { key: "bodyBattery", dot: "var(--m-battery)" },
  { key: "stress", dot: "var(--m-stress)" },
];

/**
 * Tu estado: anillo de fatiga + baldosas Sueño, VFC, Body Battery, Estrés. Cada baldosa muestra
 * el último valor disponible y, si no es de hoy, su antigüedad ("ayer"), igual que "Salud de hoy".
 */
export function StatusCard({
  fatigueIndex,
  history,
  today,
}: {
  fatigueIndex: FatigueIndexRow | null;
  history: DailyMetricsRow[];
  today: string;
}) {
  const summary = summarizeHealthMetrics(history, today);
  const hasAny = summary.some((m) => m.text !== null);
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
          {TILES.map(({ key, dot }) => {
            const m = summary.find((x) => x.key === key)!;
            return (
              <Tile key={key} label={m.label} dotColor={dot}>
                <p className="metric mt-1 text-2xl font-semibold">{m.text ?? "—"}</p>
                {m.ageLabel && <p className="mt-0.5 text-xs text-label-2">{m.ageLabel}</p>}
              </Tile>
            );
          })}
        </div>
      </div>
      {!hasAny && (
        <p className="mt-4 text-sm text-label-2">Aún no hay datos de salud sincronizados.</p>
      )}
    </GlassCard>
  );
}
