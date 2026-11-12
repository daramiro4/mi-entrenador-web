import type { FatigueRecommendation } from "@/lib/types";
import { fatigueView } from "@/lib/dashboard-v2";

const SIZE = 224;
const STROKE = 14;
const START_ANGLE = -135;
const END_ANGLE = 135; // arco de 270°

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Arco de 270° en sentido horario desde abajo-izquierda hasta abajo-derecha: el relleno crece desde la izquierda. */
function arcPath(cx: number, cy: number, r: number) {
  const start = polar(cx, cy, r, START_ANGLE);
  const end = polar(cx, cy, r, END_ANGLE);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
}

/**
 * Anillo de fatiga de 270°. El relleno depende de la recomendación (constantes provisionales en
 * lib/dashboard-v2.ts), no del ratio: la vista principal usa lenguaje humano (decisión 6).
 */
export function FatigueRing({ recommendation }: { recommendation: FatigueRecommendation | null }) {
  const view = fatigueView(recommendation);
  const center = SIZE / 2;
  const radius = (SIZE - STROKE) / 2 - 2;
  const path = arcPath(center, center, radius);

  return (
    <div
      className="relative mx-auto inline-flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={view ? `Estado de fatiga: ${view.word}. ${view.subtext}.` : "Estado de fatiga: sin datos"}
    >
      <svg width={SIZE} height={SIZE} aria-hidden="true">
        <path d={path} fill="none" stroke="var(--fill)" strokeWidth={STROKE} strokeLinecap="round" />
        {view && (
          <path
            className="arc-anim"
            d={path}
            pathLength={1}
            fill="none"
            stroke={view.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={1 - view.fill}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
        {view ? (
          <>
            <span className="font-display text-[30px] font-extrabold leading-[1.05]" style={{ color: view.color }}>
              {view.word}
            </span>
            <span className="mt-2 text-sm text-label-2">{view.subtext}</span>
          </>
        ) : (
          <span className="text-sm text-label-2">Sin datos aún</span>
        )}
      </div>
    </div>
  );
}
