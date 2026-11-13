import { polar } from "../fk";
import { bonesFor, figure, lerp, lerpV, rigOf, shoulderOf } from "../figure";
import { holdProfile, type Joints } from "../skeleton";
import { type Rig, type Vec } from "../types";

/** CORE: plancha, dead bug, bird dog y superman. */

const LEN = 108 + 70; // tobillo → hombro con el cuerpo recto

/** Plancha sobre antebrazos: cuerpo recto sobre las puntas y los antebrazos; la respiración mueve el cuerpo apenas un par de píxeles. */
export function buildPlank(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const shY = 214 + 1.6 * Math.sin(2 * Math.PI * m);
    const ankle: Vec = [70, 254 - 21]; // sobre la puntera: tobillo más alto que con el pie plano
    const alpha = Math.asin((254 - 21 - shY) / LEN);
    const dir = -(alpha * 180) / Math.PI;
    const hip = polar(ankle, dir, 108);
    const sh = shoulderOf(hip, dir);
    return figure({ hip, torso: dir, headTilt: -6, ankle, foot: 70, hand: [sh[0] + 30, 252], elbowToward: "cw" });
  };
  return rigOf({
    id: "plank_isometric:plank",
    title_es: params.title_es ?? "Plancha",
    loop_ms: params.loop_ms ?? 6000,
    bones: bonesFor(),
    at,
    labels: { start: "Codos bajo los hombros", down: "Cuerpo recto", bottom: "Glúteos firmes", up: "Empuja el suelo con los antebrazos" },
    profile: (t) => t,
    phases: [
      { from: 0, to: 0.25, label_es: "Codos bajo los hombros", muscle_opacity: 0.5 },
      { from: 0.25, to: 0.5, label_es: "Cuerpo recto", muscle_opacity: 0.8 },
      { from: 0.5, to: 0.75, label_es: "Glúteos firmes", muscle_opacity: 0.9 },
      { from: 0.75, to: 1, label_es: "Respira sin hundir la cadera", muscle_opacity: 0.8 },
    ],
    highlight: { label_es: "Abdomen y glúteos", segments: [["hip", "back", 26], ["back", "neck", 20]] },
  });
}

/** Dead bug: tumbado boca arriba con rodillas a 90°, el brazo y la pierna contrarios se estiran y vuelven. */
export function buildDeadBug(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [232, 244];
    const sh = shoulderOf(hip, 180);
    const armAng = lerp(-90, -178, m);
    const hand = [sh[0] + 66 * Math.cos((armAng * Math.PI) / 180), sh[1] + 66 * Math.sin((armAng * Math.PI) / 180)] as Vec;
    const farFoot: Vec = lerpV([hip[0] + 54, hip[1] - 56], [hip[0] + 106, hip[1] - 12], m);
    return figure({ hip, torso: 180, ankle: [hip[0] + 54, hip[1] - 56], ankleF: farFoot, kneeToward: "up", hand, handF: [sh[0] + 3, sh[1] - 66], elbowToward: "ccw" });
  };
  return rigOf({
    id: "dead_bug",
    title_es: params.title_es ?? "Dead bug",
    loop_ms: params.loop_ms ?? 6500,
    unilateral: true,
    bones: bonesFor({ farLeg: true, farArm: true }),
    at,
    labels: { start: "Rodillas a 90°, brazos arriba", down: "Estira brazo y pierna contrarios", bottom: "Lumbar pegada al suelo", up: "Vuelve despacio" },
    highlight: { label_es: "Abdomen profundo", segments: [["hip", "back", 26], ["back", "neck", 20]] },
  });
}

/** Bird dog: a cuatro apoyos, el brazo y la pierna contrarios se estiran en línea con la espalda. */
export function buildBirdDog(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const hip: Vec = [180, 192];
    const sh = shoulderOf(hip, -8);
    const farHand: Vec = lerpV([sh[0] + 2, 250], [sh[0] + 66, sh[1] - 4], m);
    const legTarget: Vec = lerpV([126, 246], [74, 196], m);
    return figure({
      hip,
      torso: -8,
      headTilt: -8,
      ankle: legTarget,
      foot: lerp(176, 168, m),
      ankleF: [126, 246],
      footF: 176,
      kneeToward: "down",
      hand: [sh[0] + 2, 250],
      handF: farHand,
      elbowToward: "cw",
    });
  };
  return rigOf({
    id: "bird_dog",
    title_es: params.title_es ?? "Bird dog",
    loop_ms: params.loop_ms ?? 6500,
    unilateral: true,
    bones: bonesFor({ farLeg: true, farArm: true }),
    at,
    labels: { start: "Cuatro apoyos", down: "Estira brazo y pierna contrarios", bottom: "Todo en línea, cadera quieta", up: "Vuelve sin girar" },
    highlight: { label_es: "Core y glúteos", segments: [["hip", "back", 26], ["back", "neck", 20]] },
  });
}

/** Superman: boca abajo, brazos y piernas se elevan a la vez del suelo y vuelven. */
export function buildSuperman(params: { title_es?: string; loop_ms?: number } = {}): Rig {
  const at = (m: number): Joints => {
    const lift = lerp(0, 14, m);
    const hip: Vec = [178, 246];
    const torso = -lerp(0, 9, m);
    const sh = shoulderOf(hip, torso);
    const hand: Vec = [sh[0] + 66, sh[1] - lerp(0, 16, m)];
    const ankle = polar(hip, 180 + lift, 106) as Vec;
    return figure({ hip, torso, headTilt: -lerp(0, 8, m), ankle, foot: 180 - lift + 10, kneeToward: "up", hand, elbowToward: "cw" });
  };
  return rigOf({
    id: "superman",
    title_es: params.title_es ?? "Superman",
    loop_ms: params.loop_ms ?? 6000,
    bones: bonesFor(),
    at,
    labels: { start: "Boca abajo", down: "Eleva brazos y piernas", bottom: "Mantén un segundo", up: "Baja despacio" },
    profile: holdProfile(0.1, 0.4, 0.62),
    highlight: { label_es: "Zona lumbar y glúteos", segments: [["hip", "back", 26], ["hip", "knee", 22]] },
  });
}
