import { polar } from "../fk";
import { ANKLE_Y, bonesFor, figure, lerp, lerpV, rigOf, shoulderOf } from "../figure";
import type { Joints } from "../skeleton";
import { type Implement, type Rig, type Vec } from "../types";

/** EMPUJES: press de pecho con mancuernas (tumbado), press con banda / Pallof (de pie), flexiones (y inclinadas) y press de hombro. */

/** Press de pecho con mancuernas tumbado en el banco: las mancuernas suben en vertical sobre el pecho. */
export function buildBenchPress(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const BENCH_X = 118;
  const BENCH_H = 28;
  const at = (m: number): Joints => {
    const hip: Vec = [236, 254 - BENCH_H - 9];
    const torso = 180;
    const sh = shoulderOf(hip, torso);
    const hand: Vec = [sh[0] + 3, sh[1] - lerp(30, 66, m)];
    return figure({ hip, torso, ankle: [274, ANKLE_Y], kneeToward: "up", hand, elbowToward: "cw" });
  };
  return rigOf({
    id: "horizontal_push:bench_press",
    title_es: params.title_es ?? "Press de pecho con mancuernas",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Mancuernas sobre el pecho", down: "Empuja hacia el techo", bottom: "Brazos estirados", up: "Baja con control" },
    // Aquí la fase "baja" del perfil es la subida de las mancuernas (m: 0 → 1 = empujar).
    implements: [{ kind: "bench", offset: [BENCH_X, 0], size: [160, BENCH_H] }, { kind: "dumbbell", at: "wrist", angle: 0, size: 16 }],
    highlight: { label_es: "Pecho y tríceps", segments: [["neck", "back", 28], ["shoulder", "elbow", 18]] },
  });
}

/** Press de pecho con banda / Pallof: de pie, manos desde el pecho hacia delante contra una banda anclada detrás. */
export function buildBandPress(params: { pallof?: boolean; title_es?: string; loop_ms?: number } = {}): Rig {
  const ANCHOR: Vec = [70, 96];
  const at = (m: number): Joints => {
    const hip: Vec = [236, 142];
    const sh = shoulderOf(hip, -90);
    const hand: Vec = [sh[0] + lerp(14, 66, m), sh[1] + lerp(12, 4, m)];
    return figure({ hip, torso: -90, ankle: [236, ANKLE_Y], ankleF: [214, ANKLE_Y], hand, handF: hand, elbowToward: "cw" });
  };
  return rigOf({
    id: params.pallof ? "core:pallof" : "horizontal_push:band_press",
    title_es: params.title_es ?? "Press de pecho con banda",
    loop_ms: params.loop_ms,
    bones: bonesFor({ farLeg: true }),
    at,
    labels: params.pallof
      ? { start: "Banda al pecho", down: "Estira los brazos sin girar", bottom: "Aguanta extendido", up: "Vuelve al pecho" }
      : { start: "Manos al pecho", down: "Empuja al frente", bottom: "Brazos estirados", up: "Vuelve con control" },
    implements: [{ kind: "band", at: "wrist", to: ANCHOR }],
    highlight: params.pallof
      ? { label_es: "Core (antirrotación)", segments: [["back", "hip", 26], ["back", "neck", 22]] }
      : { label_es: "Pecho y tríceps", segments: [["neck", "back", 28], ["shoulder", "elbow", 18]] },
  });
}

/** Flexiones: el cuerpo gira como un bloque sobre las puntas de los pies y las manos se quedan clavadas (opcional: manos sobre un banco). */
export function buildPushUp(params: { handHeight?: number; title_es?: string; loop_ms?: number } = {}): Rig {
  const H = params.handHeight ?? 0;
  const TOE: Vec = [96, 254];
  const LEN = 108 + 70; // tobillo → hombro con el cuerpo recto
  const TOE_ANKLE_Y = 254 - 21; // pie sobre la puntera: el tobillo queda más alto que con el pie plano
  const handY = 252 - H;
  const bodyAt = (m: number): Joints => {
    // m: 0 = arriba (brazos casi estirados), 1 = abajo (pecho cerca de la superficie de apoyo).
    const shY = lerp(handY - 66, handY - 22, m);
    const ankle: Vec = [TOE[0] + 20, TOE_ANKLE_Y];
    const alpha = Math.asin(Math.min(0.95, (TOE_ANKLE_Y - shY) / LEN));
    const dir = -(alpha * 180) / Math.PI;
    const hip = polar(ankle, dir, 108);
    const handX = 186 + H * 0.4;
    return figure({ hip, torso: dir, headTilt: -8, ankle, foot: 70, hand: [handX, handY], elbowToward: "cw", kneeToward: "forward" });
  };
  const impl: Implement[] = H > 0 ? [{ kind: "bench", offset: [150 + H * 0.4, 0], size: [90, H] }] : [];
  return rigOf({
    id: H > 0 ? "horizontal_push:incline_pushup" : "horizontal_push:pushup",
    title_es: params.title_es ?? "Flexiones",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at: bodyAt,
    labels: { start: "Brazos estirados", down: "Baja el pecho", bottom: "Pecho casi en el suelo", up: "Empuja y sube" },
    implements: impl,
    highlight: { label_es: "Pecho y tríceps", segments: [["shoulder", "back", 24], ["shoulder", "elbow", 18]] },
  });
}

/** Press de hombro con mancuernas de pie: de los hombros a los brazos estirados sobre la cabeza. */
export function buildShoulderPress(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [236, 142];
    const sh = shoulderOf(hip, -90);
    const hand: Vec = [sh[0] + lerp(10, 2, m), sh[1] - lerp(26, 66, m)];
    return figure({ hip, torso: -90, ankle: [236, ANKLE_Y], hand, elbowToward: "cw" });
  };
  return rigOf({
    id: "vertical_push:shoulder_press",
    title_es: params.title_es ?? "Press de hombro con mancuernas",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Mancuernas a los hombros", down: "Empuja hacia arriba", bottom: "Brazos estirados", up: "Baja a los hombros" },
    implements: [{ kind: "dumbbell", at: "wrist", angle: 0, size: 16 }],
    highlight: { label_es: "Hombros y tríceps", segments: [["neck", "shoulder", 26], ["shoulder", "elbow", 20]] },
  });
}

export { lerpV };
