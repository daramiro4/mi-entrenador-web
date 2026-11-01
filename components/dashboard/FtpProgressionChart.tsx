"use client";

import type { Key } from "react";
import {
  Area,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { getFtpMethodLabel } from "@/lib/labels";
import type { FtpHistoryRow } from "@/lib/types";

const VOLT_HEX = "#34C6F4";

const METHOD_DOT_HEX: Record<string, string> = {
  ramp_test: "#FF4F1F",
  "20min_test": "#34C6F4",
  estimated: "#8B92A0",
  manual: "#F2F4F7",
};

function dotColorFor(method: string | null): string {
  if (method == null) return METHOD_DOT_HEX.estimated;
  return METHOD_DOT_HEX[method] ?? METHOD_DOT_HEX.estimated;
}

function formatDayMonth(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

const METHODS_IN_LEGEND = ["ramp_test", "20min_test", "estimated", "manual"];

export function FtpProgressionChart({
  history,
  targetFtp,
}: {
  history: FtpHistoryRow[];
  targetFtp: number | null;
}) {
  return (
    <div className="data-surface p-5">
      <div className="h-0.5 w-10 rounded-full bg-ember mb-3" />
      <p className="font-display text-base text-paper mb-3">
        Progresión de FTP
      </p>

      {history.length === 0 && (
        <p className="text-sm text-fog py-4">Aún no hay mediciones de FTP registradas.</p>
      )}

      {history.length === 1 && (
        <div>
          <p className="metric text-4xl text-volt leading-none">
            {Math.round(history[0].ftp_watts)}
            <span className="text-lg text-fog ml-1">W</span>
          </p>
          <p className="text-xs text-fog mt-2">
            {getFtpMethodLabel(history[0].method)}
          </p>
        </div>
      )}

      {history.length >= 2 && (
        <>
          <div className="flex flex-wrap gap-3 mb-2">
            {METHODS_IN_LEGEND.map((method) => (
              <span key={method} className="text-[10px] text-fog">
                <span style={{ color: METHOD_DOT_HEX[method] }}>●</span> {getFtpMethodLabel(method)}
              </span>
            ))}
          </div>
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayMonth}
                  stroke="#8B92A0"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <Tooltip
                  labelFormatter={(label) => formatDayMonth(String(label))}
                  formatter={(value) => [`${Math.round(Number(value))} W`, "FTP"]}
                  contentStyle={{
                    backgroundColor: "#1B1F27",
                    border: "1px solid rgba(139,146,160,0.2)",
                    borderRadius: 2,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                  labelStyle={{ color: "#8B92A0" }}
                />
                {targetFtp != null && (
                  <ReferenceLine
                    y={targetFtp}
                    stroke="#FF4F1F"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="ftp_watts"
                  stroke={VOLT_HEX}
                  strokeWidth={2}
                  fill={VOLT_HEX}
                  fillOpacity={0.12}
                  isAnimationActive={false}
                  dot={(props: {
                    cx?: number;
                    cy?: number;
                    payload?: FtpHistoryRow;
                    key?: Key | null;
                  }) => {
                    const { cx, cy, payload, key } = props;
                    if (cx == null || cy == null || !payload) return <g key={key} />;
                    return (
                      <circle
                        key={key}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={dotColorFor(payload.method)}
                        stroke="#12151A"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
