/** Sparkline SVG propio, sin dependencias. */
export function Sparkline({
  values,
  width = 160,
  height = 48,
  color = "var(--accent)",
  label,
  endDot = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  label: string;
  /** Punto en el último valor (por defecto sí). */
  endDot?: boolean;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {endDot && <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} />}
    </svg>
  );
}
