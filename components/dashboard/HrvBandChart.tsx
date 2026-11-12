"use client";

import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { buildHrvChart, hrvSubtitle, HRV_MIN_DAYS, type HrvRow } from "@/lib/dashboard-v2";

const PERIODS = [
  { days: 30, label: "30 d" },
  { days: 60, label: "60 d" },
  { days: 365, label: "1 año" },
] as const;

const fmtDay = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** VFC contra tu normal: puntos diarios tenues, media móvil de 7 días y banda de rango normal. */
export function HrvBandChart({ rows, today }: { rows: HrvRow[]; today: string }) {
  const [period, setPeriod] = useState<number>(60);
  const chart = buildHrvChart(rows, today, period);
  const data = chart.points.map((p) => ({
    date: p.date,
    hrv: p.hrv,
    ma7: p.ma7 == null ? null : Math.round(p.ma7 * 10) / 10,
    band: chart.band ? [Math.round(chart.band.low * 10) / 10, Math.round(chart.band.high * 10) / 10] : null,
  }));

  return (
    <GlassCard aria-labelledby="hrv-title" className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="hrv-title" className="text-xl">VFC contra tu normal</h2>
          <p className="mt-1 text-sm text-label-2">{hrvSubtitle(chart.enough ? chart.status : null)}</p>
        </div>
        <div role="group" aria-label="Periodo" className="inline-flex rounded-full bg-fill p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              aria-pressed={period === p.days}
              onClick={() => setPeriod(p.days)}
              className={`min-h-11 min-w-14 rounded-full px-4 font-mono text-xs ${
                period === p.days ? "bg-surface-2 text-label" : "text-label-2 hover:text-label"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!chart.enough ? (
        <p className="mt-6 max-w-[65ch] py-6 text-sm text-label-2">
          Aún no hay datos de VFC suficientes: hacen falta al menos {HRV_MIN_DAYS} días con dato para calcular tu rango normal.
          Cuando Garmin los sincronice, aparecerán aquí.
        </p>
      ) : (
        <>
          <div className="mt-4 h-64 w-full" role="img" aria-label={`VFC de los últimos ${period} días con tu rango normal`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--separator)" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke="var(--label-2)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} minTickGap={32} />
                <YAxis stroke="var(--label-2)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={36} domain={["auto", "auto"]} />
                <Tooltip
                  labelFormatter={(l) => fmtDay(String(l))}
                  contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--separator)", borderRadius: 12, fontSize: 12, fontFamily: "var(--font-mono)" }}
                  labelStyle={{ color: "var(--label-2)" }}
                />
                <Area dataKey="band" name="Rango normal" stroke="none" fill="var(--volt)" fillOpacity={0.14} isAnimationActive={false} />
                <Line dataKey="hrv" name="VFC" stroke="none" dot={{ r: 2.5, fill: "var(--volt)", fillOpacity: 0.35, strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line dataKey="ma7" name="Media 7 d" stroke="var(--volt)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-label-2">
            Banda: tu media ± 0,5 desviaciones típicas de los últimos 60 días (calculada sobre ln). Puntos: VFC diaria en ms.
          </p>
        </>
      )}
    </GlassCard>
  );
}
