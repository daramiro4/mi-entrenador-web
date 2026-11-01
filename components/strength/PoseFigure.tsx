import type { Pose } from "@/lib/strength/types";
import { VIEWBOX } from "@/lib/strength/poses";

const STROKE = 5;

function Glyph({ pose }: { pose: Pose }) {
  const { kind, at, anchor } = pose.equipment;
  const [x, y] = at;
  const c = "var(--label)";
  switch (kind) {
    case "dumbbell":
      return (
        <g stroke={c} strokeWidth={2.5} strokeLinecap="round">
          <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
          <line x1={x - 7} y1={y - 5} x2={x - 7} y2={y + 5} strokeWidth={4} />
          <line x1={x + 7} y1={y - 5} x2={x + 7} y2={y + 5} strokeWidth={4} />
        </g>
      );
    case "barbell":
      return (
        <g stroke={c} strokeWidth={2.5} strokeLinecap="round">
          <line x1={x - 20} y1={y} x2={x + 20} y2={y} />
          <line x1={x - 20} y1={y - 8} x2={x - 20} y2={y + 8} strokeWidth={4} />
          <line x1={x + 20} y1={y - 8} x2={x + 20} y2={y + 8} strokeWidth={4} />
        </g>
      );
    case "kettlebell":
      return (
        <g stroke={c} strokeWidth={2.5} fill="none">
          <path d={`M ${x - 4} ${y + 2} q 4 -9 8 0`} />
          <circle cx={x} cy={y + 8} r={6} fill={c} />
        </g>
      );
    case "band":
      return (
        <g stroke={c} strokeWidth={2} strokeDasharray="3 3" strokeLinecap="round" fill="none">
          {anchor && <line x1={x} y1={y} x2={anchor[0]} y2={anchor[1]} />}
          <circle cx={x} cy={y} r={4} />
        </g>
      );
    default:
      return null;
  }
}

/** Muñeco esquemático de perfil. Colores solo por tokens (--accent, --label). */
export function PoseFigure({ pose, label, className = "" }: { pose: Pose; label: string; className?: string }) {
  const floorY = Math.max(pose.ankle[1], pose.wrist[1], pose.knee[1], pose.hip[1], pose.shoulder[1]) + 4;
  const line = (a: [number, number], b: [number, number]) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  );
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="img"
      aria-label={label}
      className={className}
      fill="none"
    >
      <line x1={8} y1={floorY} x2={VIEWBOX.w - 8} y2={floorY} stroke="var(--separator)" strokeWidth={2} strokeLinecap="round" />
      <g stroke="var(--accent)" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {line(pose.hip, pose.shoulder)}
        {line(pose.hip, pose.knee)}
        {line(pose.knee, pose.ankle)}
        {line(pose.shoulder, pose.elbow)}
        {line(pose.elbow, pose.wrist)}
        {line(pose.shoulder, pose.head)}
      </g>
      <circle cx={pose.head[0]} cy={pose.head[1]} r={6.5} stroke="var(--accent)" strokeWidth={STROKE - 1.5} fill="var(--bg)" />
      <Glyph pose={pose} />
    </svg>
  );
}

/** Dos posturas lado a lado con su etiqueta ("Arriba"/"Abajo"). */
export function PosePair({
  name,
  a,
  b,
  labels,
}: {
  name: string;
  a: Pose;
  b: Pose;
  labels: [string, string];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {([a, b] as const).map((p, i) => (
        <figure key={i} className="tile flex flex-col items-center gap-1 !p-3">
          <PoseFigure pose={p} label={`${name}: postura ${labels[i].toLowerCase()}`} className="h-32 w-auto" />
          <figcaption className="text-xs text-label-2">{labels[i]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Bucle de ~3,2 s entre las dos posturas (solo opacity). Con reduced-motion se ve la inicial. */
export function PoseLoop({ name, a, b, labels }: { name: string; a: Pose; b: Pose; labels: [string, string] }) {
  return (
    <div className="relative mx-auto aspect-[140/170] h-full max-h-64">
      <PoseFigure pose={a} label={`${name}: postura ${labels[0].toLowerCase()}`} className="pose-loop-a absolute inset-0 h-full w-full" />
      <PoseFigure pose={b} label={`${name}: postura ${labels[1].toLowerCase()}`} className="pose-loop-b absolute inset-0 h-full w-full" />
    </div>
  );
}
