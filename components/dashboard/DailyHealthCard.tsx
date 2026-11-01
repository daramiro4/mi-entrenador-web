import type { DailyMetricsRow } from "@/lib/types";
import { MetricSparkline } from "./MetricSparkline";

const VOLT_HEX = "#34C6F4";

interface HealthMetric {
  key: string;
  label: string;
  value: string;
  series: number[];
}

function buildMetrics(history: DailyMetricsRow[], today: DailyMetricsRow | undefined): HealthMetric[] {
  const seriesOf = (pick: (row: DailyMetricsRow) => number | null): number[] =>
    history.map(pick).filter((v): v is number => v != null);

  return [
    {
      key: "sleep",
      label: "Sueño",
      value: today?.sleep_score != null ? `${Math.round(today.sleep_score)}` : "—",
      series: seriesOf((r) => r.sleep_score),
    },
    {
      key: "stress",
      label: "Estrés",
      value: today?.stress_avg != null ? `${Math.round(today.stress_avg)}` : "—",
      series: seriesOf((r) => r.stress_avg),
    },
    {
      key: "hrv",
      label: "VFC",
      value: today?.hrv_ms != null ? `${Math.round(today.hrv_ms)} ms` : "—",
      series: seriesOf((r) => r.hrv_ms),
    },
    {
      key: "rhr",
      label: "FC reposo",
      value: today?.resting_hr != null ? `${Math.round(today.resting_hr)} ppm` : "—",
      series: seriesOf((r) => r.resting_hr),
    },
    {
      key: "bodyBattery",
      label: "Body Battery",
      value:
        today?.body_battery_min != null && today?.body_battery_max != null
          ? `${Math.round(today.body_battery_min)}–${Math.round(today.body_battery_max)}`
          : "—",
      series: seriesOf((r) => r.body_battery_max),
    },
  ];
}

export function DailyHealthCard({
  history,
  today,
}: {
  history: DailyMetricsRow[];
  today: string;
}) {
  const todayRow = history.find((r) => r.date === today);
  const metrics = buildMetrics(history, todayRow);

  return (
    <div className="data-surface p-5">
      <div className="h-0.5 w-10 rounded-full bg-volt mb-3" />
      <p className="font-display text-base text-paper mb-4">Salud de hoy</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-fog truncate">{metric.label}</p>
              <p className="metric text-xl text-paper leading-none mt-1">{metric.value}</p>
            </div>
            <MetricSparkline values={metric.series} colorHex={VOLT_HEX} />
          </div>
        ))}
      </div>
    </div>
  );
}
