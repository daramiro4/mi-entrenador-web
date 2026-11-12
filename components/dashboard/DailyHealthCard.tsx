import type { DailyMetricsRow } from "@/lib/types";
import { summarizeHealthMetrics, type HealthMetricKey } from "@/lib/health-metrics";
import { deltaVsAverage, lastValues } from "@/lib/dashboard-v2";
import { Sparkline } from "@/components/ui/Sparkline";
import { MIN_POINTS } from "./MetricSparkline";

const KPIS: { key: HealthMetricKey; pick: (r: DailyMetricsRow) => number | null }[] = [
  { key: "sleep", pick: (r) => r.sleep_score },
  { key: "hrv", pick: (r) => r.hrv_ms },
  { key: "rhr", pick: (r) => r.resting_hr },
  { key: "bodyBattery", pick: (r) => r.body_battery_max },
];

function contextLine(delta: number | null, ageLabel: string | null, hasData: boolean, key: HealthMetricKey): string {
  if (!hasData) return key === "hrv" ? "Garmin no está enviando la VFC" : "Sin datos sincronizados";
  const parts: string[] = [];
  if (delta != null) parts.push(delta === 0 ? "Igual que tu media de 14 días" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} frente a tu media de 14 días`);
  else parts.push("Aún sin tendencia");
  if (ageLabel) parts.push(`dato de ${ageLabel}`);
  return parts.join(" · ");
}

/** Cuatro KPIs de salud (Sueño, VFC, FC en reposo, Body Battery) con su tendencia de 14 días. */
export function DailyHealthCard({ history, today }: { history: DailyMetricsRow[]; today: string }) {
  const metrics = summarizeHealthMetrics(history, today);
  const hasAny = metrics.some((m) => m.text !== null);
  const hasToday = metrics.some((m) => m.isToday);

  return (
    <section aria-labelledby="salud-title">
      <h2 id="salud-title" className="mb-3 text-2xl">Tu cuerpo</h2>
      <div className="flex flex-wrap gap-4">
        {KPIS.map(({ key, pick }) => {
          const metric = metrics.find((m) => m.key === key)!;
          const series = lastValues(history, pick, today, 14);
          const [value, ...unitParts] = (metric.text ?? "—").split(" ");
          const unit = unitParts.join(" ");
          return (
            <div key={key} className="data-surface flex min-w-[200px] flex-1 basis-[220px] flex-col">
              <p className="text-sm text-label-2">{metric.label}</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-medium leading-none">{value}</span>
                {unit && <span className="font-mono text-sm text-label-2">{unit}</span>}
              </p>
              <p className="mt-2 min-h-8 text-xs text-label-2">
                {contextLine(deltaVsAverage(series), metric.ageLabel, metric.text !== null, key)}
              </p>
              {series.length >= MIN_POINTS && (
                <div className="mt-3">
                  <Sparkline
                    values={series}
                    width={200}
                    height={40}
                    color="var(--volt)"
                    endDot={false}
                    label={`Tendencia de ${metric.label}, últimos 14 días`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!hasAny && <p className="mt-3 text-sm text-label-2">Aún no hay datos de salud sincronizados.</p>}
      {hasAny && !hasToday && (
        <p className="mt-3 text-xs text-label-2">Garmin aún no ha sincronizado los datos de hoy; se muestra el último valor disponible.</p>
      )}
    </section>
  );
}
