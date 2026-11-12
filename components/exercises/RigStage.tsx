import { GROUND_Y, VIEWBOX, type Implement, type Rig, type Vec } from "@/lib/exercises/rig/types";

/**
 * Escenario SVG de un fotograma de un rig: suelo, resalte muscular (Volt), cuerpo y material. Presentacional y sin estado:
 * lo usan el reproductor animado, la ficha estática de respaldo y la herramienta /dev/rigs. Solo colores de tokens (var(--…)).
 */
export function RigStage({
  rig,
  joints,
  muscleOpacity = 0.35,
  mirror = false,
  label,
  className,
  children,
}: {
  rig: Rig;
  joints: Record<string, Vec>;
  muscleOpacity?: number;
  mirror?: boolean;
  /** Nombre accesible del fotograma (p. ej. "Rotación torácica: Abre el codo al techo"). */
  label: string;
  className?: string;
  /** Capa extra dentro del SVG (la herramienta de rigs dibuja aquí sus tiradores). */
  children?: React.ReactNode;
}) {
  const at = (name: string): Vec => joints[name] ?? [0, 0];
  const point = (ref: Vec | string | undefined): Vec => (Array.isArray(ref) ? ref : ref ? at(ref) : [0, 0]);

  const drawImplement = (imp: Implement, i: number) => {
    const base: Vec = imp.at ? at(imp.at) : [0, 0];
    const p: Vec = [base[0] + (imp.offset?.[0] ?? 0), base[1] + (imp.offset?.[1] ?? 0)];
    if (imp.kind === "dumbbell") {
      const len = typeof imp.size === "number" ? imp.size : 20;
      const a = ((imp.angle ?? 0) * Math.PI) / 180;
      const dx = (Math.cos(a) * len) / 2;
      const dy = (Math.sin(a) * len) / 2;
      return (
        <g key={i}>
          <line x1={p[0] - dx} y1={p[1] - dy} x2={p[0] + dx} y2={p[1] + dy} stroke="var(--label-2)" strokeWidth={4} strokeLinecap="round" />
          <circle cx={p[0] - dx} cy={p[1] - dy} r={6} fill="var(--accent)" />
          <circle cx={p[0] + dx} cy={p[1] + dy} r={6} fill="var(--accent)" />
        </g>
      );
    }
    if (imp.kind === "barbell") {
      return (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={16} fill="none" stroke="var(--accent)" strokeWidth={4} />
          <circle cx={p[0]} cy={p[1]} r={3} fill="var(--label-2)" />
        </g>
      );
    }
    if (imp.kind === "bench") {
      const [w, h] = Array.isArray(imp.size) ? imp.size : [150, 28];
      return <rect key={i} x={p[0]} y={GROUND_Y - h} width={w} height={h} rx={6} fill="var(--surface-2)" stroke="var(--separator)" strokeWidth={2} />;
    }
    const to = point(imp.to);
    return <line key={i} x1={p[0]} y1={p[1]} x2={to[0]} y2={to[1]} stroke="var(--accent)" strokeWidth={3} strokeDasharray="6 4" strokeLinecap="round" />;
  };

  const k = rig.stroke_scale ?? 1;
  const bones = [...rig.bones].sort((a, b) => Number(b.side === "far") - Number(a.side === "far"));
  const benches = (rig.implements ?? []).filter((i) => i.kind === "bench");
  const gear = (rig.implements ?? []).filter((i) => i.kind !== "bench");

  return (
    <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label={label} className={className ?? "h-auto w-full"}>
      <g transform={mirror ? `translate(${VIEWBOX.width} 0) scale(-1 1)` : undefined}>
        <line x1={0} y1={GROUND_Y} x2={VIEWBOX.width} y2={GROUND_Y} stroke="var(--separator)" strokeWidth={2} />
        {benches.map(drawImplement)}
        {rig.highlight?.segments.map(([a, b, w], i) => (
          <line
            key={i}
            data-testid="muscle"
            x1={at(a)[0]}
            y1={at(a)[1]}
            x2={at(b)[0]}
            y2={at(b)[1]}
            stroke="var(--volt)"
            strokeOpacity={muscleOpacity}
            strokeWidth={w}
            strokeLinecap="round"
          />
        ))}
        {bones.map((bone) =>
          bone.kind === "head" ? (
            <circle key={bone.id} cx={at(bone.a)[0]} cy={at(bone.a)[1]} r={bone.radius ?? 14} fill="var(--bg)" stroke="var(--label)" strokeWidth={5 * k} />
          ) : (
            <line
              key={bone.id}
              data-bone={bone.id}
              x1={at(bone.a)[0]}
              y1={at(bone.a)[1]}
              x2={at(bone.b)[0]}
              y2={at(bone.b)[1]}
              stroke={bone.accent ? "var(--accent)" : bone.side === "far" ? "var(--label-2)" : "var(--label)"}
              strokeWidth={(bone.kind === "torso" ? 14 : bone.side === "far" ? 8 : 9) * k}
              strokeLinecap="round"
            />
          ),
        )}
        {gear.map(drawImplement)}
        {(rig.markers ?? []).map((name) => (
          <circle key={name} cx={at(name)[0]} cy={at(name)[1]} r={8 * k} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
        ))}
        {children}
      </g>
    </svg>
  );
}
