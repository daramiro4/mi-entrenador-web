import { polar } from "../fk";
import { ANKLE_Y, bonesFor, figure, lerp, lerpV, reach, rigOf, shoulderOf } from "../figure";
import { BODY } from "../fk";
import { STANDING_BONES, type Joints } from "../skeleton";
import { holdProfile } from "../skeleton";
import { type Bone, type Rig, type Vec } from "../types";

/** MOVILIDAD: gato-camello, flexor de cadera, retracción cervical y estiramiento de pectoral en puerta. */

/** Gato-camello: a cuatro apoyos, la columna se redondea (gato) y se arquea (camello) con la cabeza acompañando. */
export function buildCatCow(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const HIP: Vec = [180, 192];
  const BASE = -6;
  const HAND: Vec = [252, 250];
  const bones: Bone[] = [
    { id: "spine_lo", a: "hip", b: "back", kind: "torso" },
    { id: "spine_hi", a: "back", b: "neck", kind: "torso" },
    { id: "neck", a: "neck", b: "head", kind: "limb" },
    { id: "head", a: "head", b: "head", kind: "head", radius: BODY.head_r },
    { id: "upper_arm", a: "shoulder", b: "elbow", kind: "limb" },
    { id: "forearm", a: "elbow", b: "wrist", kind: "limb" },
    { id: "thigh", a: "hip", b: "knee", kind: "limb" },
    { id: "shin", a: "knee", b: "ankle", kind: "limb" },
    { id: "foot", a: "ankle", b: "toe", kind: "limb" },
  ];
  const at = (m: number): Joints => {
    const c = Math.sin(2 * Math.PI * m); // +1 gato (espalda arriba), -1 camello (espalda abajo)
    const delta = 24 * c;
    const back = polar(HIP, BASE - delta, BODY.torso / 2) as Vec;
    const neck = polar(back, BASE + delta, BODY.torso / 2) as Vec;
    const head = polar(neck, BASE + delta + 34 * c - 10 * (1 - Math.abs(c)), BODY.neck_to_head) as Vec;
    const toBack: Vec = [back[0] - neck[0], back[1] - neck[1]];
    const l = Math.hypot(toBack[0], toBack[1]) || 1;
    const shoulder: Vec = [neck[0] + (toBack[0] / l) * 6, neck[1] + (toBack[1] / l) * 6];
    const arm = reach(shoulder, HAND, BODY.upper_arm, BODY.forearm, "ccw");
    const knee: Vec = [HIP[0], HIP[1] + BODY.thigh];
    const ankle: Vec = [knee[0] - BODY.shin, knee[1]];
    return { hip: HIP, back, neck, head, shoulder, elbow: arm.mid, wrist: arm.end, knee, ankle, toe: [ankle[0] - 22, ankle[1] + 2] };
  };
  return rigOf({
    id: "cat_cow",
    title_es: params.title_es ?? "Gato-camello",
    loop_ms: params.loop_ms ?? 7000,
    bones,
    at,
    labels: { start: "Cuatro apoyos", down: "Redondea la espalda (gato)", bottom: "Arquea la espalda (camello)", up: "Vuelve al centro" },
    steps: 72,
    profile: (t) => t,
    phases: [
      { from: 0, to: 0.12, label_es: "Cuatro apoyos", muscle_opacity: 0.2 },
      { from: 0.12, to: 0.38, label_es: "Redondea la espalda (gato)", muscle_opacity: 0.7 },
      { from: 0.38, to: 0.62, label_es: "Vuelve al centro", muscle_opacity: 0.3 },
      { from: 0.62, to: 0.88, label_es: "Arquea la espalda (camello)", muscle_opacity: 0.7 },
      { from: 0.88, to: 1, label_es: "Vuelve al centro", muscle_opacity: 0.2 },
    ],
    stroke_scale: 1.1,
    highlight: { label_es: "Columna", segments: [["hip", "back", 24], ["back", "neck", 24]] },
  });
}

