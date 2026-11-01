"use client";

import { Line, LineChart } from "recharts";

/** Mini-gráfico sin ejes para dar sensación de tendencia junto a un número. Necesita al menos 2 puntos. */
export function MetricSparkline({ values, colorHex }: { values: number[]; colorHex: string }) {
  if (values.length < 2) return null;

  const data = values.map((value, index) => ({ index, value }));

  return (
    <LineChart width={48} height={28} data={data}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={colorHex}
        strokeWidth={1.75}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
