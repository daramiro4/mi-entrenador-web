import { BODY, ik2, polar } from "./fk";
import { STANDING_BONES, type Joints } from "./skeleton";
import { GROUND_Y, type Bone, type Vec } from "./types";

/**
 * Constructor de cuerpo para los arquetipos nuevos: se fijan la cadera, el ángulo del tronco y dónde quedan los pies/manos, y la
 * cinemática inversa coloca rodillas y codos CONSERVANDO la longitud de cada hueso (si el destino no se alcanza, la mano/pie se
 * queda en el límite en vez de estirar el hueso). Cuerpo de perfil mirando a la derecha; x→derecha, y→abajo, ángulos en grados
 * desde +x en sentido horario (-90 = arriba, 90 = abajo).
 */
export const ANKLE_Y = GROUND_Y - 6;

/** Lado hacia el que se dobla una articulación de dos huesos: "forward" = hacia la derecha (rodilla normal), "back" = hacia la izquierda. */
export type Bend = "forward" | "back" | "up" | "down" | "cw" | "ccw";

/**
 * Resuelve a→mid→end con longitudes l1, l2. `toward` indica a qué lado cae la articulación intermedia: "forward/back/up/down" eligen la
 * solución más hacia ese lado del lienzo (válido cuando el destino no cambia mucho de dirección); "cw/ccw" eligen SIEMPRE el mismo lado
 * de la línea a→target (sentido horario/antihorario en pantalla): continuo, sin saltos entre fotogramas aunque el brazo gire.
 */
export function reach(a: Vec, target: Vec, l1: number, l2: number, toward: Bend): { mid: Vec; end: Vec } {
  const dx = target[0] - a[0];
  const dy = target[1] - a[1];
  const dist = Math.hypot(dx, dy) || 1;
  const max = (l1 + l2) * 0.9999;
  const end: Vec = dist > max ? [a[0] + (dx / dist) * max, a[1] + (dy / dist) * max] : target;
  if (toward === "cw") return { mid: ik2(a, end, l1, l2, 1), end };
  if (toward === "ccw") return { mid: ik2(a, end, l1, l2, -1), end };
  const m1 = ik2(a, end, l1, l2, 1);
  const m2 = ik2(a, end, l1, l2, -1);
  const pick = (f: (p: Vec) => number) => (f(m1) >= f(m2) ? m1 : m2);
  const mid = toward === "forward" ? pick((p) => p[0]) : toward === "back" ? pick((p) => -p[0]) : toward === "down" ? pick((p) => p[1]) : pick((p) => -p[1]);
  return { mid, end };
}

export interface FigureInput {
  hip: Vec;
  /** Ángulo del tronco (cadera→cuello). -90 = erguido; 180 = tumbado con la cabeza a la izquierda; 0 = horizontal con la cabeza a la derecha. */
  torso: number;
  /** Cabeza respecto a la prolongación del tronco (grados; negativo = mira arriba/atrás). */
  headTilt?: number;
  ankle: Vec;
  ankleF?: Vec;
  kneeToward?: Bend;
  /** Ángulo del pie desde +x (por defecto 15°: la puntera apoya en el suelo). */
  foot?: number;
  footF?: number;
  hand?: Vec;
  handF?: Vec;
  /** Mano relativa al hombro (dx, dy), para brazos que cuelgan o se estiran sin conocer la posición absoluta del hombro. */
  handRel?: Vec;
  handFRel?: Vec;
  elbowToward?: Bend;
  /** Longitud del cuello a la cabeza (por defecto BODY.neck_to_head). */
  neckLen?: number;
}

