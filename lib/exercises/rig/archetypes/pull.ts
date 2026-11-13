import { polar } from "../fk";
import { ANKLE_Y, bonesFor, figure, lerp, rigOf, shoulderOf } from "../figure";
import { STANDING_BONES, type Joints } from "../skeleton";
import { type Implement, type Rig, type Vec } from "../types";

/** TIRONES: remo con mancuerna, remo con banda, remo invertido, face pull, jalón al pecho, dominadas asistidas y curl de bíceps. */

/** Remo con mancuerna: una mano apoyada en el banco, la otra tira del codo hacia la cadera. */
export function buildDumbbellRow(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [190, 168];
    const torso = -14;
    const sh = shoulderOf(hip, torso);
    const hand: Vec = [sh[0] + lerp(3, -28, m), sh[1] + lerp(64, 20, m)];
    return figure({ hip, torso, headTilt: -20, ankle: [206, ANKLE_Y], ankleF: [166, ANKLE_Y], hand, handF: [262, 220], elbowToward: "cw", kneeToward: "forward" });
  };
  return rigOf({
    id: "horizontal_pull:dumbbell_row",
    title_es: params.title_es ?? "Remo con mancuerna",
    loop_ms: params.loop_ms,
    unilateral: true,
    bones: bonesFor({ farLeg: true, farArm: true }),
    at,
    labels: { start: "Brazo estirado", down: "Tira del codo a la cadera", bottom: "Aprieta la escápula", up: "Baja con control" },
    implements: [{ kind: "bench", offset: [236, 0], size: [90, 34] }, { kind: "dumbbell", at: "wrist", angle: 0, size: 16 }],
    highlight: { label_es: "Dorsal y espalda media", segments: [["shoulder", "back", 24], ["back", "hip", 20]] },
  });
}

/** Remo sentado con banda: sentado en el suelo, la banda en los pies, las manos tiran hacia el abdomen. */
export function buildBandRow(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [168, 246];
    const sh = shoulderOf(hip, -90);
    const hand: Vec = [sh[0] + lerp(66, 12, m), sh[1] + lerp(8, 30, m)];
    return figure({ hip, torso: -90, ankle: [276, 247], foot: -75, kneeToward: "up", hand, elbowToward: "cw" });
  };
  return rigOf({
    id: "horizontal_pull:band_row",
    title_es: params.title_es ?? "Remo con banda",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Brazos estirados", down: "Tira hacia el abdomen", bottom: "Junta las escápulas", up: "Vuelve con control" },
    implements: [{ kind: "band", at: "wrist", to: "toe" }],
    highlight: { label_es: "Espalda media y dorsal", segments: [["shoulder", "back", 24], ["back", "hip", 20]] },
  });
}

/** Remo invertido bajo una barra baja: el cuerpo, recto, pivota sobre los talones y el pecho sube hacia la barra. */
export function buildInvertedRow(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const BAR: Vec = [185, 92];
  const LEN = 108 + 70;
  const at = (m: number): Joints => {
    const shY = lerp(BAR[1] + 66, BAR[1] + 22, m);
    const ankle: Vec = [34, ANKLE_Y];
    const alpha = Math.asin(Math.min(0.95, (ANKLE_Y - shY) / LEN));
    const dir = -(alpha * 180) / Math.PI;
    const hip = polar(ankle, dir, 108);
    return figure({ hip, torso: dir, headTilt: 10, ankle, foot: -60, hand: BAR, elbowToward: "cw", kneeToward: "forward" });
  };
  return rigOf({
    id: "horizontal_pull:inverted_row",
    title_es: params.title_es ?? "Remo invertido",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Brazos estirados", down: "Sube el pecho a la barra", bottom: "Junta las escápulas", up: "Baja con control" },
    implements: [
      { kind: "bar", offset: [165, 92], to: [205, 92] },
      { kind: "bar", offset: [205, 92], to: [205, 254] },
    ],
    highlight: { label_es: "Espalda media y dorsal", segments: [["shoulder", "back", 24], ["back", "hip", 20]] },
  });
}

