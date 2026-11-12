import type { Phase, Pose, Rig, Vec } from "./types";

/** Suavizado de entrada y salida (cúbico). */
export const easeInOutCubic = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const lerpVec = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/**
 * Completa las poses: una articulación que no se menciona en una pose conserva su última posición (o la primera que se defina
 * más adelante). Así cada pose es completa y la interpolación es siempre entre pares de posiciones reales.
 */
export function normalizePoses(poses: Pose[]): Pose[] {
  const names = new Set<string>();
  for (const p of poses) for (const j of Object.keys(p.joints)) names.add(j);
  const sorted = [...poses].sort((a, b) => a.t - b.t);
  return sorted.map((pose, i) => {
    const joints: Record<string, Vec> = {};
    for (const name of names) {
      let v: Vec | undefined = pose.joints[name];
      for (let k = i - 1; !v && k >= 0; k--) v = sorted[k].joints[name];
      for (let k = i + 1; !v && k < sorted.length; k++) v = sorted[k].joints[name];
      joints[name] = v as Vec;
    }
    return { t: pose.t, joints };
  });
}

/** Posiciones de todas las articulaciones en el instante t (0..1), con suavizado entre poses consecutivas. */
export function evalPose(poses: Pose[], t: number, mode: "eased" | "linear" = "eased"): Record<string, Vec> {
  const full = normalizePoses(poses);
  const x = clamp01(t);
  if (x <= full[0].t) return { ...full[0].joints };
  const last = full[full.length - 1];
  if (x >= last.t) return { ...last.joints };
  let i = 0;
  while (i < full.length - 2 && x > full[i + 1].t) i++;
  const a = full[i];
  const b = full[i + 1];
  const span = b.t - a.t;
  const local = span === 0 ? 1 : (x - a.t) / span;
  const k = mode === "linear" ? local : easeInOutCubic(local);
  const out: Record<string, Vec> = {};
  for (const name of Object.keys(a.joints)) out[name] = lerpVec(a.joints[name], b.joints[name], k);
  return out;
}

export const evalRig = (rig: Rig, t: number): Record<string, Vec> => evalPose(rig.poses, t, rig.interpolation ?? "eased");

/** Índice de la fase activa en t. Si ninguna la cubre, la anterior más cercana (o la primera). */
export function phaseIndexAt(phases: Phase[], t: number): number {
  const x = clamp01(t);
  const found = phases.findIndex((p, i) => x >= p.from && (x < p.to || (i === phases.length - 1 && x <= p.to)));
  if (found >= 0) return found;
  let best = 0;
  for (let i = 0; i < phases.length; i++) if (phases[i].from <= x) best = i;
  return best;
}

/** Intensidad del resalte muscular en t: interpolación lineal entre los centros de las fases (sin saltos al cambiar de fase). */
export function muscleOpacityAt(phases: Phase[], t: number): number {
  if (phases.length === 0) return 0;
  const centers = phases.map((p) => ({ c: (p.from + p.to) / 2, o: p.muscle_opacity ?? 0.35 }));
  const x = clamp01(t);
  if (x <= centers[0].c) return centers[0].o;
  const last = centers[centers.length - 1];
  if (x >= last.c) return last.o;
  let i = 0;
  while (i < centers.length - 2 && x > centers[i + 1].c) i++;
  const k = (x - centers[i].c) / (centers[i + 1].c - centers[i].c);
  return lerp(centers[i].o, centers[i + 1].o, k);
}

/** Instante t (0..1) para un tiempo transcurrido en ms dentro de un bucle de `loopMs`. */
export const timeAt = (elapsedMs: number, loopMs: number): number => (((elapsedMs % loopMs) + loopMs) % loopMs) / loopMs;

/** Refleja una pose izquierda/derecha alrededor del eje vertical del lienzo. */
export function mirrorJoints(joints: Record<string, Vec>, width = 480): Record<string, Vec> {
  const out: Record<string, Vec> = {};
  for (const [k, [x, y]] of Object.entries(joints)) out[k] = [width - x, y];
  return out;
}
