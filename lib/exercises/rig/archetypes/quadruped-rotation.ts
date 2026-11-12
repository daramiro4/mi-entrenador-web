import { BODY, polar } from "../fk";
import { GROUND_Y } from "../types";
import { holdProfile, sampleLoop, type Joints } from "../skeleton";
import type { Bone, Rig, Vec } from "../types";

/**
 * Arquetipo CUADRUPEDIA CON ROTACIÓN. Primer rig de referencia: ROTACIÓN TORÁCICA.
 * Cuatro apoyos; la cadera NO se mueve (todo el tronco y la pierna son fijos). El codo de la mano que sostiene la cabeza baja y
 * sube hacia el techo y la mirada lo sigue. El movimiento sale del plano: el antebrazo de trabajo se ESCORZA
 * (la proyección 2D lo acorta); están marcados `foreshortened` y el validador exige el resto de huesos a ±8 %.
 * Los textos de los pasos son EXACTAMENTE las claves de la ficha curada (lib/strength/library.ts, "rotacion-toracica").
 */
export const THORACIC_ROTATION_CUES = ["Cuatro apoyos, cadera quieta", "Mano tras la cabeza y abre el codo al techo", "Sigue el codo con la mirada"] as const;

const HIP: Vec = [206, 194];
const NECK = polar(HIP, -8, BODY.torso);
const KNEE: Vec = [HIP[0], HIP[1] + BODY.thigh];
const ANKLE: Vec = [KNEE[0] - BODY.shin, KNEE[1]];
const TOE: Vec = [ANKLE[0] - 22, KNEE[1] + 2];
const BACK: Vec = [(HIP[0] + NECK[0]) / 2, (HIP[1] + NECK[1]) / 2];
const SHOULDER_S: Vec = [NECK[0] - 6, NECK[1] + 1];
const ELBOW_S: Vec = [SHOULDER_S[0], SHOULDER_S[1] + BODY.upper_arm];
const WRIST_S: Vec = [SHOULDER_S[0], SHOULDER_S[1] + BODY.upper_arm + BODY.forearm];

function fixed(): Joints {
  return { hip: HIP, neck: NECK, back: BACK, knee: KNEE, ankle: ANKLE, toe: TOE, shoulder_s: SHOULDER_S, elbow_s: ELBOW_S, wrist_s: WRIST_S };
}

/** La figura a cuatro patas es baja y ancha: se amplía (el suelo se queda en y=254) para llenar el lienzo. Se aplica a TODAS las articulaciones. */
const SCALE = 1.4;
const PIVOT_X = 215;
const grow = (v: Vec): Vec => [PIVOT_X + (v[0] - PIVOT_X) * SCALE, GROUND_Y + (v[1] - GROUND_Y) * SCALE];
const growAll = (j: Joints): Joints => Object.fromEntries(Object.entries(j).map(([k, v]) => [k, grow(v)]));

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpV = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// Instantes clave del movimiento (hombro de trabajo, mano tras la cabeza, ángulo de la cabeza respecto al cuello, codo).
const SHOULDER_W: [Vec, Vec] = [[269, 185], [264, 168]];
const WRIST_W: [Vec, Vec] = [[290, 176], [280, 165]];
const HEAD_ANGLE: [number, number] = [-8, -52];
/** Brazo de trabajo: el codo describe un ARCO alrededor del hombro (de abajo-delante a arriba): longitud casi constante, sin atravesar la cabeza. */
const ELBOW_ANGLE: [number, number] = [39, -78];
const ELBOW_LEN: [number, number] = [BODY.upper_arm - 1.2, BODY.upper_arm - 3.2];
/** Acortamiento máximo (a mitad de recorrido) del brazo de trabajo por apuntar hacia la cámara. */
const ELBOW_DIP = 0.65;

/** Parte móvil con progreso s (0 = cuatro apoyos, 1 = codo al techo). */
function moving(s: number): Joints {
  const shoulderW = lerpV(SHOULDER_W[0], SHOULDER_W[1], s);
  // A mitad de recorrido el brazo apunta hacia la cámara: la proyección lo acorta (escorzo del movimiento fuera de plano).
  const len = lerp(ELBOW_LEN[0], ELBOW_LEN[1], s) * (1 - ELBOW_DIP * Math.sin(Math.PI * s) ** 2);
  const elbowW = polar(shoulderW, lerp(ELBOW_ANGLE[0], ELBOW_ANGLE[1], s), len);
  return {
    shoulder_w: shoulderW,
    head: polar(NECK, lerp(HEAD_ANGLE[0], HEAD_ANGLE[1], s), BODY.neck_to_head),
    wrist_w: lerpV(WRIST_W[0], WRIST_W[1], s),
    elbow_w: elbowW,
  };
}

const BONES: Bone[] = [
  { id: "torso", a: "hip", b: "neck", kind: "torso" },
  { id: "neck", a: "neck", b: "head", kind: "limb" },
  { id: "head", a: "head", b: "head", kind: "head", radius: BODY.head_r * SCALE },
  { id: "thigh", a: "hip", b: "knee", kind: "limb" },
  { id: "shin", a: "knee", b: "ankle", kind: "limb" },
  { id: "foot", a: "ankle", b: "toe", kind: "limb" },
  { id: "upper_arm_support", a: "shoulder_s", b: "elbow_s", kind: "limb", side: "far" },
  { id: "forearm_support", a: "elbow_s", b: "wrist_s", kind: "limb", side: "far" },
  { id: "upper_arm", a: "shoulder_w", b: "elbow_w", kind: "limb", foreshortened: true, accent: true },
  { id: "forearm", a: "elbow_w", b: "wrist_w", kind: "limb", foreshortened: true, accent: true },
];

export function buildQuadrupedRotation(): Rig {
  const base = fixed();
  return {
    id: "quadruped_rotation:thoracic",
    title_es: "Rotación torácica",
    view: "side",
    loop_ms: 6000,
    unilateral: true,
    bones: BONES,
    interpolation: "linear",
    stroke_scale: 1.3,
    markers: ["elbow_w"],
    poses: sampleLoop((m) => growAll({ ...base, ...moving(m) }), 48, holdProfile(0.12, 0.5, 0.65)),
    phases: [
      { from: 0, to: 0.12, label_es: "Cuatro apoyos", step_es: THORACIC_ROTATION_CUES[0], muscle_opacity: 0.15 },
      { from: 0.12, to: 0.5, label_es: "Abre el codo al techo", step_es: THORACIC_ROTATION_CUES[1], muscle_opacity: 0.6 },
      { from: 0.5, to: 0.65, label_es: "Mira el codo", step_es: THORACIC_ROTATION_CUES[2], muscle_opacity: 0.9 },
      { from: 0.65, to: 1, label_es: "Vuelve al inicio", muscle_opacity: 0.5 },
    ],
    highlight: { label_es: "Columna torácica", segments: [["back", "neck", 30], ["shoulder_w", "back", 16]] },
  };
}