/** Estiramiento de flexor de cadera en zancada profunda: la rodilla trasera en el suelo y la pelvis avanza. */
export function buildHipFlexorStretch(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = lerpV([200, 190], [226, 199], m);
    return figure({
      hip,
      torso: lerp(-90, -87, m),
      ankle: [266, ANKLE_Y],
      ankleF: [118, 247],
      footF: 170,
      kneeToward: "forward",
      hand: [hip[0] + 24, hip[1] - 20],
      elbowToward: "cw",
    });
  };
  return rigOf({
    id: "stretch:hip_flexor",
    title_es: params.title_es ?? "Estiramiento de flexor de cadera",
    loop_ms: params.loop_ms ?? 7000,
    unilateral: true,
    bones: bonesFor({ farLeg: true }),
    at,
    labels: { start: "Rodilla trasera en el suelo", down: "Mete la pelvis hacia delante", bottom: "Torso erguido, respira", up: "Vuelve" },
    profile: holdProfile(0.1, 0.45, 0.72),
    highlight: { label_es: "Flexor de cadera", segments: [["hip", "knee_f", 26]] },
  });
}

/** Retracción cervical: de pie, mirando al frente, la barbilla se mete como haciendo papada (la cabeza va hacia atrás sin inclinarse). */
export function buildNeckRetraction(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const j = figure({ hip: [236, 142], torso: -90, ankle: [236, ANKLE_Y], handRel: [10, 62] });
    const head = polar(j.neck, lerp(-88, -124, m), BODY.neck_to_head) as Vec;
    return { ...j, head };
  };
  return rigOf({
    id: "stretch:neck_retraction",
    title_es: params.title_es ?? "Retracción cervical",
    loop_ms: params.loop_ms ?? 6000,
    bones: STANDING_BONES,
    at,
    labels: { start: "Mira al frente", down: "Mete la barbilla", bottom: "Mantén, sin inclinar", up: "Vuelve" },
    profile: holdProfile(0.12, 0.42, 0.7),
    implements: [{ kind: "band", offset: [236, 14], to: [236, 66] }],
    highlight: { label_es: "Músculos profundos del cuello", segments: [["neck", "head", 18]] },
  });
}

/** Estiramiento de pectoral en el marco de una puerta: el antebrazo apoyado en el marco y el cuerpo avanza. */
export function buildDoorwayChestStretch(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const E: Vec = [222, 84];
  const bones = STANDING_BONES.map((b) => (b.id === "upper_arm" ? { ...b, foreshortened: true } : b));
  const at = (m: number): Joints => {
    const hip: Vec = [lerp(206, 246, m), 142];
    const j = figure({ hip, torso: lerp(-90, -87, m), ankle: [lerp(232, 270, m), ANKLE_Y], ankleF: [200, ANKLE_Y], footF: 15 });
    const wrist: Vec = [E[0], E[1] - 32];
    return { ...j, elbow: E, wrist };
  };
  return rigOf({
    id: "stretch:doorway_chest",
    title_es: params.title_es ?? "Estiramiento de pectoral en puerta",
    loop_ms: params.loop_ms ?? 7000,
    unilateral: true,
    bones: [...bones, { id: "thigh_f", a: "hip", b: "knee_f", kind: "limb", side: "far" }, { id: "shin_f", a: "knee_f", b: "ankle_f", kind: "limb", side: "far" }, { id: "foot_f", a: "ankle_f", b: "toe_f", kind: "limb", side: "far" }],
    at,
    labels: { start: "Antebrazos en el marco", down: "Da un paso al frente", bottom: "Nota el pecho, no el hombro", up: "Vuelve" },
    profile: holdProfile(0.12, 0.5, 0.75),
    implements: [{ kind: "bar", offset: [222, 36], to: [222, 254] }],
    highlight: { label_es: "Pectoral", segments: [["shoulder", "back", 26]] },
  });
}

export { shoulderOf };
