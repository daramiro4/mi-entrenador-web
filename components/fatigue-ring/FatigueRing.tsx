"use client";

import { useState } from "react";
import type { FatigueRecommendation } from "@/lib/types";

// Única excepción a los 7 tokens de la paleta: zona "precaución" del arco.
const AMBER = "#f2a93b";

const STROKE = 14;
const START_ANGLE = -135;
const END_ANGLE = 135;
const TOTAL_ANGLE = END_ANGLE - START_ANGLE;
// Rango visual del dial: 0.0 - 2.0 de ACWR (acute:chronic workload ratio).
const SCALE_MAX = 2;

// Vista por defecto: lenguaje humano, nunca el ratio ACWR crudo (decisión 6).
const RECOMMENDATION_PHRASE: Record<FatigueRecommendation, string> = {
  normal: "Recuperado",
  precaucion: "Cuidado, vas cargado",
  descanso: "Necesitas descansar",
};

// Vista expandida (al tocar el anillo): etiqueta corta junto al número crudo.
const RECOMMENDATION_LABEL: Record<FatigueRecommendation, string> = {
  normal: "Normal",
  precaucion: "Precaución",
  descanso: "Descansa",
};

const RECOMMENDATION_COLOR: Record<FatigueRecommendation, string> = {
  normal: "var(--color-volt)",
  precaucion: AMBER,
  descanso: "var(--color-fatiga)",
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export interface FatigueRingProps {
  acwrRatio: number | null;
  recommendation: FatigueRecommendation | null;
  notes?: string | null;
  size?: number;
}

export function FatigueRing({ acwrRatio, recommendation, notes, size = 208 }: FatigueRingProps) {
  const [expanded, setExpanded] = useState(false);
  const center = size / 2;
  const radius = (size - STROKE) / 2 - 4;
  const hasData = acwrRatio != null && recommendation != null;

  const clampedRatio = hasData ? Math.min(Math.max(acwrRatio as number, 0), SCALE_MAX) : 0;
  const progress = clampedRatio / SCALE_MAX;
  const sweepAngle = START_ANGLE + TOTAL_ANGLE * progress;

  const trackPath = describeArc(center, center, radius, START_ANGLE, END_ANGLE);
  const valuePath = hasData ? describeArc(center, center, radius, START_ANGLE, sweepAngle) : "";
  const color = hasData ? RECOMMENDATION_COLOR[recommendation as FatigueRecommendation] : "var(--color-fog)";

  return (
    <button
      type="button"
      onClick={() => hasData && setExpanded((current) => !current)}
      disabled={!hasData}
      aria-label={
        hasData
          ? expanded
            ? "Ocultar el detalle numérico de fatiga"
            : "Ver el detalle numérico de fatiga"
          : undefined
      }
      className="relative inline-flex items-center justify-center shrink-0 rounded-full disabled:cursor-default cursor-pointer"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-fog)"
          strokeOpacity={0.2}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {hasData && (
          <path d={valuePath} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        {hasData ? (
          expanded ? (
            <>
              <span className="metric text-3xl font-semibold" style={{ color }}>
                {(acwrRatio as number).toFixed(2)}
              </span>
              <span className="text-xs uppercase tracking-wide text-fog mt-1">ACWR</span>
              <span
                className="font-display text-base uppercase tracking-wide mt-2"
                style={{ color }}
              >
                {RECOMMENDATION_LABEL[recommendation as FatigueRecommendation]}
              </span>
              {notes && <span className="text-[10px] text-fog mt-1.5 leading-tight">{notes}</span>}
            </>
          ) : (
            <>
              <span
                className="font-display text-xl uppercase tracking-wide leading-tight"
                style={{ color }}
              >
                {RECOMMENDATION_PHRASE[recommendation as FatigueRecommendation]}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-fog mt-2">
                Toca para ver el detalle
              </span>
            </>
          )
        ) : (
          <span className="text-sm text-fog px-2">Sin datos aún</span>
        )}
      </div>
    </button>
  );
}
