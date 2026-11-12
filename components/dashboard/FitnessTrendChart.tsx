"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { hasEnoughTrendData, type FitnessTrendPoint } from "@/lib/fitness-trend";

// Colores desde los tokens (app/tokens.css): nunca hex sueltos.
const VOLT_HEX = "var(--volt)";
const EMBER_HEX = "var(--accent)";
const PAPER_HEX = "var(--label)";

const RANGE_OPTIONS = [7, 30, 90] as const;

function formatDayMonth(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export function FitnessTrendChart({ points90 }: { points90: FitnessTrendPoint[] }) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(30);

  return (
    <div className="data-surface">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl">Fitness / Fatiga / Forma</h2>
        <div role="group" aria-label="Periodo" className="inline-flex rounded-full bg-fill p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`min-h-11 min-w-14 cursor-pointer rounded-full px-4 font-mono text-xs ${
                range === option ? "bg-surface-2 text-label" : "text-label-2 hover:text-label"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      {!hasEnoughTrendData(points90) ? (
        <p className="py-8 text-center text-sm text-label-2">
          Necesitamos más días de datos para ver la tendencia.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-4 text-xs">
            {[
              ["Fitness", "bg-volt"],
              ["Fatiga", "bg-accent"],
              ["Forma", "bg-label/45"],
            ].map(([name, dot]) => (
              <span key={name} className="inline-flex items-center gap-1.5 text-label-2">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
                {name}
              </span>
            ))}
          </div>
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={points90.slice(-range)}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--separator)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayMonth}
                  stroke="var(--label-2)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <Tooltip
                  labelFormatter={(label) => formatDayMonth(String(label))}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--separator)",
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                  labelStyle={{ color: "var(--label-2)" }}
                />
                <Area
                  type="monotone"
                  dataKey="fitness"
                  name="Fitness"
                  stroke={VOLT_HEX}
                  strokeWidth={2}
                  fill={VOLT_HEX}
                  fillOpacity={0.14}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="fatigue"
                  name="Fatiga"
                  stroke={EMBER_HEX}
                  strokeWidth={2}
                  fill={EMBER_HEX}
                  fillOpacity={0.1}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forma"
                  name="Forma"
                  stroke={PAPER_HEX}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
