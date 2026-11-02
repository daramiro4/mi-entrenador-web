import type { DailyMetricsRow } from "@/lib/types";
import { summarizeHealthMetrics } from "@/lib/health-metrics";
import { MetricSparkline } from "./MetricSparkline";

/** Salud de hoy: último valor disponible de cada métrica (con su antigüedad si no es de hoy) y tendencia de 7 días. */
export function DailyHealthCard({
  history,
  today,
}: {
  history: DailyMetricsRow[];
  today: string;
}) {
  const metrics = summarizeHealthMetrics(history, today);
  const hasAny = metrics.some((m) => m.text !== null);
  const hasToday = metrics.some((m) => m.isToday);

  return (
    <div className="data-surface p-5 self-start">
      <div className="h-0.5 w-10 rounded-full bg-volt mb-3" />
      <p className="font-display text-base text-paper mb-4">Salud de hoy</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-fog truncate">{metric.label}</p>
              <p className="metric text-xl text-paper leading-none mt-1">{metric.text ?? "—"}</p>
              {metric.ageLabel && <p className="text-[10px] text-fog mt-1">{metric.ageLabel}</p>}
            </div>
            {metric.text !== null && (
              <MetricSparkline values={metric.series} label={`Tendencia de ${metric.label}, últimos 7 días`} />
            )}
          </div>
        ))}
      </div>
      {!hasAny && <p className="mt-4 text-xs text-fog">Aún no hay datos de salud sincronizados.</p>}
      {hasAny && !hasToday && (
        <p className="mt-4 text-xs text-fog">Garmin aún no ha sincronizado los datos de hoy; se muestra el último valor disponible.</p>
      )}
    </div>
  );
}
