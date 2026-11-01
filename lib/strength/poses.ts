import type { GlyphKind, Point, Pose } from "./types";

/** Medidas del muñeco (unidades del viewBox). Constantes: las longitudes NO cambian entre posturas. */
export const SEG = { head: 10, torso: 40, thigh: 30, shin: 28, arm: 21, forearm: 19 } as const;
export const BODY_LEN = SEG.torso + SEG.thigh + SEG.shin;
export const VIEWBOX = { w: 140, h: 170 } as const;
const MARGIN = 6;

type PinJoint = "ankle" | "wrist" | "hip" | "knee" | "shoulder";

/**
 * Especificación angular de una postura. Ángulos en grados sobre pantalla:
 * 0 = derecha, 90 = abajo, 180 = izquierda, -90 = arriba. El muñeco mira a la derecha.
 *  torso: cadera→hombro · thigh: cadera→rodilla · shin: rodilla→tobillo
 *  arm: hombro→codo · forearm: codo→muñeca · neck: hombro→cabeza (por defecto = torso)
 */
export interface PoseSpec {
  torso: number;
  thigh: number;
  shin: number;
  arm: number;
  forearm: number;
  neck?: number;
  pin?: PinJoint;
  /** Desplazamiento vertical tras fijar el pin (p. ej. talones arriba). */
  dy?: number;
  eq?: GlyphKind;
  /** Anclaje relativo a la muñeca para la banda. */
  anchor?: Point;
  label: string;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const step = (from: Point, deg: number, len: number): Point => [
  from[0] + Math.cos(rad(deg)) * len,
  from[1] + Math.sin(rad(deg)) * len,
];

/** Cinemática directa desde la cadera en el origen. */
export function solvePose(spec: PoseSpec): Pose {
  const hip: Point = [0, 0];
  const shoulder = step(hip, spec.torso, SEG.torso);
  const head = step(shoulder, spec.neck ?? spec.torso, SEG.head);
  const knee = step(hip, spec.thigh, SEG.thigh);
  const ankle = step(knee, spec.shin, SEG.shin);
  const elbow = step(shoulder, spec.arm, SEG.arm);
  const wrist = step(elbow, spec.forearm, SEG.forearm);
  const pin = { ankle, wrist, hip, knee, shoulder }[spec.pin ?? "ankle"];
  const shift = (p: Point): Point => [p[0] - pin[0], p[1] - pin[1] + (spec.dy ?? 0)];
  const w = shift(wrist);
  return {
    label: spec.label,
    head: shift(head),
    shoulder: shift(shoulder),
    elbow: shift(elbow),
    wrist: w,
    hip: shift(hip),
    knee: shift(knee),
    ankle: shift(ankle),
    equipment: {
      kind: spec.eq ?? "none",
      at: w,
      anchor: spec.anchor ? [w[0] + spec.anchor[0], w[1] + spec.anchor[1]] : undefined,
    },
  };
}

function points(p: Pose): Point[] {
  const pts: Point[] = [p.head, p.shoulder, p.elbow, p.wrist, p.hip, p.knee, p.ankle];
  if (p.equipment.anchor) pts.push(p.equipment.anchor);
  return pts;
}

/**
 * Resuelve las dos posturas y las encaja JUNTAS en el viewBox con una misma
 * traslación (el suelo no "salta" entre posturas). Solo traslada: no escala.
 */
export function buildPosePair(a: PoseSpec, b: PoseSpec): [Pose, Pose] {
  const pa = solvePose(a);
  const pb = solvePose(b);
  const all = [...points(pa), ...points(pb)];
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  const dx = (VIEWBOX.w - (maxX - minX)) / 2 - minX;
  // Alinea al suelo (abajo) con margen para el pie/mancuerna.
  const dy = VIEWBOX.h - MARGIN - 6 - maxY;
  const move = (p: Pose): Pose => {
    const m = (q: Point): Point => [round(q[0] + dx), round(q[1] + dy)];
    return {
      ...p,
      head: m(p.head),
      shoulder: m(p.shoulder),
      elbow: m(p.elbow),
      wrist: m(p.wrist),
      hip: m(p.hip),
      knee: m(p.knee),
      ankle: m(p.ankle),
      equipment: { ...p.equipment, at: m(p.equipment.at), anchor: p.equipment.anchor ? m(p.equipment.anchor) : undefined },
    };
  };
  return [move(pa), move(pb)];
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Segmentos del cuerpo como pares de puntos [nombre, desde, hasta]. */
export function segments(p: Pose): Array<[string, Point, Point]> {
  return [
    ["neck", p.shoulder, p.head],
    ["torso", p.hip, p.shoulder],
    ["thigh", p.hip, p.knee],
    ["shin", p.knee, p.ankle],
    ["arm", p.shoulder, p.elbow],
    ["forearm", p.elbow, p.wrist],
  ];
}

export const segLength = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** ¿Todas las articulaciones (y la banda) dentro del viewBox con margen? */
export function poseInBounds(p: Pose, margin = 2): boolean {
  return points(p).every(
    ([x, y]) => x >= margin && x <= VIEWBOX.w - margin && y >= margin && y <= VIEWBOX.h - margin
  );
}

/**
 * Ayuda para ejercicios de suelo (flexiones, plancha): devuelve los ángulos de
 * cuerpo recto para que tobillo y muñeca queden a la misma altura (apoyados).
 * `handsAbove`: altura del apoyo de manos sobre el de pies (banco).
 */
export function floorBody(arm: number, forearm: number, handsAbove = 0) {
  const armDrop = SEG.arm * Math.sin(rad(arm)) + SEG.forearm * Math.sin(rad(forearm));
  const s = Math.min(0.98, Math.max(0.02, (armDrop + handsAbove) / BODY_LEN));
  const theta = (Math.asin(s) * 180) / Math.PI;
  return { torso: -theta, thigh: 180 - theta, shin: 180 - theta, arm, forearm };
}
