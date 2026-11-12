import { BODY, ik2, polar, round1 } from "./fk";
import { GROUND_Y, type Bone, type Phase, type Pose, type Vec } from "./types";

/** Huesos del esqueleto de pie (lado cercano). El círculo de la cabeza va en `head`. */
export const STANDING_BONES: Bone[] = [
  { id: "torso", a: "hip", b: "neck", kind: "torso" },
  { id: "neck", a: "neck", b: "head", kind: "limb" },
  { id: "head", a: "head", b: "head", kind: "head", radius: BODY.head_r },
  { id: "upper_arm", a: "shoulder", b: "elbow", kind: "limb" },
  { id: "forearm", a: "elbow", b: "wrist", kind: "limb" },
  { id: "thigh", a: "hip", b: "knee", kind: "limb" },
  { id: "shin", a: "knee", b: "ankle", kind: "limb" },
  { id: "foot", a: "ankle", b: "toe", kind: "limb" },
];

export type Joints = Record<string, Vec>;

/** Dirección unitaria de `a` a `b`. */
const unit = (a: Vec, b: Vec): Vec => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};

export interface StandingInput {
  /** x del tobillo (apoyo fijo). */
  ankleX: number;
  /** Inclinación de la espinilla desde la vertical, hacia delante (grados). */
  shin: number;
  /** Inclinación del muslo desde la vertical, hacia atrás (grados). */
  thigh: number;
  /** Inclinación del tronco desde la vertical, hacia delante (grados). */
  torso: number;
  /** Cabeza: ángulo respecto a la prolongación del tronco (grados; negativo = mira arriba). */
  headTilt?: number;
}

/** Cuerpo de pie visto de lado, mirando a la derecha: piernas y tronco por cinemática directa desde el tobillo apoyado. */
export function standingBody(i: StandingInput): Joints {
  const ankle: Vec = [i.ankleX, GROUND_Y - 6];
  const toe: Vec = [ankle[0] + BODY.foot, GROUND_Y];
  const knee = polar(ankle, -90 + i.shin, BODY.shin);
  const hip = polar(knee, -90 - i.thigh, BODY.thigh);
  const neck = polar(hip, -90 + i.torso, BODY.torso);
  const head = polar(neck, -90 + i.torso + (i.headTilt ?? 0), BODY.neck_to_head);
  const back = polar(hip, -90 + i.torso, BODY.torso * 0.5);
  const u = unit(neck, hip);
  const shoulder: Vec = [neck[0] + u[0] * 6, neck[1] + u[1] * 6];
  return { head, neck, back, shoulder, hip, knee, ankle, toe };
}

/** Brazos rectos con ángulo `deg` desde +x (90 = colgando hacia abajo, 0 = hacia delante). `bend` dobla ligeramente el codo. */
export function straightArm(shoulder: Vec, deg: number, bend = 0): Pick<Joints, "elbow" | "wrist"> {
  const elbow = polar(shoulder, deg, BODY.upper_arm);
  const wrist = polar(elbow, deg - bend, BODY.forearm);
  return { elbow, wrist };
}

/** Brazo que lleva la mano a `target` (cinemática inversa): codo por la solución más baja (o más alta con `high`). */
export function armTo(shoulder: Vec, target: Vec, high = false): Pick<Joints, "elbow" | "wrist"> {
  const a = ik2(shoulder, target, BODY.upper_arm, BODY.forearm, 1);
  const b = ik2(shoulder, target, BODY.upper_arm, BODY.forearm, -1);
  const elbow = (a[1] >= b[1]) !== high ? a : b;
  return { elbow, wrist: target };
}

export const rounded = (j: Joints): Joints => Object.fromEntries(Object.entries(j).map(([k, v]) => [k, round1(v)]));

export function pose(t: number, joints: Joints): Pose {
  return { t, joints: rounded(joints) };
}

/** Fases estándar de un movimiento en bucle: de pie → baja → abajo → sube. */
export function squatLikePhases(labels: { start: string; down: string; bottom: string; up: string }, opacity: [number, number, number, number]): Phase[] {
  return [
    { from: 0, to: 0.1, label_es: labels.start, muscle_opacity: opacity[0] },
    { from: 0.1, to: 0.45, label_es: labels.down, muscle_opacity: opacity[1] },
    { from: 0.45, to: 0.6, label_es: labels.bottom, muscle_opacity: opacity[2] },
    { from: 0.6, to: 1, label_es: labels.up, muscle_opacity: opacity[3] },
  ];
}

/**
 * Perfil de un movimiento en bucle de ida y vuelta, 0..1: espera arriba (0–0.1), baja con suavizado (0.1–0.45), espera abajo
 * (0.45–0.6) y sube con suavizado (0.6–1). Coincide con las fases estándar de `squatLikePhases`.
 */
export function loopProfile(t: number): number {
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  if (t <= 0.1) return 0;
  if (t < 0.45) return ease((t - 0.1) / 0.35);
  if (t <= 0.6) return 1;
  if (t < 1) return 1 - ease((t - 0.6) / 0.4);
  return 0;
}

/** Muestrea una cinemática `jointsAt(m)` a lo largo del bucle: muchas poses (48 tramos) para interpolar en línea recta sin deformar huesos. */
export function sampleLoop(jointsAt: (m: number) => Joints, steps = 48, profile: (t: number) => number = loopProfile): Pose[] {
  return Array.from({ length: steps + 1 }, (_, i) => pose(i / steps, jointsAt(profile(i / steps))));
}

/** Perfil de ida y vuelta con espera arriba [0, a], subida suave [a, b], espera [b, c] y bajada suave [c, 1]. */
export function holdProfile(a: number, b: number, c: number): (t: number) => number {
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  return (t) => (t <= a ? 0 : t < b ? ease((t - a) / (b - a)) : t <= c ? 1 : t < 1 ? 1 - ease((t - c) / (1 - c)) : 0);
}
