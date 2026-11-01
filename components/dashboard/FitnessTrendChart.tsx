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

const VOLT_HEX = "#34C6F4";
const EMBER_HEX = "#FF4F1F";
const PAPER_HEX = "#F2F4F7";

const RANGE_OPTIONS = [7, 30, 90] as const;

function formatDayMonth(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export function FitnessTrendChart({ points90 }: { points90: FitnessTrendPoint[] }) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(30);

  return (
    <div className="data-surface p-5">
      <div className="h-0.5 w-10 rounded-full bg-volt mb-3" />
      <div className="flex items-center justify-between mb-1">
        <p className="font-display text-base text-paper">
          Fitness / Fatiga / Forma
        </p>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer ${
                range === option
                  ? "border-volt text-volt"
                  : "border-fog/30 text-fog hover:border-fog/60 hover:text-paper"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      {!hasEnoughTrendData(points90) ? (
        <p className="text-sm text-fog py-8 text-center">
          Necesitamos más días de datos para ver la tendencia.
        </p>
      ) : (
        <>
          <div className="flex gap-4 mb-3">
            <span className="text-[10px] text-volt">● Fitness</span>
            <span className="text-[10px] text-ember">● Fatiga</span>
            <span className="text-[10px] text-fog">● Forma</span>
          </div>
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={points90.slice(-range)}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid stroke="#8B92A0" strokeOpacity={0.1} vertical={false} />
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
                  contentStyle={{
                    backgroundColor: "#1B1F27",
                    border: "1px solid rgba(139,146,160,0.2)",
                    borderRadius: 2,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                  labelStyle={{ color: "#8B92A0" }}
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