/** Face pull con banda: de pie, las manos van de los brazos estirados a la cara con los codos altos. */
export function buildFacePull(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const ANCHOR: Vec = [60, 92];
  const at = (m: number): Joints => {
    const hip: Vec = [236, 142];
    const sh = shoulderOf(hip, -90);
    const hand: Vec = [sh[0] + lerp(64, 34, m), sh[1] + lerp(2, -6, m)];
    return figure({ hip, torso: -90, ankle: [236, ANKLE_Y], hand, elbowToward: "ccw" });
  };
  return rigOf({
    id: "horizontal_pull:face_pull",
    title_es: params.title_es ?? "Face pull con banda",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Brazos estirados", down: "Tira hacia la cara", bottom: "Codos altos, puños atrás", up: "Vuelve con control" },
    implements: [{ kind: "band", at: "wrist", to: ANCHOR }],
    highlight: { label_es: "Hombro posterior y trapecio", segments: [["shoulder", "neck", 24], ["shoulder", "elbow", 18]] },
  });
}

/** Jalón al pecho: sentado, la barra baja desde arriba hasta la parte alta del pecho. */
export function buildLatPulldown(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [196, 204];
    const torso = -97;
    const sh = shoulderOf(hip, torso);
    const hand: Vec = [sh[0] + lerp(22, 18, m), sh[1] - lerp(62, -20, m)];
    const j = figure({ hip, torso, ankle: [252, ANKLE_Y], hand, elbowToward: "cw" });
    return { ...j, bar_a: [j.wrist[0] - 18, j.wrist[1]], bar_b: [j.wrist[0] + 18, j.wrist[1]], cable_top: [j.wrist[0], 8] };
  };
  return rigOf({
    id: "vertical_pull:lat_pulldown",
    title_es: params.title_es ?? "Jalón al pecho",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Brazos arriba", down: "Baja la barra al pecho", bottom: "Pecho alto", up: "Sube con control" },
    implements: [
      { kind: "bar", at: "bar_a", to: "bar_b" },
      { kind: "bar", at: "wrist", to: "cable_top" },
      { kind: "bar", offset: [150, 214], to: [236, 214] },
    ],
    highlight: { label_es: "Dorsal ancho", segments: [["shoulder", "back", 24], ["back", "hip", 20]] },
  });
}

/** Dominadas asistidas con banda: colgado de la barra, el pecho sube hasta que la barbilla pasa la barra. */
export function buildPullUp(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const HAND: Vec = [236, 46];
  const at = (m: number): Joints => {
    const hip: Vec = [236, lerp(176, 132, m)];
    const j = figure({ hip, torso: -90, headTilt: lerp(0, -12, m), ankle: [hip[0] - 26, hip[1] + 52], foot: 80, kneeToward: "forward", hand: HAND, elbowToward: "cw" });
    return j;
  };
  return rigOf({
    id: "vertical_pull:pull_up",
    title_es: params.title_es ?? "Dominadas asistidas",
    loop_ms: params.loop_ms,
    bones: bonesFor(),
    at,
    labels: { start: "Colgado", down: "Sube el pecho a la barra", bottom: "Barbilla sobre la barra", up: "Baja con control" },
    implements: [
      { kind: "bar", offset: [208, 46], to: [264, 46] },
      { kind: "band", at: "knee", to: [250, 52] },
    ],
    highlight: { label_es: "Dorsal y bíceps", segments: [["shoulder", "back", 24], ["shoulder", "elbow", 18]] },
  });
}

/** Curl de bíceps de pie: el codo queda fijo y el antebrazo sube con la mancuerna hacia el hombro. */
export function buildCurl(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [236, 142];
    const j = figure({ hip, torso: -90, ankle: [236, ANKLE_Y] });
    const elbow = polar(j.shoulder, 84, 36);
    const wrist = polar(elbow, lerp(88, -98, m), 32);
    return { ...j, elbow, wrist };
  };
  const impl: Implement[] = [{ kind: "dumbbell", at: "wrist", angle: 0, size: 16 }];
  return rigOf({
    id: "curl:standing",
    title_es: params.title_es ?? "Curl de bíceps con mancuernas",
    loop_ms: params.loop_ms,
    bones: STANDING_BONES,
    at,
    labels: { start: "Brazos estirados", down: "Sube sin balancear", bottom: "Mancuerna al hombro", up: "Baja despacio" },
    implements: impl,
    highlight: { label_es: "Bíceps", segments: [["shoulder", "elbow", 24]] },
  });
}
