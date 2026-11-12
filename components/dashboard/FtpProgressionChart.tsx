"use client";

import type { Key } from "react";
import { CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { buildFtpSeries } from "@/lib/dashboard-v2";
import type { FtpHistoryRow } from "@/lib/types";

const DAY_MS = 86_400_000;
const toTs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fmtDay = (ts: number) => {
  const d = new Date(ts).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
};

/** Historial de FTP: línea escalonada, puntos Ember con su valor, objetivo discontinuo, "hoy" y próximo test. */
export function FtpProgressionChart({
  history,
  targetFtp,
  today = new Date().toISOString().slice(0, 10),
}: {
  history: Pick<FtpHistoryRow, "date" | "ftp_watts">[];
  targetFtp: number | null;
  today?: string;
}) {
  const series = buildFtpSeries(history, today);
  const empty = series.points.length === 0;

  const rows = [
    ...series.points.map((p) => ({ t: toTs(p.date), ftp: p.ftp, isTest: true })),
    ...(series.stepEnd ? [{ t: toTs(series.stepEnd.date), ftp: series.stepEnd.ftp, isTest: false }] : []),
  ];
  const values = [...series.points.map((p) => p.ftp), ...(targetFtp != null ? [targetFtp] : [])];
  const yMin = values.length ? Math.floor((Math.min(...values) - 20) / 10) * 10 : 0;
  const yMax = values.length ? Math.ceil((Math.max(...values) + 20) / 10) * 10 : 100;
  const firstT = series.points[0] ? toTs(series.points[0].date) : toTs(today);
  const lastT = Math.max(toTs(today), series.nextTest ? toTs(series.nextTest.date) : 0);
  const domain: [number, number] = [firstT - 14 * DAY_MS, lastT + 14 * DAY_MS];
  const latest = series.points[series.points.length - 1];

  return (
    <GlassCard aria-labelledby="ftp-title" className="flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ftp-title" className="text-xl">Historial de FTP</h2>
        {latest && (
          <p className="font-mono text-sm text-label-2">
            Último test: <span className="text-label">{latest.ftp} W</span>
          </p>
        )}
      </div>

      {empty ? (
        <p className="mt-6 max-w-[65ch] py-6 text-sm text-label-2">
          Aún no hay tests de FTP registrados. El primer test de rampa fijará tu FTP medido y aparecerá aquí.
          {targetFtp != null && <> Objetivo de la temporada: <span className="font-mono text-label">{targetFtp} W</span>.</>}
        </p>
      ) : (
        <div className="mt-4 h-64 w-full" role="img" aria-label={`Historial de FTP: ${series.points.map((p) => `${p.ftp} W el ${p.date}`).join(", ")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--separator)" />
              <XAxis type="number" dataKey="t" scale="time" domain={domain} tickFormatter={fmtDay} stroke="var(--label-2)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis domain={[yMin, yMax]} stroke="var(--label-2)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                labelFormatter={(l) => fmtDay(Number(l))}
                formatter={(v) => [`${Math.round(Number(v))} W`, "FTP"]}
                contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--separator)", borderRadius: 12, fontSize: 12, fontFamily: "var(--font-mono)" }}
                labelStyle={{ color: "var(--label-2)" }}
              />
              {targetFtp != null && (
                <ReferenceLine y={targetFtp} stroke="var(--label-2)" strokeDasharray="5 5" label={{ value: `Objetivo ${targetFtp} W`, position: "insideTopRight", fill: "var(--label-2)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
              )}
              <ReferenceLine x={toTs(today)} stroke="var(--label)" strokeOpacity={0.5} strokeDasharray="2 4" label={{ value: "hoy", position: "top", fill: "var(--label)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Line
                type="stepAfter"
                dataKey="ftp"
                stroke="var(--volt)"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; payload?: { isTest: boolean; ftp: number }; key?: Key | null }) => {
                  const { cx, cy, payload, key } = props;
                  if (cx == null || cy == null || !payload?.isTest) return <g key={key} />;
                  return (
                    <g key={key}>
                      <circle cx={cx} cy={cy} r={5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.5} />
                      <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--label)" fontSize={12} fontFamily="var(--font-mono)">
                        {payload.ftp}
                      </text>
                    </g>
                  );
                }}
              />
              {series.nextTest && (
                <ReferenceDot
                  x={toTs(series.nextTest.date)}
                  y={series.nextTest.ftp}
                  shape={(p: { cx?: number; cy?: number }) =>
                    p.cx == null || p.cy == null ? <g /> : (
                      <g>
                        <circle cx={p.cx} cy={p.cy} r={7} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 3" />
                        <text x={p.cx} y={p.cy - 14} textAnchor="middle" fill="var(--label-2)" fontSize={11} fontFamily="var(--font-mono)">Próx. test</text>
                      </g>
                    )
                  }
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {series.nextTest && (
        <p className="mt-2 text-xs text-label-2">
          Próximo test orientativo: <span className="font-mono">{series.nextTest.date.slice(8, 10)}/{series.nextTest.date.slice(5, 7)}</span> (unas 5 semanas después del último).
        </p>
      )}
    </GlassCard>
  );
}