export function figure(i: FigureInput): Joints {
  const kneeToward = i.kneeToward ?? "forward";
  const neck = polar(i.hip, i.torso, BODY.torso);
  const head = polar(neck, i.torso + (i.headTilt ?? 0), i.neckLen ?? BODY.neck_to_head);
  const back = polar(i.hip, i.torso, BODY.torso * 0.5);
  const dx = i.hip[0] - neck[0];
  const dy = i.hip[1] - neck[1];
  const dl = Math.hypot(dx, dy) || 1;
  const shoulder: Vec = [neck[0] + (dx / dl) * 6, neck[1] + (dy / dl) * 6];
  const kn = reach(i.hip, i.ankle, BODY.thigh, BODY.shin, kneeToward);
  const j: Joints = { head, neck, back, shoulder, hip: i.hip, knee: kn.mid, ankle: kn.end, toe: polar(kn.end, i.foot ?? 15, BODY.foot) };
  if (i.ankleF) {
    const kf = reach(i.hip, i.ankleF, BODY.thigh, BODY.shin, kneeToward);
    j.knee_f = kf.mid;
    j.ankle_f = kf.end;
    j.toe_f = polar(kf.end, i.footF ?? i.foot ?? 15, BODY.foot);
  }
  const elbowToward = i.elbowToward ?? "back";
  const rel = (v: Vec): Vec => [shoulder[0] + v[0], shoulder[1] + v[1]];
  const hand = i.hand ?? (i.handRel ? rel(i.handRel) : undefined);
  const handF = i.handF ?? (i.handFRel ? rel(i.handFRel) : undefined);
  if (hand) {
    const a = reach(shoulder, hand, BODY.upper_arm, BODY.forearm, elbowToward);
    j.elbow = a.mid;
    j.wrist = a.end;
  }
  if (handF) {
    const a = reach(shoulder, handF, BODY.upper_arm, BODY.forearm, elbowToward);
    j.elbow_f = a.mid;
    j.wrist_f = a.end;
  }
  return j;
}

/** Huesos del lado lejano (atenuados), opcionales según el ejercicio. */
export const FAR_LEG_BONES: Bone[] = [
  { id: "thigh_f", a: "hip", b: "knee_f", kind: "limb", side: "far" },
  { id: "shin_f", a: "knee_f", b: "ankle_f", kind: "limb", side: "far" },
  { id: "foot_f", a: "ankle_f", b: "toe_f", kind: "limb", side: "far" },
];
export const FAR_ARM_BONES: Bone[] = [
  { id: "upper_arm_f", a: "shoulder", b: "elbow_f", kind: "limb", side: "far" },
  { id: "forearm_f", a: "elbow_f", b: "wrist_f", kind: "limb", side: "far" },
];

/** Esqueleto de perfil con las piernas lejanas y/o los brazos lejanos añadidos si se piden. */
export function bonesFor(opts: { farLeg?: boolean; farArm?: boolean; noArms?: boolean } = {}): Bone[] {
  const base = opts.noArms ? STANDING_BONES.filter((b) => b.id !== "upper_arm" && b.id !== "forearm") : STANDING_BONES;
  return [...base, ...(opts.farLeg ? FAR_LEG_BONES : []), ...(opts.farArm ? FAR_ARM_BONES : [])];
}

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const lerpV = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/** Hombro de una figura (igual que en `figure`): para colocar manos en coordenadas absolutas antes de construirla. */
export function shoulderOf(hip: Vec, torso: number): Vec {
  const neck = polar(hip, torso, BODY.torso);
  const dx = hip[0] - neck[0];
  const dy = hip[1] - neck[1];
  const dl = Math.hypot(dx, dy) || 1;
  return [neck[0] + (dx / dl) * 6, neck[1] + (dy / dl) * 6];
}

/** Punto pegado al pecho: `along` px desde el cuello hacia la cadera y `out` px hacia delante (perpendicular al tronco). */
export function chestPoint(hip: Vec, torso: number, along = 16, out = 15): Vec {
  const neck = polar(hip, torso, BODY.torso);
  const a = polar(neck, torso + 180, along);
  const o = polar([0, 0], torso + 90, out);
  return [a[0] + o[0], a[1] + o[1]];
}

/** Suavizado cúbico 0..1. */
export const ease = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
